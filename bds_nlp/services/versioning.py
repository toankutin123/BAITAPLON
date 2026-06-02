from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from datetime import datetime

from models.listing import Listing
from models.version import ListingVersion
from models.location import Location

import logging

logger = logging.getLogger(__name__)


class VersioningService:
    """Service for managing listing versions and history."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_listing_history(
        self,
        listing_id: int,
        include_snapshots: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get complete version history for a listing.
        
        Args:
            listing_id: ID of the listing
            include_snapshots: Include full snapshot data
        
        Returns:
            List of version records
        """
        query = self.db.query(ListingVersion).filter(
            ListingVersion.listing_id == listing_id
        ).order_by(desc(ListingVersion.version_number))
        
        versions = query.all()
        
        return [
            {
                "version_number": v.version_number,
                "field_changed": v.field_changed,
                "old_value": v.old_value,
                "new_value": v.new_value,
                "old_value_numeric": v.old_value_numeric,
                "new_value_numeric": v.new_value_numeric,
                "created_at": v.created_at.isoformat() if v.created_at else None,
                "snapshot": v.snapshot if include_snapshots else None,
            }
            for v in versions
        ]
    
    def get_listing_changes(
        self,
        listing_id: int,
        since_date: datetime = None
    ) -> List[Dict[str, Any]]:
        """
        Get all changes for a listing since a specific date.
        
        Args:
            listing_id: ID of the listing
            since_date: Only get changes after this date
        
        Returns:
            List of changes
        """
        query = self.db.query(ListingVersion).filter(
            ListingVersion.listing_id == listing_id,
            ListingVersion.field_changed != "created"
        )
        
        if since_date:
            query = query.filter(ListingVersion.created_at >= since_date)
        
        changes = query.order_by(desc(ListingVersion.created_at)).all()
        
        return [
            {
                "version_number": v.version_number,
                "field": v.field_changed,
                "old": v.old_value,
                "new": v.new_value,
                "change_pct": self._calculate_change_pct(
                    v.old_value_numeric, 
                    v.new_value_numeric
                ),
                "timestamp": v.created_at.isoformat() if v.created_at else None,
            }
            for v in changes
        ]
    
    def compare_versions(
        self,
        listing_id: int,
        version_a: int,
        version_b: int
    ) -> Dict[str, Any]:
        """
        Compare two specific versions of a listing.
        
        Args:
            listing_id: ID of the listing
            version_a: First version number
            version_b: Second version number
        
        Returns:
            Dict with comparison data
        """
        v1 = self.db.query(ListingVersion).filter(
            and_(
                ListingVersion.listing_id == listing_id,
                ListingVersion.version_number == version_a
            )
        ).first()
        
        v2 = self.db.query(ListingVersion).filter(
            and_(
                ListingVersion.listing_id == listing_id,
                ListingVersion.version_number == version_b
            )
        ).first()
        
        if not v1 or not v2:
            return {"error": "Version not found"}
        
        return {
            "listing_id": listing_id,
            "version_a": version_a,
            "version_b": version_b,
            "changes": [
                {
                    "field": "price",
                    "old_value": v1.old_value_numeric,
                    "new_value": v2.new_value_numeric,
                    "change_abs": (v2.new_value_numeric or 0) - (v1.old_value_numeric or 0),
                    "change_pct": self._calculate_change_pct(
                        v1.old_value_numeric,
                        v2.new_value_numeric
                    ),
                }
                for v in [v1, v2]
                if v.field_changed in ["price", "area", "status"]
            ],
            "version_a_created": v1.created_at.isoformat() if v1.created_at else None,
            "version_b_created": v2.created_at.isoformat() if v2.created_at else None,
        }
    
    def get_price_timeline(
        self,
        listing_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get price change timeline for a listing.
        
        Args:
            listing_id: ID of the listing
        
        Returns:
            List of price changes
        """
        versions = self.db.query(ListingVersion).filter(
            and_(
                ListingVersion.listing_id == listing_id,
                ListingVersion.field_changed == "price"
            )
        ).order_by(ListingVersion.version_number).all()
        
        timeline = []
        for v in versions:
            timeline.append({
                "version": v.version_number,
                "price": v.new_value_numeric,
                "timestamp": v.created_at.isoformat() if v.created_at else None,
            })
        
        return timeline
    
    def get_listings_with_price_changes(
        self,
        since_date: datetime = None,
        min_change_pct: float = 5.0,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Find listings with significant price changes.
        
        Args:
            since_date: Only consider changes after this date
            min_change_pct: Minimum change percentage
            limit: Maximum number of results
        
        Returns:
            List of listings with changes
        """
        query = self.db.query(
            ListingVersion, Listing, Location
        ).join(
            Listing, ListingVersion.listing_id == Listing.id
        ).outerjoin(
            Location, Listing.location_id == Location.id
        ).filter(
            and_(
                ListingVersion.field_changed == "price",
                Listing.deleted_at.is_(None)
            )
        )
        
        if since_date:
            query = query.filter(ListingVersion.created_at >= since_date)
        
        results = query.order_by(
            desc(ListingVersion.created_at)
        ).limit(limit).all()
        
        changes = []
        for version, listing, location in results:
            change_pct = self._calculate_change_pct(
                version.old_value_numeric,
                version.new_value_numeric
            )
            
            if abs(change_pct) >= min_change_pct:
                changes.append({
                    "listing_id": listing.id,
                    "title": listing.title,
                    "url": listing.url,
                    "location": f"{location.district}, {location.city}" if location else None,
                    "old_price": version.old_value_numeric,
                    "new_price": version.new_value_numeric,
                    "change_pct": change_pct,
                    "change_abs": (version.new_value_numeric or 0) - (version.old_value_numeric or 0),
                    "changed_at": version.created_at.isoformat() if version.created_at else None,
                })
        
        return changes
    
    def _calculate_change_pct(
        self,
        old_value: Optional[int],
        new_value: Optional[int]
    ) -> Optional[float]:
        """Calculate percentage change."""
        if not old_value or not new_value or old_value == 0:
            return None
        
        return round((new_value - old_value) / old_value * 100, 2)
