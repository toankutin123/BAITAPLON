import os
import re
import time
from typing import List, Dict, Optional, Tuple
from urllib.parse import quote_plus, urljoin

try:
    from curl_cffi import requests as curl_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False

try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False

from bs4 import BeautifulSoup


CITY_MAP = {
    'tp.hcm': 'ho-chi-minh',
    'tp. hcm': 'ho-chi-minh',
    'tphcm': 'ho-chi-minh',
    'hồ chí minh': 'ho-chi-minh',
    'ho chi minh': 'ho-chi-minh',
    'hà nội': 'ha-noi',
    'hanoi': 'ha-noi',
    'đà nẵng': 'da-nang',
    'da nang': 'da-nang',
    'bình dương': 'binh-duong',
    'binh duong': 'binh-duong',
    'đồng nai': 'dong-nai',
    'dong nai': 'dong-nai',
    'long an': 'long-an',
    'cần thơ': 'can-tho',
    'can tho': 'can-tho',
    'hải phòng': 'hai-phong',
    'hai phong': 'hai-phong',
}


def normalize_city_url(city: str) -> str:
    """Normalize city name to URL format"""
    if not city:
        return 'ho-chi-minh'

    city_lower = city.lower().strip()

    # Try direct match
    if city_lower in CITY_MAP:
        return CITY_MAP[city_lower]

    # Try without spaces
    city_no_space = city_lower.replace(' ', '')
    for key, value in CITY_MAP.items():
        if key.replace(' ', '') == city_no_space:
            return value

    # Last resort: remove diacritics manually
    return city_lower.replace(' ', '-')


def extract_domain(url: str) -> str:
    """Trích xuất domain từ URL"""
    match = re.search(r'(?:https?://)?(?:www\.)?([^/]+)', url)
    return match.group(1) if match else 'unknown'


