from nlp.preprocess import clean_text
from nlp.extractor import *

def process(data):
    if isinstance(data, dict):
        text_parts = [
            data.get("title") or "",
            data.get("description") or "",
            data.get("address") or ""
        ]
        text = "\n".join(part for part in text_parts if part)
    else:
        text = data or ""

    clean = clean_text(text)

    return {
        "area": extract_area(clean),
        "bedroom": extract_bedroom(clean),
        "nearby": extract_nearby(text)
    }