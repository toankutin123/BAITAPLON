"""
Import data from bds_nlp/data.json into properties table.
"""
import json
import re
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from config import get_connection

def parse_address_to_district_city(address):
    """Parse address to extract district and city."""
    if not address:
        return None, None

    city = None
    district = None

    # City patterns
    city_patterns = [
        (r'hà nội|ha noi|\bhn\b', 'hanoi'),
        (r'tp\.?\s*hcm|tp\s*hcm|hồ chí minh|ho chi minh', 'hcm'),
        (r'đà nẵng|da nang', 'danang'),
        (r'bình dương|binh duong', 'binhduong'),
        (r'đồng nai|dong nai', 'dongnai'),
        (r'long an|longan', 'longan'),
        (r'cần thơ|can tho', 'cantho'),
        (r'hải phòng|hai phong', 'haiphong'),
    ]

    addr_lower = address.lower()
    for pattern, city_name in city_patterns:
        if re.search(pattern, addr_lower):
            city = city_name
            break

    # District patterns - capture multiple words
    district_patterns = [
        r'quận\s+([\w\s]+?),',
        r'huyện\s+([\w\s]+?),',
        r'phường\s+([\w\s]+?),',
        r'quận\s+([\w\s]+?)(?:\s*,|\s*$)',
        r'huyện\s+([\w\s]+?)(?:\s*,|\s*$)',
    ]

    for pattern in district_patterns:
        match = re.search(pattern, addr_lower)
        if match:
            district = match.group(1).strip().title()
            # Fix common OCR errors
            district = district.replace('Quần ', 'Quận ')
            # Remove trailing punctuation
            district = re.sub(r'[,\s]+$', '', district)
            if district and len(district) > 1:
                break

    return district, city


def main():
    data_path = '../bds_nlp/data.json'

    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"Loaded {len(data)} properties from {data_path}")

    conn = get_connection()
    imported = 0
    skipped = 0

    for item in data:
        try:
            price_total = item.get('price_total', 0)
            area = item.get('area', 0)

            if not price_total or price_total <= 0 or not area or area <= 0:
                skipped += 1
                continue

            title = item.get('title', '')[:500]
            address = item.get('address', '')
            district, city = parse_address_to_district_city(address)

            # Extract bedrooms
            bedrooms = item.get('bedroom')
            if bedrooms and not isinstance(bedrooms, int):
                try:
                    bedrooms = int(bedrooms)
                except:
                    bedrooms = None

            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO properties (
                        user_id, title, property_type, price, area, address,
                        district, city, bedrooms, status, verified
                    ) VALUES (1, %s, 'apartment', %s, %s, %s, %s, %s, %s, 'approved', true)
                    RETURNING id
                """, (
                    title,
                    int(price_total),
                    float(area),
                    address,
                    district,
                    city,
                    bedrooms
                ))
                result = cursor.fetchone()
                conn.commit()

                if result:
                    imported += 1
                    print(f"[{imported}] Imported: {title[:50]}... | district={district}, city={city}")

        except Exception as e:
            print(f"[SKIP] Error: {e}")
            skipped += 1
            continue

    conn.close()
    print(f"\nDone: {imported} imported, {skipped} skipped")


if __name__ == '__main__':
    main()