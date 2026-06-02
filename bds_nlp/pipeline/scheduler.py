"""
Scheduler for automated crawling.
Runs daily at midnight (00:00) by default.
"""
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import get_db_session
from config.settings import get_settings
from pipeline.etl import ETLPipeline
from crawler.scraper import scrape_bds
from crawler.list_crawler import get_listing_links

settings = get_settings()
logger = logging.getLogger(__name__)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def run_daily_crawl():
    """Main crawling job - runs daily."""
    logger.info("=" * 50)
    logger.info("Starting daily crawl job")
    logger.info("=" * 50)
    
    db = None
    try:
        db = get_db_session().__enter__()
        
        pipeline = ETLPipeline(db)
        
        # Run pipeline
        job = pipeline.run_full_pipeline(
            sources=settings.SOURCES,
            max_pages=settings.CRAWLER_MAX_PAGES_PER_SOURCE,
            triggered_by="scheduler"
        )
        
        logger.info(f"Crawl job {job.id} completed")
        logger.info(f"  Status: {job.status}")
        logger.info(f"  Listings added: {job.listings_added}")
        logger.info(f"  Listings updated: {job.listings_updated}")
        logger.info(f"  Errors: {job.errors_count}")
        
    except Exception as e:
        logger.error(f"Crawl job failed: {e}", exc_info=True)
        raise
    
    finally:
        if db:
            db.close()
    
    logger.info("Daily crawl job finished")
    logger.info("=" * 50)


def run_manual_crawl(sources: list = None, max_pages: int = 10):
    """Run manual crawl with custom parameters."""
    logger.info("Starting manual crawl")
    
    db = None
    try:
        db = get_db_session().__enter__()
        
        pipeline = ETLPipeline(db)
        
        sources_to_crawl = sources or settings.SOURCES
        
        job = pipeline.run_full_pipeline(
            sources=sources_to_crawl,
            max_pages=max_pages,
            triggered_by="manual"
        )
        
        logger.info(f"Manual crawl completed. Job {job.id}")
        return job
        
    except Exception as e:
        logger.error(f"Manual crawl failed: {e}", exc_info=True)
        raise
    
    finally:
        if db:
            db.close()


def main():
    """Main entry point for scheduler."""
    scheduler = BlockingScheduler()
    
    # Add daily job at midnight
    scheduler.add_job(
        run_daily_crawl,
        CronTrigger(hour=settings.SCHEDULER_CRON_HOUR, minute=settings.SCHEDULER_CRON_MINUTE),
        id='daily_crawl',
        name='Daily Real Estate Crawl',
        replace_existing=True
    )
    
    logger.info(f"Scheduler started. Daily crawl at {settings.SCHEDULER_CRON_HOUR:02d}:{settings.SCHEDULER_CRON_MINUTE:02d}")
    logger.info("Press Ctrl+C to stop")
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "run":
            # Run immediately
            run_daily_crawl()
        elif command == "scheduled":
            # Run as scheduler
            main()
        elif command == "test":
            # Test with limited pages
            run_manual_crawl(max_pages=2)
        else:
            print(f"Unknown command: {command}")
            print("Usage: python scheduler.py [run|scheduled|test]")
    else:
        # Default: run as scheduler
        main()
