"""
Recommendation endpoints for buyers
"""

from fastapi import APIRouter, HTTPException, Depends
from models.schemas import (
    BuyerProfileRequest, BuyerRecommendationRequest,
    BuyerRecommendationResponse, ScoredProperty
)
from middleware.auth import get_current_user
from services.recommendation_service import recommendation_service

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.post("/buyer", response_model=BuyerRecommendationResponse)
async def get_recommendations(
    request: BuyerRecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get property recommendations for buyer"""
    recommendations = recommendation_service.find_recommendations(
        budget_min=request.budget_min,
        budget_max=request.budget_max,
        preferred_districts=request.preferred_districts,
        preferred_types=request.preferred_types,
        min_area=request.min_area,
        min_bedrooms=request.min_bedrooms
    )
    
    props = [r['property'] for r in recommendations]
    avg_price = sum(p.get('price', 0) for p in props) / len(props) if props else 0
    
    scored = [
        ScoredProperty(
            property=r['property'],
            match_score=r['match_score'],
            price_score=r['price_score'],
            location_score=r['location_score'],
            size_score=r['size_score'],
            features_score=r['features_score'],
            reasons=r['reasons']
        )
        for r in recommendations
    ]
    
    return BuyerRecommendationResponse(
        recommendations=scored,
        total_found=len(recommendations),
        average_price=avg_price,
        market_trend="stable"
    )


@router.put("/profile")
async def update_profile(
    request: BuyerProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update buyer profile"""
    result = recommendation_service.update_buyer_profile(
        user_id=current_user.get('id'),
        budget_min=request.budget_min,
        budget_max=request.budget_max,
        preferred_districts=request.preferred_districts,
        preferred_types=request.preferred_types,
        min_area=request.min_area,
        max_area=request.max_area,
        min_bedrooms=request.min_bedrooms,
        min_bathrooms=request.min_bathrooms
    )
    return result


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get buyer profile"""
    profile = recommendation_service.get_buyer_profile(current_user.get('id'))
    if not profile:
        return {"profile": None, "message": "Chưa có profile"}
    return {"profile": profile}


@router.post("/profile/recommend")
async def recommend_from_profile(current_user: dict = Depends(get_current_user)):
    """Get recommendations based on saved profile"""
    profile = recommendation_service.get_buyer_profile(current_user.get('id'))
    
    if not profile:
        raise HTTPException(status_code=404, detail="Chưa có profile. Vui lòng cập nhật profile trước.")
    
    recommendations = recommendation_service.find_recommendations(
        budget_min=profile.get('budget_min', 0),
        budget_max=profile.get('budget_max', 10000000000),
        preferred_districts=profile.get('preferred_districts', []),
        preferred_types=profile.get('preferred_types', []),
        min_area=float(profile.get('min_area', 0)) if profile.get('min_area') else 0,
        min_bedrooms=int(profile.get('min_bedrooms', 0)) if profile.get('min_bedrooms') else 0
    )
    
    return {
        "recommendations": recommendations,
        "total_found": len(recommendations),
        "profile": profile
    }
