"""
Khởi tạo database schema khi container started
Chạy tự động khi docker-compose up
"""

import psycopg2
import os
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import DATABASE_URL


def get_connection():
    return psycopg2.connect(**DATABASE_URL)


def create_tables():
    """Tạo tất cả các bảng cần thiết"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100),
                    phone VARCHAR(20),
                    role INTEGER DEFAULT 3 CHECK (role IN (1, 2, 3)),
                    avatar TEXT,
                    status BOOLEAN DEFAULT TRUE,
                    content_restricted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 2. Properties table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS properties (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    property_type VARCHAR(50),
                    price BIGINT,
                    area DECIMAL(10,2),
                    bedrooms INTEGER DEFAULT 0,
                    bathrooms INTEGER DEFAULT 0,
                    floors INTEGER DEFAULT 1,
                    address TEXT,
                    district VARCHAR(100),
                    city VARCHAR(100) DEFAULT 'TP.HCM',
                    images JSONB DEFAULT '[]',
                    features JSONB DEFAULT '[]',
                    legal_status VARCHAR(50) DEFAULT 'unknown',
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 3. Seller requests
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS seller_requests (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) UNIQUE,
                    business_name VARCHAR(255) NOT NULL,
                    business_type VARCHAR(50) NOT NULL,
                    business_registration_number VARCHAR(100),
                    tax_id VARCHAR(100),
                    phone_number VARCHAR(20) NOT NULL,
                    business_address TEXT,
                    city VARCHAR(100),
                    district VARCHAR(100),
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    reviewed_at TIMESTAMP,
                    reviewed_by INTEGER REFERENCES users(id)
                )
            """)

            # 4. Saved properties
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS saved_properties (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    property_id INTEGER REFERENCES properties(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, property_id)
                )
            """)

            # 5. Prediction history
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS prediction_history (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    location VARCHAR(255),
                    property_type VARCHAR(50),
                    area DECIMAL(10,2),
                    bedrooms INTEGER,
                    bathrooms INTEGER,
                    year_built INTEGER,
                    features JSONB DEFAULT '[]',
                    predicted_price BIGINT,
                    confidence DECIMAL(3,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 6. Property valuations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS property_valuations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    address TEXT,
                    property_type VARCHAR(50),
                    area DECIMAL(10,2),
                    bedrooms INTEGER DEFAULT 0,
                    bathrooms INTEGER DEFAULT 0,
                    district VARCHAR(100),
                    city VARCHAR(100) DEFAULT 'TP.HCM',
                    legal_status VARCHAR(50) DEFAULT 'unknown',
                    features JSONB DEFAULT '[]',
                    estimated_low BIGINT,
                    estimated_avg BIGINT,
                    estimated_high BIGINT,
                    confidence DECIMAL(3,2),
                    comparable_count INTEGER,
                    factors JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 7. Admin chat conversations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin_chat_conversations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 8. Admin chat messages
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin_chat_messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INTEGER REFERENCES admin_chat_conversations(id),
                    sender_role INTEGER NOT NULL,
                    sender_user_id INTEGER,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 9. Crawl sources
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawl_sources (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    base_url TEXT NOT NULL,
                    selector_map JSONB DEFAULT '{}',
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 10. Crawled listings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS crawled_listings (
                    id SERIAL PRIMARY KEY,
                    source_id INTEGER REFERENCES crawl_sources(id),
                    title VARCHAR(255),
                    price BIGINT,
                    area DECIMAL(10,2),
                    address TEXT,
                    url TEXT,
                    normalized_data JSONB,
                    status VARCHAR(20) DEFAULT 'raw',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 11. Buyer profiles
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS buyer_profiles (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) UNIQUE,
                    budget_min BIGINT DEFAULT 0,
                    budget_max BIGINT DEFAULT 100000000000,
                    preferred_districts JSONB DEFAULT '[]',
                    preferred_types JSONB DEFAULT '[]',
                    min_area DECIMAL(10,2) DEFAULT 0,
                    max_area DECIMAL(10,2) DEFAULT 0,
                    min_bedrooms INTEGER DEFAULT 0,
                    min_bathrooms INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 12. Property recommendations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS property_recommendations (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    property_id INTEGER REFERENCES properties(id),
                    match_score DECIMAL(3,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, property_id)
                )
            """)

            # 13. Price history (for market analysis)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id SERIAL PRIMARY KEY,
                    district VARCHAR(100),
                    city VARCHAR(100) DEFAULT 'TP.HCM',
                    property_type VARCHAR(50),
                    avg_price_per_m2 BIGINT,
                    total_listings INTEGER,
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            conn.commit()
            print("[OK] Database tables created successfully!")

    except Exception as e:
        print(f"[ERROR] Failed to create tables: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("[INFO] Initializing database...")
    create_tables()
