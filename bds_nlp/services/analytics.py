from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, case, select
from datetime import datetime, date, timedelta
import logging

from models.listing import Listing
from models.location import Location
from models.analytics import AreaStatistics, PriceHistory
from models.crawl import CrawlJob
from models.version import ListingVersion

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for computing and retrieving analytics."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_area_statistics(
        self,
        location_id: int,
        date_str: str = None,
        period_type: str = "daily"
    ) -> Dict[str, Any]:
        """
        Calculate statistics for a specific location.
        
        Args:
            location_id: ID of the location
            date_str: Date for statistics (YYYY-MM-DD), defaults to today
            period_type: daily, weekly, or monthly
        
        Returns:
            Dict with statistics
        """
        if date_str is None:
            date_str = datetime.utcnow().strftime("%Y-%m-%d")
        
        # Get all active listings for this location
        listings = self.db.query(Listing).filter(
            and_(
                Listing.location_id == location_id,
                Listing.deleted_at.is_(None),
                Listing.status == "active",
                Listing.price.isnot(None)
            )
        ).all()
        
        if not listings:
            return {
                "location_id": location_id,
                "date": date_str,
                "period_type": period_type,
                "total_listings": 0,
                "avg_price": None,
                "median_price": None,
            }
        
        # Calculate statistics
        prices = [l.price for l in listings if l.price]
        areas = [float(l.area) for l in listings if l.area]
        price_per_m2_list = [l.price_per_m2 for l in listings if l.price_per_m2]
        
        stats = {
            "location_id": location_id,
            "date": date_str,
            "period_type": period_type,
            "total_listings": len(listings),
            "active_listings": len([l for l in listings if l.status == "active"]),
            "avg_price": sum(prices) / len(prices) if prices else None,
            "median_price": self._median(prices) if prices else None,
            "min_price": min(prices) if prices else None,
            "max_price": max(prices) if prices else None,
            "avg_area": sum(areas) / len(areas) if areas else None,
            "avg_price_per_m2": sum(price_per_m2_list) / len(price_per_m2_list) if price_per_m2_list else None,
        }
        
        # Calculate percentiles
        if prices:
            sorted_prices = sorted(prices)
            n = len(sorted_prices)
            stats["price_percentile_25"] = sorted_prices[int(n * 0.25)]
            stats["price_percentile_75"] = sorted_prices[int(n * 0.75)]
            stats["price_std_dev"] = self._std_dev(prices)
        
        # Get previous period for trend calculation
        prev_date = self._get_previous_date(date_str, period_type)
        prev_stats = self.db.query(AreaStatistics).filter(
            and_(
                AreaStatistics.location_id == location_id,
                AreaStatistics.date == prev_date,
                AreaStatistics.period_type == period_type
            )
        ).first()
        
        if prev_stats and prev_stats.avg_price:
            price_change = stats["avg_price"] - prev_stats.avg_price
            stats["price_change_abs"] = int(price_change)
            stats["price_change_pct"] = (price_change / prev_stats.avg_price) * 100 if prev_stats.avg_price else None
        
        return stats
    
    def save_area_statistics(self, stats: Dict[str, Any]) -> AreaStatistics:
        """Save area statistics to database."""
        existing = self.db.query(AreaStatistics).filter(
            and_(
                AreaStatistics.location_id == stats["location_id"],
                AreaStatistics.date == stats["date"],
                AreaStatistics.period_type == stats.get("period_type", "daily")
            )
        ).first()
        
        if existing:
            # Update existing
            for key, value in stats.items():
                if hasattr(existing, key):
                    setattr(existing, key, value)
        else:
            # Create new
            existing = AreaStatistics(**stats)
            self.db.add(existing)
        
        self.db.commit()
        self.db.refresh(existing)
        return existing
    
    def get_market_overview(self) -> Dict[str, Any]:
        """Get overall market statistics."""
        total_listings = self.db.query(Listing).filter(
            Listing.deleted_at.is_(None)
        ).count()
        
        active_listings = self.db.query(Listing).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.status == "active"
            )
        ).count()
        
        # Price distribution
        avg_price = self.db.query(func.avg(Listing.price)).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.price.isnot(None)
            )
        ).scalar()
        
        median_price = self.db.query(
            func.percentile_cont(0.5).within_group(Listing.price)
        ).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.price.isnot(None)
            )
        ).scalar()
        
        # Listings by property type
        by_type = self.db.query(
            Listing.property_type,
            func.count(Listing.id).label("count")
        ).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.property_type.isnot(None)
            )
        ).group_by(Listing.property_type).all()
        
        # Listings by city
        by_city = self.db.query(
            Location.city,
            func.count(Listing.id).label("count")
        ).join(Listing, Location.id == Listing.location_id).filter(
            Listing.deleted_at.is_(None)
        ).group_by(Location.city).all()
        
        return {
            "total_listings": total_listings,
            "active_listings": active_listings,
            "avg_price": float(avg_price) if avg_price else None,
            "median_price": float(median_price) if median_price else None,
            "by_property_type": {r[0]: r[1] for r in by_type},
            "by_city": {r[0]: r[1] for r in by_city},
        }
    
    def get_district_rankings(
        self, 
        sort_by: str = "avg_price",
        order: str = "desc",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get district rankings."""
        query = self.db.query(
            Location.id,
            Location.city,
            Location.district,
            func.count(Listing.id).label("listing_count"),
            func.avg(Listing.price).label("avg_price"),
            func.avg(Listing.price_per_m2).label("avg_price_per_m2"),
        ).join(Listing, Location.id == Listing.location_id).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.status == "active"
            )
        ).group_by(Location.id, Location.city, Location.district)
        
        if sort_by == "avg_price":
            query = query.order_by(desc(func.avg(Listing.price)))
        elif sort_by == "avg_price_per_m2":
            query = query.order_by(desc(func.avg(Listing.price_per_m2)))
        elif sort_by == "listing_count":
            query = query.order_by(desc(func.count(Listing.id)))
        else:
            query = query.order_by(desc(func.avg(Listing.price)))
        
        results = query.limit(limit).all()
        
        return [
            {
                "location_id": r[0],
                "city": r[1],
                "district": r[2],
                "listing_count": r[3],
                "avg_price": float(r[4]) if r[4] else None,
                "avg_price_per_m2": float(r[5]) if r[5] else None,
            }
            for r in results
        ]
    
    def get_price_trends(
        self,
        location_id: Optional[int] = None,
        property_type: Optional[str] = None,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get price trends over time."""
        start_date = datetime.utcnow().date() - timedelta(days=days)
        
        query = self.db.query(
            PriceHistory.recorded_at,
            func.avg(PriceHistory.price).label("avg_price"),
            func.count(PriceHistory.id).label("count")
        ).filter(
            PriceHistory.recorded_at >= start_date
        )
        
        if location_id:
            listing_ids = self.db.query(Listing.id).filter(
                Listing.location_id == location_id
            ).subquery()
            query = query.filter(PriceHistory.listing_id.in_(select(listing_ids)))
        
        if property_type:
            listing_ids = self.db.query(Listing.id).filter(
                Listing.property_type == property_type
            ).subquery()
            query = query.filter(PriceHistory.listing_id.in_(select(listing_ids)))
        
        results = query.group_by(
            PriceHistory.recorded_at
        ).order_by(
            PriceHistory.recorded_at
        ).all()
        
        return [
            {
                "date": r[0].isoformat() if hasattr(r[0], 'isoformat') else r[0],
                "avg_price": float(r[1]) if r[1] else None,
                "count": r[2],
            }
            for r in results
        ]
    
    def get_top_gainers_losers(
        self,
        limit: int = 10,
        metric: str = "price_change_pct"
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Get top listings with biggest price changes."""
        # Get listings with recent price changes
        recent_changes = self.db.query(
            Listing,
            ListingVersion
        ).join(
            ListingVersion, Listing.id == ListingVersion.listing_id
        ).filter(
            and_(
                Listing.deleted_at.is_(None),
                ListingVersion.field_changed == "price",
                ListingVersion.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        ).order_by(
            ListingVersion.created_at.desc()
        ).limit(limit * 2).all()
        
        # Calculate price change percentage
        changes = []
        for listing, version in recent_changes:
            if version.old_value_numeric and version.new_value_numeric:
                pct_change = (
                    (version.new_value_numeric - version.old_value_numeric) 
                    / version.old_value_numeric * 100
                )
                changes.append({
                    "listing_id": listing.id,
                    "title": listing.title,
                    "old_price": version.old_value_numeric,
                    "new_price": version.new_value_numeric,
                    "change_pct": pct_change,
                    "change_abs": version.new_value_numeric - version.old_value_numeric,
                    "changed_at": version.created_at.isoformat() if version.created_at else None,
                })
        
        # Separate gainers and losers
        sorted_changes = sorted(changes, key=lambda x: x["change_pct"], reverse=True)
        
        return {
            "gainers": sorted_changes[:limit],
            "losers": sorted_changes[-limit:][::-1] if len(sorted_changes) >= limit else [],
        }
    
    def _median(self, values: List[float]) -> float:
        """Calculate median."""
        if not values:
            return None
        sorted_values = sorted(values)
        n = len(sorted_values)
        if n % 2 == 0:
            return (sorted_values[n//2 - 1] + sorted_values[n//2]) / 2
        return sorted_values[n//2]
    
    def _std_dev(self, values: List[float]) -> float:
        """Calculate standard deviation."""
        if len(values) < 2:
            return 0
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def _get_previous_date(self, date_str: str, period_type: str) -> str:
        """Get previous period date."""
        current = datetime.strptime(date_str, "%Y-%m-%d").date()
        
        if period_type == "daily":
            prev = current - timedelta(days=1)
        elif period_type == "weekly":
            prev = current - timedelta(weeks=1)
        elif period_type == "monthly":
            # Go back one month
            if current.month == 1:
                prev = current.replace(year=current.year - 1, month=12)
            else:
                prev = current.replace(month=current.month - 1)
        else:
            prev = current - timedelta(days=1)
        
        return prev.strftime("%Y-%m-%d")
