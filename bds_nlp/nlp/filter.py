import unicodedata
import re

# ===== NORMALIZE TIẾNG VIỆT =====
def normalize(text):
    if not isinstance(text, str):
        return ""

    text = text.lower()

    # FIX chữ đ
    text = text.replace("đ", "d")

    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')

    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


# ===== SLUG (dùng build URL) =====
def slugify(text):
    return normalize(text).replace(" ", "-")


# ===== MAP PHƯỜNG → QUẬN =====
WARD_TO_DISTRICT = {
    "ha dong": [
        "phu luong", "phu la", "mo lao", "la khe",
        "van quan", "van khe", "bien giang",
        "yen nghia", "kien hung", "duong noi"
    ],
    "binh thanh": [
        "phuong 1", "phuong 2", "phuong 3", "phuong 5",
        "phuong 7", "phuong 11", "phuong 13", "phuong 25",
        "phuong 26", "phuong 27", "phuong 28"
    ]
}


# ===== TÁCH STREET + DISTRICT =====
def split_keyword(text):
    text = normalize(text)
    parts = text.split()

    if len(parts) >= 3:
        district = " ".join(parts[-3:])
        street = " ".join(parts[:-3])
    else:
        district = text
        street = ""

    return street.strip(), district.strip()


# ===== DETECT DISTRICT TỪ ADDRESS =====
def detect_district(address):
    address = normalize(address)

    for district, wards in WARD_TO_DISTRICT.items():
        for ward in wards:
            if ward in address:
                return district

    return None


# ===== MATCH LOGIC (NÂNG CẤP) =====
def match_address(address, street_kw, district_kw, title=None, nearby=None):
    combined = " ".join(filter(None, [address, title, " ".join(nearby or [])]))
    combined = normalize(combined)

    # ===== 1. MATCH STREET =====
    if street_kw and street_kw in combined:
        return "street"

    # ===== 2. MATCH TRỰC TIẾP QUẬN =====
    if district_kw and district_kw in combined:
        return "district"

    # ===== 3. MATCH QUA PHƯỜNG =====
    detected = detect_district(combined)
    if detected and detected == district_kw:
        return "district"

    return None