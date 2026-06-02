from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class MarketOverview(BaseModel):
    """Market overview statistics."""
    total_listings: int
    active_listings: int
    avg_price: Optional[float]
    median_price: Optional[float]
    by_property_type: Dict[str, int]
    by_city: Dict[str, int]


class DistrictRanking(BaseModel):
    """District ranking item."""
    location_id: int
    city: Optional[str]
    district: str
    listing_count: int
    avg_price: Optional[float]
    avg_price_per_m2: Optional[float]


class PriceTrendItem(BaseModel):
    """Price trend data point."""
    date: str
    avg_price: Optional[float]
    count: int


class PriceChange(BaseModel):
    """Price change record."""
    listing_id: int
    title: str
    url: Optional[str] = None
    location: Optional[str] = None
    old_price: Optional[int]
    new_price: Optional[int]
    change_pct: float
    change_abs: int
    changed_at: Optional[str]


class TopMoversResponse(BaseModel):
    """Top gainers and losers."""
    gainers: List[PriceChange]
    losers: List[PriceChange]


class AreaStatisticsResponse(BaseModel):
    """Area statistics response."""
    location_id: int
    date: str
    period_type: str
    total_listings: int
    active_listings: int
    avg_price: Optional[float]
    median_price: Optional[float]
    min_price: Optional[int]
    max_price: Optional[int]
    avg_area: Optional[float]
    avg_price_per_m2: Optional[float]
    price_change_pct: Optional[float]
    price_change_abs: Optional[int]


class AnomalyResponse(BaseModel):
    """Anomaly record."""
    id: int
    listing_id: int
    listing_title: Optional[str]
    listing_url: Optional[str]
    location: Optional[str]
    anomaly_type: str
    severity: str
    description: str
    detected_price: Optional[int]
    deviation_pct: Optional[float]
    detected_at: Optional[str]
    resolved: str


class DashboardSummary(BaseModel):
    """Dashboard summary data."""
    market_overview: MarketOverview
    top_districts: List[DistrictRanking]
    recent_changes: TopMoversResponse
    unresolved_anomalies: List[AnomalyResponse]
    last_crawl_job: Optional[Dict]
