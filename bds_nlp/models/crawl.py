from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Index, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from config.database import Base
import enum


class CrawlJobStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class CrawlJob(Base):
    __tablename__ = "crawl_jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Status
    status = Column(String(20), default=CrawlJobStatus.PENDING.value)
    
    # Timing
    started_at = Column(DateTime)
    finished_at = Column(DateTime)
    
    # Statistics
    pages_crawled = Column(Integer, default=0)
    listings_found = Column(Integer, default=0)
    listings_added = Column(Integer, default=0)
    listings_updated = Column(Integer, default=0)
    listings_removed = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    
    # Configuration
    sources = Column(JSON, default=list)
    max_pages = Column(Integer, default=10)
    
    # Error info
    error_message = Column(Text)
    error_traceback = Column(Text)
    
    # Trigger
    triggered_by = Column(String(50), default="scheduler")  # scheduler, manual, api
    manual_params = Column(JSON)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    logs = relationship("CrawlLog", back_populates="crawl_job", order_by="CrawlLog.created_at")
    versions = relationship("ListingVersion", back_populates="crawl_job")
    
    __table_args__ = (
        Index("idx_jobs_status", "status"),
        Index("idx_jobs_started", "started_at"),
        Index("idx_jobs_triggered_by", "triggered_by"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<CrawlJob {self.id}: {self.status}>"
    
    @property
    def duration_secs(self):
        if self.started_at and self.finished_at:
            return (self.finished_at - self.started_at).total_seconds()
        return None


class CrawlLog(Base):
    __tablename__ = "crawl_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    crawl_job_id = Column(Integer, ForeignKey("crawl_jobs.id", ondelete="CASCADE"))
    
    # Log info
    level = Column(String(10), nullable=False)  # DEBUG, INFO, WARNING, ERROR
    message = Column(Text, nullable=False)
    context = Column(JSON, default=dict)
    
    # Source info
    url = Column(String(1000))
    listing_id = Column(Integer)
    
    # Timestamp
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    crawl_job = relationship("CrawlJob", back_populates="logs")
    
    __table_args__ = (
        Index("idx_logs_job", "crawl_job_id"),
        Index("idx_logs_level", "level"),
        Index("idx_logs_created", "created_at"),
        Index("idx_logs_listing", "listing_id"),
        {"sqlite_autoincrement": True},
    )
    
    def __repr__(self):
        return f"<CrawlLog [{self.level}] {self.message[:50]}>"
