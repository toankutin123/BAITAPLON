from crawler.scraper import scrape_bds
from crawler.list_crawler import get_listing_links
import json
import time
import os

DB_FILE = "data.json"


# ===== DB =====
def load_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def is_duplicate(url, db):
    return any(item.get("url") == url for item in db)


# ===== MAIN =====
areas = [
    "https://batdongsan.com.vn/ban-nha-rieng-ha-noi",
    "https://batdongsan.com.vn/ban-nha-rieng-tp-hcm",
    "https://batdongsan.com.vn/ban-nha-rieng-da-nang"
]

db = load_db()

for area in areas:
    print(f"\n===== CRAWL: {area} =====")

    links = get_listing_links(area, max_page=2)

    print(f" Tìm thấy {len(links)} link")

    for link in links:
        if is_duplicate(link, db):
            print("Trùng:", link)
            continue

        try:
            print(" Đang scrape:", link)

            data = scrape_bds(link)
            data["url"] = link

            db.append(data)
            save_db(db)

            print(" Đã lưu")

            time.sleep(2)

        except Exception as e:
            print(" Lỗi:", e)