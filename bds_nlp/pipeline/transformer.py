from typing import Dict, Any, Optional, Tuple
import re
from datetime import datetime


class DataTransformer:
    """Transform and normalize extracted data."""
    
    # Location mapping for Vietnamese addresses
    LOCATION_KEYWORDS = {
        "TP. HỒ CHÍ MINH": ["hồ chí minh", "tp hcm", "ho chi minh", "hcm"],
        "HÀ NỘI": ["hà nội", "ha noi", "hn"],
        "ĐÀ NẴNG": ["đà nẵng", "da nang", "dn"],
        "BÌNH DƯƠNG": ["bình dương", "binh duong"],
        "ĐỒNG NAI": ["đồng nai", "dong nai"],
        "BÀ RỊA VŨNG TÀU": ["bà rịa", "vũng tàu", "vung tau"],
    }
    
    DISTRICT_KEYWORDS = {
        "QUẬN 1": ["quận 1", "q1", "1 district"],
        "QUẬN 2": ["quận 2", "q2"],
        "QUẬN 3": ["quận 3", "q3"],
        "QUẬN BÌNH THẠCH": ["quận bình thạch", "bình thạch", "binh thach"],
        "QUẬN TÂN BÌNH": ["quận tân bình", "tân bình", "tan binh"],
        "QUẬN PHÚ NHUẬN": ["quận phú nhuận", "phú nhuận", "phu nhuan"],
        "QUẬN GÒ VẤP": ["quận gò vấp", "gò vấp", "go vap"],
    }
    
    def transform(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform raw data to normalized format."""
        result = raw_data.copy()
        
        # Normalize price
        result["price"] = self._normalize_price(result.get("price"))
        result["price_per_m2"] = self._normalize_price(result.get("price_per_m2"))
        result["price_rent"] = self._normalize_price(result.get("price_rent"))
        
        # Calculate derived fields
        if result.get("price") and result.get("area") and result["area"] > 0:
            result["price_per_m2"] = int(result["price"] / result["area"])
        
        # Normalize address and extract location
        address = result.get("address", "")
        location = self._extract_location(address)
        result.update(location)
        
        # Normalize area
        result["area"] = self._normalize_number(result.get("area"))
        
        # Normalize strings
        result["title"] = self._normalize_string(result.get("title"))
        result["description"] = self._normalize_string(result.get("description"))
        result["property_type"] = self._normalize_string(result.get("property_type"))
        result["direction"] = self._normalize_string(result.get("direction"))
        result["legal_status"] = self._normalize_string(result.get("legal_status"))
        
        # Parse posted date
        if result.get("posted_date"):
            result["posted_date"] = self._parse_date(result["posted_date"])
        
        # Add metadata
        result["normalized_at"] = datetime.utcnow().isoformat()
        
        return result
    
    def _normalize_price(self, price: Any) -> Optional[int]:
        """Normalize price to VND (integer)."""
        if price is None:
            return None
        
        if isinstance(price, (int, float)):
            return int(price)
        
        if isinstance(price, str):
            price = price.strip().lower()
            
            # Remove currency symbols
            price = re.sub(r"[đồng|vnđ|vn]$", "", price)
            price = re.sub(r"[.,]", "", price)
            
            # Handle "tỷ" (billion)
            if "tỷ" in price or "ty" in price or "tỷệ" in price:
                match = re.search(r"(\d+[\.,]?\d*)", price)
                if match:
                    return int(float(match.group(1).replace(",", ".")) * 1_000_000_000)
            
            # Handle "triệu" (million)
            if "triệu" in price or "trieu" in price:
                match = re.search(r"(\d+[\.,]?\d*)", price)
                if match:
                    return int(float(match.group(1).replace(",", ".")) * 1_000_000)
            
            # Handle "nghìn" (thousand)
            if "nghìn" in price or "nghin" in price:
                match = re.search(r"(\d+[\.,]?\d*)", price)
                if match:
                    return int(float(match.group(1).replace(",", ".")) * 1_000)
        
        return None
    
    def _normalize_number(self, value: Any) -> Optional[float]:
        """Normalize number."""
        if value is None:
            return None
        
        if isinstance((int, float)):
            return float(value)
        
        if isinstance(value, str):
            value = re.sub(r"[m²|m2| m]", "", value)
            value = re.sub(r"[.,]", ".", value)
            try:
                return float(value.strip())
            except:
                return None
        
        return None
    
    def _normalize_string(self, value: Optional[str]) -> Optional[str]:
        """Normalize string."""
        if value is None:
            return None
        
        return " ".join(value.split()).strip()
    
    def _extract_location(self, address: str) -> Dict[str, Optional[str]]:
        """Extract city, district, ward from address."""
        result = {
            "city": None,
            "city_normalized": None,
            "district": None,
            "district_normalized": None,
            "ward": None,
            "ward_normalized": None,
            "full_address": address
        }
        
        if not address:
            return result
        
        address_lower = address.lower()
        
        # Detect city
        for city, keywords in self.LOCATION_KEYWORDS.items():
            for keyword in keywords:
                if keyword in address_lower:
                    result["city"] = city
                    result["city_normalized"] = self._normalize_string(city)
                    break
            if result["city"]:
                break
        
        # Detect district
        for district, keywords in self.DISTRICT_KEYWORDS.items():
            for keyword in keywords:
                if keyword in address_lower:
                    result["district"] = district
                    result["district_normalized"] = self._normalize_string(district)
                    break
            if result["district"]:
                break
        
        # Extract ward (pattern: "phường X" or "P.X")
        ward_match = re.search(r"(phường|p\.\s*)(\w+)", address_lower)
        if ward_match:
            result["ward"] = f"Phường {ward_match.group(2).title()}"
            result["ward_normalized"] = ward_match.group(2).lower()
        
        return result
    
    def _parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string to YYYY-MM-DD format."""
        if not date_str:
            return None
        
        # Try DD/MM/YYYY
        match = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", date_str)
        if match:
            day, month, year = match.groups()
            return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
        
        # Try YYYY-MM-DD
        match = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", date_str)
        if match:
            return date_str[:10]
        
        return None
    
    def detect_duplicates(self, new_data: Dict[str, Any], existing_data: list) -> list:
        """Detect potential duplicate listings."""
        duplicates = []
        
        for existing in existing_data:
            score = self._calculate_similarity(new_data, existing)
            if score > 0.8:  # 80% similarity threshold
                duplicates.append({
                    "existing_id": existing.get("id"),
                    "similarity": score,
                    "existing_url": existing.get("url")
                })
        
        return duplicates
    
    def _calculate_similarity(self, data1: Dict[str, Any], data2: Dict[str, Any]) -> float:
        """Calculate similarity score between two listings."""
        score = 0.0
        factors = 0
        
        # Title similarity
        if data1.get("title") and data2.get("title"):
            factors += 1
            score += self._string_similarity(
                data1["title"].lower(), 
                data2["title"].lower()
            )
        
        # Price similarity
        if data1.get("price") and data2.get("price"):
            factors += 1
            if data1["price"] == data2["price"]:
                score += 1.0
            elif max(data1["price"], data2["price"]) > 0:
                ratio = min(data1["price"], data2["price"]) / max(data1["price"], data2["price"])
                score += ratio
        
        # Address similarity
        if data1.get("address") and data2.get("address"):
            factors += 1
            score += self._string_similarity(
                data1["address"].lower(),
                data2["address"].lower()
            )
        
        # Area similarity
        if data1.get("area") and data2.get("area"):
            factors += 1
            if abs(data1["area"] - data2["area"]) < 5:  # Within 5m²
                score += 1.0
        
        return score / factors if factors > 0 else 0.0
    
    def _string_similarity(self, s1: str, s2: str) -> float:
        """Simple string similarity using common characters."""
        if not s1 or not s2:
            return 0.0
        
        # Use Jaccard similarity on character n-grams
        def get_ngrams(s, n=2):
            return set(s[i:i+n] for i in range(len(s) - n + 1))
        
        ngrams1 = get_ngrams(s1)
        ngrams2 = get_ngrams(s2)
        
        if not ngrams1 or not ngrams2:
            return 0.0
        
        intersection = len(ngrams1 & ngrams2)
        union = len(ngrams1 | ngrams2)
        
        return intersection / union if union > 0 else 0.0
