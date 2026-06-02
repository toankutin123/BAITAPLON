from sqlalchemy import Column, Integer, String, BigInteger, Text, DateTime, Date, DECIMAL, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    
    # Price snapshot
    price = Column(BigInteger, nullable=False)
    price_per_m2 = Column(BigInteger)
    
    # Timing
    recorded_at = Column(Date, nullable=False, default=func.current_date())
    crawl_job_id = Column(Integer, ForeignKey("crawl_jobs.id"))
    
    # Source
    source_url = Column(String(1000))
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    listing = relationship("Listing", back_populates="price_history")
    crawl_job = relationship("CrawlJob")
    
    __table_args__ = (
        Index("idx_price_history_listing", "listing_id"),
        Index("idx_price_history_recorded", "recorded_at"),
        Index("idx_price_history_listing_recorded", "listing_id", "recorded_at"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<PriceHistory {self.listing_id}: {self.price} on {self.recorded_at}>"


class AreaStatistics(Base):
    __tablename__ = "area_statistics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    
    # Period
    date = Column(Date, nullable=False)
    period_type = Column(String(10), nullable=False)  # daily, weekly, monthly
    
    # Price metrics
    avg_price = Column(BigInteger)
    median_price = Column(BigInteger)
    min_price = Column(BigInteger)
    max_price = Column(BigInteger)
    avg_price_per_m2 = Column(BigInteger)
    median_price_per_m2 = Column(BigInteger)
    
    # Listing metrics
    total_listings = Column(Integer, default=0)
    new_listings = Column(Integer, default=0)
    removed_listings = Column(Integer, default=0)
    active_listings = Column(Integer, default=0)
    
    # Trend metrics
    price_change_pct = Column(DECIMAL(8, 4))
    price_change_abs = Column(BigInteger)
    volume_change_pct = Column(DECIMAL(8, 4))
    
    # Absorption rate
    absorption_rate = Column(DECIMAL(5, 2))
    
    # Price distribution
    price_percentile_25 = Column(BigInteger)
    price_percentile_75 = Column(BigInteger)
    price_std_dev = Column(BigInteger)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    location = relationship("Location", back_populates="statistics")
    
    __table_args__ = (
        Index("idx_area_stats_location", "location_id"),
        Index("idx_area_stats_date", "date"),
        Index("idx_area_stats_period", "period_type"),
        Index("idx_area_stats_change", "price_change_pct"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<AreaStatistics {self.location_id} on {self.date}>"


class AnomalyLog(Base):
    __tablename__ = "anomaly_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="SET NULL"))
    location_id = Column(Integer, ForeignKey("locations.id"))
    
    # Anomaly info
    anomaly_type = Column(String(50), nullable=False)  # price_drop, price_surge, suspicious, duplicate
    severity = Column(String(10), nullable=False)  # low, medium, high, critical
    description = Column(Text)
    
    # Values at detection time
    detected_price = Column(BigInteger)
    expected_price_range_min = Column(BigInteger)
    expected_price_range_max = Column(BigInteger)
    deviation_pct = Column(DECIMAL(8, 4))
    
    # Resolution
    resolved = Column(String(1), default="N")  # Y, N
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Timing
    detected_at = Column(DateTime, server_default=func.now())
    
    # Related data
    crawl_job_id = Column(Integer, ForeignKey("crawl_jobs.id"))
    related_listing_id = Column(Integer, ForeignKey("listings.id"))
    
    # Relationships
    listing = relationship("Listing", back_populates="anomalies", foreign_keys=[listing_id])
    crawl_job = relationship("CrawlJob")
    
    __table_args__ = (
        Index("idx_anomaly_listing", "listing_id"),
        Index("idx_anomaly_location", "location_id"),
        Index("idx_anomaly_type", "anomaly_type"),
        Index("idx_anomaly_severity", "severity"),
        Index("idx_anomaly_resolved", "resolved"),
        Index("idx_anomaly_detected", "detected_at"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<AnomalyLog [{self.severity}] {self.anomaly_type}>"
