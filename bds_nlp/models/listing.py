from sqlalchemy import Column, Integer, String, BigInteger, Text, Date, DateTime, DECIMAL, JSON, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class Listing(Base):
    __tablename__ = "listings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    location_id = Column(Integer, ForeignKey("locations.id"))
    
    # Basic Info
    title = Column(String(500), nullable=False)
    description = Column(Text)
    
    # Price (in VND)
    price = Column(BigInteger)
    price_per_m2 = Column(BigInteger)
    price_rent = Column(BigInteger)
    
    # Physical Properties
    area = Column(DECIMAL(12, 2))  # m²
    bedrooms = Column(Integer)
    bathrooms = Column(Integer)
    floors = Column(Integer)
    
    # Orientation & Legal
    direction = Column(String(50))
    legal_status = Column(String(100))
    
    # Property Type
    property_type = Column(String(50))  # house, apartment, land, etc.
    
    # Media
    images = Column(JSON, default=list)
    
    # Source Tracking
    source_id = Column(String(100), unique=True)
    url = Column(String(1000), unique=True)
    
    # Status
    status = Column(String(20), default="active")  # active, sold, rented, expired
    
    # Timestamps
    posted_date = Column(Date)
    updated_date = Column(Date)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_crawled_at = Column(DateTime)
    
    # Versioning
    current_version = Column(Integer, default=1)
    
    # Soft delete
    deleted_at = Column(DateTime)
    
    # Relationships
    location = relationship("Location", back_populates="listings")
    versions = relationship("ListingVersion", back_populates="listing", order_by="desc(ListingVersion.version_number)")
    price_history = relationship("PriceHistory", back_populates="listing", order_by="desc(PriceHistory.recorded_at)")
    anomalies = relationship("AnomalyLog", back_populates="listing", foreign_keys="AnomalyLog.listing_id")
    
    __table_args__ = (
        Index("idx_listings_location", "location_id"),
        Index("idx_listings_price", "price", postgresql_where=price.isnot(None)),
        Index("idx_listings_area", "area", postgresql_where=area.isnot(None)),
        Index("idx_listings_price_per_m2", "price_per_m2", postgresql_where=price_per_m2.isnot(None)),
        Index("idx_listings_property_type", "property_type"),
        Index("idx_listings_status", "status"),
        Index("idx_listings_posted_date", "posted_date"),
        Index("idx_listings_created_at", "created_at"),
        Index("idx_listings_source_id", "source_id"),
        Index("idx_listings_loc_price", "location_id", "price"),
        Index("idx_listings_loc_area", "location_id", "area"),
        Index("idx_listings_type_price", "property_type", "price"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<Listing {self.id}: {self.title[:50]}>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "price": self.price,
            "area": float(self.area) if self.area else None,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "property_type": self.property_type,
            "status": self.status,
            "url": self.url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
