from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime

from models.listing import Listing
from models.location import Location
from models.version import ListingVersion
from models.analytics import PriceHistory
from models.crawl import CrawlJob, CrawlLog


class DataLoader:
    """Load transformed data to database with versioning."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def load_listing(
        self, 
        data: Dict[str, Any], 
        crawl_job_id: int
    ) -> Tuple[Listing, str]:
        """
        Load a listing to database.
        Returns: (listing, action) where action is 'created', 'updated', or 'unchanged'
        """
        source_id = data.get("source_id")
        url = data.get("url")
        
        # Find existing listing by source_id or url
        existing = self._find_existing_listing(source_id, url)
        
        if existing:
            # Check for changes
            changes = self._detect_changes(existing, data)
            
            if changes:
                # Update existing listing
                action = self._update_listing(existing, data, changes, crawl_job_id)
                return existing, action
            else:
                # No changes, just update last_crawled_at
                existing.last_crawled_at = datetime.utcnow()
                self.db.commit()
                return existing, "unchanged"
        else:
            # Create new listing
            listing = self._create_listing(data, crawl_job_id)
            return listing, "created"
    
    def _find_existing_listing(self, source_id: str, url: str) -> Optional[Listing]:
        """Find existing listing by source_id or url."""
        query = self.db.query(Listing).filter(Listing.deleted_at.is_(None))
        
        if source_id:
            listing = query.filter(Listing.source_id == source_id).first()
            if listing:
                return listing
        
        if url:
            listing = query.filter(Listing.url == url).first()
            if listing:
                return listing
        
        return None
    
    def _detect_changes(
        self, 
        existing: Listing, 
        new_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Detect changes between existing and new data."""
        changes = []
        
        # Define fields to track
        tracked_fields = [
            ("price", "price", int),
            ("price_per_m2", "price_per_m2", int),
            ("price_rent", "price_rent", int),
            ("area", "area", float),
            ("bedrooms", "bedrooms", int),
            ("bathrooms", "bathrooms", int),
            ("title", "title", str),
            ("description", "description", str),
            ("status", "status", str),
        ]
        
        for field_name, data_key, type_fn in tracked_fields:
            old_value = getattr(existing, field_name)
            new_value = new_data.get(data_key)
            
            # Convert types for comparison
            if old_value is not None and type_fn in (int, float):
                old_value = type_fn(old_value)
            if new_value is not None and type_fn in (int, float):
                try:
                    new_value = type_fn(new_value)
                except:
                    new_value = None
            
            # Compare values
            if old_value != new_value:
                changes.append({
                    "field": field_name,
                    "old_value": str(old_value) if old_value is not None else None,
                    "new_value": str(new_value) if new_value is not None else None,
                    "old_value_numeric": int(old_value) if isinstance(old_value, (int, float)) else None,
                    "new_value_numeric": int(new_value) if isinstance(new_value, (int, float)) else None,
                })
        
        return changes
    
    def _create_listing(self, data: Dict[str, Any], crawl_job_id: int) -> Listing:
        """Create a new listing."""
        # Get or create location
        location = self._get_or_create_location(data)
        
        # Parse posted_date
        posted_date = None
        if data.get("posted_date"):
            try:
                posted_date = datetime.strptime(data["posted_date"], "%Y-%m-%d").date()
            except:
                pass
        
        # Create listing
        listing = Listing(
            location_id=location.id if location else None,
            title=data.get("title"),
            description=data.get("description"),
            price=data.get("price"),
            price_per_m2=data.get("price_per_m2"),
            price_rent=data.get("price_rent"),
            area=data.get("area"),
            bedrooms=data.get("bedrooms"),
            bathrooms=data.get("bathrooms"),
            property_type=data.get("property_type"),
            direction=data.get("direction"),
            legal_status=data.get("legal_status"),
            images=data.get("images", []),
            source_id=data.get("source_id"),
            url=data.get("url"),
            status="active",
            posted_date=posted_date,
            updated_date=datetime.utcnow().date(),
            last_crawled_at=datetime.utcnow(),
            current_version=1,
        )
        
        self.db.add(listing)
        self.db.flush()  # Get the ID
        
        # Create initial version
        self._create_version(
            listing_id=listing.id,
            version_number=1,
            field_changed="created",
            new_value=str(data),
            new_value_numeric=None,
            crawl_job_id=crawl_job_id,
            snapshot=data
        )
        
        # Record price history
        self._record_price_history(listing, crawl_job_id)
        
        self.db.commit()
        return listing
    
    def _update_listing(
        self, 
        listing: Listing, 
        data: Dict[str, Any], 
        changes: List[Dict[str, Any]],
        crawl_job_id: int
    ) -> str:
        """Update existing listing and record changes."""
        # Increment version
        new_version = listing.current_version + 1
        
        for change in changes:
            # Update the listing field
            field = change["field"]
            if field in data:
                setattr(listing, field, data[field])
            
            # Create version record
            self._create_version(
                listing_id=listing.id,
                version_number=new_version,
                field_changed=change["field"],
                old_value=change["old_value"],
                new_value=change["new_value"],
                old_value_numeric=change.get("old_value_numeric"),
                new_value_numeric=change.get("new_value_numeric"),
                crawl_job_id=crawl_job_id,
                snapshot=data
            )
        
        # Update metadata
        listing.current_version = new_version
        listing.updated_date = datetime.utcnow().date()
        listing.last_crawled_at = datetime.utcnow()
        
        # If price changed, record in price history
        price_change = next((c for c in changes if c["field"] == "price"), None)
        if price_change:
            self._record_price_history(listing, crawl_job_id)
        
        self.db.commit()
        return "updated"
    
    def _create_version(
        self,
        listing_id: int,
        version_number: int,
        field_changed: str,
        old_value: Optional[str],
        new_value: Optional[str],
        old_value_numeric: Optional[int],
        new_value_numeric: Optional[int],
        crawl_job_id: Optional[int],
        snapshot: Optional[Dict] = None
    ) -> ListingVersion:
        """Create a version record."""
        version = ListingVersion(
            listing_id=listing_id,
            version_number=version_number,
            field_changed=field_changed,
            old_value=old_value,
            new_value=new_value,
            old_value_numeric=old_value_numeric,
            new_value_numeric=new_value_numeric,
            crawl_job_id=crawl_job_id,
            snapshot=snapshot
        )
        self.db.add(version)
        return version
    
    def _record_price_history(
        self, 
        listing: Listing, 
        crawl_job_id: int
    ) -> PriceHistory:
        """Record price in history table."""
        history = PriceHistory(
            listing_id=listing.id,
            price=listing.price,
            price_per_m2=listing.price_per_m2,
            recorded_at=datetime.utcnow().date(),
            crawl_job_id=crawl_job_id,
            source_url=listing.url
        )
        self.db.add(history)
        return history
    
    def _get_or_create_location(self, data: Dict[str, Any]) -> Optional[Location]:
        """Get existing location or create new one."""
        city = data.get("city_normalized")
        district = data.get("district_normalized")
        ward = data.get("ward_normalized")
        
        if not city and not district:
            return None
        
        # Try to find existing location
        query = self.db.query(Location)
        
        if city:
            query = query.filter(Location.city_normalized == city)
        if district:
            query = query.filter(Location.district_normalized == district)
        if ward:
            query = query.filter(Location.ward_normalized == ward)
        
        existing = query.first()
        if existing:
            return existing
        
        # Create new location
        location = Location(
            city=data.get("city", ""),
            district=data.get("district", ""),
            ward=data.get("ward"),
            full_address=data.get("address"),
            city_normalized=city,
            district_normalized=district,
            ward_normalized=ward,
        )
        
        self.db.add(location)
        self.db.flush()
        return location
    
    def log_message(
        self,
        crawl_job_id: int,
        level: str,
        message: str,
        context: Optional[Dict] = None,
        url: Optional[str] = None,
        listing_id: Optional[int] = None
    ) -> CrawlLog:
        """Log a message."""
        log = CrawlLog(
            crawl_job_id=crawl_job_id,
            level=level,
            message=message,
            context=context or {},
            url=url,
            listing_id=listing_id
        )
        self.db.add(log)
        self.db.commit()
        return log
