"""
Data normalization for Vietnamese real estate
"""

from typing import Optional


# Price unit conversions to VND
PRICE_MULTIPLIERS = {
    'vnd': 1,
    'đồng': 1,
    'triệu': 1000000,
    'tr': 1000000,
    'tỷ': 1000000000,
    'ty': 1000000000,
    'trieu': 1000000,
}


# Area unit conversions to m2
AREA_MULTIPLIERS = {
    'm2': 1,
    'm²': 1,
    'm': 1,
    'hecta': 10000,
    'ha': 10000,
    'km2': 1000000,
}


# Property type mappings
PROPERTY_TYPE_MAPPINGS = {
    'căn hộ': 'căn hộ',
    'chung cư': 'căn hộ',
    'apartment': 'căn hộ',
    'nhà phố': 'nhà phố',
    'nhà liền kề': 'nhà phố',
    'townhouse': 'nhà phố',
    'nhà mặt phố': 'nhà mặt phố',
    'shophouse': 'shophouse',
    'biệt thự': 'biệt thự',
    'villa': 'biệt thự',
    'đất nền': 'đất nền',
    'đất': 'đất',
    'land': 'đất',
    'penthouse': 'penthouse',
    'duplex': 'duplex',
    'officetel': 'officetel',
    'studio': 'studio',
    'nhà ngõ': 'nhà ngõ',
    'nhà trong hẻm': 'nhà ngõ',
}


def normalize_price(value, unit='vnd') -> int:
    """Normalize price to VND"""
    if value is None:
        return 0
    
    if isinstance(value, (int, float)):
        multiplier = PRICE_MULTIPLIERS.get(unit.lower(), 1)
        return int(value * multiplier)
    
    return 0


def normalize_area(value, unit='m2') -> float:
    """Normalize area to m2"""
    if value is None:
        return 0.0
    
    if isinstance(value, (int, float)):
        multiplier = AREA_MULTIPLIERS.get(unit.lower(), 1)
        return float(value * multiplier)
    
    return 0.0


def normalize_property_type(prop_type: str) -> str:
    """Normalize property type to standard form"""
    if not prop_type:
        return 'không xác định'
    
    prop_type_lower = prop_type.lower().strip()
    return PROPERTY_TYPE_MAPPINGS.get(prop_type_lower, prop_type_lower)


def normalize_address(address: str) -> dict:
    """Normalize address components"""
    result = {
        'full_address': address.strip() if address else '',
        'street': '',
        'ward': '',
        'district': '',
        'city': 'TP.HCM',
    }
    
    if not address:
        return result
    
    parts = [p.strip() for p in address.split(',')]
    
    for i, part in enumerate(parts):
        part_lower = part.lower().strip()
        
        if part_lower.startswith('p.') or 'phường' in part_lower:
            result['ward'] = part.replace('P.', '').replace('p.', '').replace('Phường', '').replace('phường', '').strip()
        elif part_lower.startswith('q.') or 'quận' in part_lower:
            result['district'] = part.replace('Q.', '').replace('q.', '').replace('Quận', '').replace('quận', '').strip()
        elif 'hồ chí minh' in part_lower or 'hcm' in part_lower or 'tp.hcm' in part_lower:
            result['city'] = 'TP.HCM'
        elif 'hà nội' in part_lower:
            result['city'] = 'Hà Nội'
        elif 'đà nẵng' in part_lower:
            result['city'] = 'Đà Nẵng'
        elif i == len(parts) - 1 and result['ward'] and result['district']:
            result['street'] = part
    
    return result


def normalize_phone(phone: str) -> str:
    """Normalize phone number"""
    if not phone:
        return ''
    
    digits = ''.join(c for c in phone if c.isdigit() or c == '+')
    
    if digits.startswith('84'):
        digits = '0' + digits[2:]
    
    if not digits.startswith('0'):
        digits = '0' + digits
    
    if len(digits) == 10:
        return digits
    
    return phone


def validate_price_range(price: int, area: float) -> tuple[bool, str]:
    """Validate if price/area is reasonable"""
    if area > 0:
        price_per_m2 = price / area
        
        if price_per_m2 < 2000000:
            return False, f"Giá/m² ({price_per_m2:,.0f} VND) quá thấp"
        
        if price_per_m2 > 300000000:
            return False, f"Giá/m² ({price_per_m2:,.0f} VND) quá cao"
    
    return True, ""


def validate_area_range(area: float, prop_type: str) -> tuple[bool, str]:
    """Validate if area is reasonable for property type"""
    if area <= 0:
        return False, "Diện tích phải > 0"
    
    min_areas = {
        'căn hộ': 20,
        'phòng trọ': 15,
        'nhà ngõ': 30,
        'nhà phố': 40,
        'đất': 50,
        'biệt thự': 100,
        'shophouse': 50,
    }
    
    min_area = min_areas.get(prop_type, 20)
    if area < min_area:
        return False, f"Diện tích ({area}m²) quá nhỏ cho loại {prop_type}"
    
    max_area = {
        'căn hộ': 500,
        'phòng trọ': 100,
        'nhà ngõ': 300,
        'nhà phố': 500,
        'đất': 100000,
        'biệt thự': 2000,
    }
    
    max_a = max_area.get(prop_type, 10000)
    if area > max_a:
        return False, f"Diện tích ({area}m²) quá lớn cho loại {prop_type}"
    
    return True, ""


def normalize_data(raw_data: dict) -> dict:
    """Normalize raw real estate data to standard format"""
    normalized = {
        'title': raw_data.get('title', '').strip() if raw_data.get('title') else '',
        'description': raw_data.get('description', '').strip() if raw_data.get('description') else '',
        'property_type': normalize_property_type(raw_data.get('property_type', '')),
        'price': normalize_price(raw_data.get('price'), raw_data.get('price_unit', 'vnd')),
        'price_unit': 'VND',
        'area': normalize_area(raw_data.get('area'), raw_data.get('area_unit', 'm2')),
        'area_unit': 'm2',
        'bedrooms': max(0, int(raw_data.get('bedrooms', 0))),
        'bathrooms': max(0, int(raw_data.get('bathrooms', 0))),
        'floors': max(0, int(raw_data.get('floors', 0))),
        'address': raw_data.get('address', ''),
        'utilities': raw_data.get('utilities', []),
        'images': raw_data.get('images', []),
    }
    
    address_info = normalize_address(normalized['address'])
    normalized.update(address_info)
    
    if normalized['area'] > 0 and normalized['price'] > 0:
        normalized['price_per_m2'] = normalized['price'] / normalized['area']
    else:
        normalized['price_per_m2'] = 0
    
    return normalized
