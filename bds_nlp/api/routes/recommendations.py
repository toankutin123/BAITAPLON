"""API routes for property recommendations"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import json

from config.database import get_db
from api.schemas.new_features import (
    PropertySearchRequest,
    PropertySearchResponse,
    PropertyRecommendationResponse,
    SearchProfileCreate,
    SearchProfileResponse
)
from services.recommendation_service import RecommendationService, get_recommendation_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/search", response_model=PropertySearchResponse)
def search_properties(
    request: PropertySearchRequest,
    service: RecommendationService = Depends(get_recommendation_service)
):
    """
    AI-powered property search with personalized recommendations
    
    Features:
    - Progressive search expansion (street -> ward -> district -> city)
    - Match scoring based on user preferences
    - Alternative suggestions when exact matches are limited
    - Detailed analysis for each recommendation
    """
    try:
        # Create search profile
        profile = service.create_search_profile(
            budget_min=request.budget_min,
            budget_max=request.budget_max,
            city=request.city,
            district=request.district,
            ward=request.ward,
            property_type=request.property_type,
            min_area=request.min_area,
            max_area=request.max_area,
            min_bedrooms=request.min_bedrooms,
            min_bathrooms=request.min_bathrooms,
            acceptable_districts=request.include_nearby_districts and [request.district] or [],
            acceptable_wards=request.include_nearby_wards and [request.ward] or [],
            location_weight=request.location_weight,
            price_weight=request.price_weight,
            area_weight=request.area_weight,
            amenities_weight=request.amenities_weight
        )
        
        # Generate recommendations
        recommendations, alternatives = service.generate_recommendations(
            profile,
            max_results=request.max_results
        )
        
        # Calculate expansion info
        criteria_dict = request.model_dump()
        
        return PropertySearchResponse(
            criteria=request,
            total_matches=len(recommendations) + len(alternatives),
            shown_results=len(recommendations),
            recommendations=[
                PropertyRecommendationResponse(**r) for r in recommendations
            ],
            alternative_suggestions=[
                PropertyRecommendationResponse(**a) for a in alternatives[:5]
            ],
            search_expanded=profile.search_count > 1,
            expansion_reason=None
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/for-you", response_model=List[PropertyRecommendationResponse])
def get_personalized_recommendations(
    session_id: str = Query(..., description="User session ID"),
    limit: int = Query(10, ge=1, le=50),
    service: RecommendationService = Depends(get_recommendation_service)
):
    """Get personalized recommendations based on previous searches"""
    try:
        from models.recommendation import UserSearchProfile, PropertyRecommendation
        
        # Get latest search profile
        profile = service.db.query(UserSearchProfile).filter(
            UserSearchProfile.session_id == session_id
        ).order_by(UserSearchProfile.created_at.desc()).first()
        
        if not profile:
            return []
        
        # Get saved recommendations
        recommendations = service.db.query(PropertyRecommendation).filter(
            PropertyRecommendation.session_id == session_id,
            PropertyRecommendation.is_active == "Y"
        ).order_by(PropertyRecommendation.match_score.desc()).limit(limit).all()
        
        # Get listing details
        result = []
        for rec in recommendations:
            listing = service.db.query(Listing).filter(Listing.id == rec.listing_id).first()
            if listing:
                result.append(PropertyRecommendationResponse(
                    id=rec.id,
                    listing_id=rec.listing_id,
                    title=listing.title,
                    price=listing.price,
                    area=float(listing.area) if listing.area else 0,
                    price_per_m2=listing.price_per_m2 or 0,
                    city=listing.location.city if listing.location else "",
                    district=listing.location.district if listing.location else "",
                    ward=listing.location.ward if listing.location else "",
                    bedrooms=listing.bedrooms,
                    bathrooms=listing.bathrooms,
                    property_type=listing.property_type,
                    match_score=float(rec.match_score),
                    location_score=float(rec.location_score) if rec.location_score else 0,
                    price_score=float(rec.price_score) if rec.price_score else 0,
                    area_score=float(rec.area_score) if rec.area_score else 0,
                    amenities_score=float(rec.amenities_score) if rec.amenities_score else 0,
                    recommendation_type=rec.recommendation_type,
                    strengths=rec.strengths or [],
                    weaknesses=rec.weaknesses or [],
                    reasons=rec.reasons or "",
                    rank=rec.rank or 0
                ))
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/similar/{listing_id}")
def get_similar_properties(
    listing_id: int,
    limit: int = Query(5, ge=1, le=20),
    service: RecommendationService = Depends(get_recommendation_service)
):
    """Get properties similar to a given listing"""
    try:
        from models.listing import Listing
        
        # Get target listing
        target = service.db.query(Listing).filter(Listing.id == listing_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Create temporary profile
        profile = service.create_search_profile(
            city=target.city_normalized,
            district=target.district_normalized,
            property_type=target.property_type,
            budget_min=int(target.price * 0.7) if target.price else None,
            budget_max=int(target.price * 1.3) if target.price else None,
            min_area=float(target.area * 0.7) if target.area else None,
            max_area=float(target.area * 1.3) if target.area else None,
            min_bedrooms=target.bedrooms
        )
        
        # Generate recommendations
        recommendations, _ = service.generate_recommendations(profile, max_results=limit + 1)
        
        # Filter out the target listing
        recommendations = [r for r in recommendations if r["listing_id"] != listing_id]
        
        return {
            "target_listing_id": listing_id,
            "similar_count": len(recommendations),
            "similar_properties": [
                PropertyRecommendationResponse(**r) for r in recommendations
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/under-valued")
def get_undervalued_properties(
    city: str,
    district: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
    service: RecommendationService = Depends(get_recommendation_service)
):
    """Get properties priced below market value"""
    try:
        from models.listing import Listing
        from models.analytics import AreaStatistics
        
        # Get area average price
        avg_query = service.db.query(
            func.avg(Listing.price).label("avg_price"),
            func.avg(Listing.price_per_m2).label("avg_ppm2")
        ).filter(
            Listing.status == "active",
            Listing.city_normalized == city
        )
        
        if district:
            avg_query = avg_query.filter(Listing.district_normalized == district)
        
        avg = avg_query.first()
        
        if not avg or not avg.avg_price:
            return {"properties": [], "message": "Không đủ dữ liệu"}
        
        # Find properties priced below average
        undervalued = service.db.query(Listing).filter(
            Listing.status == "active",
            Listing.city_normalized == city,
            Listing.price_per_m2 < (avg.avg_ppm2 * 0.85) if avg.avg_ppm2 else True
        ).order_by(Listing.price_per_m2).limit(limit).all()
        
        return {
            "area_avg_price": int(avg.avg_price),
            "area_avg_price_per_m2": int(avg.avg_ppm2) if avg.avg_ppm2 else 0,
            "properties": [
                {
                    "id": p.id,
                    "title": p.title,
                    "price": p.price,
                    "area": float(p.area) if p.area else 0,
                    "price_per_m2": p.price_per_m2,
                    "district": p.district_normalized,
                    "discount_from_avg": round(
                        ((p.price_per_m2 - avg.avg_ppm2) / avg.avg_ppm2 * 100) 
                        if avg.avg_ppm2 and p.price_per_m2 else 0, 
                        1
                    )
                }
                for p in undervalued
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


# Import func for SQL
from sqlalchemy import func
from models.listing import Listing
