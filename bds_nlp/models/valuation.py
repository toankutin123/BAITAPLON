"""AI Valuation model - stores AI-generated property valuations"""
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Numeric, Text, Index
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class PropertyValuation(Base):
    """Stores AI-generated property valuations"""
    __tablename__ = "property_valuations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Reference to listing
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    listing = relationship("Listing", backref="valuations")
    user_listing_id = Column(Integer, ForeignKey("user_listings.id"), nullable=True)
    user_listing = relationship("UserListing", backref="valuations")
    
    # Valuation inputs
    input_area = Column(Numeric(12, 2), nullable=True)
    input_price = Column(BigInteger, nullable=True)
    input_property_type = Column(String(50), nullable=True)
    input_city = Column(String(100), nullable=True)
    input_district = Column(String(100), nullable=True)
    input_ward = Column(String(100), nullable=True)
    input_street = Column(String(200), nullable=True)
    
    # Valuation results
    suggested_price = Column(BigInteger, nullable=False)
    price_range_min = Column(BigInteger, nullable=True)
    price_range_max = Column(BigInteger, nullable=True)
    price_per_m2 = Column(BigInteger, nullable=True)
    market_avg_price = Column(BigInteger, nullable=True)
    market_median_price = Column(BigInteger, nullable=True)
    
    # Analysis metrics
    price_assessment = Column(String(20), nullable=True)  # below_market, fair, above_market
    confidence_score = Column(Numeric(5, 2), nullable=True)  # 0-100%
    data_points_used = Column(Integer, default=0)  # Number of comparable properties used
    
    # Breakdown scores
    location_score = Column(Numeric(5, 2), nullable=True)
    price_score = Column(Numeric(5, 2), nullable=True)
    condition_score = Column(Numeric(5, 2), nullable=True)
    
    # Comparable properties
    comparable_count = Column(Integer, default=0)
    comparable_ids = Column(Text, nullable=True)  # JSON array of listing IDs
    
    # Metadata
    valuation_method = Column(String(50), default="ai_analysis")  # ai_analysis, comparable, manual
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  # Valuation expires after certain time
    
    # Analysis details
    analysis_details = Column(Text, nullable=True)  # JSON with full analysis
    trend_direction = Column(String(20), nullable=True)  # rising, stable, declining
    
    __table_args__ = (
        Index("idx_valuation_listing", "listing_id"),
        Index("idx_valuation_user_listing", "user_listing_id"),
        Index("idx_valuation_city_district", "input_city", "input_district"),
        Index("idx_valuation_created", "created_at"),
    )
