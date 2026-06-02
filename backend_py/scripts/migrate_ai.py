"""
Migration script for AI features tables
Run: python scripts/migrate_ai.py
"""

import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "dbname": os.getenv("DB_NAME", "real_estate_ai"),
}


def get_connection():
    return psycopg2.connect(cursor_factory=psycopg2.extras.RealDictCursor, **DB_CONFIG)


MIGRATION_SQL = """
-- =============================================
-- AI FEATURES TABLES FOR BAITAPLON
-- =============================================

-- Crawl sources configuration
CREATE TABLE IF NOT EXISTS crawl_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    selector_map JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crawled listings raw data
CREATE TABLE IF NOT EXISTS crawled_listings (
    id SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES crawl_sources(id) ON DELETE CASCADE,
    raw_title TEXT,
    raw_description TEXT,
    raw_price TEXT,
    raw_address TEXT,
    raw_area TEXT,
    raw_data JSONB DEFAULT '{}',
    normalized_data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'raw',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history for trend analysis
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    listing_id INTEGER REFERENCES crawled_listings(id) ON DELETE CASCADE,
    property_id INTEGER,
    district VARCHAR(100),
    city VARCHAR(100),
    price_per_m2 INTEGER NOT NULL,
    total_price BIGINT NOT NULL,
    area DECIMAL(10,2),
    property_type VARCHAR(50),
    recorded_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(listing_id, recorded_at)
);

-- Property valuations (AI estimates)
CREATE TABLE IF NOT EXISTS property_valuations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    address TEXT,
    property_type VARCHAR(50),
    area DECIMAL(10,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    district VARCHAR(100),
    city VARCHAR(100),
    estimated_low DECIMAL(15,2),
    estimated_avg DECIMAL(15,2),
    estimated_high DECIMAL(15,2),
    confidence DECIMAL(5,4),
    comparable_count INTEGER DEFAULT 0,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prediction history
CREATE TABLE IF NOT EXISTS prediction_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    predicted_price DECIMAL(15,2) NOT NULL,
    confidence DECIMAL(5,4),
    insights TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buyer profiles for recommendations
CREATE TABLE IF NOT EXISTS buyer_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    budget_min BIGINT,
    budget_max BIGINT,
    preferred_districts JSONB DEFAULT '[]',
    preferred_types JSONB DEFAULT '[]',
    min_area DECIMAL(10,2),
    max_area DECIMAL(10,2),
    min_bedrooms INTEGER DEFAULT 0,
    min_bathrooms INTEGER DEFAULT 0,
    additional_requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property recommendations for buyers
CREATE TABLE IF NOT EXISTS property_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    match_score DECIMAL(5,4),
    price_score DECIMAL(5,4),
    location_score DECIMAL(5,4),
    size_score DECIMAL(5,4),
    features_score DECIMAL(5,4),
    reasons JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

-- Market insights cache
CREATE TABLE IF NOT EXISTS market_insights (
    id SERIAL PRIMARY KEY,
    location_type VARCHAR(20),
    location_name VARCHAR(100),
    property_type VARCHAR(50) DEFAULT 'all',
    metric_type VARCHAR(50),
    metric_value DECIMAL(15,4),
    period VARCHAR(20),
    period_start DATE,
    period_end DATE,
    change_percent DECIMAL(10,4),
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(location_type, location_name, property_type, metric_type, period, period_start)
);

-- Dashboard metrics cache
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50),
    metric_value JSONB,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved properties
CREATE TABLE IF NOT EXISTS saved_properties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, property_id)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_price_history_district ON price_history(district);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_property_type ON price_history(property_type);
CREATE INDEX IF NOT EXISTS idx_crawled_listings_status ON crawled_listings(status);
CREATE INDEX IF NOT EXISTS idx_market_insights_location ON market_insights(location_type, location_name);
CREATE INDEX IF NOT EXISTS idx_market_insights_period ON market_insights(period, period_start);

-- Full text search index for properties
CREATE INDEX IF NOT EXISTS idx_properties_search ON properties USING GIN (
    to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(address, ''))
);
"""


def run_migration():
    print("Running AI features migration...")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(MIGRATION_SQL)
            conn.commit()
            print("Migration completed successfully!")
            
            # Verify tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name IN (
                    'crawl_sources', 'crawled_listings', 'price_history',
                    'property_valuations', 'buyer_profiles', 'property_recommendations',
                    'market_insights', 'dashboard_metrics'
                )
                ORDER BY table_name
            """)
            tables = cursor.fetchall()
            print(f"\nCreated {len(tables)} tables:")
            for t in tables:
                print(f"  - {t['table_name']}")
                
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    run_migration()
