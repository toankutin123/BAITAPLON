"""
Crawl management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from models.schemas import CrawlSourceCreate, CrawlSourceResponse, CrawlJobStart
from middleware.auth import get_current_user, require_role
from services.crawler_service import crawler_service
from typing import List

router = APIRouter(prefix="/api/crawl", tags=["Crawl"])


@router.get("/sources")
async def get_sources():
    """Get all crawl sources"""
    sources = crawler_service.get_sources()
    return {"sources": sources}


@router.post("/sources")
async def add_source(
    request: CrawlSourceCreate,
    current_user: dict = Depends(require_role(1))
):
    """Add a new crawl source (Admin only)"""
    source = crawler_service.add_source(
        name=request.name,
        base_url=request.base_url,
        selector_map=request.selector_map
    )
    return {"success": True, "source": source}


@router.post("/start")
async def start_crawl(
    request: CrawlJobStart,
    current_user: dict = Depends(require_role(1))
):
    """Start a crawl job (Admin only)"""
    result = crawler_service.start_crawl_job(
        source_id=request.source_id,
        max_pages=request.max_pages
    )
    return result


@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get crawl job status"""
    status = crawler_service.get_job_status(job_id)
    return status


@router.get("/stats")
async def get_crawl_stats():
    """Get crawl statistics"""
    stats = crawler_service.get_crawl_stats()
    return stats


@router.get("/listings")
async def get_listings(
    status: str = None,
    source_id: int = None,
    limit: int = 100
):
    """Get crawled listings"""
    listings = crawler_service.get_crawled_listings(
        status=status,
        source_id=source_id,
        limit=limit
    )
    return {"listings": listings, "count": len(listings)}


@router.put("/listings/{listing_id}")
async def update_listing(
    listing_id: int,
    status: str,
    normalized_data: dict = None
):
    """Update listing status"""
    result = crawler_service.update_listing_status(
        listing_id=listing_id,
        status=status,
        normalized_data=normalized_data
    )
    return result
