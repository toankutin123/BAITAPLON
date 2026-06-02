"""Market Insights model - stores AI-generated market insights and trends"""
from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Date, ForeignKey, Numeric, Text, JSON, Index
from sqlalchemy.orm import relationship
from config.database import Base
from datetime import datetime


class MarketInsight(Base):
    """AI-generated market insights and analysis"""
    __tablename__ = "market_insights"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Location scope
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    location = relationship("Location", backref="insights")
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    
    # Insight type
    insight_type = Column(String(50), nullable=False)
    # Types: price_trend, area_analysis, market_overview, investment_opportunity,
    #         price_forecast, demand_analysis, supply_analysis, competition_level
    
    # Time period
    period_start = Column(Date, nullable=True)
    period_end = Column(Date, nullable=True)
    period_type = Column(String(20), default="monthly")  # daily, weekly, monthly, quarterly
    
    # Metrics
    avg_price = Column(BigInteger, nullable=True)
    avg_price_per_m2 = Column(BigInteger, nullable=True)
    median_price = Column(BigInteger, nullable=True)
    min_price = Column(BigInteger, nullable=True)
    max_price = Column(BigInteger, nullable=True)
    
    # Change metrics
    price_change_pct = Column(Numeric(10, 2), nullable=True)
    price_change_absolute = Column(BigInteger, nullable=True)
    volume_change_pct = Column(Numeric(10, 2), nullable=True)
    
    # Market indicators
    listing_count = Column(Integer, nullable=True)
    new_listings_count = Column(Integer, nullable=True)
    removed_listings_count = Column(Integer, nullable=True)
    absorption_rate = Column(Numeric(5, 2), nullable=True)  # How fast properties sell
    
    # Trend indicators
    trend_direction = Column(String(20), nullable=True)  # rising, stable, declining
    trend_strength = Column(Numeric(5, 2), nullable=True)  # 0-100%
    market_sentiment = Column(String(20), nullable=True)  # bullish, neutral, bearish
    
    # AI Analysis
    summary = Column(Text, nullable=True)
    key_findings = Column(JSON, nullable=True)  # List of key findings
    recommendations = Column(JSON, nullable=True)  # List of recommendations
    risk_factors = Column(JSON, nullable=True)  # List of risk factors
    
    # Comparison
    compared_to_city_avg_pct = Column(Numeric(10, 2), nullable=True)
    ranked_position = Column(Integer, nullable=True)  # Position among districts
    
    # Metadata
    confidence_score = Column(Numeric(5, 2), nullable=True)
    data_sources = Column(JSON, nullable=True)  # List of data sources used
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(50), default="ai")  # ai, system, manual
    
    __table_args__ = (
        Index("idx_insight_location", "location_id"),
        Index("idx_insight_city_district", "city", "district"),
        Index("idx_insight_type", "insight_type"),
        Index("idx_insight_period", "period_start", "period_end"),
    )


class DashboardMetrics(Base):
    """Pre-computed dashboard metrics for fast loading"""
    __tablename__ = "dashboard_metrics"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Time period
    date = Column(Date, nullable=False)
    period_type = Column(String(20), default="daily")
    
    # City/Region
    city = Column(String(100), nullable=True)
    
    # Overall metrics
    total_listings = Column(Integer, default=0)
    active_listings = Column(Integer, default=0)
    new_listings = Column(Integer, default=0)
    removed_listings = Column(Integer, default=0)
    
    # Price metrics
    avg_price = Column(BigInteger, nullable=True)
    avg_price_per_m2 = Column(BigInteger, nullable=True)
    median_price = Column(BigInteger, nullable=True)
    
    # Price changes
    avg_price_change_pct = Column(Numeric(10, 2), nullable=True)
    avg_price_change_absolute = Column(BigInteger, nullable=True)
    
    # Top areas
    top_districts = Column(JSON, nullable=True)  # [{district, avg_price, count}]
    top_searched_areas = Column(JSON, nullable=True)  # [{area, search_count}]
    
    # Top recommendations
    top_recommended_listings = Column(JSON, nullable=True)  # [{listing_id, score, count}]
    
    # Market health
    market_health_score = Column(Numeric(5, 2), nullable=True)  # 0-100
    buyer_seller_ratio = Column(Numeric(5, 2), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index("idx_dashboard_city_date", "city", "date"),
        Index("idx_dashboard_date", "date"),
    )
