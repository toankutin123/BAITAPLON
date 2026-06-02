"""AI Property Valuation Service"""
import sys
sys.path.insert(0, 'c:/GitHub/BAITAPLON/bds_nlp')

from typing import List, Optional, Tuple, Dict
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from models.listing import Listing
from models.location import Location
from models.analytics import PriceHistory, AreaStatistics
from models.valuation import PropertyValuation
from config.database import SessionLocal


class ValuationService:
    """Service for AI-powered property valuation"""
    
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
    
    def close(self):
        self.db.close()
    
    def find_comparable_properties(
        self,
        city: str,
        district: str = None,
        ward: str = None,
        street: str = None,
        property_type: str = "house",
        area: float = None,
        limit: int = 50
    ) -> List[Listing]:
        """Find comparable properties with expanding search scope"""
        query = self.db.query(Listing).filter(
            Listing.status == "active",
            Listing.city_normalized == city,
            Listing.property_type == property_type
        )
        
        # Priority 1: Same street
        if street and len(street) > 3:
            same_street = query.filter(
                Listing.street_name.ilike(f"%{street}%")
            ).limit(limit).all()
            if len(same_street) >= 10:
                return same_street
        
        # Priority 2: Same ward
        if ward:
            same_ward = query.filter(
                Listing.ward_normalized == ward
            ).limit(limit).all()
            if len(same_ward) >= 10:
                return same_ward
        
        # Priority 3: Same district
        if district:
            same_district = query.filter(
                Listing.district_normalized == district
            ).limit(limit).all()
            if len(same_district) >= 10:
                return same_district
        
        # Priority 4: Same city
        same_city = query.limit(limit).all()
        if len(same_city) >= 10:
            return same_city
        
        # Priority 5: All properties
        return self.db.query(Listing).filter(
            Listing.status == "active",
            Listing.property_type == property_type
        ).limit(limit).all()
    
    def calculate_similarity(
        self,
        prop: Listing,
        target_area: float = None,
        target_city: str = None,
        target_district: str = None,
        target_ward: str = None
    ) -> float:
        """Calculate similarity score between properties (0-100)"""
        score = 0.0
        weights = {"area": 30, "location": 40, "type": 30}
        
        # Area similarity (30%)
        if target_area and prop.area:
            area_diff = abs(prop.area - target_area) / max(target_area, 1)
            score += (1 - min(area_diff, 1)) * weights["area"]
        
        # Location similarity (40%)
        location_score = 0
        if target_city and prop.location:
            location_score += 25 if prop.location.city_normalized == target_city else 0
            location_score += 15 if prop.location.district_normalized == target_district else 0
            location_score += 10 if prop.location.ward_normalized == target_ward else 0
        score += location_score
        
        return min(score, 100)
    
    def calculate_market_metrics(self, properties: List[Listing]) -> Dict:
        """Calculate market metrics from comparable properties"""
        if not properties:
            return {
                "avg_price": 0,
                "median_price": 0,
                "avg_price_per_m2": 0,
                "min_price": 0,
                "max_price": 0,
                "count": 0
            }
        
        prices = [p.price for p in properties if p.price and p.price > 0]
        prices_per_m2 = [p.price_per_m2 for p in properties if p.price_per_m2 and p.price_per_m2 > 0]
        
        prices.sort()
        n = len(prices)
        
        return {
            "avg_price": sum(prices) // n if prices else 0,
            "median_price": prices[n // 2] if prices else 0,
            "avg_price_per_m2": sum(prices_per_m2) // len(prices_per_m2) if prices_per_m2 else 0,
            "min_price": min(prices) if prices else 0,
            "max_price": max(prices) if prices else 0,
            "count": n
        }
    
    def assess_price(
        self,
        user_price: int,
        market_avg: int,
        market_median: int
    ) -> Tuple[str, float]:
        """Assess if price is below/fair/above market"""
        if market_avg == 0:
            return "unknown", 50.0
        
        diff_pct = ((user_price - market_avg) / market_avg) * 100
        
        if diff_pct < -10:
            return "below_market", min(100 - abs(diff_pct), 100)
        elif diff_pct > 10:
            return "above_market", max(100 - diff_pct, 0)
        else:
            return "fair", 90.0
    
    def calculate_confidence_score(
        self,
        data_points: int,
        property_area: float = None
    ) -> float:
        """Calculate confidence score based on data quality"""
        # Base score from data points
        if data_points >= 50:
            base_score = 90
        elif data_points >= 20:
            base_score = 70
        elif data_points >= 10:
            base_score = 50
        else:
            base_score = 30
        
        # Reduce if no area data
        if not property_area:
            base_score *= 0.8
        
        return min(base_score, 95)
    
    def get_trend_direction(
        self,
        city: str,
        district: str = None,
        days: int = 90
    ) -> str:
        """Determine price trend direction"""
        start_date = datetime.utcnow().date() - timedelta(days=days)
        
        query = self.db.query(AreaStatistics).filter(
            AreaStatistics.city == city,
            AreaStatistics.date >= start_date
        )
        
        if district:
            query = query.filter(AreaStatistics.district == district)
        
        stats = query.order_by(AreaStatistics.date).all()
        
        if len(stats) < 2:
            return "stable"
        
        recent_avg = sum(s.avg_price for s in stats[-3:]) / 3
        older_avg = sum(s.avg_price for s in stats[:3]) / 3
        
        if recent_avg > older_avg * 1.03:
            return "rising"
        elif recent_avg < older_avg * 0.97:
            return "declining"
        else:
            return "stable"
    
    def valuation(
        self,
        area: float = None,
        price: int = None,
        property_type: str = "house",
        city: str = None,
        district: str = None,
        ward: str = None,
        street: str = None,
        bedrooms: int = 0,
        bathrooms: int = 0,
        floors: int = 1,
        direction: str = None
    ) -> Dict:
        """
        Main valuation method - AI analysis of property value
        
        Returns comprehensive valuation with:
        - Suggested price
        - Price range
        - Market assessment
        - Comparable properties
        """
        # Find comparable properties with expanding scope
        comparables = self.find_comparable_properties(
            city=city,
            district=district,
            ward=ward,
            street=street,
            property_type=property_type,
            area=area
        )
        
        # Calculate market metrics
        metrics = self.calculate_market_metrics(comparables)
        
        # Calculate price per m² if area provided
        price_per_m2 = None
        if area and area > 0 and metrics["avg_price"]:
            price_per_m2 = int(metrics["avg_price"] / (area or 1))
        
        # Calculate suggested price
        suggested_price = metrics["avg_price"]
        if area and metrics["avg_price_per_m2"]:
            suggested_price = int(metrics["avg_price_per_m2"] * area)
        
        # Calculate price range (15% on each side)
        range_pct = 0.15
        price_range_min = int(suggested_price * (1 - range_pct))
        price_range_max = int(suggested_price * (1 + range_pct))
        
        # Assess user price if provided
        price_assessment = "unknown"
        confidence = self.calculate_confidence_score(len(comparables), area)
        
        if price:
            price_assessment, _ = self.assess_price(
                price, metrics["avg_price"], metrics["median_price"]
            )
        
        # Get trend direction
        trend = self.get_trend_direction(city, district)
        
        # Build comparable list with similarity scores
        comparable_list = []
        for prop in comparables[:10]:
            sim_score = self.calculate_similarity(
                prop, area, city, district, ward
            )
            comparable_list.append({
                "id": prop.id,
                "title": prop.title,
                "price": prop.price,
                "area": float(prop.area) if prop.area else 0,
                "price_per_m2": prop.price_per_m2,
                "city": prop.location.city if prop.location else city,
                "district": prop.location.district if prop.location else district,
                "ward": prop.location.ward if prop.location else ward,
                "similarity_score": sim_score
            })
        
        # Sort by similarity
        comparable_list.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        # Generate analysis summary
        assessment_text = {
            "below_market": "Giá thấp hơn thị trường",
            "fair": "Giá hợp lý so với thị trường",
            "above_market": "Giá cao hơn thị trường"
        }.get(price_assessment, "Chưa xác định được")
        
        trend_text = {
            "rising": "thị trường đang tăng giá",
            "declining": "thị trường đang giảm giá",
            "stable": "thị trường ổn định"
        }.get(trend, "chưa xác định")
        
        analysis_summary = (
            f"Dựa trên {len(comparables)} bất động sản tương tự trong khu vực, "
            f"giá trị thị trường trung bình là {metrics['avg_price']/1e9:.2f} tỷ VNĐ. "
            f"Giá đề xuất: {suggested_price/1e9:.2f} tỷ VNĐ, "
            f"khoảng giá hợp lý: {price_range_min/1e9:.2f} - {price_range_max/1e9:.2f} tỷ. "
            f"{assessment_text}. {trend_text.capitalize()}."
        )
        
        return {
            "suggested_price": suggested_price,
            "price_range_min": price_range_min,
            "price_range_max": price_range_max,
            "price_per_m2": price_per_m2 or metrics["avg_price_per_m2"],
            "market_avg_price": metrics["avg_price"],
            "market_median_price": metrics["median_price"],
            "price_assessment": price_assessment,
            "confidence_score": confidence,
            "data_points_used": len(comparables),
            "comparable_properties": comparable_list,
            "trend_direction": trend,
            "analysis_summary": analysis_summary,
            "scores": {
                "location_score": 85 if district else 60,
                "price_score": 90 if price_assessment == "fair" else 70,
                "condition_score": 75  # Default, can be enhanced with more data
            }
        }
    
    def save_valuation(self, request_data: Dict, result: Dict, user_listing_id: int = None) -> PropertyValuation:
        """Save valuation to database"""
        valuation = PropertyValuation(
            user_listing_id=user_listing_id,
            input_area=request_data.get("area"),
            input_price=request_data.get("price"),
            input_property_type=request_data.get("property_type"),
            input_city=request_data.get("city"),
            input_district=request_data.get("district"),
            input_ward=request_data.get("ward"),
            input_street=request_data.get("street"),
            suggested_price=result["suggested_price"],
            price_range_min=result["price_range_min"],
            price_range_max=result["price_range_max"],
            price_per_m2=result["price_per_m2"],
            market_avg_price=result["market_avg_price"],
            market_median_price=result["market_median_price"],
            price_assessment=result["price_assessment"],
            confidence_score=result["confidence_score"],
            data_points_used=result["data_points_used"],
            comparable_ids=json.dumps([c["id"] for c in result["comparable_properties"][:10]]),
            comparable_count=len(result["comparable_properties"]),
            trend_direction=result["trend_direction"],
            analysis_details=json.dumps(result),
            created_at=datetime.utcnow()
        )
        
        self.db.add(valuation)
        self.db.commit()
        self.db.refresh(valuation)
        
        return valuation


def get_valuation_service() -> ValuationService:
    """Dependency for getting valuation service"""
    return ValuationService()
