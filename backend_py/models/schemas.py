from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UpdateRoleRequest(BaseModel):
    role: int


class UpdateStatusRequest(BaseModel):
    status: bool


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str


class PredictionRequest(BaseModel):
    location: str
    property_type: str
    area: float
    bedrooms: int
    bathrooms: int
    year_built: Optional[int] = None
    features: Optional[list[str]] = []


class PredictionResponse(BaseModel):
    predicted_price: float
    confidence: float
    insights: list[str]


# Seller Request Models
class SellerRequestCreate(BaseModel):
    business_name: str
    business_type: str  # individual, company, agency
    business_registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    phone_number: str
    business_address: str
    city: str
    district: str
    description: Optional[str] = None


class SellerRequestResponse(BaseModel):
    id: int
    user_id: int
    business_name: str
    business_type: str
    phone_number: str
    business_address: str
    city: str
    district: str
    status: str
    requested_at: datetime
    reviewed_at: Optional[datetime] = None


class SellerRequestApprove(BaseModel):
    pass


class SellerRequestReject(BaseModel):
    reason_for_rejection: str


# =============================================
# Crawl Models
# =============================================

class CrawlSourceCreate(BaseModel):
    name: str
    base_url: str
    selector_map: dict = {}


class CrawlSourceResponse(BaseModel):
    id: int
    name: str
    base_url: str
    status: str
    created_at: datetime


class CrawlJobStart(BaseModel):
    source_id: int
    max_pages: int = 10


# =============================================
# NLP / Normalization Models
# =============================================

class NormalizeTextRequest(BaseModel):
    text: str


class NormalizeTextResponse(BaseModel):
    original_text: str
    normalized_data: dict
    confidence: float


class ValidateDataRequest(BaseModel):
    data: dict


class ValidateDataResponse(BaseModel):
    is_valid: bool
    errors: list[str]
    warnings: list[str]


class DeduplicateRequest(BaseModel):
    listings: list[dict]


class DeduplicateResponse(BaseModel):
    duplicates: list[dict]
    unique_listings: list[dict]
    merge_suggestions: list[dict]


# =============================================
# Valuation Models
# =============================================

class ValuationRequest(BaseModel):
    address: str
    property_type: str
    area: float
    bedrooms: int = 0
    bathrooms: int = 0
    district: str
    city: str = "TP.HCM"
    legal_status: str = "unknown"
    features: list[str] = []


class ValuationResponse(BaseModel):
    estimated_low: float
    estimated_avg: float
    estimated_high: float
    confidence: float
    comparable_count: int
    factors: dict
    comparable_properties: list[dict]


# =============================================
# Buyer Recommendation Models
# =============================================

class BuyerProfileRequest(BaseModel):
    budget_min: int
    budget_max: int
    preferred_districts: list[str] = []
    preferred_types: list[str] = []
    min_area: float = 0
    max_area: float = 0
    min_bedrooms: int = 0
    min_bathrooms: int = 0


class BuyerRecommendationRequest(BaseModel):
    budget_min: int
    budget_max: int
    preferred_districts: list[str] = []
    preferred_types: list[str] = []
    min_area: float = 0
    min_bedrooms: int = 0


class ScoredProperty(BaseModel):
    property: dict
    match_score: float
    price_score: float
    location_score: float
    size_score: float
    features_score: float
    reasons: list[str]


class BuyerRecommendationResponse(BaseModel):
    recommendations: list[ScoredProperty]
    total_found: int
    average_price: float
    market_trend: str


# =============================================
# Market Analysis Models
# =============================================

class MarketTrendRequest(BaseModel):
    district: Optional[str] = None
    city: str = "TP.HCM"
    property_type: Optional[str] = None
    period: str = "monthly"


class MarketTrendResponse(BaseModel):
    trends: list[dict]
    current_avg_price: float
    change_percent: float
    trend_direction: str
    forecast: Optional[dict]


class DistrictStats(BaseModel):
    district: str
    avg_price_per_m2: float
    total_listings: int
    change_30d: float
    change_90d: float


class DistrictStatsResponse(BaseModel):
    districts: list[DistrictStats]
    city_avg: float


# =============================================
# Dashboard Models
# =============================================

class DashboardStats(BaseModel):
    total_properties: int
    total_users: int
    avg_price: float
    avg_price_change: float
    new_listings_today: int
    active_crawlers: int


class TopGainer(BaseModel):
    district: str
    change_percent: float
    current_avg: float
    previous_avg: float


class TopLoser(BaseModel):
    district: str
    change_percent: float
    current_avg: float
    previous_avg: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    top_gainers: list[TopGainer]
    top_losers: list[TopLoser]
    recent_activity: list[dict]


# =============================================
# Admin Chat Models
# =============================================

class AdminChatSendRequest(BaseModel):
    message: str


class AdminChatReplyRequest(BaseModel):
    user_id: int
    message: str


class AdminChatMessageResponse(BaseModel):
    id: int
    user_id: int
    sender_role: int
    sender_user_id: int | None = None
    content: str
    created_at: datetime

