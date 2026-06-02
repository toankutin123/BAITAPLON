import re

def extract_area(text):
    match = re.search(r'(\d+)\s*m', text)
    return float(match.group(1)) if match else None

def extract_bedroom(text):
    match = re.search(r'(\d+)\s*phòng ngủ', text)
    return int(match.group(1)) if match else None

def extract_nearby(text):
    results = []
    for line in text.split("\n"):
        if any(k in line.lower() for k in ["gần", "tiện ích", "xung quanh"]):
            results.append(line.strip())
    return results