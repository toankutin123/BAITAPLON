"""
Entity extraction for Vietnamese real estate data
"""

import re
from typing import Optional


# Property types
PROPERTY_TYPES = {
    'nhà phố': 'nhà phố',
    'nhà mặt phố': 'nhà mặt phố',
    'nhà ngõ': 'nhà ngõ',
    'căn hộ': 'căn hộ',
    'chung cư': 'chung cư',
    'biệt thự': 'biệt thự',
    'đất nền': 'đất nền',
    'đất': 'đất',
    'shophouse': 'shophouse',
    'officetel': 'officetel',
    'penthouse': 'penthouse',
    'duplex': 'duplex',
    'studio': 'studio',
    'townhouse': 'townhouse',
    'villa': 'biệt thự',
}


def extract_property_type(text: str) -> Optional[str]:
    """Extract property type from text"""
    text = text.lower()
    for pattern, prop_type in PROPERTY_TYPES.items():
        if pattern in text:
            return prop_type
    return None


def extract_area(text: str) -> Optional[float]:
    """Extract area in m2 from text"""
    patterns = [
        r'(\d+[\d.,]*)\s*m2',
        r'(\d+[\d.,]*)\s*m²',
        r'diện tích[:\s]*(\d+[\d.,]*)',
        r'([\d.,]+)\s*hecta',
        r'([\d.,]+)\s*ha',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            area_str = match.group(1).replace(',', '.')
            area = float(area_str)
            if 'hecta' in pattern or 'ha' in pattern.lower():
                area *= 10000
            return area
    return None


def extract_price(text: str) -> Optional[int]:
    """Extract price in VND from text"""
    text = text.lower()
    
    patterns = [
        (r'(\d+[\d.,]*)\s*tỷ', 1000000000),
        (r'(\d+[\d.,]*)\s*ty', 1000000000),
        (r'(\d+[\d.,]*)\s*triệu', 1000000),
        (r'(\d+[\d.,]*)\s*tr', 1000000),
        (r'(\d+)000000000', 1000000000),
        (r'(\d+)000000', 1000000),
    ]
    
    for pattern, multiplier in patterns:
        match = re.search(pattern, text)
        if match:
            price_str = match.group(1).replace(',', '.')
            if '.' in price_str and multiplier == 1000000000:
                parts = price_str.split('.')
                integer = int(parts[0]) * 1000000000
                decimal = int(parts[1].ljust(9, '0')[:9])
                return integer + decimal
            elif '.' in price_str and multiplier == 1000000:
                parts = price_str.split('.')
                integer = int(parts[0]) * 1000000
                decimal = int(parts[1].ljust(6, '0')[:6])
                return integer + decimal
            else:
                return int(float(price_str) * multiplier)
    return None


def extract_price_per_m2(text: str) -> Optional[int]:
    """Extract price per m2 in VND"""
    patterns = [
        r'(\d+[\d.,]*)\s*triệu/m2',
        r'(\d+[\d.,]*)\s*tr/m2',
        r'(\d+[\d.,]*)\s*triệu/m²',
        r'(\d+[\d.,]*)\s*tr/m²',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            price_str = match.group(1).replace(',', '.')
            return int(float(price_str) * 1000000)
    return None


def extract_bedrooms(text: str) -> Optional[int]:
    """Extract number of bedrooms"""
    patterns = [
        r'(\d+)\s*pn',
        r'(\d+)\s*phòng ngủ',
        r'(\d+)\s*phòng\s*ngủ',
        r'(\d+)\s*bedroom',
        r'(\d+)\s*bed',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return None


def extract_bathrooms(text: str) -> Optional[int]:
    """Extract number of bathrooms"""
    patterns = [
        r'(\d+)\s*pt',
        r'(\d+)\s*phòng vệ sinh',
        r'(\d+)\s*phòng\s*tắm',
        r'(\d+)\s*toilet',
        r'(\d+)\s*bathroom',
        r'(\d+)\s*bath',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return None


def extract_floors(text: str) -> Optional[int]:
    """Extract number of floors"""
    patterns = [
        r'(\d+)\s*tầng',
        r'(\d+)\s*tang',
        r'(\d+)\s*floor',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))
    return None


def extract_address_parts(text: str) -> dict:
    """Extract address components"""
    result = {
        'street': None,
        'ward': None,
        'district': None,
        'city': None,
    }
    
    ward_patterns = [
        r'phường\s+([\w\s]+?)(?:,|\n|$)',
        r'p\.\s*([\w\s]+?)(?:,|\n|$)',
        r'ward\s+([\w\s]+?)(?:,|\n|$)',
    ]
    for pattern in ward_patterns:
        match = re.search(pattern, text.lower())
        if match:
            result['ward'] = match.group(1).strip()
            break
    
    district_patterns = [
        r'quận\s+([\w\s]+?)(?:,|\n|$)',
        r'q\.\s*([\w\s]+?)(?:,|\n|$)',
        r'district\s+([\w\s]+?)(?:,|\n|$)',
    ]
    for pattern in district_patterns:
        match = re.search(pattern, text.lower())
        if match:
            result['district'] = match.group(1).strip()
            break
    
    city_patterns = [
        r'(tp\.?\s*)?hồ\s*chí\s*minh',
        r'(tp\.?\s*)?hcm',
        r'hà\s*nội',
        r'đà\s*nẵng',
        r'tp\.\s*([\w\s]+?)(?:,|\n|$)',
    ]
    for pattern in city_patterns:
        match = re.search(pattern, text.lower())
        if match:
            result['city'] = 'TP.HCM'
            break
    
    return result


def extract_utilities(text: str) -> list[str]:
    """Extract utilities/amenities"""
    utilities = []
    utility_keywords = {
        'điều hòa': 'điều hòa',
        'máy lạnh': 'điều hòa',
        'điều hòa nhiệt độ': 'điều hòa',
        'nóng lạnh': 'nóng lạnh',
        'bình nóng lạnh': 'nóng lạnh',
        'wifi': 'wifi',
        'internet': 'wifi',
        'chỗ để xe': 'parking',
        'bãi đỗ xe': 'parking',
        'parking': 'parking',
        'thang máy': 'thang máy',
        'elevator': 'thang máy',
        'hồ bơi': 'hồ bơi',
        'pool': 'hồ bơi',
        'gym': 'phòng gym',
        'phòng gym': 'phòng gym',
        'fitness': 'phòng gym',
        'siêu thị': 'siêu thị',
        'trường học': 'trường học',
        'bệnh viện': 'bệnh viện',
        'hospital': 'bệnh viện',
        'an ninh': 'an ninh',
        'bảo vệ': 'an ninh',
        'security': 'an ninh',
        'camera': 'camera',
        'cctv': 'camera',
    }
    
    text_lower = text.lower()
    for keyword, utility in utility_keywords.items():
        if keyword in text_lower and utility not in utilities:
            utilities.append(utility)
    
    return utilities


def extract_all(text: str) -> dict:
    """Extract all entities from text"""
    return {
        'property_type': extract_property_type(text),
        'area': extract_area(text),
        'price': extract_price(text),
        'price_per_m2': extract_price_per_m2(text),
        'bedrooms': extract_bedrooms(text),
        'bathrooms': extract_bathrooms(text),
        'floors': extract_floors(text),
        'address': extract_address_parts(text),
        'utilities': extract_utilities(text),
    }
