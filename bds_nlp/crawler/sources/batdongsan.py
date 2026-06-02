from crawler.base import BaseCrawler
from typing import List, Optional
from urllib.parse import urljoin
import logging

logger = logging.getLogger(__name__)


class BatDongsanCrawler(BaseCrawler):
    """Crawler for batdongsan.com.vn."""
    
    SOURCE_NAME = "batdongsan.com.vn"
    BASE_URL = "https://batdongsan.com.vn"
    
    LISTING_SELECTORS = {
        "container": "a[href*='-pr']",
        "title": "span[data-tracking-item-prop='title']",
        "price": ".re__listing-price",
        "area": ".re__listing-area",
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.source_config = {
            "base_url": self.BASE_URL,
            "listing_selectors": self.LISTING_SELECTORS,
        }
    
    def get_listing_urls(self, area_path: str, max_pages: int = 10) -> List[str]:
        """
        Get all listing URLs from a category page.
        
        Args:
            area_path: Path to area/category (e.g., "/ban-nha-rieng-ha-noi")
            max_pages: Maximum number of pages to crawl
        
        Returns:
            List of listing URLs
        """
        urls = []
        
        for page in range(1, max_pages + 1):
            if page == 1:
                page_url = f"{self.BASE_URL}{area_path}"
            else:
                page_url = f"{self.BASE_URL}{area_path}/p{page}"
            
            try:
                self.logger.info(f"Crawling page {page}: {page_url}")
                
                # Load page with Playwright
                self.page.goto(page_url, timeout=self.timeout)
                
                # Wait for listings to load
                self.wait_for_selectors(["a[href*='-pr']"], timeout=15000)
                
                # Scroll to load lazy content
                self.scroll_to_load()
                
                # Extract listing links
                anchors = self.page.query_selector_all("a[href*='-pr']")
                
                for anchor in anchors:
                    href = anchor.get_attribute("href")
                    if href:
                        full_url = urljoin(self.BASE_URL, href)
                        if self.BASE_URL in full_url:
                            urls.append(full_url)
                
                self.logger.info(f"Found {len(anchors)} links on page {page}")
                
            except Exception as e:
                self.logger.error(f"Error crawling page {page}: {e}")
                continue
        
        # Remove duplicates while preserving order
        seen = set()
        unique_urls = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                unique_urls.append(url)
        
        self.logger.info(f"Total unique URLs: {len(unique_urls)}")
        return unique_urls
    
    def crawl_listing(self, url: str) -> Optional[dict]:
        """
        Crawl a single listing page.
        
        Args:
            url: URL of the listing
        
        Returns:
            Dict with listing data or None if failed
        """
        try:
            self.logger.info(f"Crawling listing: {url}")
            
            # Load page
            self.page.goto(url, timeout=self.timeout)
            
            # Wait for content
            self.wait_for_selectors(["h1"], timeout=15000)
            
            # Additional wait for dynamic content
            self.page.wait_for_timeout(2000)
            
            # Extract data
            data = self.extract_data()
            data["url"] = url
            data["source"] = self.SOURCE_NAME
            
            return data
            
        except Exception as e:
            self.logger.error(f"Error crawling {url}: {e}")
            return None
    
    def extract_data(self) -> dict:
        """Extract data from current page."""
        from bs4 import BeautifulSoup
        from pipeline.extractor import DataExtractor
        
        html = self.page.content()
        soup = BeautifulSoup(html, "lxml")
        
        extractor = DataExtractor()
        return extractor.extract_from_html(html, self.page.url)
