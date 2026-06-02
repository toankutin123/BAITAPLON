from curl_cffi import requests as curl_requests
from bs4 import BeautifulSoup
from nlp.pipeline import process
import json
import re
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ScraperError(Exception):
    """Custom exception for scraper errors."""
    pass


class RateLimitError(ScraperError):
    """Exception for rate limiting."""
    pass


class PageLoadError(ScraperError):
    """Exception for page load failures."""
    pass


def extract_address(soup):
    """Extract address from parsed HTML."""
    address = None

    # ===== 1. JSON-LD =====
    scripts = soup.find_all("script", type="application/ld+json")

    for s in scripts:
        try:
            data = json.loads(s.string)

            if isinstance(data, dict):
                addr = data.get("address")

                if isinstance(addr, dict):
                    address = ", ".join(filter(None, [
                        addr.get("streetAddress"),
                        addr.get("addressLocality"),
                        addr.get("addressRegion")
                    ]))

                elif isinstance(addr, str):
                    address = addr

            if address:
                return address

        except:
            continue

    # ===== 2. HTML =====
    tag = soup.select_one(".re__pr-short__info-value")
    if tag:
        return tag.get_text(strip=True)

    # ===== 3. REGEX =====
    text = soup.get_text("\n")

    match = re.search(
        r"đường.*?,\s*phường.*?,\s*(quận|q\.).*?,\s*(hồ chí minh|hà nội)",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group()

    return None


def extract_price(text):
    """Extract price from text."""
    text = text.lower().replace(",", ".")

    # ===== dạng 3 tỷ 860 (rất hay gặp) =====
    match = re.search(r'(\d+)\s*t[ỷi]\s*(\d+)?', text)
    if match:
        main = float(match.group(1))
        extra = float(match.group(2)) if match.group(2) else 0
        return {
            "price_total": (main + extra / 1000) * 1_000_000_000,
            "price_m2": None
        }

    # ===== dạng 3.359 tỷ =====
    match = re.search(r'(\d+\.\d+)\s*t[ỷi]', text)
    if match:
        return {
            "price_total": float(match.group(1)) * 1_000_000_000,
            "price_m2": None
        }

    # ===== giá theo m2 =====
    match = re.search(r'(\d+(\.\d+)?)\s*triệu/m', text)
    if match:
        return {
            "price_total": None,
            "price_m2": float(match.group(1)) * 1_000_000
        }

    return {
        "price_total": None,
        "price_m2": None
    }


class Scraper:
    """Scraper using curl_cffi with browser impersonation."""
    
    def __init__(
        self,
        headless: bool = True,
        timeout: int = 60,
        retry_count: int = 3,
        delay_seconds: float = 2.0
    ):
        self.timeout = timeout
        self.retry_count = retry_count
        self.delay_seconds = delay_seconds
    
    def scrape_bds(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape a listing with retry logic using curl_cffi.
        """
        for attempt in range(self.retry_count):
            try:
                return self._scrape_single(url)
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1}/{self.retry_count} failed for {url}: {e}")
                if attempt < self.retry_count - 1:
                    import time
                    time.sleep(self.delay_seconds * (attempt + 1))
        
        return None
    
    def _scrape_single(self, url: str) -> Dict[str, Any]:
        """Single scrape attempt using curl_cffi."""
        response = curl_requests.get(
            url,
            impersonate="chrome",
            timeout=self.timeout
        )
        
        if response.status_code != 200:
            raise PageLoadError(f"HTTP {response.status_code}")
        
        soup = BeautifulSoup(response.text, "lxml")
        
        title_tag = soup.select_one("h1")
        title = title_tag.get_text(strip=True) if title_tag else None
        
        full_text = soup.get_text()
        price_data = extract_price(full_text)
        
        desc_block = soup.find("div", class_=lambda x: x and "body" in x)
        description = desc_block.get_text("\n", strip=True) if desc_block else ""
        
        address = extract_address(soup)
        nlp_data = process(description)
        
        return {
            "title": title,
            "price_total": price_data["price_total"],
            "price_m2": price_data["price_m2"],
            "address": address,
            "description": description,
            **nlp_data
        }


def scrape_bds(url: str) -> Optional[Dict[str, Any]]:
    """
    Standalone function to scrape a listing.
    """
    try:
        scraper = Scraper()
        return scraper.scrape_bds(url)
    except Exception as e:
        logger.error(f"Scraper error for {url}: {e}")
        return None
