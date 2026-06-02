from sqlalchemy import Column, Integer, String, Text, BigInteger, DateTime, JSON, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base


class ListingVersion(Base):
    __tablename__ = "listing_versions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False)
    crawl_job_id = Column(Integer, ForeignKey("crawl_jobs.id"))
    
    # Version info
    version_number = Column(Integer, nullable=False)
    
    # Change tracking
    field_changed = Column(String(50), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    old_value_numeric = Column(BigInteger)
    new_value_numeric = Column(BigInteger)
    
    # Full snapshot (JSON)
    snapshot = Column(JSON)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    listing = relationship("Listing", back_populates="versions")
    crawl_job = relationship("CrawlJob")
    
    __table_args__ = (
        Index("idx_versions_listing", "listing_id"),
        Index("idx_versions_listing_created", "listing_id", "created_at"),
        Index("idx_versions_field", "field_changed"),
        Index("idx_versions_job", "crawl_job_id"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<ListingVersion {self.listing_id} v{self.version_number}: {self.field_changed}>"
