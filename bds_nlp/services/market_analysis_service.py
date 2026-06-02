"""AI Market Analysis Service"""
import sys
sys.path.insert(0, 'c:/GitHub/BAITAPLON/bds_nlp')

from typing import List, Dict, Optional
from sqlalchemy import func, and_, desc
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from models.listing import Listing
from models.location import Location
from models.analytics import AreaStatistics, PriceHistory
from models.recommendation import PropertyRecommendation
from models.market_insight import MarketInsight, DashboardMetrics
from config.database import SessionLocal


class MarketAnalysisService:
    """Service for AI-powered market analysis and insights"""
    
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
    
    def close(self):
        self.db.close()
    
    def get_market_overview(self, city: str = None) -> Dict:
        """Get overall market statistics"""
        query = self.db.query(Listing).filter(Listing.status == "active")
        
        if city:
            query = query.filter(Listing.city_normalized == city)
        
        total = query.count()
        
        if total == 0:
            return {
                "total_listings": 0,
                "avg_price": 0,
                "avg_price_per_m2": 0,
                "median_price": 0
            }
        
        # Calculate aggregates
        stats = self.db.query(
            func.count(Listing.id).label("count"),
            func.avg(Listing.price).label("avg_price"),
            func.avg(Listing.price_per_m2).label("avg_ppm2"),
            func.percentile_cont(0.5).within_group(Listing.price).label("median_price")
        ).filter(Listing.status == "active")
        
        if city:
            stats = stats.filter(Listing.city_normalized == city)
        
        result = stats.first()
        
        return {
            "total_listings": result.count or 0,
            "avg_price": int(result.avg_price or 0),
            "avg_price_per_m2": int(result.avg_ppm2 or 0),
            "median_price": int(result.median_price or 0)
        }
    
    def get_district_rankings(
        self,
        city: str = None,
        limit: int = 10,
        sort_by: str = "avg_price"
    ) -> List[Dict]:
        """Get district rankings by various metrics"""
        query = self.db.query(
            Listing.district_normalized.label("district"),
            func.count(Listing.id).label("listing_count"),
            func.avg(Listing.price).label("avg_price"),
            func.avg(Listing.price_per_m2).label("avg_ppm2")
        ).filter(
            Listing.status == "active",
            Listing.district_normalized.isnot(None)
        )
        
        if city:
            query = query.filter(Listing.city_normalized == city)
        
        query = query.group_by(Listing.district_normalized)
        
        if sort_by == "avg_price":
            query = query.order_by(desc("avg_price"))
        elif sort_by == "avg_price_per_m2":
            query = query.order_by(desc("avg_ppm2"))
        elif sort_by == "listing_count":
            query = query.order_by(desc("listing_count"))
        
        results = query.limit(limit).all()
        
        # Get price changes
        rankings = []
        for r in results:
            price_change = self._get_price_change(city, r.district)
            
            rankings.append({
                "district": r.district,
                "avg_price": int(r.avg_price or 0),
                "avg_price_per_m2": int(r.avg_ppm2 or 0),
                "listing_count": r.listing_count,
                "price_change_pct": price_change,
                "trend": "rising" if price_change > 2 else ("declining" if price_change < -2 else "stable")
            })
        
        return rankings
    
    def _get_price_change(self, city: str, district: str) -> float:
        """Calculate price change percentage"""
        thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
        sixty_days_ago = datetime.utcnow().date() - timedelta(days=60)
        
        # Get old price
        old_price = self.db.query(
            func.avg(Listing.price).label("avg_price")
        ).filter(
            Listing.status == "active",
            Listing.city_normalized == city,
            Listing.district_normalized == district,
            Listing.updated_date >= sixty_days_ago,
            Listing.updated_date < thirty_days_ago
        ).scalar()
        
        # Get new price
        new_price = self.db.query(
            func.avg(Listing.price).label("avg_price")
        ).filter(
            Listing.status == "active",
            Listing.city_normalized == city,
            Listing.district_normalized == district,
            Listing.updated_date >= thirty_days_ago
        ).scalar()
        
        if old_price and new_price and old_price > 0:
            return round(((new_price - old_price) / old_price) * 100, 2)
        
        return 0.0
    
    def get_area_trends(
        self,
        city: str = None,
        limit: int = 10,
        trend: str = "rising"  # rising, declining, stable
    ) -> List[Dict]:
        """Get areas with specific trends"""
        districts = self.get_district_rankings(city, limit=50, sort_by="avg_price")
        
        trends = []
        for d in districts:
            if d["trend"] == trend or trend == "all":
                trends.append({
                    "area": d["district"],
                    "avg_price": d["avg_price"],
                    "avg_price_per_m2": d["avg_price_per_m2"],
                    "listing_count": d["listing_count"],
                    "price_change_pct": d["price_change_pct"],
                    "trend_direction": d["trend"]
                })
        
        return trends[:limit]
    
    def get_top_searched_areas(self, limit: int = 10) -> List[Dict]:
        """Get most searched/viewed areas based on recommendations"""
        # This would typically come from analytics tracking
        # For now, use recommendation counts as proxy
        results = self.db.query(
            PropertyRecommendation.listing_id,
            func.count(PropertyRecommendation.id).label("rec_count")
        ).join(
            Listing, PropertyRecommendation.listing_id == Listing.id
        ).group_by(
            PropertyRecommendation.listing_id
        ).order_by(
            desc("rec_count")
        ).limit(50).all()
        
        # Aggregate by district
        district_counts = {}
        for r in results:
            listing = self.db.query(Listing).filter(Listing.id == r.listing_id).first()
            if listing and listing.district_normalized:
                if listing.district_normalized not in district_counts:
                    district_counts[listing.district_normalized] = 0
                district_counts[listing.district_normalized] += r.rec_count
        
        # Sort and return top areas
        sorted_areas = sorted(
            district_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        return [
            {"area": area, "search_count": count}
            for area, count in sorted_areas
        ]
    
    def get_top_recommended_listings(self, limit: int = 10) -> List[Dict]:
        """Get most frequently recommended listings"""
        results = self.db.query(
            PropertyRecommendation.listing_id,
            func.count(PropertyRecommendation.id).label("rec_count"),
            func.avg(PropertyRecommendation.match_score).label("avg_score")
        ).group_by(
            PropertyRecommendation.listing_id
        ).order_by(
            desc("rec_count"),
            desc("avg_score")
        ).limit(limit).all()
        
        top_listings = []
        for r in results:
            listing = self.db.query(Listing).filter(Listing.id == r.listing_id).first()
            if listing:
                top_listings.append({
                    "listing_id": listing.id,
                    "title": listing.title,
                    "price": listing.price,
                    "district": listing.district_normalized,
                    "recommendation_count": r.rec_count,
                    "avg_match_score": round(float(r.avg_score or 0), 2)
                })
        
        return top_listings
    
    def calculate_market_health_score(self, city: str = None) -> float:
        """Calculate overall market health score (0-100)"""
        # Factors:
        # 1. Price stability (variance)
        # 2. Listing turnover
        # 3. Balance of supply/demand
        
        score = 70.0  # Base score
        
        # Check price stability (last 30 days)
        price_change = abs(self._get_overall_price_change(city))
        if price_change < 2:
            score += 10  # Very stable
        elif price_change < 5:
            score += 5  # Stable
        elif price_change > 10:
            score -= 10  # Very volatile
        
        # Check listing turnover
        new_listings = self.db.query(Listing).filter(
            Listing.status == "active",
            Listing.posted_date >= datetime.utcnow().date() - timedelta(days=7)
        )
        if city:
            new_listings = new_listings.filter(Listing.city_normalized == city)
        
        new_count = new_listings.count()
        total = self.db.query(Listing).filter(Listing.status == "active")
        if city:
            total = total.filter(Listing.city_normalized == city)
        
        total_count = total.count()
        
        if total_count > 0:
            turnover_rate = new_count / total_count * 100
            if 3 < turnover_rate < 10:
                score += 10  # Healthy turnover
            elif turnover_rate >= 10:
                score += 5  # Hot market
            elif turnover_rate < 1:
                score -= 5  # Slow market
        
        return min(max(score, 0), 100)
    
    def _get_overall_price_change(self, city: str = None) -> float:
        """Get overall price change percentage"""
        thirty_days_ago = datetime.utcnow().date() - timedelta(days=30)
        
        query = self.db.query(
            func.avg(Listing.price).label("avg_price")
        ).filter(Listing.status == "active")
        
        if city:
            query = query.filter(Listing.city_normalized == city)
        
        current_price = query.scalar() or 0
        
        # Get historical average (use price_history if available)
        thirty_days_price = self.db.query(
            func.avg(PriceHistory.price).label("avg_price")
        ).join(
            Listing, PriceHistory.listing_id == Listing.id
        ).filter(
            Listing.status == "active",
            PriceHistory.recorded_at >= thirty_days_ago - timedelta(days=30),
            PriceHistory.recorded_at < thirty_days_ago
        )
        
        if city:
            thirty_days_price = thirty_days_price.filter(Listing.city_normalized == city)
        
        old_price = thirty_days_price.scalar() or current_price
        
        if old_price > 0:
            return ((current_price - old_price) / old_price) * 100
        
        return 0.0
    
    def generate_market_summary(self, city: str = None) -> Dict:
        """Generate comprehensive market summary"""
        overview = self.get_market_overview(city)
        rankings = self.get_district_rankings(city, limit=10)
        rising = self.get_area_trends(city, limit=5, trend="rising")
        declining = self.get_area_trends(city, limit=5, trend="declining")
        searched = self.get_top_searched_areas(limit=10)
        recommended = self.get_top_recommended_listings(limit=10)
        health = self.calculate_market_health_score(city)
        
        # Generate summary text
        summary_parts = []
        
        if overview["total_listings"] > 0:
            summary_parts.append(
                f"Thị trường hiện có {overview['total_listings']} bất động sản đang rao bán."
            )
        else:
            summary_parts.append("Hiện chưa có dữ liệu thị trường.")
        
        if rankings:
            top_district = rankings[0]
            summary_parts.append(
                f"Quận có giá cao nhất: {top_district['district']} với giá trung bình "
                f"{top_district['avg_price']/1e9:.2f} tỷ VNĐ."
            )
        
        if rising:
            areas = ", ".join([r["area"] for r in rising[:3]])
            summary_parts.append(f"Các khu vực đang tăng giá: {areas}.")
        
        # Key findings
        key_findings = []
        if health >= 80:
            key_findings.append("Thị trường rất sôi động và ổn định.")
        elif health >= 60:
            key_findings.append("Thị trường khá cân bằng giữa cung và cầu.")
        else:
            key_findings.append("Thị trường đang trong giai đoạn điều chỉnh.")
        
        # Recommendations
        recommendations = []
        if rising:
            recommendations.append(
                f"Quận {rising[0]['area']} đang có xu hướng tăng giá - cơ hội đầu tư tốt."
            )
        
        return {
            "market_overview": overview,
            "top_districts": rankings,
            "rising_areas": rising,
            "declining_areas": declining,
            "top_searched_areas": searched,
            "top_recommended_listings": recommended,
            "market_health_score": health,
            "summary": " ".join(summary_parts),
            "key_findings": key_findings,
            "recommendations": recommendations
        }
    
    def get_dashboard_summary(self, city: str = None) -> Dict:
        """Get data for dashboard"""
        summary = self.generate_market_summary(city)
        
        # Get new listings today
        today = datetime.utcnow().date()
        new_today = self.db.query(Listing).filter(
            Listing.status == "active",
            Listing.posted_date == today
        )
        if city:
            new_today = new_today.filter(Listing.city_normalized == city)
        
        return {
            "total_listings": summary["market_overview"]["total_listings"],
            "active_listings": summary["market_overview"]["total_listings"],
            "new_listings_today": new_today.count(),
            "avg_price": summary["market_overview"]["avg_price"],
            "avg_price_change_pct": 0.0,  # Calculate if needed
            "top_districts": [
                {
                    "district": d["district"],
                    "avg_price": d["avg_price"],
                    "avg_price_per_m2": d["avg_price_per_m2"],
                    "listing_count": d["listing_count"],
                    "price_change_pct": d["price_change_pct"],
                    "trend": d["trend"]
                }
                for d in summary["top_districts"][:10]
            ],
            "rising_areas": summary["rising_areas"],
            "declining_areas": summary["declining_areas"],
            "top_searched_areas": summary["top_searched_areas"],
            "top_recommended_listings": summary["top_recommended_listings"],
            "market_health_score": summary["market_health_score"]
        }


def get_market_analysis_service() -> MarketAnalysisService:
    """Dependency for getting market analysis service"""
    return MarketAnalysisService()
