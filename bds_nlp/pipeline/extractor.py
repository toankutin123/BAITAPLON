from bs4 import BeautifulSoup
import json
import re
from typing import Dict, Optional, Any
from datetime import datetime


class DataExtractor:
    """Extract structured data from raw HTML content."""
    
    def extract_from_html(self, html: str, url: str) -> Dict[str, Any]:
        """Main extraction method - parse HTML and extract all fields."""
        soup = BeautifulSoup(html, "lxml")
        
         # Extract all fields
        title = self._extract_title(soup)
        price_data = self._extract_price(soup)
        address = self._extract_address(soup)
        area = self._extract_area(soup)
        bedrooms = self._extract_bedrooms(soup)
        bathrooms = self._extract_bathrooms(soup)
        property_type = self._extract_property_type(soup)
        direction = self._extract_direction(soup)
        legal_status = self._extract_legal_status(soup)
        description = self._extract_description(soup)
        images = self._extract_images(soup)
        source_id = self._extract_source_id(url)
        posted_date = self._extract_posted_date(soup)
        
        return {
            "title": title,
            "url": url,
            "source_id": source_id,
            "price": price_data.get("price"),
            "price_per_m2": price_data.get("price_per_m2"),
            "price_rent": price_data.get("price_rent"),
            "area": area,
            "bedrooms": bedrooms,
            "bathrooms": bathrooms,
            "property_type": property_type,
            "direction": direction,
            "legal_status": legal_status,
            "description": description,
            "images": images,
            "address": address,
            "posted_date": posted_date,
        }
    
    def _extract_title(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract listing title."""
        # Try JSON-LD first
        scripts = soup.find_all("script", type="application/ld+json")
        for s in scripts:
            try:
                data = json.loads(s.string)
                if isinstance(data, dict) and data.get("name"):
                    return data["name"]
            except:
                continue
        
        # Try h1 tag
        h1 = soup.select_one("h1")
        if h1:
            return h1.get_text(strip=True)
        
        return None
    
    def _extract_price(self, soup: BeautifulSoup) -> Dict[str, Optional[int]]:
        """Extract price information."""
        result = {"price": None, "price_per_m2": None, "price_rent": None}
        text = soup.get_text()
        
        # Pattern 1: "3 tỷ 860" or "3 tỷ 5"
        match = re.search(r"(\d+)\s*t[ỷiệ]\s*(\d+)?", text)
        if match:
            main = float(match.group(1))
            extra = float(match.group(2)) if match.group(2) else 0
            result["price"] = int((main + extra / 1000) * 1_000_000_000)
            return result
        
        # Pattern 2: "3.359 tỷ"
        match = re.search(r"(\d+[\.,]\d+)\s*t[ỷiệ]", text)
        if match:
            price = float(match.group(1).replace(",", "."))
            result["price"] = int(price * 1_000_000_000)
            return result
        
        # Pattern 3: Price per m2: "86 triệu/m²"
        match = re.search(r"(\d+[\.,]?\d*)\s*triệu/m", text)
        if match:
            result["price_per_m2"] = int(float(match.group(1).replace(",", ".")) * 1_000_000)
            return result
        
        # Pattern 4: Rent: "25 triệu/tháng"
        match = re.search(r"(\d+)\s*triệu/tháng", text)
        if match:
            result["price_rent"] = int(float(match.group(1)) * 1_000_000)
            return result
        
        return result
    
    def _extract_address(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract address."""
        # JSON-LD
        scripts = soup.find_all("script", type="application/ld+json")
        for s in scripts:
            try:
                data = json.loads(s.string)
                if isinstance(data, dict):
                    addr = data.get("address")
                    if isinstance(addr, dict):
                        parts = [
                            addr.get("streetAddress"),
                            addr.get("addressLocality"),
                            addr.get("addressRegion")
                        ]
                        return ", ".join(filter(None, parts))
                    elif isinstance(addr, str):
                        return addr
            except:
                continue
        
        # HTML class
        tag = soup.select_one(".re__pr-short__info-value")
        if tag:
            return tag.get_text(strip=True)
        
        return None
    
    def _extract_area(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract area in m²."""
        text = soup.get_text()
        
        # Pattern: "100 m²" or "100m2"
        match = re.search(r"(\d+[\.,]?\d*)\s*m[2²]", text)
        if match:
            return float(match.group(1).replace(",", "."))
        
        return None
    
    def _extract_bedrooms(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract number of bedrooms."""
        text = soup.get_text()
        
        # Pattern: "4 phòng ngủ" or "4PN"
        match = re.search(r"(\d+)\s*phòng\s*ngủ", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        
        match = re.search(r"(\d+)\s*PN", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        
        return None
    
    def _extract_bathrooms(self, soup: BeautifulSoup) -> Optional[int]:
        """Extract number of bathrooms."""
        text = soup.get_text()
        
        # Pattern: "3 phòng tắm" or "3WC"
        match = re.search(r"(\d+)\s*phòng\s*tắm", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        
        match = re.search(r"(\d+)\s*WC", text, re.IGNORECASE)
        if match:
            return int(match.group(1))
        
        return None
    
    def _extract_property_type(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract property type."""
        text = soup.get_text().lower()
        
        if "căn hộ" in text or "apartment" in text:
            return "apartment"
        elif "nhà riêng" in text or "nhà phố" in text:
            return "house"
        elif "đất nền" in text or "dat nen" in text:
            return "land"
        elif "shophouse" in text or "shop house" in text:
            return "shophouse"
        elif "biệt thự" in text or "villa" in text:
            return "villa"
        
        return "house"  # Default
    
    def _extract_direction(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract house direction."""
        text = soup.get_text()
        
        directions = ["đông", "tây", "nam", "bắc", "đông nam", "đông bắc", "tây nam", "tây bắc"]
        for d in directions:
            if d in text.lower():
                return d.title()
        
        return None
    
    def _extract_legal_status(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract legal status."""
        text = soup.get_text().lower()
        
        if "sổ đỏ" in text or "sổ hồng" in text:
            return "Sổ đỏ/Sổ hồng"
        elif "sổ chung" in text:
            return "Sổ chung"
        elif "đang chờ sổ" in text:
            return "Đang chờ sổ"
        elif "hợp đồng mua bán" in text:
            return "Hợp đồng mua bán"
        
        return None
    
    def _extract_description(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract description."""
        # Try common selectors
        selectors = [
            "div[class*='description']",
            "div[class*='body']",
            "div[class*='content']",
            "#description",
            ".re__pr-description"
        ]
        
        for selector in selectors:
            elem = soup.select_one(selector)
            if elem:
                return elem.get_text("\n", strip=True)
        
        return None
    
    def _extract_images(self, soup: BeautifulSoup) -> list:
        """Extract image URLs."""
        images = []
        
        # JSON-LD
        scripts = soup.find_all("script", type="application/ld+json")
        for s in scripts:
            try:
                data = json.loads(s.string)
                if isinstance(data, dict):
                    img = data.get("image")
                    if isinstance(img, list):
                        images.extend(img)
                    elif isinstance(img, str):
                        images.append(img)
            except:
                continue
        
        # HTML img tags
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if src and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                if src not in images:
                    images.append(src)
        
        return images[:10]  # Limit to 10 images
    
    def _extract_source_id(self, url: str) -> Optional[str]:
        """Extract source ID from URL."""
        # Pattern: .../pr123456
        match = re.search(r"/pr(\d+)(?:/|$)", url)
        if match:
            return match.group(1)
        return None
    
    def _extract_posted_date(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract posted date."""
        text = soup.get_text()
        
        # Pattern: "Đăng tin ngày XX/XX/XXXX"
        match = re.search(r"đăng\s*(?:tin\s*)?ngày\s*(\d{1,2}/\d{1,2}/\d{4})", text, re.IGNORECASE)
        if match:
            return match.group(1)
        
        return None
