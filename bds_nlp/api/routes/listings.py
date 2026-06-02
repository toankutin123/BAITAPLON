from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func
from typing import Optional, List
from datetime import datetime

from config.database import get_db
from models.listing import Listing
from models.location import Location
from models.version import ListingVersion
from services.analytics import AnalyticsService
from services.versioning import VersioningService
from api.schemas.listing import (
    ListingResponse,
    ListingDetailResponse,
    ListingListResponse,
    ListingFilter
)

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=ListingListResponse)
def get_listings(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    city: Optional[str] = None,
    district: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    status: str = "active",
    sort_by: str = "created_at",
    order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get paginated list of listings with filters."""
    query = db.query(Listing).outerjoin(
        Location, Listing.location_id == Location.id
    ).filter(Listing.deleted_at.is_(None))
    
    # Apply filters
    if city:
        query = query.filter(Location.city_normalized == city.lower())
    if district:
        query = query.filter(Location.district_normalized == district.lower())
    if property_type:
        query = query.filter(Listing.property_type == property_type)
    if min_price:
        query = query.filter(Listing.price >= min_price)
    if max_price:
        query = query.filter(Listing.price <= max_price)
    if min_area:
        query = query.filter(Listing.area >= min_area)
    if max_area:
        query = query.filter(Listing.area <= max_area)
    if status:
        query = query.filter(Listing.status == status)
    
    # Get total count
    total = query.count()
    
    # Apply sorting
    if sort_by == "price":
        query = query.order_by(Listing.price)
    elif sort_by == "area":
        query = query.order_by(Listing.area)
    elif sort_by == "created_at":
        query = query.order_by(Listing.created_at)
    else:
        query = query.order_by(Listing.id)
    
    if order == "desc":
        query = query.desc()
    
    # Apply pagination
    offset = (page - 1) * page_size
    listings = query.offset(offset).limit(page_size).all()
    
    return ListingListResponse(
        items=[ListingResponse.model_validate(l) for l in listings],
        total=total,
        page=page,
        page_size=page_size,
        pages=(total + page_size - 1) // page_size
    )


@router.get("/{listing_id}", response_model=ListingDetailResponse)
def get_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific listing."""
    listing = db.query(Listing).filter(
        and_(
            Listing.id == listing_id,
            Listing.deleted_at.is_(None)
        )
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Get location
    location = None
    if listing.location_id:
        location = db.query(Location).filter(
            Location.id == listing.location_id
        ).first()
    
    # Get price history
    versioning_service = VersioningService(db)
    price_history = versioning_service.get_price_timeline(listing_id)
    
    # Get version history
    version_history = versioning_service.get_listing_history(listing_id)
    
    return ListingDetailResponse(
        id=listing.id,
        title=listing.title,
        price=listing.price,
        area=float(listing.area) if listing.area else None,
        bedrooms=listing.bedrooms,
        bathrooms=listing.bathrooms,
        property_type=listing.property_type,
        address=listing.description,
        url=listing.url,
        source_id=listing.source_id,
        status=listing.status,
        price_per_m2=listing.price_per_m2,
        direction=listing.direction,
        legal_status=listing.legal_status,
        images=listing.images or [],
        posted_date=listing.posted_date.isoformat() if listing.posted_date else None,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        current_version=listing.current_version,
        city=location.city if location else None,
        district=location.district if location else None,
        ward=location.ward if location else None,
        price_history=price_history,
        version_history=version_history,
    )


@router.get("/{listing_id}/history")
def get_listing_history(
    listing_id: int,
    include_snapshots: bool = False,
    db: Session = Depends(get_db)
):
    """Get version history for a listing."""
    listing = db.query(Listing).filter(
        and_(
            Listing.id == listing_id,
            Listing.deleted_at.is_(None)
        )
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    versioning_service = VersioningService(db)
    return versioning_service.get_listing_history(listing_id, include_snapshots)


@router.get("/{listing_id}/changes")
def get_listing_changes(
    listing_id: int,
    since_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get changes for a listing since a specific number of days ago."""
    listing = db.query(Listing).filter(
        and_(
            Listing.id == listing_id,
            Listing.deleted_at.is_(None)
        )
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    since_date = datetime.utcnow() - timedelta(days=since_days)
    
    versioning_service = VersioningService(db)
    return versioning_service.get_listing_changes(listing_id, since_date)
