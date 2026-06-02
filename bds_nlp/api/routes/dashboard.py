from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from config.database import get_db
from config.settings import get_settings
from models.crawl import CrawlJob, CrawlLog
from pipeline.etl import ETLPipeline

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class CrawlJobResponse(BaseModel):
    id: int
    status: str
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    pages_crawled: int
    listings_found: int
    listings_added: int
    listings_updated: int
    errors_count: int
    triggered_by: str
    
    class Config:
        from_attributes = True


class TriggerCrawlRequest(BaseModel):
    sources: Optional[List[str]] = None
    max_pages: int = 10


class TriggerCrawlResponse(BaseModel):
    job_id: int
    status: str
    message: str


@router.get("/jobs", response_model=List[CrawlJobResponse])
def get_crawl_jobs(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get recent crawl jobs."""
    jobs = db.query(CrawlJob).order_by(
        CrawlJob.created_at.desc()
    ).limit(limit).all()
    
    return [CrawlJobResponse.model_validate(j) for j in jobs]


@router.get("/jobs/{job_id}", response_model=CrawlJobResponse)
def get_crawl_job(job_id: int, db: Session = Depends(get_db)):
    """Get a specific crawl job."""
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return CrawlJobResponse.model_validate(job)


@router.get("/jobs/{job_id}/logs")
def get_job_logs(job_id: int, db: Session = Depends(get_db)):
    """Get logs for a specific crawl job."""
    job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    logs = db.query(CrawlLog).filter(
        CrawlLog.crawl_job_id == job_id
    ).order_by(CrawlLog.created_at).all()
    
    return [
        {
            "id": log.id,
            "level": log.level,
            "message": log.message,
            "url": log.url,
            "listing_id": log.listing_id,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.post("/trigger-crawl", response_model=TriggerCrawlResponse)
def trigger_crawl(
    request: TriggerCrawlRequest,
    db: Session = Depends(get_db)
):
    """
    Manually trigger a crawl job.
    
    Note: This starts the job synchronously. For large crawls,
    consider running it in background or using a task queue.
    """
    settings = get_settings()
    
    sources = request.sources or settings.SOURCES
    
    # Create pipeline
    pipeline = ETLPipeline(db)
    
    # Run pipeline
    try:
        job = pipeline.run_full_pipeline(
            sources=sources,
            max_pages=request.max_pages,
            triggered_by="manual"
        )
        
        return TriggerCrawlResponse(
            job_id=job.id,
            status=job.status,
            message=f"Crawl completed. Added: {job.listings_added}, Updated: {job.listings_updated}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "BDS_NLP Dashboard API"
    }
