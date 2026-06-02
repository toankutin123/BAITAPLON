"""
Crawler Service for scraping real estate data
"""

import asyncio
import json
from typing import Optional
from datetime import datetime
from config import get_connection


class CrawlerService:
    """Service for managing crawl jobs and data"""
    
    def __init__(self):
        self.active_jobs = {}
    
    def get_sources(self) -> list[dict]:
        """Get all crawl sources"""
        conn = get_connection()
        sources = []
        
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, name, base_url, status, created_at
                    FROM crawl_sources
                    ORDER BY created_at DESC
                """)
                sources = cursor.fetchall()
        finally:
            conn.close()
        
        return sources
    
    def add_source(
        self,
        name: str,
        base_url: str,
        selector_map: dict = None
    ) -> dict:
        """Add a new crawl source"""
        if selector_map is None:
            selector_map = {}
        
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO crawl_sources (name, base_url, selector_map)
                    VALUES (%s, %s, %s)
                    RETURNING id, name, base_url, status, created_at
                """, (name, base_url, json.dumps(selector_map)))
                result = cursor.fetchone()
                conn.commit()
                return result
        finally:
            conn.close()
    
    def update_source_status(self, source_id: int, status: str) -> dict:
        """Update source status"""
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE crawl_sources 
                    SET status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING id, name, status
                """, (status, source_id))
                result = cursor.fetchone()
                conn.commit()
                return result
        finally:
            conn.close()
    
    def start_crawl_job(
        self,
        source_id: int,
        max_pages: int = 10
    ) -> dict:
        """Start a new crawl job"""
        job_id = f"job_{source_id}_{datetime.now().timestamp()}"
        
        self.active_jobs[job_id] = {
            'source_id': source_id,
            'status': 'running',
            'pages_crawled': 0,
            'listings_found': 0,
            'started_at': datetime.now().isoformat(),
            'max_pages': max_pages
        }
        
        return {
            'job_id': job_id,
            'status': 'started',
            'message': f'Crawl job started for source {source_id}'
        }
    
    def get_job_status(self, job_id: str) -> dict:
        """Get crawl job status"""
        if job_id in self.active_jobs:
            return self.active_jobs[job_id]
        
        return {
            'job_id': job_id,
            'status': 'not_found',
            'message': 'Job not found or expired'
        }
    
    def save_crawled_listing(
        self,
        source_id: int,
        raw_data: dict,
        normalized_data: dict = None,
        status: str = 'raw'
    ) -> dict:
        """Save a crawled listing"""
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO crawled_listings 
                    (source_id, raw_title, raw_description, raw_price, raw_address,
                     raw_area, raw_data, normalized_data, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    source_id,
                    raw_data.get('title'),
                    raw_data.get('description'),
                    raw_data.get('price'),
                    raw_data.get('address'),
                    raw_data.get('area'),
                    json.dumps(raw_data),
                    json.dumps(normalized_data) if normalized_data else '{}',
                    status
                ))
                result = cursor.fetchone()
                conn.commit()
                return {'listing_id': result['id'], 'status': 'saved'}
        finally:
            conn.close()
    
    def get_crawled_listings(
        self,
        status: str = None,
        source_id: int = None,
        limit: int = 100
    ) -> list[dict]:
        """Get crawled listings"""
        conn = get_connection()
        listings = []
        
        try:
            with conn.cursor() as cursor:
                query = "SELECT * FROM crawled_listings WHERE 1=1"
                params = []
                
                if status:
                    query += " AND status = %s"
                    params.append(status)
                
                if source_id:
                    query += " AND source_id = %s"
                    params.append(source_id)
                
                query += " ORDER BY created_at DESC LIMIT %s"
                params.append(limit)
                
                cursor.execute(query, params)
                listings = cursor.fetchall()
        finally:
            conn.close()
        
        return listings
    
    def update_listing_status(
        self,
        listing_id: int,
        status: str,
        normalized_data: dict = None
    ) -> dict:
        """Update listing status and normalized data"""
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                if normalized_data:
                    cursor.execute("""
                        UPDATE crawled_listings
                        SET status = %s, normalized_data = %s, processed_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING id, status
                    """, (status, json.dumps(normalized_data), listing_id))
                else:
                    cursor.execute("""
                        UPDATE crawled_listings
                        SET status = %s, processed_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING id, status
                    """, (status, listing_id))
                
                result = cursor.fetchone()
                conn.commit()
                return result
        finally:
            conn.close()
    
    def get_crawl_stats(self) -> dict:
        """Get crawl statistics"""
        conn = get_connection()
        
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT status, COUNT(*) as count
                    FROM crawled_listings
                    GROUP BY status
                """)
                by_status = {r['status']: r['count'] for r in cursor.fetchall()}
                
                cursor.execute("SELECT COUNT(*) as total FROM crawl_sources")
                total_sources = cursor.fetchone()['count']
                
                cursor.execute("""
                    SELECT COUNT(*) as active 
                    FROM crawl_sources 
                    WHERE status = 'active'
                """)
                active_sources = cursor.fetchone()['active']
                
        finally:
            conn.close()
        
        return {
            'total_sources': total_sources,
            'active_sources': active_sources,
            'listings_by_status': by_status,
            'total_listings': sum(by_status.values())
        }


crawler_service = CrawlerService()
