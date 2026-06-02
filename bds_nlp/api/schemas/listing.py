from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ListingBase(BaseModel):
    """Base listing schema."""
    title: str
    price: Optional[int] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    property_type: Optional[str] = None
    address: Optional[str] = None
    url: Optional[str] = None


class ListingResponse(ListingBase):
    """Listing response schema."""
    id: int
    source_id: Optional[str] = None
    status: str
    price_per_m2: Optional[int] = None
    direction: Optional[str] = None
    legal_status: Optional[str] = None
    images: List[str] = []
    posted_date: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ListingDetailResponse(ListingResponse):
    """Detailed listing with location and history."""
    city: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    current_version: int = 1
    price_history: List[dict] = []
    version_history: List[dict] = []


class ListingCreate(ListingBase):
    """Schema for creating a listing."""
    source_id: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    images: List[str] = []
    posted_date: Optional[str] = None


class ListingUpdate(BaseModel):
    """Schema for updating a listing."""
    title: Optional[str] = None
    price: Optional[int] = None
    area: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None


class ListingFilter(BaseModel):
    """Filter options for listings."""
    city: Optional[str] = None
    district: Optional[str] = None
    property_type: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    min_bedrooms: Optional[int] = None
    status: Optional[str] = "active"
    posted_after: Optional[str] = None
    posted_before: Optional[str] = None


class ListingListResponse(BaseModel):
    """Paginated listing response."""
    items: List[ListingResponse]
    total: int
    page: int
    page_size: int
    pages: int
