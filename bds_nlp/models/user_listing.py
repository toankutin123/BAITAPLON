"""User listings model - for users posting properties for sale/rent"""
from sqlalchemy import Column, Integer, String, BigInteger, Date, DateTime, ForeignKey, Text, Numeric, Index
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class UserListing(Base):
    """User-submitted listings for sale/rent"""
    __tablename__ = "user_listings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=True)  # Optional user tracking
    
    # Basic info
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Location
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location = relationship("Location", backref="user_listings")
    
    # Address details
    street = Column(String(200), nullable=True)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    ward = Column(String(100), nullable=True)
    
    # Property details
    property_type = Column(String(50), nullable=False)  # house, apartment, land, villa
    area = Column(Numeric(12, 2), nullable=True)  # m²
    bedrooms = Column(Integer, default=0)
    bathrooms = Column(Integer, default=0)
    floors = Column(Integer, default=1)
    direction = Column(String(50), nullable=True)
    legal_status = Column(String(100), nullable=True)
    
    # Pricing
    price = Column(BigInteger, nullable=False)  # VND
    price_per_m2 = Column(BigInteger, nullable=True)
    
    # Images
    images = Column(Text, nullable=True)  # JSON array
    
    # Status
    status = Column(String(20), default="pending")  # pending, analyzing, published, sold, expired
    listing_type = Column(String(10), default="sell")  # sell, rent
    
    # AI Analysis results
    suggested_price = Column(BigInteger, nullable=True)
    price_range_min = Column(BigInteger, nullable=True)
    price_range_max = Column(BigInteger, nullable=True)
    price_assessment = Column(String(20), nullable=True)  # below_market, fair, above_market
    market_competitiveness = Column(Numeric(5, 2), nullable=True)  # 0-100%
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    posted_date = Column(Date, nullable=True)
    expires_date = Column(Date, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index("idx_user_listing_city_district", "city", "district"),
        Index("idx_user_listing_property_type", "property_type"),
        Index("idx_user_listing_price", "price"),
        Index("idx_user_listing_status", "status"),
    )
    
    def calculate_price_per_m2(self):
        """Calculate price per m²"""
        if self.area and self.area > 0 and self.price:
            self.price_per_m2 = int(self.price / float(self.area))
        return self.price_per_m2
