from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import re
import json


def scrape_bds(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled"]
        )

        page = browser.new_page(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        )

        print(" Đang load trang...")

        # ===== RETRY LOAD =====
        for i in range(3):
            try:
                page.goto(url, timeout=60000)
                break
            except:
                print(f"⚠️ Retry lần {i+1}")

        # ===== FIX LOAD (QUAN TRỌNG) =====
        page.wait_for_load_state("domcontentloaded")

        try:
            page.wait_for_selector("h1", timeout=15000)
        except:
            print(" Không thấy H1, vẫn tiếp tục...")

        page.wait_for_timeout(2000)

        html = page.content()
        soup = BeautifulSoup(html, "lxml")

        # ===== TITLE =====
        title_tag = soup.find("h1")
        title = title_tag.get_text(strip=True) if title_tag else None

        # ===== TEXT FULL =====
        full_text = soup.get_text("\n", strip=True)

        # ===== PRICE =====
        price = re.search(r"\d+[.,]?\d*\s*tỷ", full_text)
        if not price:
            price = re.search(r"\d+[.,]?\d*\s*triệu/m²", full_text)
        price = price.group() if price else None

        # ===== AREA =====
        area = re.search(r"\d+\s*m²", full_text)
        area = area.group() if area else None

        # ===== BEDROOM =====
        bedroom = re.search(r"\d+\s*PN", full_text)
        bedroom = bedroom.group() if bedroom else None

        # ===== ADDRESS =====
        address = None
        for line in full_text.split("\n"):
            if any(k in line for k in ["Đường", "Phường", "Quận"]):
                if "Hồ Chí Minh" in line or "Hà Nội" in line:
                    address = line
                    break

        # ===== DESCRIPTION =====
        description = None
        desc_block = soup.find("div", class_=re.compile("body|content|detail", re.I))
        if desc_block:
            description = desc_block.get_text("\n", strip=True)

        # ===== NEARBY =====
        nearby = []

        scripts = soup.find_all("script", type="application/ld+json")

        for s in scripts:
            try:
                data = json.loads(s.string)

                if isinstance(data, dict):
                    desc = data.get("description", "")
                    for line in desc.split("."):
                        if "gần" in line.lower():
                            nearby.append(line.strip())
            except:
                pass

        return {
            "title": title,
            "price": price,
            "area": area,
            "bedroom": bedroom,
            "address": address,
            "nearby": nearby
        }