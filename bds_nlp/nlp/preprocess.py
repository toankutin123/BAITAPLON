import re

def clean_text(text):
    if not isinstance(text, str):
        text = str(text or "")

    text = text.lower()
    text = text.replace(",", ".")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()