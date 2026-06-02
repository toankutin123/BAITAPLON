from sqlalchemy import Column, Integer, String, BigInteger, Text, Date, DateTime, DECIMAL, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Address hierarchy
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    ward = Column(String(100))
    full_address = Column(String(500))
    
    # Geocoding
    latitude = Column(DECIMAL(10, 8))
    longitude = Column(DECIMAL(11, 8))
    
    # Metadata
    population = Column(Integer)
    area_km2 = Column(DECIMAL(10, 2))
    
    # Normalized fields
    city_normalized = Column(String(100))
    district_normalized = Column(String(100))
    ward_normalized = Column(String(100))
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    listings = relationship("Listing", back_populates="location")
    statistics = relationship("AreaStatistics", back_populates="location")
    
    __table_args__ = (
        Index("idx_locations_city", "city"),
        Index("idx_locations_district", "district"),
        Index("idx_locations_ward", "ward"),
        Index("idx_locations_coords", "latitude", "longitude"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<Location {self.district}, {self.city}>"
