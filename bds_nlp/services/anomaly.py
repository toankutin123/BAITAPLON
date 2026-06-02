from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime
import logging

from models.listing import Listing
from models.analytics import AnomalyLog
from models.location import Location

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Service for detecting anomalies in real estate data."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def detect_all_anomalies(
        self,
        crawl_job_id: Optional[int] = None
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Run all anomaly detection algorithms.
        
        Args:
            crawl_job_id: ID of the crawl job for logging
        
        Returns:
            Dict with anomalies by type
        """
        results = {
            "price_drops": self.detect_price_drops(crawl_job_id),
            "price_surges": self.detect_price_surges(crawl_job_id),
            "suspicious_prices": self.detect_suspicious_prices(crawl_job_id),
            "duplicates": self.detect_duplicates(crawl_job_id),
        }
        
        total = sum(len(v) for v in results.values())
        logger.info(f"Detected {total} anomalies")
        
        return results
    
    def detect_price_drops(
        self,
        crawl_job_id: Optional[int] = None,
        min_drop_pct: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Detect listings with significant price drops.
        
        Args:
            crawl_job_id: ID of the crawl job
            min_drop_pct: Minimum drop percentage to flag
        
        Returns:
            List of listings with price drops
        """
        # Get listings with recent price drops
        from models.version import ListingVersion
        
        drops = self.db.query(
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
        ).order_by(
            ListingVersion.created_at.desc()
        ).limit(500).all()
        
        anomalies = []
        for version, listing, location in drops:
            if version.old_value_numeric and version.new_value_numeric:
                if version.new_value_numeric < version.old_value_numeric:
                    drop_pct = (
                        (version.old_value_numeric - version.new_value_numeric)
                        / version.old_value_numeric * 100
                    )
                    
                    if drop_pct >= min_drop_pct:
                        # Check if already logged
                        existing = self._get_existing_anomaly(
                            listing.id, 
                            "price_drop", 
                            version.created_at
                        )
                        
                        if not existing:
                            anomaly = self._create_anomaly(
                                listing_id=listing.id,
                                location_id=listing.location_id,
                                anomaly_type="price_drop",
                                severity=self._get_severity(drop_pct),
                                description=f"Giá giảm {drop_pct:.1f}%",
                                detected_price=version.new_value_numeric,
                                expected_range_min=version.old_value_numeric,
                                expected_range_max=version.old_value_numeric,
                                deviation_pct=-drop_pct,
                                crawl_job_id=crawl_job_id
                            )
                            anomalies.append(anomaly)
        
        return anomalies
    
    def detect_price_surges(
        self,
        crawl_job_id: Optional[int] = None,
        min_surge_pct: float = 20.0
    ) -> List[Dict[str, Any]]:
        """
        Detect listings with significant price increases.
        
        Args:
            crawl_job_id: ID of the crawl job
            min_surge_pct: Minimum surge percentage to flag
        
        Returns:
            List of listings with price surges
        """
        from models.version import ListingVersion
        
        surges = self.db.query(
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
        ).order_by(
            ListingVersion.created_at.desc()
        ).limit(500).all()
        
        anomalies = []
        for version, listing, location in surges:
            if version.old_value_numeric and version.new_value_numeric:
                if version.new_value_numeric > version.old_value_numeric:
                    surge_pct = (
                        (version.new_value_numeric - version.old_value_numeric)
                        / version.old_value_numeric * 100
                    )
                    
                    if surge_pct >= min_surge_pct:
                        existing = self._get_existing_anomaly(
                            listing.id,
                            "price_surge",
                            version.created_at
                        )
                        
                        if not existing:
                            anomaly = self._create_anomaly(
                                listing_id=listing.id,
                                location_id=listing.location_id,
                                anomaly_type="price_surge",
                                severity=self._get_severity(surge_pct),
                                description=f"Giá tăng {surge_pct:.1f}%",
                                detected_price=version.new_value_numeric,
                                expected_range_min=version.old_value_numeric,
                                expected_range_max=version.old_value_numeric,
                                deviation_pct=surge_pct,
                                crawl_job_id=crawl_job_id
                            )
                            anomalies.append(anomaly)
        
        return anomalies
    
    def detect_suspicious_prices(
        self,
        crawl_job_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Detect listings with suspicious absolute prices.
        
        Args:
            crawl_job_id: ID of the crawl job
        
        Returns:
            List of suspicious listings
        """
        # Get listings with very low or very high prices
        suspicious = []
        
        # Very low prices (below 100 million VND for houses)
        low_prices = self.db.query(Listing, Location).outerjoin(
            Location, Listing.location_id == Location.id
        ).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.status == "active",
                Listing.property_type == "house",
                Listing.price.isnot(None),
                Listing.price < 100_000_000  # Below 100M
            )
        ).limit(50).all()
        
        for listing, location in low_prices:
            existing = self._get_existing_anomaly(listing.id, "suspicious", None)
            if not existing:
                anomaly = self._create_anomaly(
                    listing_id=listing.id,
                    location_id=listing.location_id,
                    anomaly_type="suspicious",
                    severity="high",
                    description="Giá bất thường thấp",
                    detected_price=listing.price,
                    crawl_job_id=crawl_job_id
                )
                suspicious.append(anomaly)
        
        # Very high price per m2 (above 500M/m²)
        high_price_per_m2 = self.db.query(Listing, Location).outerjoin(
            Location, Listing.location_id == Location.id
        ).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.status == "active",
                Listing.price_per_m2.isnot(None),
                Listing.price_per_m2 > 500_000_000  # Above 500M/m²
            )
        ).limit(50).all()
        
        for listing, location in high_price_per_m2:
            existing = self._get_existing_anomaly(listing.id, "suspicious", None)
            if not existing:
                anomaly = self._create_anomaly(
                    listing_id=listing.id,
                    location_id=listing.location_id,
                    anomaly_type="suspicious",
                    severity="medium",
                    description="Giá/m² bất thường cao",
                    detected_price=listing.price,
                    expected_price_range_max=listing.price_per_m2,
                    crawl_job_id=crawl_job_id
                )
                suspicious.append(anomaly)
        
        return suspicious
    
    def detect_duplicates(
        self,
        crawl_job_id: Optional[int] = None,
        similarity_threshold: float = 0.85
    ) -> List[Dict[str, Any]]:
        """
        Detect potential duplicate listings.
        
        Args:
            crawl_job_id: ID of the crawl job
            similarity_threshold: Minimum similarity score
        
        Returns:
            List of potential duplicates
        """
        # Get all active listings
        listings = self.db.query(Listing).filter(
            and_(
                Listing.deleted_at.is_(None),
                Listing.status == "active",
                Listing.price.isnot(None),
                Listing.area.isnot(None)
            )
        ).limit(1000).all()
        
        duplicates = []
        checked = set()
        
        for i, listing1 in enumerate(listings):
            for listing2 in listings[i+1:]:
                pair_key = (min(listing1.id, listing2.id), max(listing1.id, listing2.id))
                
                if pair_key in checked:
                    continue
                checked.add(pair_key)
                
                # Check similarity
                if self._is_duplicate(listing1, listing2, similarity_threshold):
                    # Check if already logged
                    existing = self._get_existing_anomaly(
                        listing1.id,
                        "duplicate",
                        None
                    )
                    
                    if not existing:
                        anomaly = self._create_anomaly(
                            listing_id=listing1.id,
                            location_id=listing1.location_id,
                            anomaly_type="duplicate",
                            severity="low",
                            description=f"Có thể trùng với tin #{listing2.id}",
                            detected_price=listing1.price,
                            related_listing_id=listing2.id,
                            crawl_job_id=crawl_job_id
                        )
                        duplicates.append(anomaly)
        
        return duplicates
    
    def _is_duplicate(
        self,
        listing1: Listing,
        listing2: Listing,
        threshold: float
    ) -> bool:
        """Check if two listings are duplicates."""
        score = 0.0
        factors = 0
        
        # Price similarity (40%)
        if listing1.price and listing2.price:
            factors += 1
            price_ratio = min(listing1.price, listing2.price) / max(listing1.price, listing2.price)
            score += price_ratio * 0.4
        
        # Area similarity (30%)
        if listing1.area and listing2.area:
            factors += 1
            area_ratio = min(listing1.area, listing2.area) / max(listing1.area, listing2.area)
            score += area_ratio * 0.3
        
        # Location similarity (30%)
        if listing1.location_id and listing2.location_id:
            factors += 1
            if listing1.location_id == listing2.location_id:
                score += 0.3
        
        return (score / factors if factors > 0 else 0) >= threshold
    
    def _create_anomaly(
        self,
        listing_id: int,
        location_id: Optional[int],
        anomaly_type: str,
        severity: str,
        description: str,
        detected_price: Optional[int] = None,
        expected_range_min: Optional[int] = None,
        expected_range_max: Optional[int] = None,
        deviation_pct: Optional[float] = None,
        crawl_job_id: Optional[int] = None,
        related_listing_id: Optional[int] = None
    ) -> AnomalyLog:
        """Create and save an anomaly record."""
        anomaly = AnomalyLog(
            listing_id=listing_id,
            location_id=location_id,
            anomaly_type=anomaly_type,
            severity=severity,
            description=description,
            detected_price=detected_price,
            expected_price_range_min=expected_range_min,
            expected_price_range_max=expected_range_max,
            deviation_pct=deviation_pct,
            crawl_job_id=crawl_job_id,
            related_listing_id=related_listing_id,
        )
        
        self.db.add(anomaly)
        self.db.commit()
        self.db.refresh(anomaly)
        
        return anomaly
    
    def _get_existing_anomaly(
        self,
        listing_id: int,
        anomaly_type: str,
        detected_at: Optional[datetime]
    ) -> Optional[AnomalyLog]:
        """Check if anomaly already exists."""
        query = self.db.query(AnomalyLog).filter(
            and_(
                AnomalyLog.listing_id == listing_id,
                AnomalyLog.anomaly_type == anomaly_type
            )
        )
        
        if detected_at:
            query = query.filter(
                func.abs(
                    func.extract('epoch', AnomalyLog.detected_at - detected_at)
                ) < 86400  # Within 24 hours
            )
        
        return query.first()
    
    def _get_severity(self, deviation_pct: float) -> str:
        """Determine severity based on deviation percentage."""
        abs_pct = abs(deviation_pct)
        
        if abs_pct >= 50:
            return "critical"
        elif abs_pct >= 30:
            return "high"
        elif abs_pct >= 15:
            return "medium"
        else:
            return "low"
    
    def get_unresolved_anomalies(
        self,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all unresolved anomalies."""
        anomalies = self.db.query(AnomalyLog, Listing, Location).join(
            Listing, AnomalyLog.listing_id == Listing.id
        ).outerjoin(
            Location, Listing.location_id == Location.id
        ).filter(
            AnomalyLog.resolved == "N"
        ).order_by(
            AnomalyLog.detected_at.desc()
        ).limit(limit).all()
        
        return [
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
            }
            for a in anomalies
        ]
    
    def resolve_anomaly(
        self,
        anomaly_id: int,
        notes: str = None
    ) -> bool:
        """Mark an anomaly as resolved."""
        anomaly = self.db.query(AnomalyLog).filter(
            AnomalyLog.id == anomaly_id
        ).first()
        
        if anomaly:
            anomaly.resolved = "Y"
            anomaly.resolved_at = datetime.utcnow()
            if notes:
                anomaly.resolution_notes = notes
            self.db.commit()
            return True
        
        return False
