"""
Database initialization script.
Run this to create all tables.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import engine, Base
from models.listing import Listing
from models.location import Location
from models.version import ListingVersion
from models.crawl import CrawlJob, CrawlLog
from models.analytics import PriceHistory, AreaStatistics, AnomalyLog


def init_db():
    """Create all tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


def drop_db():
    """Drop all tables."""
    print("Dropping database tables...")
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped!")


def recreate_db():
    """Drop and recreate all tables."""
    drop_db()
    init_db()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "init":
            init_db()
        elif command == "drop":
            drop_db()
        elif command == "recreate":
            recreate_db()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python init_db.py [init|drop|recreate]")
    else:
        init_db()
