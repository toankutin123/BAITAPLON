from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc

from models.listing import Listing
from models.location import Location
from models.version import ListingVersion
from models.analytics import PriceHistory, AreaStatistics, AnomalyLog
from models.crawl import CrawlJob, CrawlLog
from pipeline.extractor import DataExtractor
from pipeline.transformer import DataTransformer
from pipeline.loader import DataLoader

import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ETLPipeline:
    """Main ETL Pipeline orchestrator."""
    
    def __init__(self, db: Session):
        self.db = db
        self.extractor = DataExtractor()
        self.transformer = DataTransformer()
        self.loader = DataLoader(db)
    
    def run_full_pipeline(
        self,
        sources: List[str],
        max_pages: int = 10,
        triggered_by: str = "manual"
    ) -> CrawlJob:
        """
        Run the full ETL pipeline.
        
        Args:
            sources: List of URLs to crawl
            max_pages: Maximum pages per source
            triggered_by: Who triggered the pipeline (scheduler, manual, api)
        
        Returns:
            CrawlJob: The completed crawl job record
        """
        # Create crawl job
        job = self._create_crawl_job(sources, max_pages, triggered_by)
        
        try:
            # Run extraction
            raw_data = self._extract_all(sources, max_pages, job)
            
            # Run transformation
            transformed_data = self._transform_all(raw_data)
            
            # Run loading
            results = self._load_all(transformed_data, job)
            
            # Complete job
            self._complete_crawl_job(job, results)
            
        except Exception as e:
            self._fail_crawl_job(job, e)
            raise
        
        return job
    
    def run_incremental(
        self,
        source: str,
        since_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Run incremental crawl (only new/changed listings).
        
        Args:
            source: URL to crawl
            since_date: Only crawl listings after this date
        
        Returns:
            Dict with statistics
        """
        # For incremental, we'd typically use the source website's API
        # or check for listings updated since last crawl
        # This is a simplified version
        pass
    
    def _create_crawl_job(
        self,
        sources: List[str],
        max_pages: int,
        triggered_by: str
    ) -> CrawlJob:
        """Create a new crawl job record."""
        job = CrawlJob(
            status="running",
            started_at=datetime.utcnow(),
            sources=sources,
            max_pages=max_pages,
            triggered_by=triggered_by
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        
        logger.info(f"Created crawl job {job.id}")
        return job
    
    def _extract_all(
        self,
        sources: List[str],
        max_pages: int,
        job: CrawlJob
    ) -> List[Dict[str, Any]]:
        """Extract data from all sources."""
        all_data = []
        
        for source in sources:
            try:
                logger.info(f"Extracting from {source}")
                job.pages_crawled += 1
                
                # Get listing links
                links = self._get_listing_links(source, max_pages)
                job.listings_found += len(links)
                
                # Extract each listing
                for link in links:
                    try:
                        # Check if already exists
                        if self._listing_exists(link):
                            logger.debug(f"Skipping existing: {link}")
                            continue
                        
                        # Extract HTML
                        html = self._fetch_page(link)
                        if not html:
                            continue
                        
                        # Parse data
                        data = self.extractor.extract_from_html(html, link)
                        if data:  # Only add if data is valid
                            all_data.append(data)
                        
                    except Exception as e:
                        logger.error(f"Error extracting {link}: {e}")
                        job.errors_count += 1
                
                self.db.commit()
                
            except Exception as e:
                logger.error(f"Error extracting from {source}: {e}")
                job.errors_count += 1
                self.db.commit()
        
        return all_data
    
    def _transform_all(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform all raw data."""
        transformed = []
        
        for data in raw_data:
            try:
                normalized = self.transformer.transform(data)
                transformed.append(normalized)
            except Exception as e:
                logger.error(f"Error transforming: {e}")
                continue
        
        return transformed
    
    def _load_all(
        self,
        data: List[Dict[str, Any]],
        job: CrawlJob
    ) -> Dict[str, int]:
        """Load all transformed data."""
        results = {
            "created": 0,
            "updated": 0,
            "unchanged": 0,
            "errors": 0
        }
        
        for item in data:
            try:
                listing, action = self.loader.load_listing(item, job.id)
                
                if action == "created":
                    results["created"] += 1
                    job.listings_added += 1
                elif action == "updated":
                    results["updated"] += 1
                    job.listings_updated += 1
                else:
                    results["unchanged"] += 1
                
                self.db.commit()
                
            except Exception as e:
                logger.error(f"Error loading listing: {e}")
                results["errors"] += 1
                job.errors_count += 1
        
        return results
    
    def _complete_crawl_job(
        self,
        job: CrawlJob,
        results: Dict[str, int]
    ):
        """Mark crawl job as completed."""
        job.status = "completed"
        job.finished_at = datetime.utcnow()
        self.db.commit()
        
        logger.info(f"Crawl job {job.id} completed: {results}")
    
    def _fail_crawl_job(self, job: CrawlJob, error: Exception):
        """Mark crawl job as failed."""
        job.status = "failed"
        job.finished_at = datetime.utcnow()
        job.error_message = str(error)
        job.error_traceback = str(error.__traceback__)
        self.db.commit()
        
        logger.error(f"Crawl job {job.id} failed: {error}")
    
    def _get_listing_links(self, source: str, max_pages: int) -> List[str]:
        """
        Get listing links from source page.
        Uses the batdongsan crawler.
        """
        try:
            from crawler.list_crawler import get_listing_links
            return get_listing_links(source, max_page=max_pages, headless=True)
        except Exception as e:
            logger.error(f"Error getting listing links: {e}")
            return []
    
    def _fetch_page(self, url: str) -> Optional[str]:
        """
        Fetch HTML content from URL using Playwright for JS rendering.
        """
        try:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=120000)  # 2 min timeout
                page.wait_for_load_state("networkidle", timeout=60000)
                page.wait_for_timeout(3000)  # Extra wait for JS
                html = page.content()
                browser.close()
                return html
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def _listing_exists(self, url: str) -> bool:
        """Check if listing already exists."""
        existing = self.db.query(Listing).filter(
            and_(
                Listing.url == url,
                Listing.deleted_at.is_(None)
            )
        ).first()
        return existing is not None
    
    def get_pipeline_status(self) -> Dict[str, Any]:
        """Get current pipeline status."""
        # Get latest job
        latest_job = self.db.query(CrawlJob).order_by(
            desc(CrawlJob.created_at)
        ).first()
        
        # Get counts
        total_listings = self.db.query(Listing).filter(
            Listing.deleted_at.is_(None)
        ).count()
        
        total_versions = self.db.query(ListingVersion).count()
        total_price_history = self.db.query(PriceHistory).count()
        
        return {
            "latest_job": {
                "id": latest_job.id if latest_job else None,
                "status": latest_job.status if latest_job else None,
                "started_at": latest_job.started_at.isoformat() if latest_job else None,
                "finished_at": latest_job.finished_at.isoformat() if latest_job else None,
            },
            "totals": {
                "listings": total_listings,
                "versions": total_versions,
                "price_history": total_price_history,
            }
        }
