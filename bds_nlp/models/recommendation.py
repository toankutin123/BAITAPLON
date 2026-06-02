"""AI Recommendation model - stores personalized property recommendations"""
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey, Numeric, Text, JSON, Index
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class UserSearchProfile(Base):
    """Stores user search preferences and profiles"""
    __tablename__ = "user_search_profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(100), nullable=True)
    user_id = Column(String(100), nullable=True)
    
    # Search criteria
    budget_min = Column(BigInteger, nullable=True)
    budget_max = Column(BigInteger, nullable=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    ward = Column(String(100), nullable=True)
    property_type = Column(String(50), nullable=True)
    min_area = Column(Numeric(12, 2), nullable=True)
    max_area = Column(Numeric(12, 2), nullable=True)
    min_bedrooms = Column(Integer, nullable=True)
    min_bathrooms = Column(Integer, nullable=True)
    
    # Preferences weights
    location_weight = Column(Numeric(3, 2), default=0.40)  # 40%
    price_weight = Column(Numeric(3, 2), default=0.30)  # 30%
    area_weight = Column(Numeric(3, 2), default=0.15)  # 15%
    amenities_weight = Column(Numeric(3, 2), default=0.15)  # 15%
    
    # Acceptable neighborhoods
    acceptable_districts = Column(JSON, nullable=True)  # List of districts
    acceptable_wards = Column(JSON, nullable=True)  # List of wards
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_search_at = Column(DateTime, nullable=True)
    search_count = Column(Integer, default=0)
    
    __table_args__ = (
        Index("idx_search_profile_session", "session_id"),
    )


class PropertyRecommendation(Base):
    """AI-generated property recommendations"""
    __tablename__ = "property_recommendations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # User context
    search_profile_id = Column(Integer, ForeignKey("user_search_profiles.id"), nullable=True)
    search_profile = relationship("UserSearchProfile", backref="recommendations")
    session_id = Column(String(100), nullable=True)
    
    # Recommended listing
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=True)
    listing = relationship("Listing", backref="recommendations")
    user_listing_id = Column(Integer, ForeignKey("user_listings.id"), nullable=True)
    
    # Recommendation score (0-100)
    match_score = Column(Numeric(5, 2), nullable=False)
    
    # Score breakdown
    location_score = Column(Numeric(5, 2), nullable=True)
    price_score = Column(Numeric(5, 2), nullable=True)
    area_score = Column(Numeric(5, 2), nullable=True)
    amenities_score = Column(Numeric(5, 2), nullable=True)
    
    # Recommendation type
    recommendation_type = Column(String(50), nullable=False)
    # Types: exact_match, similar_location, similar_price, similar_area,
    #         better_option, potential_investment, under_market_value,
    #         nearby_suggestion, expanded_search
    
    # Analysis
    strengths = Column(JSON, nullable=True)  # List of strengths
    weaknesses = Column(JSON, nullable=True)  # List of weaknesses
    reasons = Column(Text, nullable=True)  # AI-generated explanation
    
    # Rank within this search
    rank = Column(Integer, nullable=True)
    
    # User feedback
    user_feedback = Column(String(20), nullable=True)  # viewed, liked, contacted, rejected
    feedback_at = Column(DateTime, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(String(1), default="Y")
    
    __table_args__ = (
        Index("idx_recommendation_listing", "listing_id"),
        Index("idx_recommendation_profile", "search_profile_id"),
        Index("idx_recommendation_session", "session_id"),
        Index("idx_recommendation_score", "match_score"),
    )
