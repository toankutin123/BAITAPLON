"""API Schemas for new features"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# ============ User Listing Schemas ============

class UserListingBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None
    city: str
    district: Optional[str] = None
    ward: Optional[str] = None
    street: Optional[str] = None
    property_type: str
    area: Optional[float] = None
    bedrooms: int = 0
    bathrooms: int = 0
    floors: int = 1
    direction: Optional[str] = None
    legal_status: Optional[str] = None
    price: int
    listing_type: str = "sell"  # sell, rent


class UserListingCreate(UserListingBase):
    images: Optional[List[str]] = []


class UserListingResponse(UserListingBase):
    id: int
    location_id: Optional[int] = None
    price_per_m2: Optional[int] = None
    status: str
    suggested_price: Optional[int] = None
    price_range_min: Optional[int] = None
    price_range_max: Optional[int] = None
    price_assessment: Optional[str] = None
    market_competitiveness: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Property Valuation Schemas ============

class ValuationRequest(BaseModel):
    area: Optional[float] = None
    price: Optional[int] = None
    property_type: str = "house"
    city: str
    district: Optional[str] = None
    ward: Optional[str] = None
    street: Optional[str] = None
    bedrooms: int = 0
    bathrooms: int = 0
    floors: int = 1
    direction: Optional[str] = None


class ComparableProperty(BaseModel):
    id: int
    title: str
    price: int
    area: float
    price_per_m2: int
    city: str
    district: str
    ward: str
    similarity_score: float = Field(ge=0, le=100)


class ValuationScoreBreakdown(BaseModel):
    location_score: float = Field(ge=0, le=100)
    price_score: float = Field(ge=0, le=100)
    condition_score: float = Field(ge=0, le=100)


class ValuationResponse(BaseModel):
    suggested_price: int
    price_range_min: int
    price_range_max: int
    price_per_m2: int
    market_avg_price: int
    market_median_price: int
    price_assessment: str  # below_market, fair, above_market
    confidence_score: float = Field(ge=0, le=100)
    data_points_used: int
    scores: ValuationScoreBreakdown
    comparable_properties: List[ComparableProperty]
    trend_direction: str  # rising, stable, declining
    analysis_summary: str


# ============ Search Profile Schemas ============

class SearchProfileCreate(BaseModel):
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    city: str
    district: Optional[str] = None
    ward: Optional[str] = None
    property_type: Optional[str] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    min_bedrooms: int = 0
    min_bathrooms: int = 0
    acceptable_districts: Optional[List[str]] = []
    acceptable_wards: Optional[List[str]] = []
    # Weights
    location_weight: float = 0.40
    price_weight: float = 0.30
    area_weight: float = 0.15
    amenities_weight: float = 0.15


class SearchProfileResponse(SearchProfileCreate):
    id: int
    session_id: Optional[str] = None
    created_at: datetime
    last_search_at: Optional[datetime] = None
    search_count: int = 0
    
    class Config:
        from_attributes = True


# ============ Recommendation Schemas ============

class PropertyStrengths(BaseModel):
    category: str
    points: List[str]


class PropertyRecommendationResponse(BaseModel):
    id: int
    listing_id: int
    title: str
    price: int
    area: float
    price_per_m2: int
    city: str
    district: str
    ward: str
    bedrooms: int
    bathrooms: int
    property_type: str
    match_score: float = Field(ge=0, le=100)
    location_score: float = Field(ge=0, le=100)
    price_score: float = Field(ge=0, le=100)
    area_score: float = Field(ge=0, le=100)
    amenities_score: float = Field(ge=0, le=100)
    recommendation_type: str
    strengths: List[str]
    weaknesses: List[str]
    reasons: str
    rank: int


class RecommendationListResponse(BaseModel):
    profile_id: int
    total_count: int
    recommendations: List[PropertyRecommendationResponse]
    search_criteria: SearchProfileCreate
    alternative_suggestions: Optional[List[PropertyRecommendationResponse]] = None


# ============ Market Insight Schemas ============

class PriceMetrics(BaseModel):
    avg_price: int
    avg_price_per_m2: int
    median_price: int
    min_price: int
    max_price: int


class DistrictRanking(BaseModel):
    district: str
    avg_price: int
    avg_price_per_m2: int
    listing_count: int
    price_change_pct: float
    trend: str  # rising, stable, declining


class AreaTrend(BaseModel):
    area: str
    avg_price: float
    price_change_pct: float
    listing_count: int
    trend_direction: str


class MarketInsightResponse(BaseModel):
    city: str
    insight_type: str
    period_type: str
    period_start: date
    period_end: date
    price_metrics: PriceMetrics
    price_change_pct: float
    listing_count: int
    new_listings: int
    trend_direction: str
    trend_strength: float
    market_sentiment: str  # bullish, neutral, bearish
    summary: str
    key_findings: List[str]
    recommendations: List[str]


class DashboardSummary(BaseModel):
    total_listings: int
    active_listings: int
    new_listings_today: int
    avg_price: int
    avg_price_change_pct: float
    top_districts: List[DistrictRanking]
    rising_areas: List[AreaTrend]
    declining_areas: List[AreaTrend]
    top_searched_areas: List[dict]
    market_health_score: float


# ============ Search Request Schemas ============

class PropertySearchRequest(BaseModel):
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)
    city: str
    district: Optional[str] = None
    ward: Optional[str] = None
    property_type: Optional[str] = None
    min_area: Optional[float] = Field(None, ge=0)
    max_area: Optional[float] = Field(None, ge=0)
    min_bedrooms: int = 0
    min_bathrooms: int = 0
    # Weights for scoring
    location_weight: float = 0.40
    price_weight: float = 0.30
    area_weight: float = 0.15
    amenities_weight: float = 0.15
    # Expansion options
    include_nearby_districts: bool = True
    include_nearby_wards: bool = True
    max_results: int = Field(default=20, ge=1, le=100)


class PropertySearchResponse(BaseModel):
    criteria: PropertySearchRequest
    total_matches: int
    shown_results: int
    recommendations: List[PropertyRecommendationResponse]
    alternative_suggestions: List[PropertyRecommendationResponse]
    search_expanded: bool
    expansion_reason: Optional[str] = None
