"""API routes for AI Analytics Dashboard"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from config.database import get_db
from api.schemas.new_features import (
    DashboardSummary,
    MarketInsightResponse,
    PriceMetrics,
    DistrictRanking,
    AreaTrend
)
from services.market_analysis_service import MarketAnalysisService, get_market_analysis_service

router = APIRouter(prefix="/analytics", tags=["AI Analytics"])


@router.get("/dashboard", response_model=DashboardSummary)
def get_ai_dashboard(
    city: Optional[str] = Query(None, description="Filter by city"),
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """
    AI Analytics Dashboard
    
    Returns comprehensive market data including:
    - Total and active listings
    - Average prices
    - District rankings
    - Rising/declining areas
    - Top searched areas
    - Market health score
    """
    try:
        dashboard = service.get_dashboard_summary(city)
        
        return DashboardSummary(
            total_listings=dashboard["total_listings"],
            active_listings=dashboard["active_listings"],
            new_listings_today=dashboard["new_listings_today"],
            avg_price=dashboard["avg_price"],
            avg_price_change_pct=dashboard["avg_price_change_pct"],
            top_districts=[
                DistrictRanking(
                    district=d["district"],
                    avg_price=d["avg_price"],
                    avg_price_per_m2=d["avg_price_per_m2"],
                    listing_count=d["listing_count"],
                    price_change_pct=d["price_change_pct"],
                    trend=d["trend"]
                )
                for d in dashboard["top_districts"]
            ],
            rising_areas=[
                AreaTrend(
                    area=a["area"],
                    avg_price=a["avg_price"],
                    price_change_pct=a["price_change_pct"],
                    listing_count=a["listing_count"],
                    trend_direction=a["trend_direction"]
                )
                for a in dashboard["rising_areas"]
            ],
            declining_areas=[
                AreaTrend(
                    area=a["area"],
                    avg_price=a["avg_price"],
                    price_change_pct=a["price_change_pct"],
                    listing_count=a["listing_count"],
                    trend_direction=a["trend_direction"]
                )
                for a in dashboard["declining_areas"]
            ],
            top_searched_areas=dashboard["top_searched_areas"],
            market_health_score=dashboard["market_health_score"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/market-overview")
def get_market_overview(
    city: Optional[str] = None,
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get market overview statistics"""
    try:
        overview = service.get_market_overview(city)
        return overview
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/district-rankings")
def get_district_rankings(
    city: Optional[str] = None,
    sort_by: str = Query("avg_price", regex="^(avg_price|avg_price_per_m2|listing_count)$"),
    limit: int = Query(10, ge=1, le=50),
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get district rankings by various metrics"""
    try:
        rankings = service.get_district_rankings(city, limit, sort_by)
        return {"rankings": rankings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/area-trends")
def get_area_trends(
    city: Optional[str] = None,
    trend: str = Query("all", regex="^(rising|declining|stable|all)$"),
    limit: int = Query(10, ge=1, le=50),
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get area trends (rising, declining, or stable)"""
    try:
        trends = service.get_area_trends(city, limit, trend)
        return {"trends": trends}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/top-searched")
def get_top_searched_areas(
    limit: int = Query(10, ge=1, le=50),
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get most searched/viewed areas"""
    try:
        areas = service.get_top_searched_areas(limit)
        return {"top_searched_areas": areas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/top-recommended")
def get_top_recommended(
    limit: int = Query(10, ge=1, le=50),
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get most frequently recommended listings"""
    try:
        listings = service.get_top_recommended_listings(limit)
        return {"top_recommended": listings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/market-health")
def get_market_health_score(
    city: Optional[str] = None,
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get market health score (0-100)"""
    try:
        score = service.calculate_market_health_score(city)
        
        # Interpret score
        if score >= 80:
            interpretation = "Thị trường rất sôi động và ổn định"
        elif score >= 60:
            interpretation = "Thị trường khá cân bằng"
        elif score >= 40:
            interpretation = "Thị trường trung bình"
        else:
            interpretation = "Thị trường đang trong giai đoạn điều chỉnh"
        
        return {
            "score": score,
            "interpretation": interpretation,
            "city": city
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()


@router.get("/market-summary")
def get_market_summary(
    city: Optional[str] = None,
    service: MarketAnalysisService = Depends(get_market_analysis_service)
):
    """Get comprehensive market summary with AI-generated insights"""
    try:
        summary = service.generate_market_summary(city)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        service.close()