def search_batdongsan_playwright(location: str, property_type: str, limit: int = 10) -> List[Dict]:
    """
    Tìm kiếm batdongsan.com.vn dùng Playwright (hỗ trợ JavaScript rendering).
    Trả về danh sách listings với tiêu đề, giá, diện tích.
    """
    results = []

    if not HAS_PLAYWRIGHT:
        print("[SCRAPE] Playwright not installed")
        return results

    property_type_map = {
        'apartment': 'can-ho',
        'house': 'nha-pho',
        'villa': 'biet-thu',
        'townhouse': 'nha-lien-ke',
        'land': 'dat-nen'
    }
    type_search = property_type_map.get(property_type.lower(), 'nha-pho')

    # Parse location - handle single city name (no comma) vs district,city format
    location_parts = [p.strip() for p in location.split(',')]

    # Known major cities (single-word or common formats)
    major_cities = ['hà nội', 'hanoi', 'tp.hcm', 'tphcm', 'hồ chí minh', 'ho chi minh',
                    'đà nẵng', 'da nang', 'danang', 'hải phòng', 'hai phong',
                    'cần thơ', 'can tho', 'cantho', 'bình dương', 'binh duong']

    if len(location_parts) == 1:
        # Single location - could be city name or district name
        loc = location_parts[0].lower().strip()
        # Remove quận/huyện prefix first
        for prefix in ['quận ', 'quận', 'huyện ', 'huyện', 'tp. ', 'tp', 'thành phố ']:
            if loc.startswith(prefix):
                loc = loc[len(prefix):].strip()
                break
        # Check if it's a city name
        if loc in major_cities or any(city in loc for city in ['hà nội', 'hồ chí minh', 'đà nẵng']):
            # It's a city name - no district
            city = location_parts[0]
            district = None
        else:
            # It's a district name without city
            district = location_parts[0]
            city = 'TP.HCM'  # Default city
    else:
        # district, city format
        district = location_parts[0]
        city = location_parts[-1]

    city_url = normalize_city_url(city)
    # Remove quận/huyện prefix first, then convert spaces to dashes
    district_clean = district.lower().strip() if district else ''
    for prefix in ['quận ', 'quận', 'huyện ', 'huyện']:
        if district_clean.startswith(prefix):
            district_clean = district_clean[len(prefix):].strip()
            break
    district_url = district_clean.replace(' ', '-') if district_clean else ''
    # If district_url is empty (e.g., "Quận 7" -> "7"), prepend "quan-" or similar
    if district_url and district_url[0].isdigit():
        district_url = 'quan-' + district_url

    # Build URL based on whether we have district or city-only
    if district_url:
        search_url = f"https://batdongsan.com.vn/{type_search}-{district_url}-{city_url}"
    else:
        # City-only search (no district)
        search_url = f"https://batdongsan.com.vn/{type_search}-{city_url}"

    print(f"[SCRAPE-PW] Searching: {search_url}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(search_url, timeout=30000)

            # Wait for listings to load (JavaScript renders content)
            page.wait_for_selector('a[href*="-pr"]', timeout=10000)

            # Scroll to load more
            for _ in range(3):
                page.keyboard.press('End')
                time.sleep(1)

            # Get page HTML after JS rendering
            content = page.content()
            browser.close()

            soup = BeautifulSoup(content, 'html.parser')
            listing_links = soup.select('a[href*="-pr"]')

            print(f"[SCRAPE-PW] Found {len(listing_links)} listings")

            seen_urls = set()
            count = 0

            for a in listing_links:
                if count >= limit:
                    break

                href = a.get('href', '')
                if not href or href in seen_urls or '-pr' not in href:
                    continue
                seen_urls.add(href)

                # Build full URL
                if href.startswith('/'):
                    listing_url = f"https://batdongsan.com.vn{href}"
                else:
                    listing_url = href

                title = a.get_text(strip=True)
                if not title or len(title) < 10:
                    continue

                # Try to extract price/area from title
                price = parse_price(title)
                area = parse_area(title)

                results.append({
                    'title': title[:100],
                    'url': listing_url,
                    'address': location,
                    'price': price,
                    'area': area,
                    'source': 'batdongsan.com.vn'
                })

                print(f"[SCRAPE-PW] {title[:50]}... price={price}, area={area}")
                count += 1

        except Exception as e:
            print(f"[SCRAPE-PW ERROR] {e}")
            browser.close()

    return results


def search_mogi_vn(location: str, property_type: str, limit: int = 10) -> List[Dict]:
    """
    Tìm kiếm mogi.vn dùng Playwright.
    mogi.vn là sàn BĐS Việt Nam, không có Cloudflare protection.
    """
    results = []

    if not HAS_PLAYWRIGHT:
        print("[SCRAPE-MOGI] Playwright not installed")
        return results

    property_type_map = {
        'apartment': 'chung-cu',
        'house': 'nha',
        'villa': 'biet-thu',
        'townhouse': 'nha',
        'land': 'dat'
    }
    type_search = property_type_map.get(property_type.lower(), 'nha')

    # Parse location - handle single city name (no comma) vs district,city format
    location_parts = [p.strip() for p in location.split(',')]

    # Known major cities
    major_cities = ['hà nội', 'hanoi', 'tp.hcm', 'tphcm', 'hồ chí minh', 'ho chi minh',
                    'đà nẵng', 'da nang', 'danang', 'hải phòng', 'hai phong',
                    'cần thơ', 'can tho', 'cantho', 'bình dương', 'binh duong']

    if len(location_parts) == 1:
        loc = location_parts[0].lower().strip()
        for prefix in ['quận ', 'quận', 'huyện ', 'huyện', 'tp. ', 'tp', 'thành phố ']:
            if loc.startswith(prefix):
                loc = loc[len(prefix):].strip()
                break
        if loc in major_cities or any(city in loc for city in ['hà nội', 'hồ chí minh', 'đà nẵng']):
            city = location_parts[0]
            district = None
        else:
            district = location_parts[0]
            city = 'TP.HCM'
    else:
        district = location_parts[0]
        city = location_parts[-1]

    # mogi.vn uses 'tp-ho-chi-minh' format
    city_map = {
        'tp.hcm': 'tp-ho-chi-minh',
        'tp. hcm': 'tp-ho-chi-minh',
        'tphcm': 'tp-ho-chi-minh',
        'hồ chí minh': 'tp-ho-chi-minh',
        'ho chi minh': 'tp-ho-chi-minh',
        'hcm': 'tp-ho-chi-minh',
        'hà nội': 'ha-noi',
        'hanoi': 'ha-noi',
        'đà nẵng': 'da-nang',
        'da nang': 'da-nang',
        'bình dương': 'binh-duong',
        'binh duong': 'binh-duong',
        'đồng nai': 'dong-nai',
        'dong nai': 'dong-nai',
        'long an': 'long-an',
    }
    city_url = normalize_city_url(city)
    if city_url == 'ho-chi-minh':
        city_url = 'tp-ho-chi-minh'

    # Normalize district
    district_clean = district.lower().strip() if district else ''
    for prefix in ['quận ', 'quận', 'huyện ', 'huyện']:
        if district_clean.startswith(prefix):
            district_clean = district_clean[len(prefix):].strip()
            break
    district_url = district_clean.replace(' ', '-') if district_clean else ''
    if district_url and district_url[0].isdigit():
        district_url = 'quan-' + district_url

    # Build search URL - mogi.vn uses district in URL
    if district_url and district_url != city_url:
        search_url = f"https://mogi.vn/mua/{type_search}/{district_url}-{city_url}"
    else:
        search_url = f"https://mogi.vn/mua/{type_search}/{city_url}"

    print(f"[SCRAPE-MOGI] Searching: {search_url}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                extra_http_headers={'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'}
            )
            page = context.new_page()

            page.goto(search_url, timeout=30000)
            page.wait_for_load_state('load')
            time.sleep(6)

            for _ in range(5):
                page.keyboard.press('End')
                time.sleep(2)

            content = page.content()
            browser.close()

            soup = BeautifulSoup(content, 'html.parser')

            # Find listing cards - mogi.vn uses specific classes
            # Try multiple selectors
            cards = soup.select('[class*="prj"], [class*="project-item"], .project-list-item')
            if not cards:
                cards = soup.select('[class*="listing-item"], [class*="re-item"]')

            print(f"[SCRAPE-MOGI] Found {len(cards)} listing cards")

            seen_urls = set()
            count = 0

            for card in cards:
                if count >= limit:
                    break

                # Find main link
                links = card.find_all('a', href=True)
                listing_link = None
                for a in links:
                    href = a.get('href', '')
                    if '/mua/' in href or '/ban/' in href:
                        listing_link = a
                        break

                if not listing_link:
                    continue

                href = listing_link.get('href', '')
                if not href or href in seen_urls:
                    continue
                seen_urls.add(href)

                if href.startswith('/'):
                    listing_url = f"https://mogi.vn{href}"
                else:
                    listing_url = href

                # Get text content
                text = card.get_text(separator=' ', strip=True)
                price = parse_price(text)
                area = parse_area(text)

                # Try to get title from link or card
                title = listing_link.get_text(strip=True)
                if not title or len(title) < 5:
                    title_elem = card.select_one('h3, h4, [class*="title"]')
                    if title_elem:
                        title = title_elem.get_text(strip=True)

                if not title or len(title) < 5:
                    title = text[:80] if len(text) > 20 else 'Mogi Listing'

                results.append({
                    'title': title[:100],
                    'url': listing_url,
                    'address': location,
                    'price': price,
                    'area': area,
                    'source': 'mogi.vn'
                })

                if price or area:
                    print(f"[SCRAPE-MOGI] {title[:50]}... price={price}, area={area}")
                count += 1

        except Exception as e:
            print(f"[SCRAPE-MOGI ERROR] {e}")
            browser.close()

    return results


def search_rever_vn(location: str, property_type: str, limit: int = 10) -> List[Dict]:
    """
    Tìm kiếm rever.vn dùng Playwright (hỗ trợ JavaScript rendering).
    rever.vn không có Cloudflare protection nên dễ scrape hơn.
    """
    results = []

    if not HAS_PLAYWRIGHT:
        print("[SCRAPE-REVER] Playwright not installed")
        return results

    property_type_map = {
        'apartment': 'can-ho',
        'house': 'nha-pho',
        'villa': 'biet-thu',
        'townhouse': 'nha-pho',
        'land': 'dat-nen'
    }
    type_search = property_type_map.get(property_type.lower(), 'can-ho')

    # Parse location - handle single city name (no comma) vs district,city format
    location_parts = [p.strip() for p in location.split(',')]

    # Known major cities
    major_cities = ['hà nội', 'hanoi', 'tp.hcm', 'tphcm', 'hồ chí minh', 'ho chi minh',
                    'đà nẵng', 'da nang', 'danang', 'hải phòng', 'hai phong',
                    'cần thơ', 'can tho', 'cantho', 'bình dương', 'binh duong']

    if len(location_parts) == 1:
        loc = location_parts[0].lower().strip()
        for prefix in ['quận ', 'quận', 'huyện ', 'huyện', 'tp. ', 'tp', 'thành phố ']:
            if loc.startswith(prefix):
                loc = loc[len(prefix):].strip()
                break
        if loc in major_cities or any(city in loc for city in ['hà nội', 'hồ chí minh', 'đà nẵng']):
            city = location_parts[0]
            district = None
        else:
            district = location_parts[0]
            city = 'TP.HCM'
    else:
        district = location_parts[0]
        city = location_parts[-1]

    city_url = normalize_city_url(city)

    # Normalize district - remove quận/huyện prefix but keep the number
    district_clean = district.lower().strip() if district else ''
    for prefix in ['quận ', 'quận', 'huyện ', 'huyện']:
        if district_clean.startswith(prefix):
            district_clean = district_clean[len(prefix):].strip()
            break
    # Convert spaces to dashes
    district_url = district_clean.replace(' ', '-') if district_clean else ''

    # Build search URL - try district-specific first
    # If district is just a number (like "7" from "Quận 7"), we need "quan-7"
    if district_url and not district_url.startswith('quan-'):
        if district_url[0].isdigit():
            district_url = 'quan-' + district_url

    if district_url and district_url != city_url:
        search_url = f"https://rever.vn/s/{district_url}-{city_url}/mua/{type_search}"
    else:
        search_url = f"https://rever.vn/s/{city_url}/mua/{type_search}"

    print(f"[SCRAPE-REVER] Searching: {search_url}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                extra_http_headers={'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8'}
            )
            page = context.new_page()

            page.goto(search_url, timeout=30000)
            page.wait_for_load_state('load')

            # Wait for JS to render
            time.sleep(8)

            # Scroll to load more listings
            for _ in range(5):
                page.keyboard.press('End')
                time.sleep(2)

            content = page.content()
            browser.close()

            soup = BeautifulSoup(content, 'html.parser')

            # Find listing containers - elements that contain both a listing link and price
            containers = soup.select('[class*="listing-item"], [class*="re-item"], [class*="property-item"], [class*="result-item"]')

            print(f"[SCRAPE-REVER] Found {len(containers)} listing containers")

            seen_urls = set()
            count = 0

            for container in containers:
                if count >= limit:
                    break

                # Find the listing link within this container
                links = container.find_all('a', href=True)
                listing_link = None
                for a in links:
                    href = a.get('href', '')
                    if '/mua/' in href and any(c.isdigit() for c in href):
                        listing_link = a
                        break

                if not listing_link:
                    continue

                href = listing_link.get('href', '')
                if not href or href in seen_urls:
                    continue
                seen_urls.add(href)

                # Build full URL
                if href.startswith('/'):
                    listing_url = f"https://rever.vn{href}"
                else:
                    listing_url = href

                # Get title from container text
                text = container.get_text(separator=' ', strip=True)

                # Extract price
                price = parse_price(text)

                # Extract area
                area = parse_area(text)

                # Generate title from URL or text
                title_match = re.search(r'mua/(?:can-ho|nha-pho|biet-thu|dat-nen)[-/]?(.+)', href)
                if title_match:
                    title = title_match.group(1).replace('-', ' ').title()
                else:
                    title = text[:80] if len(text) > 20 else 'Rever Listing'

                results.append({
                    'title': title[:100],
                    'url': listing_url,
                    'address': location,
                    'price': price,
                    'area': area,
                    'source': 'rever.vn'
                })

                print(f"[SCRAPE-REVER] {title[:50]}... price={price}, area={area}")
                count += 1

        except Exception as e:
            print(f"[SCRAPE-REVER ERROR] {e}")
            browser.close()

    return results


def parse_price(price_text: str) -> Optional[float]:
    """Parse giá từ text (VD: "2.5 tỷ", "1.2 tỷ 500 triệu")"""
    if not price_text:
        return None

    price_text = price_text.lower().replace(',', '.')

    # Try tỷ
    match = re.search(r'([\d.]+)\s*tỷ', price_text)
    if match:
        value = float(match.group(1))
        # Check for triệu extra
        trieu_match = re.search(r'([\d.]+)\s*triệu', price_text)
        if trieu_match:
            value += float(trieu_match.group(1)) / 1000
        return value * 1_000_000_000

    # Try chỉ triệu
    match = re.search(r'([\d.]+)\s*triệu', price_text)
    if match:
        return float(match.group(1)) * 1_000_000

    return None


def parse_area(area_text: str) -> Optional[float]:
    """Parse diện tích từ text (VD: "100 m²", "80m2")"""
    if not area_text:
        return None

    match = re.search(r'([\d.]+)\s*m', area_text)
    if match:
        return float(match.group(1))
    return None


def calculate_price_per_m2(price: float, area: float) -> Optional[float]:
    """Tính giá/m2 từ giá tổng và diện tích"""
    if price and area and area > 0:
        return price / area
    return None


def search_batdongsan_direct(location: str, property_type: str, limit: int = 10) -> List[Dict]:
    """
    Tìm kiếm trực tiếp trên batdongsan.com.vn theo khu vực và loại BĐS.
    Extracts price/area from listing titles when direct data not available.
    """
    results = []

    if not HAS_CURL_CFFI:
        print("[SCRAPE ERROR] curl_cffi not installed")
        return results

    property_type_map = {
        'apartment': 'can-ho',
        'house': 'nha-pho',
        'villa': 'biet-thu',
        'townhouse': 'nha-lien-ke',
        'land': 'dat-nen'
    }
    type_search = property_type_map.get(property_type.lower(), 'nha-pho')

    # Parse location - handle single city name (no comma) vs district,city format
    location_parts = [p.strip() for p in location.split(',')]

    # Known major cities
    major_cities = ['hà nội', 'hanoi', 'tp.hcm', 'tphcm', 'hồ chí minh', 'ho chi minh',
                    'đà nẵng', 'da nang', 'danang', 'hải phòng', 'hai phong',
                    'cần thơ', 'can tho', 'cantho', 'bình dương', 'binh duong']

    if len(location_parts) == 1:
        loc = location_parts[0].lower().strip()
        for prefix in ['quận ', 'quận', 'huyện ', 'huyện', 'tp. ', 'tp', 'thành phố ']:
            if loc.startswith(prefix):
                loc = loc[len(prefix):].strip()
                break
        if loc in major_cities or any(city in loc for city in ['hà nội', 'hồ chí minh', 'đà nẵng']):
            city = location_parts[0]
            district = None
        else:
            district = location_parts[0]
            city = 'TP.HCM'
    else:
        district = location_parts[0]
        city = location_parts[-1]

    city_url = normalize_city_url(city)

    # Normalize district - remove quận/huyện prefix, convert spaces
    district_clean = district.lower().strip() if district else ''
    for prefix in ['quận ', 'quận', 'huyện ', 'huyện']:
        if district_clean.startswith(prefix):
            district_clean = district_clean[len(prefix):].strip()
            break
    district_url = district_clean.replace(' ', '-') if district_clean else ''
    if district_url and district_url[0].isdigit():
        district_url = 'quan-' + district_url

    # Build search URL for batdongsan.com.vn
    if district_url:
        search_url = f"https://batdongsan.com.vn/{type_search}-{district_url}-{city_url}"
    else:
        # City-only search (no district)
        search_url = f"https://batdongsan.com.vn/{type_search}-{city_url}"

    print(f"[SCRAPE] Searching directly: {search_url}")

    try:
        response = curl_requests.get(
            search_url,
            impersonate="chrome",
            timeout=30,
            headers={
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        )

        if response.status_code != 200:
            print(f"[SCRAPE ERROR] Direct search HTTP {response.status_code}")
            return results

        soup = BeautifulSoup(response.text, 'html.parser')

        # Find listing links with -pr suffix (actual listing URLs)
        listing_links = soup.select('a[href*="-pr"]')
        listing_links = [a for a in listing_links if a.get('href', '')]

        print(f"[SCRAPE] Found {len(listing_links)} listing links with -pr")

        seen_urls = set()
        count = 0
        for a in listing_links:
            if count >= limit:
                break
            try:
                href = a.get('href', '')

                # Skip duplicates
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                # Build full URL
                if href.startswith('/'):
                    listing_url = f"https://batdongsan.com.vn{href}"
                elif not href.startswith('http'):
                    continue
                else:
                    listing_url = href

                # Only actual listing URLs
                if '-pr' not in listing_url:
                    continue

                # Get title
                title = a.get_text(strip=True)
                if not title or len(title) < 10 or 'tải ứng dụng' in title.lower():
                    continue

                # Try to extract price/area from title text
                price = None
                area = None

                # Look for area pattern like "50m2", "50 m2", "50m²"
                area_match = re.search(r'(\d+[.,]?\d*)\s*m2', title, re.IGNORECASE)
                if area_match:
                    area = float(area_match.group(1).replace(',', '.'))
                    if area < 10 or area > 10000:  # Sanity check
                        area = None

                # Look for price patterns like "2.5 tỷ", "1 tỷ 500 triệu"
                price = parse_price(title)

                results.append({
                    'title': title[:100],
                    'url': listing_url,
                    'address': location,
                    'price': price,
                    'area': area,
                    'source': 'batdongsan.com.vn'
                })
                print(f"[SCRAPE] {title[:60]}... price={price}, area={area}")
                count += 1

            except Exception as e:
                continue

        print(f"[SCRAPE] Total listings found: {len(results)}")

    except Exception as e:
        print(f"[SCRAPE ERROR] Direct search failed: {e}")

    return results


def search_google_for_property_prices(location: str, property_type: str, limit: int = 10) -> List[Dict]:
    """
    Tìm kiếm giá bất động sản qua Google Search (sites:batdongsan.com.vn)
    Trích xuất price/area từ search snippets.
    """
    results = []

    if not HAS_CURL_CFFI:
        print("[SCRAPE ERROR] curl_cffi not installed")
        return results

    property_type_map = {
        'apartment': 'can ho',
        'house': 'nha pho',
        'villa': 'biet thu',
        'townhouse': 'nha lien ke',
        'land': 'dat nen'
    }
    type_search = property_type_map.get(property_type.lower(), 'nha pho')

    # Build search query
    query = f"site:batdongsan.com.vn {type_search} {location}"
    search_url = f"https://www.google.com/search?q={quote_plus(query)}"

    print(f"[SCRAPE] Tìm kiếm Google: {query}")

    try:
        response = curl_requests.get(
            search_url,
            impersonate="chrome",
            timeout=30,
            headers={
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
            }
        )

        if response.status_code != 200:
            print(f"[SCRAPE ERROR] Google search HTTP {response.status_code}")
            return results

        soup = BeautifulSoup(response.text, 'html.parser')

        # Tìm các search results - try multiple selectors for Google search results
        search_results = soup.select('div[data-snf] a[href], .g a[href], [class^="js"] a[href]')

        print(f"[SCRAPE] Tìm thấy {len(search_results)} kết quả tìm kiếm")

        for a in search_results[:limit]:
            try:
                href = a.get('href', '')
                if 'batdongsan.com.vn' in href and '/ban-' in href:
                    # Extract listing URL
                    match = re.search(r'/([^/]+-\d+)\.pr', href)
                    if match:
                        listing_url = f"https://batdongsan.com.vn/{match.group(1)}.pr"

                        # Get title
                        title_elem = a.select_one('h3')
                        title = title_elem.get_text(strip=True) if title_elem else 'N/A'

                        # Get the parent or sibling text that might contain price/area info
                        price = None
                        area = None
                        snippet_text = a.get_text(' ', strip=True)

                        # Try to extract price from snippet
                        price = parse_price(snippet_text)

                        # Try to extract area from snippet
                        area = parse_area(snippet_text)

                        result = {
                            'title': title,
                            'url': listing_url,
                            'address': location,
                            'source': 'batdongsan.com.vn'
                        }
                        if price:
                            result['price'] = price
                        if area:
                            result['area'] = area

                        results.append(result)
                        if price or area:
                            print(f"[SCRAPE] Tìm thấy: {title[:40]}... price={price/1e9 if price else 'N/A'}tỷ, area={area if area else 'N/A'}m²")
                        else:
                            print(f"[SCRAPE] Tìm thấy: {title[:50]}...")
            except Exception as e:
                continue

    except Exception as e:
        print(f"[SCRAPE ERROR] Google search failed: {e}")

    return results


def scrape_listing_details(url: str) -> Optional[Dict]:
    """Scrape chi tiết một listing để lấy giá và diện tích"""
    if not HAS_CURL_CFFI:
        return None

    try:
        response = curl_requests.get(
            url,
            impersonate="chrome",
            timeout=20,
            headers={
                'Accept-Language': 'vi-VN,vi;q=0.9',
                'Accept': 'text/html',
            }
        )

        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.text, 'html.parser')

        # Try to find JSON-LD structured data first
        json_ld = soup.select_one('script[type="application/ld+json"]')
        if json_ld:
            try:
                import json
                data = json.loads(json_ld.string)
                if isinstance(data, dict):
                    offers = data.get('offers', {})
                    if offers:
                        price = parse_price(str(offers.get('price', '')))
                        # Also get from schema
                        area = None
                        schema_area = data.get('floorSize')
                        if schema_area and isinstance(schema_area, dict):
                            area = parse_area(str(schema_area.get('value', '')))
                        if price:
                            return {
                                'title': data.get('name', ''),
                                'price': price,
                                'price_text': str(offers.get('price', '')),
                                'area': area,
                                'area_text': str(schema_area) if schema_area else '',
                                'url': url
                            }
            except Exception:
                pass

        # Get title
        title_elem = soup.select_one('h1, [class*="title"]')
        title = title_elem.get_text(strip=True) if title_elem else ''

        # Skip placeholder content
        if not title or 'tải ứng dụng' in title.lower():
            title = ''

        # Get price - try multiple selectors
        price_text = ''
        price_elem = soup.select_one('[class*="price"], .product-price, .price-detail, [class*="product"], .price')
        if price_elem:
            price_text = price_elem.get_text(strip=True)
        price = parse_price(price_text)

        # Get area
        area_text = ''
        area_elem = soup.select_one('[class*="area"], .product-area, .square, [class*="size"]')
        if area_elem:
            area_text = area_elem.get_text(strip=True)
        area = parse_area(area_text)

        return {
            'title': title,
            'price': price,
            'price_text': price_text,
            'area': area,
            'area_text': area_text,
            'url': url
        }

    except Exception as e:
        print(f"[SCRAPE ERROR] scrape_listing_details: {e}")
        return None


def search_and_extract_price_per_m2(location: str, property_type: str, limit: int = 8) -> Tuple[List[Dict], float]:
    """
    Tìm kiếm BĐS theo location và property_type, trích xuất price/m2 từ kết quả.
    Trả về danh sách properties và price_per_m2 trung bình.
    """
    print(f"[SCRAPE] =======================================")
    print(f"[SCRAPE] Bắt đầu tìm kiếm: {property_type} tại {location}")
    print(f"[SCRAPE] Playwright available: {HAS_PLAYWRIGHT}")
    print(f"[SCRAPE] curl_cffi available: {HAS_CURL_CFFI}")

    all_prices_per_m2 = []
    properties = []

    # Try multiple sources in order
    search_results = []

    # 1. Try rever.vn first (no Cloudflare protection)
    print("[SCRAPE] Thử rever.vn...")
    if HAS_PLAYWRIGHT:
        search_results = search_rever_vn(location, property_type, limit)
        if search_results:
            print(f"[SCRAPE] rever.vn found {len(search_results)} listings")
        else:
            print("[SCRAPE] rever.vn: không có kết quả")

    # 2. Try mogi.vn if rever.vn didn't work
    if not search_results and HAS_PLAYWRIGHT:
        print("[SCRAPE] Thử mogi.vn...")
        search_results = search_mogi_vn(location, property_type, limit)
        if search_results:
            print(f"[SCRAPE] mogi.vn found {len(search_results)} listings")
        else:
            print("[SCRAPE] mogi.vn: không có kết quả")

    # 3. Fallback to batdongsan.com.vn if all else failed
    if not search_results:
        print("[SCRAPE] Thử batdongsan.com.vn (Playwright)...")
        search_results = search_batdongsan_playwright(location, property_type, limit)
        if search_results:
            print(f"[SCRAPE] batdongsan Playwright found {len(search_results)} listings")
        else:
            print("[SCRAPE] batdongsan Playwright: không có kết quả")

        # Fallback to curl_cffi if Playwright not available or failed
        if not search_results:
            print("[SCRAPE] Thử batdongsan.com.vn (curl_cffi)...")
            search_results = search_batdongsan_direct(location, property_type, limit)
            if search_results:
                print(f"[SCRAPE] batdongsan direct found {len(search_results)} listings")
            else:
                print("[SCRAPE] batdongsan direct: không có kết quả")

    # 5. Fallback to Google if no direct results
    if not search_results:
        print("[SCRAPE] Thử Google search...")
        search_results = search_google_for_property_prices(location, property_type, limit)
        if search_results:
            print(f"[SCRAPE] Google found {len(search_results)} listings")
        else:
            print("[SCRAPE] Google: không có kết quả")

    if not search_results:
        print("[SCRAPE] No search results from all sources")
        return [], 0

    print(f"[SCRAPE] Found {len(search_results)} listings to check")

    # Scrape each listing to get price and area
    for prop in search_results[:limit]:
        try:
            # Use price/area if already found in search results
            price = prop.get('price')
            area = prop.get('area')

            # If either price or area is missing, try scraping the detail page
            if not price or not area:
                details = scrape_listing_details(prop['url'])
                if details:
                    # Merge data - take what we don't have from scrape
                    if not price and details.get('price'):
                        price = details['price']
                    if not area and details.get('area'):
                        area = details['area']
                    # Also update title if we didn't have one
                    if not prop.get('title') or prop.get('title') == 'N/A':
                        if details.get('title'):
                            prop['title'] = details['title']

            # Only require both price AND area before calculating
            if price and area:
                price_per_m2 = calculate_price_per_m2(price, area)

                if price_per_m2 and 2_000_000 <= price_per_m2 <= 300_000_000:
                    all_prices_per_m2.append(price_per_m2)
                    properties.append({
                        'title': prop.get('title', 'N/A'),
                        'price': price,
                        'area': area,
                        'price_per_m2': price_per_m2,
                        'address': location,
                        'url': prop['url'],
                        'source': prop.get('source', 'web')
                    })
                    print(f"[SCRAPE] {prop.get('title', '')[:40]}... - Price: {price/1e9:.2f}tỷ, Area: {area}m², Price/m2: {price_per_m2/1e6:.1f}tr/m²")
            elif price and not area:
                # Try to get area from price_per_m2 if we can estimate
                print(f"[SCRAPE] {prop.get('title', '')[:40]}... - Price: {price/1e9:.2f}tỷ, Area: unknown")
            elif not price and area:
                print(f"[SCRAPE] {prop.get('title', '')[:40]}... - Price: unknown, Area: {area}m²")

            time.sleep(1)  # Be respectful
        except Exception as e:
            print(f"[SCRAPE ERROR] Processing listing: {e}")
            continue

    # Calculate median price per m2
    if all_prices_per_m2:
        sorted_prices = sorted(all_prices_per_m2)
        n = len(sorted_prices)
        if n % 2 == 0:
            median_price_per_m2 = sum(sorted_prices[n//2-1:n//2+1]) / 2
        else:
            median_price_per_m2 = sorted_prices[(n + 1) // 2 - 1]
    else:
        median_price_per_m2 = 0

    print(f"[SCRAPE] Median price/m2: {median_price_per_m2/1e6:.1f} triệu/m² from {len(all_prices_per_m2)} properties")

    return properties, median_price_per_m2


def search_real_estate_online(location: str, property_type: str, limit: int = 6) -> List[Dict]:
    """
    Tìm kiếm BĐS online - search web và extract price/m2.
    """
    print(f"[SCRAPE] Tìm kiếm BĐS: {property_type} tại {location}")

    properties, _ = search_and_extract_price_per_m2(location, property_type, limit)

    return properties


def scrape_single_listing(url: str) -> Optional[Dict]:
    """Thử scrape một listing page cụ thể để lấy thông tin giá"""
    return scrape_listing_details(url)


def format_listings_for_ai(listings: List[Dict]) -> str:
    """Format listings thành text để đưa vào AI prompt"""
    if not listings:
        return "Không tìm thấy dữ liệu BĐS trực tuyến."

    lines = ["DỮ LIỆU BĐS TỪ INTERNET (tìm kiếm thực tế):"]
    lines.append("")

    for i, prop in enumerate(listings, 1):
        lines.append(f"{i}. {prop.get('title', 'N/A')}")

        if prop.get('price'):
            if prop['price'] >= 1_000_000_000:
                lines.append(f"   Giá: {prop['price']/1_000_000_000:.2f} tỷ VNĐ")
            else:
                lines.append(f"   Giá: {prop['price']/1_000_000:.0f} triệu VNĐ")

        if prop.get('area'):
            lines.append(f"   Diện tích: {prop['area']:.0f} m²")

        if prop.get('price_per_m2'):
            lines.append(f"   Giá/m²: {prop['price_per_m2']/1e6:.1f} triệu/m²")

        if prop.get('address'):
            lines.append(f"   Địa chỉ: {prop['address']}")

        lines.append(f"   Nguồn: {prop.get('source', 'N/A')}")
        lines.append("")

    return "\n".join(lines)
