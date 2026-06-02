import os
import sys
import io
import json
from typing import Any, Dict, List

# Fix UTF-8 output encoding for Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from config import CLAUDE_API_KEY, CLAUDE_API_URL


def _median(values: List[float]) -> float:
    """Calculate median of a list"""
    if not values:
        return 0
    sorted_values = sorted(values)
    n = len(sorted_values)
    if n % 2 == 0:
        return sum(sorted_values[n//2-1:n//2+1]) / 2
    else:
        mid = (n + 1) // 2
        return sorted_values[mid - 1]


def _get_city_average_price(city: str) -> float:
    """
    Get average price per m2 for a city from average.json.
    Returns price in VND (not millions).
    """
    prices = _get_all_city_prices(city)
    return _median(prices) if prices else None


def _get_all_city_prices(city: str) -> List[float]:
    """
    Get ALL district prices per m2 for a city from average.json.
    Returns list of prices in VND (not millions).
    """
    import json
    from pathlib import Path

    if not city:
        return []

    try:
        data_path = Path(__file__).resolve().parent.parent / "bds_tool" / "average.json"
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = data.get("result", [])

            city_prices = []
            for record in records:
                if record.get("province", "").lower() == city.lower():
                    price = record.get("avg_price_per_m2", 0)
                    if price > 0:
                        city_prices.append(price * 1_000_000)  # Convert triệu to VND

            return city_prices
    except Exception as e:
        print(f"[AI] Could not load average.json: {e}")

    return []


def _get_district_price(city: str, district: str) -> float:
    """
    Get price for a specific district from average.json.
    Returns price in VND or None if not found.
    """
    import json
    from pathlib import Path

    if not city or not district:
        return None

    try:
        data_path = Path(__file__).resolve().parent.parent / "bds_tool" / "average.json"
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            records = data.get("result", [])

            district_lower = district.lower().replace('quận ', '').replace('quận', '').strip()
            province_lower = city.lower()

            for record in records:
                if record.get("province", "").lower() == province_lower:
                    zone = record.get("zone", "").lower().replace('quận ', '').replace('quận', '').strip()
                    if zone == district_lower or district_lower in zone:
                        price = record.get("avg_price_per_m2", 0)
                        if price > 0:
                            return price * 1_000_000
    except Exception as e:
        print(f"[AI] Could not load average.json: {e}")

    return None


def build_ai_prompt(records: List[Dict[str, float]]) -> str:
    lines = [
        "Dưới đây là dữ liệu giá thị trường bất động sản theo tỉnh/thành và khu vực:",
        "",
    ]
    for item in records:
        lines.append(f"- {item.get('province', '').title()} / {item.get('zone', '')}: {item.get('avg_price_per_m2', 0)} triệu/m²")

    lines.extend([
        "",
        "Hãy suy đoán và tóm tắt những thông tin sau:",
        "1. Xu hướng giá theo từng tỉnh/thành.",
        "2. Khu vực nào đang có giá cao nhất và thấp nhất.",
        "3. Cơ hội đầu tư và cảnh báo thị trường.",
        "4. Kết luận ngắn gọn, dễ đọc.",
        "",
        "Trả lời theo format văn bản tiếng Việt.",
    ])

    return "\n".join(lines)


def generate_fallback_insights(records: List[Dict[str, float]]) -> str:
    """Tạo insights tự động từ dữ liệu khi Claude API không khả dụng."""
    if not records:
        return "Không có dữ liệu thị trường để phân tích."

    prices = [r.get("avg_price_per_m2", 0) for r in records]
    avg_price = sum(prices) / len(prices) if prices else 0
    max_price = max(prices) if prices else 0
    min_price = min(prices) if prices else 0

    max_record = next((r for r in records if r.get("avg_price_per_m2") == max_price), None)
    min_record = next((r for r in records if r.get("avg_price_per_m2") == min_price), None)

    provinces = {}
    for record in records:
        province = record.get("province", "")
        if province not in provinces:
            provinces[province] = []
        provinces[province].append(record.get("avg_price_per_m2", 0))

    province_avgs = []
    for province, province_prices in provinces.items():
        avg = sum(province_prices) / len(province_prices) if province_prices else 0
        province_avgs.append((province, avg))

    province_avgs.sort(key=lambda x: x[1], reverse=True)

    # City name mapping for display
    city_names = {
        'hanoi': 'Hà Nội', 'hcm': 'TP.HCM', 'danang': 'Đà Nẵng',
        'binhduong': 'Bình Dương', 'dongnai': 'Đồng Nai', 'cantho': 'Cần Thơ'
    }

    lines = [
        "📊 Phân tích thị trường BĐS:",
        f"- Giá trung bình: {avg_price:.1f} triệu/m²",
        f"- Giá cao nhất: {max_price:.1f} triệu/m² ({max_record.get('zone', '')}, {city_names.get(max_record.get('province', ''), max_record.get('province', ''))})",
        f"- Giá thấp nhất: {min_price:.1f} triệu/m² ({min_record.get('zone', '')}, {city_names.get(min_record.get('province', ''), min_record.get('province', ''))})",
        "",
        "📈 Xu hướng theo khu vực:",
    ]

    for province, avg in province_avgs[:5]:
        city_display = city_names.get(province, province.upper())
        trend = "↑" if avg > avg_price else "↓"
        lines.append(f"  {trend} {city_display}: {avg:.1f} triệu/m²")

    # Find best and worst districts
    all_zones = [(r.get('zone', ''), r.get('province', ''), r.get('avg_price_per_m2', 0)) for r in records]
    all_zones.sort(key=lambda x: x[2], reverse=True)

    if len(all_zones) >= 3:
        lines.append("")
        lines.append("🏆 Top khu vực đắt nhất:")
        for i, (zone, province, price) in enumerate(all_zones[:3], 1):
            city_display = city_names.get(province, province.upper())
            lines.append(f"  {i}. {zone}, {city_display}: {price:.1f} triệu/m²")

        lines.append("")
        lines.append("📉 Top khu vực rẻ nhất:")
        for i, (zone, province, price) in enumerate(reversed(all_zones[-3:]), 1):
            city_display = city_names.get(province, province.upper())
            lines.append(f"  {i}. {zone}, {city_display}: {price:.1f} triệu/m²")

    lines.extend([
        "",
        "💡 Nhận định:",
        f"- Thị trường {'tăng' if avg_price > 80 else 'ổn định'} nhìn chung",
        f"- Có {len(records)} khu vực dữ liệu để so sánh"
    ])

    return "\n".join(lines)


def generate_ai_insights(records: List[Dict[str, Any]]) -> str:
    """Generate AI insights from market data records"""
    return analyze_market_trends(records)


def analyze_market_trends(records: List[Dict[str, float]]) -> str:
    """Gọi Claude API để phân tích xu hướng thị trường"""
    if not CLAUDE_API_KEY:
        return generate_fallback_insights(records)

    try:
        prompt = build_ai_prompt(records)
        response = call_claude(prompt)
        return response if response else generate_fallback_insights(records)
    except Exception as e:
        print(f"[AI] Claude API error: {e}")
        return generate_fallback_insights(records)


def call_claude(prompt: str) -> str:
    """Gọi Claude API qua OpenRouter"""
    from config import OPENROUTER_API_KEY, OPENROUTER_API_URL
    if not OPENROUTER_API_KEY:
        return None

    try:
        import requests
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "anthropic/claude-3-haiku",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 600,
        }
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            data = response.json()
            # OpenRouter format: choices[0].message.content
            return data.get("choices", [{}])[0].get("message", {}).get("content", "")
        else:
            print(f"[AI] API error {response.status_code}: {response.text[:200]}")
    except Exception as e:
        print(f"[AI] Claude API call failed: {e}")
    return None


def _build_prediction_prompt(location: str, property_type: str, area: float, scraped_properties: list, db_prices_per_m2: list) -> str:
    """Build a rich AI prompt from scraped property data for price prediction."""
    lines = [
        "BẠN LÀ CHUYÊN GIA TƯ VẤN BẤT ĐỘNG SẢN VIỆT NAM.",
        "",
        f"YÊU CẦU: Dự đoán giá bất động sản theo thông tin thực tế.",
        "",
        f"Thông tin yêu cầu:",
        f"- Loại BĐS: {property_type}",
        f"- Khu vực: {location}",
        f"- Diện tích: {area} m²",
        "",
    ]

    # Add database data if available
    if db_prices_per_m2:
        lines.append("DỮ LIỆU TỪ DATABASE HỆ THỐNG:")
        lines.append(f"(Có {len(db_prices_per_m2)} bất động sản trong khu vực)")
        for i, p in enumerate(db_prices_per_m2[:10], 1):
            lines.append(f"  {i}. Giá/m²: {p/1e6:.1f} triệu/m²")
        lines.append("")

    # Add scraped web data if available
    if scraped_properties:
        lines.append("DỮ LIỆU TÌM KIẾM THỰC TẾ TỪ INTERNET:")
        lines.append(f"(Tìm thấy {len(scraped_properties)} bất động sản tương tự)")
        lines.append("")
        for i, prop in enumerate(scraped_properties[:8], 1):
            lines.append(f"{i}. {prop.get('title', 'N/A')}")
            if prop.get('price'):
                if prop['price'] >= 1e9:
                    lines.append(f"   Giá: {prop['price']/1e9:.2f} tỷ VNĐ")
                else:
                    lines.append(f"   Giá: {prop['price']/1e6:.0f} triệu VNĐ")
            if prop.get('area'):
                lines.append(f"   Diện tích: {prop['area']:.0f} m²")
            if prop.get('price_per_m2'):
                lines.append(f"   Giá/m²: {prop['price_per_m2']/1e6:.1f} triệu/m²")
            lines.append("")

    lines.extend([
        "NHIỆM VỤ:",
        "1. Phân tích dữ liệu trên",
        "2. Đưa ra dự đoán giá CHÍNH XÁC nhất cho bất động sản trên",
        "3. Xem xét các yếu tố: vị trí, loại BĐS, diện tích, giá thị trường",
        "",
        "TRẢ LỜI THEO FORMAT SAU (tiếng Việt):",
        "GIÁ DỰ ĐOÁN: [X] tỷ VNĐ",
        "GIÁ/M² THỊ TRƯỜNG: [Y] triệu/m²",
        "ĐỘ TIN CẬY: [Z]%",
        "PHÂN TÍCH NGẮN: [2-3 câu giải thích]",
    ])

    return "\n".join(lines)


def predict_property_price(location: str, property_type: str, area: float, bedrooms: int, bathrooms: int, year_built: int = None, features: list[str] = []) -> dict:
    """
    Dự đoán giá bất động sản: truy vấn database + web scraping + AI analysis.
    """
    from config import get_connection

    MIN_PRICE_PER_M2 = 2_000_000
    MAX_PRICE_PER_M2 = 300_000_000
    SAFE_BASE_PRICE_PER_M2 = 45_000_000

    print(f"[AI] Dự đoán giá: {property_type} tại {location}")

    # Parse location
    location_parts = [p.strip() for p in location.split(',')]

    # Known major cities (single-word or common formats)
    major_cities = ['hà nội', 'hanoi', 'tp.hcm', 'tphcm', 'hồ chí minh', 'ho chi minh', 'hcm',
                    'đà nẵng', 'da nang', 'danang', 'hải phòng', 'hai phong', 'haiphong',
                    'cần thơ', 'can tho', 'cantho', 'bình dương', 'binh duong', 'binhduong',
                    'đồng nai', 'dong nai', 'dongnai', 'long an', 'longan']

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
            search_district = ''
            search_city = location_parts[0].lower()
        else:
            search_district = location_parts[0].lower()
            search_city = ''
    else:
        search_district = location_parts[0].lower()
        search_city = location_parts[-1].lower()

    # Clean district/city
    clean_district = search_district.replace('quận', '').replace('huyện', '').replace('phường', '').strip()
    clean_city = search_city.replace('tp.', '').replace('thành phố', '').strip()

    # Normalize city names for database matching
    city_normalize = {
        'hànội': 'hanoi', 'hà nội': 'hanoi', 'ha noi': 'hanoi', 'hn': 'hanoi',
        'tphcm': 'hcm', 'tp hcm': 'hcm', 'tp.hcm': 'hcm', 'hồ chí minh': 'hcm', 'ho chi minh': 'hcm',
        'đànẵng': 'danang', 'đà nẵng': 'danang', 'da nang': 'danang',
        'bìnhdương': 'binhduong', 'bình dương': 'binhduong', 'binh duong': 'binhduong',
        'đồngnai': 'dongnai', 'đồng nai': 'dongnai', 'dong nai': 'dongnai',
        'longan': 'longan', 'long an': 'longan',
        'cầnthơ': 'cantho', 'cần thơ': 'cantho', 'can tho': 'cantho',
        'hảiphòng': 'haiphong', 'hải phòng': 'haiphong', 'hai phong': 'haiphong',
    }
    clean_city_key = clean_city.lower().replace(' ', '')
    if clean_city_key in city_normalize:
        clean_city = city_normalize[clean_city_key]

    all_prices_per_m2 = []
    scraped_properties = []
    scrape_source_count = 0

    # 1. Try web scraping FIRST
    try:
        from services.web_scraper import search_and_extract_price_per_m2
        print(f"[AI] Bắt đầu scrape web cho: {property_type} tại {location}")
        scraper_props, scraper_median = search_and_extract_price_per_m2(location, property_type, limit=10)
        print(f"[AI] Scrape xong - tìm thấy {len(scraper_props)} properties, median: {scraper_median/1e6:.1f}tr/m²")
        if scraper_props:
            scraped_properties = scraper_props
            for prop in scraper_props:
                if prop.get('price') and prop.get('area'):
                    price_per_m2 = prop['price'] / prop['area']
                    if MIN_PRICE_PER_M2 <= price_per_m2 <= MAX_PRICE_PER_M2:
                        all_prices_per_m2.append(price_per_m2)
            scrape_source_count = len(all_prices_per_m2)
            print(f"[AI] Sau scrape: có {scrape_source_count} prices hợp lệ")
    except Exception as e:
        print(f"[AI ERROR] Web scraping failed: {e}")

    source_count = len(all_prices_per_m2)

    # 2. Fallback to average.json if scrape has no/too few data
    if source_count < 3:
        print(f"[AI] Dữ liệu scrape không đủ ({source_count}), thử average.json...")
        if clean_district:
            # Try district-level price first
            district_price = _get_district_price(clean_city, clean_district)
            if district_price:
                all_prices_per_m2.append(district_price)
                print(f"[AI] Thêm giá district từ average.json cho {clean_district}: {district_price/1e6:.1f} triệu/m²")
        if clean_city:
            # Add ALL district prices from the city for better statistical coverage
            city_prices = _get_all_city_prices(clean_city)
            for city_price in city_prices:
                all_prices_per_m2.append(city_price)
            if city_prices:
                print(f"[AI] Thêm {len(city_prices)} giá từ average.json cho {clean_city}")

    # 3. Fallback to database LAST (test DB có thể có dữ liệu không chính xác)
    if source_count < 3:
        print(f"[AI] Dữ liệu vẫn không đủ ({source_count}), thử truy vấn database...")
        db_source_count = 0
        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                query = """
                    SELECT price, area, address, district, city, property_type
                    FROM properties
                    WHERE status = 'approved' AND price > 0 AND area > 0
                """
                params = []

                if clean_city:
                    query += " AND (LOWER(city) LIKE %s OR LOWER(city) LIKE %s)"
                    params.append(f'%{clean_city}%')
                    params.append(f'%{clean_city.replace(" ", "")}%')

                if clean_district:
                    query += " AND (LOWER(district) LIKE %s OR LOWER(district) LIKE %s OR LOWER(address) LIKE %s)"
                    params.append(f'%{clean_district}%')
                    params.append(f'%{clean_district.replace(" ", "")}%')
                    params.append(f'%{clean_district}%')

                if property_type:
                    query += " AND LOWER(property_type) = %s"
                    params.append(property_type.lower())

                query += " LIMIT 100"

                cursor.execute(query, tuple(params))
                rows = cursor.fetchall()

                print(f"[AI] Tìm thấy {len(rows)} properties trong database")

                for row in rows:
                    price = float(row['price'])
                    item_area = float(row['area'])
                    address = row['address'] or ''

                    if not price or price <= 0 or not item_area or item_area <= 0:
                        continue

                    price_per_m2 = price / item_area
                    if price_per_m2 < MIN_PRICE_PER_M2 or price_per_m2 > MAX_PRICE_PER_M2:
                        continue

                    all_prices_per_m2.append(price_per_m2)
                    db_source_count += 1
                    print(f"[DB] {address[:50]}... price/m2={price_per_m2/1e6:.1f}tr")

            conn.close()

            if db_source_count > 0:
                print(f"[AI] Có {db_source_count} properties hợp lệ từ database")

            # City-level fallback if needed
            if len(all_prices_per_m2) < 3 and clean_city:
                print(f"[AI] Dữ liệu district ít, thử tìm city-level...")
                try:
                    conn2 = get_connection()
                    with conn2.cursor() as cursor:
                        query_city = """
                            SELECT price, area, address, district, city, property_type
                            FROM properties
                            WHERE status = 'approved' AND price > 0 AND area > 0
                            AND (LOWER(city) LIKE %s OR LOWER(city) LIKE %s)
                            LIMIT 100
                        """
                        cursor.execute(query_city, (f'%{clean_city}%', f'%{clean_city.replace(" ", "")}%'))
                        city_rows = cursor.fetchall()

                        for row in city_rows:
                            price = float(row['price'])
                            item_area = float(row['area'])
                            address = row['address'] or ''

                            if not price or price <= 0 or not item_area or item_area <= 0:
                                continue

                            price_per_m2 = price / item_area
                            if price_per_m2 < MIN_PRICE_PER_M2 or price_per_m2 > MAX_PRICE_PER_M2:
                                continue

                            all_prices_per_m2.append(price_per_m2)
                            db_source_count += 1
                            print(f"[DB-CITY] {address[:50]}... price/m2={price_per_m2/1e6:.1f}tr")

                        print(f"[AI] City-level: thêm {len(city_rows)} properties")
                    conn2.close()
                except Exception as e:
                    print(f"[AI ERROR] City-level query failed: {e}")
        except Exception as e:
            print(f"[AI ERROR] Truy vấn database thất bại: {e}")

    # Re-check source count after all fallbacks
    source_count = len(all_prices_per_m2)
    print(f"[AI] Tổng cộng: {source_count} prices hợp lệ sau tất cả các nguồn")

    # AI-powered prediction if we have data and API key
    predicted_price = None
    ai_analysis = None

    if source_count > 0 and CLAUDE_API_KEY:
        try:
            prompt = _build_prediction_prompt(location, property_type, area, scraped_properties, all_prices_per_m2)
            ai_response = call_claude(prompt)
            if ai_response:
                # Parse AI response
                parsed_price = parse_ai_price(ai_response)
                parsed_confidence = parse_ai_confidence(ai_response) or min(0.95, 0.3 + source_count / 100)

                if parsed_price and parsed_price > 0:
                    predicted_price = parsed_price
                    ai_analysis = ai_response
                    print(f"[AI] AI predicted: {predicted_price/1e9:.2f} tỷ VNĐ")
        except Exception as e:
            print(f"[AI ERROR] AI prediction failed: {e}")

    # Fallback to median calculation if AI didn't work
    if predicted_price is None:
        used_fallback_data = False
        if source_count == 0:
            # Try district-level price first, then city-level
            if clean_district:
                district_price = _get_district_price(clean_city, clean_district)
                if district_price:
                    median_price_per_m2 = district_price
                    print(f"[AI] Sử dụng giá district từ average.json: {district_price/1e6:.1f} triệu/m² cho {clean_district}")
                    used_fallback_data = True
            if not used_fallback_data and clean_city:
                city_prices = _get_all_city_prices(clean_city)
                if city_prices:
                    median_price_per_m2 = _median(city_prices)
                    print(f"[AI] Sử dụng giá TB từ average.json: {median_price_per_m2/1e6:.1f} triệu/m² cho {clean_city}")
                    used_fallback_data = True
            if not used_fallback_data:
                median_price_per_m2 = SAFE_BASE_PRICE_PER_M2
                print("[AI] Không có dữ liệu, sử dụng giá mặc định an toàn")
        else:
            median_price_per_m2 = _median(all_prices_per_m2)
            print(f"[AI] Median price/m2: {median_price_per_m2/1e6:.1f} triệu/m² từ {source_count} samples")

        predicted_price = median_price_per_m2 * area

    # Confidence dựa trên số samples
    confidence = min(0.95, 0.3 + source_count / 100) if source_count > 0 else 0.3

    # Insights
    insights = []
    if source_count > 0:
        insights.append(f"Tìm thấy {source_count} bất động sản tại '{location}'.")
        insights.append(f"Giá thị trường: {_median(all_prices_per_m2)/1000000:.1f} triệu/m²")
        insights.append(f"Dự đoán cho {area}m²: {predicted_price/1000000000:.2f} tỷ VNĐ")
    else:
        # Check district price first for better messaging
        district_price = _get_district_price(clean_city, clean_district) if clean_district else None
        city_price = _get_city_average_price(clean_city) if clean_city else None

        if district_price:
            insights.append(f"Không tìm thấy dữ liệu local tại '{location}'.")
            insights.append(f"Sử dụng giá quận {clean_district}: {district_price/1000000:.1f} triệu/m² (dữ liệu thị trường)")
            insights.append(f"Dự đoán cho {area}m²: {predicted_price/1000000000:.2f} tỷ VNĐ")
        elif city_price:
            insights.append(f"Không tìm thấy dữ liệu local tại '{location}'.")
            insights.append(f"Sử dụng giá thị trường {clean_city}: {city_price/1000000:.1f} triệu/m² (dữ liệu thị trường)")
            insights.append(f"Dự đoán cho {area}m²: {predicted_price/1000000000:.2f} tỷ VNĐ")
        else:
            insights.append("Không tìm thấy dữ liệu trong khu vực.")
            insights.append(f"Sử dụng giá ước tính: {SAFE_BASE_PRICE_PER_M2/1000000:.1f} triệu/m²")
            insights.append(f"Dự đoán cho {area}m²: {predicted_price/1000000000:.2f} tỷ VNĐ")

    # Add AI analysis if available
    if ai_analysis:
        # Extract key points from AI response
        ai_lines = ai_analysis.split('\n')
        for line in ai_lines:
            if line.startswith('PHÂN TÍCH') or line.startswith('GIÁ DỰ'):
                insights.append(line)

    return {
        'predicted_price': predicted_price,
        'confidence': round(confidence, 2),
        'insights': insights,
    }


def parse_ai_price(ai_response: str) -> float:
    """Parse predicted price from AI response (in billions VND)"""
    import re
    patterns = [
        r'GIÁ\s*DỰ\s*ĐOÁN[:\s]*(\d+[.,]\d+)\s*tỷ',
        r'(\d+[.,]\d+)\s*tỷ\s*VNĐ',
        r'(\d+[.,]\d+)\s*tỷ',
    ]
    for pattern in patterns:
        match = re.search(pattern, ai_response, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(',', '.')
            return float(price_str) * 1_000_000_000
    return None


def parse_ai_confidence(ai_response: str) -> float:
    """Parse confidence from AI response (as percentage, convert to 0-1)"""
    import re
    pattern = r'ĐỘ\s*TIN\s*CẬY[:\s]*(\d+)%'
    match = re.search(pattern, ai_response, re.IGNORECASE)
    if match:
        return float(match.group(1)) / 100
    return None
