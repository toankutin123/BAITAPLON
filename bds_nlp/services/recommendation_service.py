"""AI Property Recommendation Service"""
import sys
sys.path.insert(0, 'c:/GitHub/BAITAPLON/bds_nlp')

from typing import List, Optional, Dict, Tuple
from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid

from models.listing import Listing
from models.location import Location
from models.recommendation import UserSearchProfile, PropertyRecommendation
from models.valuation import PropertyValuation
from config.database import SessionLocal


class RecommendationService:
    """Service for AI-powered property recommendations"""
    
    def __init__(self, db: Session = None):
        self.db = db or SessionLocal()
    
    def close(self):
        self.db.close()
    
    def create_search_profile(
        self,
        budget_min: int = None,
        budget_max: int = None,
        city: str = None,
        district: str = None,
        ward: str = None,
        property_type: str = None,
        min_area: float = None,
        max_area: float = None,
        min_bedrooms: int = 0,
        min_bathrooms: int = 0,
        acceptable_districts: List[str] = None,
        acceptable_wards: List[str] = None,
        location_weight: float = 0.40,
        price_weight: float = 0.30,
        area_weight: float = 0.15,
        amenities_weight: float = 0.15,
        session_id: str = None
    ) -> UserSearchProfile:
        """Create or update search profile"""
        profile = UserSearchProfile(
            session_id=session_id or str(uuid.uuid4()),
            budget_min=budget_min,
            budget_max=budget_max,
            city=city,
            district=district,
            ward=ward,
            property_type=property_type,
            min_area=min_area,
            max_area=max_area,
            min_bedrooms=min_bedrooms,
            min_bathrooms=min_bathrooms,
            acceptable_districts=acceptable_districts or [],
            acceptable_wards=acceptable_wards or [],
            location_weight=location_weight,
            price_weight=price_weight,
            area_weight=area_weight,
            amenities_weight=amenities_weight,
            search_count=1,
            last_search_at=datetime.utcnow()
        )
        
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        
        return profile
    
    def find_matching_properties(
        self,
        profile: UserSearchProfile,
        expansion_level: int = 0
    ) -> Tuple[List[Listing], bool, str]:
        """
        Find matching properties with progressive expansion
        Returns: (properties, expanded, reason)
        """
        # Build base query
        query = self.db.query(Listing).filter(
            Listing.status == "active"
        )
        
        # City filter
        if profile.city:
            query = query.filter(Listing.city_normalized == profile.city)
        
        # District filter
        if profile.district:
            if expansion_level == 0:
                query = query.filter(Listing.district_normalized == profile.district)
        
        # Price range filter
        if profile.budget_max:
            query = query.filter(Listing.price <= profile.budget_max)
        if profile.budget_min:
            query = query.filter(Listing.price >= profile.budget_min)
        
        # Property type
        if profile.property_type:
            query = query.filter(Listing.property_type == profile.property_type)
        
        # Area filter
        if profile.min_area:
            query = query.filter(Listing.area >= profile.min_area)
        if profile.max_area:
            query = query.filter(Listing.area <= profile.max_area)
        
        # Bedrooms
        if profile.min_bedrooms:
            query = query.filter(Listing.bedrooms >= profile.min_bedrooms)
        
        # Bathrooms
        if profile.min_bathrooms:
            query = query.filter(Listing.bathrooms >= profile.min_bathrooms)
        
        properties = query.limit(100).all()
        
        # Check if we need to expand
        expanded = False
        reason = None
        
        if len(properties) < 5 and expansion_level < 4:
            if expansion_level == 0 and profile.district:
                # Expand to acceptable districts
                if profile.acceptable_districts:
                    query = query.filter(
                        or_(
                            Listing.district_normalized == profile.district,
                            Listing.district_normalized.in_(profile.acceptable_districts)
                        )
                    )
                    properties = query.limit(100).all()
                    if len(properties) >= 5:
                        return properties, True, f"Mở rộng đến các quận: {', '.join(profile.acceptable_districts[:3])}"
            
            if expansion_level <= 1 and profile.district:
                # Expand to same city
                query = query.filter(
                    Listing.city_normalized == profile.city,
                    Listing.price <= (profile.budget_max or 999999999999)
                )
                properties = query.limit(100).all()
                if len(properties) >= 5:
                    return properties, True, "Mở rộng đến toàn bộ thành phố"
            
            if expansion_level <= 2:
                # Relax price constraints
                query = self.db.query(Listing).filter(
                    Listing.status == "active",
                    Listing.city_normalized == profile.city,
                    Listing.property_type == profile.property_type if profile.property_type else True
                )
                if profile.min_area:
                    query = query.filter(Listing.area >= profile.min_area)
                properties = query.limit(100).all()
                if len(properties) >= 5:
                    return properties, True, "Mở rộng ngân sách và khu vực"
        
        return properties, expanded, reason
    
    def calculate_match_score(
        self,
        listing: Listing,
        profile: UserSearchProfile
    ) -> Dict:
        """Calculate match score with breakdown"""
        scores = {}
        weights = {
            "location": float(profile.location_weight or 0.40),
            "price": float(profile.price_weight or 0.30),
            "area": float(profile.area_weight or 0.15),
            "amenities": float(profile.amenities_weight or 0.15)
        }
        
        # Location score (40%)
        location_score = 0
        if profile.district and listing.district_normalized == profile.district:
            location_score = 100
        elif profile.district in (profile.acceptable_districts or []):
            location_score = 70
        elif listing.city_normalized == profile.city:
            location_score = 40
        else:
            location_score = 20
        scores["location_score"] = location_score
        
        # Price score (30%)
        price_score = 100
        if profile.budget_max and listing.price:
            if listing.price <= profile.budget_max:
                # Bonus for being lower than max budget
                savings = (profile.budget_max - listing.price) / profile.budget_max
                price_score = 100 - (savings * 30)  # Max 100, min 70
            else:
                price_score = max(0, 100 - (listing.price - profile.budget_max) / profile.budget_max * 100)
        
        # Bonus if good price per m2
        if listing.price_per_m2:
            expected_ppm2 = (profile.budget_max or 0) / (profile.min_area or 100) if profile.min_area else 0
            if expected_ppm2 and listing.price_per_m2 < expected_ppm2:
                price_score = min(price_score + 10, 100)
        scores["price_score"] = price_score
        
        # Area score (15%)
        area_score = 100
        if profile.min_area and listing.area:
            if listing.area >= profile.min_area:
                # Perfect match or slightly larger
                area_score = 100 if listing.area <= profile.min_area * 1.5 else 80
            else:
                area_score = max(0, listing.area / profile.min_area * 100)
        scores["area_score"] = area_score
        
        # Amenities score (15%)
        amenity_points = 0
        total_amenities = 2
        
        if profile.min_bedrooms and listing.bedrooms:
            if listing.bedrooms >= profile.min_bedrooms:
                amenity_points += 1
        elif profile.min_bedrooms == 0:
            amenity_points += 1
        
        if profile.min_bathrooms and listing.bathrooms:
            if listing.bathrooms >= profile.min_bathrooms:
                amenity_points += 1
        elif profile.min_bathrooms == 0:
            amenity_points += 1
        
        scores["amenities_score"] = (amenity_points / total_amenities) * 100
        scores["amenities_score"] = amenity_points / total_amenities * 100
        
        # Total weighted score
        total_score = (
            scores["location_score"] * weights["location"] +
            scores["price_score"] * weights["price"] +
            scores["area_score"] * weights["area"] +
            scores["amenities_score"] * weights["amenities"]
        )
        
        return {
            "total_score": round(total_score, 2),
            "location_score": round(scores["location_score"], 2),
            "price_score": round(scores["price_score"], 2),
            "area_score": round(scores["area_score"], 2),
            "amenities_score": round(scores["amenities_score"], 2)
        }
    
    def generate_recommendations(
        self,
        profile: UserSearchProfile,
        max_results: int = 20
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Generate recommendations with alternatives
        Returns: (main_recommendations, alternative_suggestions)
        """
        properties, expanded, expansion_reason = self.find_matching_properties(profile)
        
        # Score all properties
        scored_properties = []
        for prop in properties:
            scores = self.calculate_match_score(prop, profile)
            scored_properties.append((prop, scores))
        
        # Sort by total score
        scored_properties.sort(key=lambda x: x[1]["total_score"], reverse=True)
        
        # Generate main recommendations
        recommendations = []
        alternatives = []
        
        for i, (prop, scores) in enumerate(scored_properties[:max_results]):
            # Determine recommendation type
            rec_type = self._determine_recommendation_type(prop, scores, profile)
            
            # Generate strengths and weaknesses
            strengths, weaknesses = self._generate_analysis(prop, scores, profile)
            
            # Generate reasons
            reasons = self._generate_reasons(prop, scores, profile)
            
            rec_data = {
                "listing_id": prop.id,
                "title": prop.title,
                "price": prop.price,
                "area": float(prop.area) if prop.area else 0,
                "price_per_m2": prop.price_per_m2,
                "city": prop.location.city if prop.location else profile.city,
                "district": prop.location.district if prop.location else profile.district,
                "ward": prop.location.ward if prop.location else profile.ward,
                "bedrooms": prop.bedrooms,
                "bathrooms": prop.bathrooms,
                "property_type": prop.property_type,
                "match_score": scores["total_score"],
                "location_score": scores["location_score"],
                "price_score": scores["price_score"],
                "area_score": scores["area_score"],
                "amenities_score": scores["amenities_score"],
                "recommendation_type": rec_type,
                "strengths": strengths,
                "weaknesses": weaknesses,
                "reasons": reasons,
                "rank": i + 1
            }
            
            if scores["total_score"] >= 60:
                recommendations.append(rec_data)
            else:
                alternatives.append(rec_data)
        
        return recommendations, alternatives
    
    def _determine_recommendation_type(
        self,
        listing: Listing,
        scores: Dict,
        profile: UserSearchProfile
    ) -> str:
        """Determine the type of recommendation"""
        if listing.district_normalized == profile.district:
            return "exact_match"
        elif listing.price_per_m2 and profile.budget_max:
            # Check if under market value
            expected_ppm2 = profile.budget_max / (profile.min_area or 100)
            if listing.price_per_m2 < expected_ppm2 * 0.8:
                return "under_market_value"
            elif listing.price_per_m2 < expected_ppm2:
                return "good_value"
        
        if scores["total_score"] >= 80:
            return "similar_area"
        elif scores["total_score"] >= 60:
            return "expanded_search"
        
        return "alternative"
    
    def _generate_analysis(
        self,
        listing: Listing,
        scores: Dict,
        profile: UserSearchProfile
    ) -> Tuple[List[str], List[str]]:
        """Generate strengths and weaknesses"""
        strengths = []
        weaknesses = []
        
        # Location
        if listing.district_normalized == profile.district:
            strengths.append("Nằm trong khu vực mong muốn")
        elif listing.city_normalized == profile.city:
            strengths.append("Thuộc thành phố bạn quan tâm")
        
        # Price
        if listing.price and profile.budget_max:
            if listing.price < profile.budget_max * 0.9:
                strengths.append("Giá thấp hơn ngân sách")
            elif listing.price > profile.budget_max:
                weaknesses.append("Giá cao hơn ngân sách")
        
        # Area
        if listing.area and profile.min_area:
            if listing.area >= profile.min_area:
                strengths.append(f"Diện tích đạt yêu cầu ({listing.area}m²)")
            else:
                weaknesses.append(f"Diện tích nhỏ hơn yêu cầu")
        
        # Bedrooms
        if listing.bedrooms and profile.min_bedrooms:
            if listing.bedrooms >= profile.min_bedrooms:
                strengths.append(f"Có {listing.bedrooms} phòng ngủ")
            else:
                weaknesses.append(f"Chỉ có {listing.bedrooms} phòng ngủ")
        
        return strengths, weaknesses
    
    def _generate_reasons(
        self,
        listing: Listing,
        scores: Dict,
        profile: UserSearchProfile
    ) -> str:
        """Generate AI explanation for recommendation"""
        reasons = []
        
        if scores["total_score"] >= 80:
            reasons.append(f"Đây là lựa chọn rất phù hợp với điểm phù hợp {scores['total_score']:.0f}%.")
        elif scores["total_score"] >= 60:
            reasons.append(f"Đây là lựa chọn khá phù hợp với điểm phù hợp {scores['total_score']:.0f}%.")
        
        if listing.district_normalized == profile.district:
            reasons.append("Nằm đúng quận bạn mong muốn.")
        
        if listing.price_per_m2 and profile.budget_max:
            expected = profile.budget_max / (profile.min_area or 100)
            if listing.price_per_m2 < expected:
                reasons.append(f"Giá/m² tốt hơn kỳ vọng.")
        
        if listing.bedrooms and listing.bedrooms >= (profile.min_bedrooms or 0):
            reasons.append(f"Đáp ứng đủ số phòng ngủ.")
        
        return " ".join(reasons) if reasons else "Phù hợp với tiêu chí tìm kiếm cơ bản."
    
    def save_recommendations(
        self,
        profile: UserSearchProfile,
        recommendations: List[Dict],
        alternatives: List[Dict]
    ) -> List[PropertyRecommendation]:
        """Save recommendations to database"""
        saved = []
        
        for rec in recommendations + alternatives:
            db_rec = PropertyRecommendation(
                search_profile_id=profile.id,
                session_id=profile.session_id,
                listing_id=rec["listing_id"],
                match_score=rec["match_score"],
                location_score=rec["location_score"],
                price_score=rec["price_score"],
                area_score=rec["area_score"],
                amenities_score=rec["amenities_score"],
                recommendation_type=rec["recommendation_type"],
                strengths=rec["strengths"],
                weaknesses=rec["weaknesses"],
                reasons=rec["reasons"],
                rank=rec["rank"]
            )
            self.db.add(db_rec)
            saved.append(db_rec)
        
        self.db.commit()
        return saved


def get_recommendation_service() -> RecommendationService:
    """Dependency for getting recommendation service"""
    return RecommendationService()
