"""API routes for property valuation"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import json

from config.database import get_db
from api.schemas.new_features import (
    ValuationRequest,
    ValuationResponse,
    ComparableProperty,
    ValuationScoreBreakdown
)
from services.valuation_service import ValuationService, get_valuation_service

router = APIRouter(prefix="/valuation", tags=["Valuation"])


@router.post("/property", response_model=ValuationResponse)
def valuate_property(
    request: ValuationRequest,
    service: ValuationService = Depends(get_valuation_service)
):
    """
    AI-powered property valuation
    
    Analyzes the property and compares with market data to provide:
    - Suggested fair price
    - Price range (min-max)
    - Price assessment (below/fair/above market)
    - Comparable properties
    - Market trends
    """
    try:
        result = service.valuation(
            area=request.area,
            price=request.price,
            property_type=request.property_type,
            city=request.city,
            district=request.district,
            ward=request.ward,
            street=request.street,
            bedrooms=request.bedrooms,
            bathrooms=request.bathrooms,
            floors=request.floors,
            direction=request.direction
        )
        
        # Convert to response model
        response = ValuationResponse(
            suggested_price=result["suggested_price"],
            price_range_min=result["price_range_min"],
            price_range_max=result["price_range_max"],
            price_per_m2=result["price_per_m2"] or 0,
            market_avg_price=result["market_avg_price"],
            market_median_price=result["market_median_price"],
            price_assessment=result["price_assessment"],
            confidence_score=result["confidence_score"],
            data_points_used=result["data_points_used"],
            scores=ValuationScoreBreakdown(**result["scores"]),
            comparable_properties=[
                ComparableProperty(**c) for c in result["comparable_properties"]
            ],
            trend_direction=result["trend_direction"],
            analysis_summary=result["analysis_summary"]
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/comparable")
def get_comparable_properties(
    city: str,
    district: Optional[str] = None,
    ward: Optional[str] = None,
    property_type: str = "house",
    limit: int = 20,
    service: ValuationService = Depends(get_valuation_service)
):
    """Get comparable properties for a given location"""
    try:
        properties = service.find_comparable_properties(
            city=city,
            district=district,
            ward=ward,
            property_type=property_type,
            limit=limit
        )
        
        return {
            "count": len(properties),
            "properties": [
                {
                    "id": p.id,
                    "title": p.title,
                    "price": p.price,
                    "area": float(p.area) if p.area else 0,
                    "price_per_m2": p.price_per_m2,
                    "city": p.location.city if p.location else city,
                    "district": p.location.district if p.location else district,
                    "ward": p.location.ward if p.location else ward,
                    "bedrooms": p.bedrooms,
                    "bathrooms": p.bathrooms
                }
                for p in properties
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/market-analysis")
def get_market_analysis(
    city: str,
    district: Optional[str] = None,
    service: ValuationService = Depends(get_valuation_service)
):
    """Get market analysis for a specific area"""
    try:
        # Get comparable properties
        properties = service.find_comparable_properties(
            city=city,
            district=district,
            property_type="house",
            limit=100
        )
        
        # Calculate metrics
        metrics = service.calculate_market_metrics(properties)
        trend = service.get_trend_direction(city, district)
        
        return {
            "city": city,
            "district": district,
            "property_count": len(properties),
            "metrics": metrics,
            "trend_direction": trend,
            "avg_price_per_m2": metrics["avg_price_per_m2"],
            "median_price_per_m2": metrics["avg_price_per_m2"]  # Approximate
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()
