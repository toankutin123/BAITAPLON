"""API routes for user property listings"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from config.database import get_db
from api.schemas.new_features import (
    UserListingCreate,
    UserListingResponse,
    ValuationRequest
)
from models.user_listing import UserListing
from models.location import Location
from services.valuation_service import ValuationService

router = APIRouter(prefix="/listings", tags=["User Listings"])


def get_or_create_location(db: Session, city: str, district: str = None, ward: str = None) -> Optional[Location]:
    """Get or create location record"""
    query = db.query(Location).filter(Location.city_normalized == city)
    
    if district:
        query = query.filter(Location.district_normalized == district)
    if ward:
        query = query.filter(Location.ward_normalized == ward)
    
    location = query.first()
    
    if not location:
        location = Location(
            city=city,
            district=district or "",
            ward=ward or "",
            city_normalized=city,
            district_normalized=district or "",
            ward_normalized=ward or ""
        )
        db.add(location)
        db.flush()
    
    return location


@router.post("/user", response_model=UserListingResponse)
def create_user_listing(
    listing: UserListingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Create a new user listing with AI valuation
    
    The listing will be automatically analyzed by AI to:
    - Provide market valuation
    - Assess pricing competitiveness
    - Suggest improvements
    """
    try:
        # Get or create location
        location = get_or_create_location(
            db, listing.city, listing.district, listing.ward
        )
        
        # Calculate price per m²
        price_per_m2 = None
        if listing.area and listing.area > 0:
            price_per_m2 = int(listing.price / listing.area)
        
        # Create listing
        db_listing = UserListing(
            title=listing.title,
            description=listing.description,
            city=listing.city,
            district=listing.district or "",
            ward=listing.ward or "",
            street=listing.street or "",
            property_type=listing.property_type,
            area=listing.area,
            bedrooms=listing.bedrooms,
            bathrooms=listing.bathrooms,
            floors=listing.floors,
            direction=listing.direction,
            legal_status=listing.legal_status,
            price=listing.price,
            price_per_m2=price_per_m2,
            location_id=location.id if location else None,
            images=json.dumps(listing.images) if listing.images else "[]",
            status="pending",
            listing_type=listing.listing_type
        )
        
        db.add(db_listing)
        db.commit()
        db.refresh(db_listing)
        
        # Schedule AI valuation
        background_tasks.add_task(
            analyze_user_listing,
            db_listing.id,
            listing.city,
            listing.district
        )
        
        return UserListingResponse(
            id=db_listing.id,
            title=db_listing.title,
            description=db_listing.description,
            city=db_listing.city,
            district=db_listing.district,
            ward=db_listing.ward,
            street=db_listing.street,
            property_type=db_listing.property_type,
            area=db_listing.area,
            bedrooms=db_listing.bedrooms,
            bathrooms=db_listing.bathrooms,
            floors=db_listing.floors,
            direction=db_listing.direction,
            legal_status=db_listing.legal_status,
            price=db_listing.price,
            listing_type=db_listing.listing_type,
            location_id=db_listing.location_id,
            price_per_m2=db_listing.price_per_m2,
            status=db_listing.status,
            suggested_price=None,
            price_range_min=None,
            price_range_max=None,
            price_assessment=None,
            market_competitiveness=None,
            created_at=db_listing.created_at
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def analyze_user_listing(listing_id: int, city: str, district: str = None):
    """Background task to analyze user listing"""
    from config.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Get listing
        listing = db.query(UserListing).filter(UserListing.id == listing_id).first()
        if not listing:
            return
        
        # Run valuation
        service = ValuationService(db)
        result = service.valuation(
            area=float(listing.area) if listing.area else None,
            price=listing.price,
            property_type=listing.property_type,
            city=city,
            district=district
        )
        
        # Update listing with analysis
        listing.suggested_price = result["suggested_price"]
        listing.price_range_min = result["price_range_min"]
        listing.price_range_max = result["price_range_max"]
        listing.price_assessment = result["price_assessment"]
        listing.market_competitiveness = result["confidence_score"]
        listing.status = "analyzing"
        
        db.commit()
        
    except Exception as e:
        print(f"Error analyzing listing {listing_id}: {e}")
    finally:
        db.close()


@router.get("/user/{listing_id}", response_model=UserListingResponse)
def get_user_listing(listing_id: int, db: Session = Depends(get_db)):
    """Get user listing by ID"""
    listing = db.query(UserListing).filter(UserListing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return UserListingResponse(
        id=listing.id,
        title=listing.title,
        description=listing.description,
        city=listing.city,
        district=listing.district,
        ward=listing.ward,
        street=listing.street,
        property_type=listing.property_type,
        area=listing.area,
        bedrooms=listing.bedrooms,
        bathrooms=listing.bathrooms,
        floors=listing.floors,
        direction=listing.direction,
        legal_status=listing.legal_status,
        price=listing.price,
        listing_type=listing.listing_type,
        location_id=listing.location_id,
        price_per_m2=listing.price_per_m2,
        status=listing.status,
        suggested_price=listing.suggested_price,
        price_range_min=listing.price_range_min,
        price_range_max=listing.price_range_max,
        price_assessment=listing.price_assessment,
        market_competitiveness=float(listing.market_competitiveness) if listing.market_competitiveness else None,
        created_at=listing.created_at
    )


@router.post("/user/{listing_id}/refresh-analysis")
def refresh_analysis(
    listing_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Refresh AI analysis for a listing"""
    listing = db.query(UserListing).filter(UserListing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    listing.status = "pending"
    db.commit()
    
    # Schedule re-analysis
    background_tasks.add_task(
        analyze_user_listing,
        listing_id,
        listing.city,
        listing.district
    )
    
    return {"message": "Analysis refresh scheduled"}


@router.get("/user", response_model=List[UserListingResponse])
def list_user_listings(
    city: Optional[str] = None,
    district: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List user listings with filters"""
    query = db.query(UserListing)
    
    if city:
        query = query.filter(UserListing.city == city)
    if district:
        query = query.filter(UserListing.district == district)
    if status:
        query = query.filter(UserListing.status == status)
    
    listings = query.order_by(UserListing.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        UserListingResponse(
            id=l.id,
            title=l.title,
            description=l.description,
            city=l.city,
            district=l.district,
            ward=l.ward,
            street=l.street,
            property_type=l.property_type,
            area=l.area,
            bedrooms=l.bedrooms,
            bathrooms=l.bathrooms,
            floors=l.floors,
            direction=l.direction,
            legal_status=l.legal_status,
            price=l.price,
            listing_type=l.listing_type,
            location_id=l.location_id,
            price_per_m2=l.price_per_m2,
            status=l.status,
            suggested_price=l.suggested_price,
            price_range_min=l.price_range_min,
            price_range_max=l.price_range_max,
            price_assessment=l.price_assessment,
            market_competitiveness=float(l.market_competitiveness) if l.market_competitiveness else None,
            created_at=l.created_at
        )
        for l in listings
    ]
