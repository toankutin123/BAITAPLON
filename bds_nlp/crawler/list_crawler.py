from curl_cffi import requests as curl_requests
from urllib.parse import urljoin
import logging
from typing import List, Set
from datetime import datetime

logger = logging.getLogger(__name__)


class ListCrawlerError(Exception):
    """Custom exception for list crawler errors."""
    pass


def get_listing_links(
    base_url: str, 
    max_page: int = 3,
    headless: bool = True,  # kept for compatibility
    delay_seconds: float = 2.0
) -> List[str]:
    """
    Get listing links using curl_cffi with browser impersonation.
    """
    links: Set[str] = set()
    errors = []
    
    import time
    
    for i in range(1, max_page + 1):
        page_url = f"{base_url}/p{i}" if i > 1 else base_url
        
        try:
            logger.info(f"Crawling page {i}: {page_url}")
            
            response = curl_requests.get(
                page_url, 
                impersonate="chrome",
                timeout=60
            )
            
            if response.status_code != 200:
                logger.warning(f"Page {i}: HTTP {response.status_code}")
                errors.append(f"HTTP {response.status_code}")
                continue
            
            # Debug: save page content
            debug_dir = "c:/GitHub/BAITAPLON/bds_nlp/crawler/debug"
            import os
            os.makedirs(debug_dir, exist_ok=True)
            debug_file = os.path.join(debug_dir, f"curl_page_{i}_{datetime.now().strftime('%H%M%S')}.html")
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(response.text)
            logger.info(f"Saved debug HTML to: {debug_file}")
            
            # Parse HTML to find listing links
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, 'html.parser')
            
            found_count = 0
            anchors = soup.find_all('a', href=True)
            
            for a in anchors:
                href = a.get('href')
                if not href:
                    continue
                
                # Filter for listing URLs
                if any(x in href for x in ['-pr', '/ban-', '/cho-thue-', '/nha-']):
                    if href.startswith('http'):
                        full = href
                    else:
                        full = urljoin("https://batdongsan.com.vn", href)
                    
                    if "batdongsan.com.vn" in full and full not in links:
                        links.add(full)
                        found_count += 1
            
            if found_count > 0:
                logger.info(f"Page {i}: Found {found_count} links")
            else:
                link_sample = [a.get('href') for a in anchors[:10] if a.get('href')]
                logger.warning(f"Page {i}: No listing links found. Sample links: {link_sample}")
            
            time.sleep(delay_seconds)
            
        except Exception as e:
            error_msg = f"Error on page {i}: {e}"
            logger.error(error_msg)
            errors.append(error_msg)
            continue
    
    result = list(links)
    logger.info(f"Total unique links: {len(result)} (Errors: {len(errors)})")
    
    return result


def crawl_area_with_progress(
    base_url: str,
    max_page: int = 3,
    on_link_found: callable = None,
    on_page_complete: callable = None
) -> dict:
    """
    Crawl an area with progress callbacks using curl_cffi.
    """
    start_time = datetime.now()
    links = []
    errors = []
    page_stats = []
    
    import time
    
    try:
        for i in range(1, max_page + 1):
            page_start = datetime.now()
            page_url = f"{base_url}/p{i}" if i > 1 else base_url
            page_links = []
            
            try:
                response = curl_requests.get(
                    page_url,
                    impersonate="chrome",
                    timeout=60
                )
                
                if response.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.text, 'html.parser')
                    anchors = soup.find_all('a', href=True)
                    
                    for a in anchors:
                        href = a.get('href')
                        if not href:
                            continue
                        
                        if any(x in href for x in ['-pr', '/ban-', '/cho-thue-']) and 'batdongsan.com.vn' in href:
                            if href.startswith('http'):
                                full = href
                            else:
                                full = urljoin("https://batdongsan.com.vn", href)
                            
                            if full not in links:
                                links.append(full)
                                page_links.append(full)
                                
                                if on_link_found:
                                    on_link_found(full, len(links), max_page * 50)
                
                page_time = (datetime.now() - page_start).total_seconds()
                page_stats.append({
                    "page": i,
                    "links": len(page_links),
                    "time_seconds": page_time
                })
                
                if on_page_complete:
                    on_page_complete(i, len(page_links))
                
                time.sleep(2)
                
            except Exception as e:
                errors.append(f"Page {i}: {str(e)}")
                logger.error(f"Error on page {i}: {e}")
    
    except Exception as e:
        logger.error(f"Scraper error: {e}")
        raise
    
    total_time = (datetime.now() - start_time).total_seconds()
    
    return {
        "links": list(set(links)),
        "total_links": len(set(links)),
        "page_stats": page_stats,
        "errors": errors,
        "total_errors": len(errors),
        "total_time_seconds": total_time,
        "start_time": start_time.isoformat(),
        "end_time": datetime.now().isoformat()
    }
