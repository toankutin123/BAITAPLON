from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime, timedelta

from config.database import get_db
from models.listing import Listing
from models.location import Location
from models.analytics import AreaStatistics, AnomalyLog
from models.crawl import CrawlJob
from services.analytics import AnalyticsService
from services.versioning import VersioningService
from services.anomaly import AnomalyDetector
from api.schemas.analytics import (
    MarketOverview,
    DistrictRanking,
    PriceTrendItem,
    TopMoversResponse,
    AreaStatisticsResponse,
    AnomalyResponse,
    DashboardSummary
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/market-overview", response_model=MarketOverview)
def get_market_overview(db: Session = Depends(get_db)):
    """Get overall market statistics."""
    service = AnalyticsService(db)
    return service.get_market_overview()


@router.get("/district-rankings", response_model=List[DistrictRanking])
def get_district_rankings(
    sort_by: str = Query("avg_price", regex="^(avg_price|avg_price_per_m2|listing_count)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get district rankings by various metrics."""
    service = AnalyticsService(db)
    rankings = service.get_district_rankings(sort_by, order, limit)
    return [DistrictRanking(**r) for r in rankings]


@router.get("/price-trends", response_model=List[PriceTrendItem])
def get_price_trends(
    location_id: Optional[int] = None,
    property_type: Optional[str] = None,
    days: int = Query(30, ge=7, le=365),
    db: Session = Depends(get_db)
):
    """Get price trends over time."""
    service = AnalyticsService(db)
    trends = service.get_price_trends(location_id, property_type, days)
    return [PriceTrendItem(**t) for t in trends]


@router.get("/top-movers", response_model=TopMoversResponse)
def get_top_movers(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get listings with biggest price changes."""
    service = AnalyticsService(db)
    return service.get_top_gainers_losers(limit)


@router.get("/area-statistics/{location_id}", response_model=AreaStatisticsResponse)
def get_area_statistics(
    location_id: int,
    date: Optional[str] = None,
    period_type: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    db: Session = Depends(get_db)
):
    """Get statistics for a specific location."""
    service = AnalyticsService(db)
    
    # Calculate or get cached statistics
    stats = service.calculate_area_statistics(location_id, date, period_type)
    
    # Try to save
    try:
        service.save_area_statistics(stats)
    except:
        pass  # Ignore if already exists
    
    return AreaStatisticsResponse(**stats)


@router.get("/anomalies", response_model=List[AnomalyResponse])
def get_anomalies(
    unresolved_only: bool = True,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get anomalies."""
    service = AnomalyDetector(db)
    
    if unresolved_only:
        anomalies = service.get_unresolved_anomalies(limit)
    else:
        anomalies = db.query(AnomalyLog, Listing, Location).join(
            Listing, AnomalyLog.listing_id == Listing.id
        ).outerjoin(
            Location, Listing.location_id == Location.id
        ).order_by(
            AnomalyLog.detected_at.desc()
        ).limit(limit).all()
        
        anomalies = [
            {
                "id": a[0].id,
                "listing_id": a[0].listing_id,
                "listing_title": a[1].title if a[1] else None,
                "listing_url": a[1].url if a[1] else None,
                "location": f"{a[2].district}, {a[2].city}" if a[2] else None,
                "anomaly_type": a[0].anomaly_type,
                "severity": a[0].severity,
                "description": a[0].description,
                "detected_price": a[0].detected_price,
                "deviation_pct": a[0].deviation_pct,
                "detected_at": a[0].detected_at.isoformat() if a[0].detected_at else None,
                "resolved": a[0].resolved,
            }
            for a in anomalies
        ]
    
    return [AnomalyResponse(**a) for a in anomalies]


@router.post("/anomalies/{anomaly_id}/resolve")
def resolve_anomaly(
    anomaly_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Mark an anomaly as resolved."""
    service = AnomalyDetector(db)
    success = service.resolve_anomaly(anomaly_id, notes)
    
    if not success:
        return {"success": False, "message": "Anomaly not found"}
    
    return {"success": True, "message": "Anomaly resolved"}


@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)):
    """Get complete dashboard summary."""
    analytics_service = AnalyticsService(db)
    
    # Market overview
    market_overview = analytics_service.get_market_overview()
    
    # Top districts
    top_districts = analytics_service.get_district_rankings(
        sort_by="avg_price",
        order="desc",
        limit=10
    )
    
    # Top movers
    top_movers = analytics_service.get_top_gainers_losers(limit=10)
    
    # Anomalies
    anomaly_service = AnomalyDetector(db)
    unresolved_anomalies = anomaly_service.get_unresolved_anomalies(limit=10)
    
    # Last crawl job
    last_job = db.query(CrawlJob).order_by(
        CrawlJob.created_at.desc()
    ).first()
    
    last_job_data = None
    if last_job:
        last_job_data = {
            "id": last_job.id,
            "status": last_job.status,
            "started_at": last_job.started_at.isoformat() if last_job.started_at else None,
            "finished_at": last_job.finished_at.isoformat() if last_job.finished_at else None,
            "listings_added": last_job.listings_added,
            "listings_updated": last_job.listings_updated,
            "errors_count": last_job.errors_count,
        }
    
    return DashboardSummary(
        market_overview=MarketOverview(**market_overview),
        top_districts=[DistrictRanking(**d) for d in top_districts],
        recent_changes=TopMoversResponse(
            gainers=[g for g in top_movers.get("gainers", [])],
            losers=[l for l in top_movers.get("losers", [])]
        ),
        unresolved_anomalies=[AnomalyResponse(**a) for a in unresolved_anomalies],
        last_crawl_job=last_job_data
    )
