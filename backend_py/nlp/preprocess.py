"""
Text preprocessing for Vietnamese real estate data
"""

import re
from typing import Optional


def clean_html(text: str) -> str:
    """Remove HTML tags"""
    if not text:
        return ""
    return re.sub(r'<[^>]+>', '', text)


def clean_text(text: str) -> str:
    """Basic text cleaning"""
    if not isinstance(text, str):
        text = str(text or "")
    
    text = clean_html(text)
    text = text.lower()
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def remove_special_chars(text: str, keep_vietnamese: bool = True) -> str:
    """Remove special characters but keep Vietnamese diacritics"""
    if keep_vietnamese:
        pattern = r'[^a-zA-ZÀ-ỹ0-9\s.,-]'
    else:
        pattern = r'[^a-zA-Z0-9\s.,-]'
    return re.sub(pattern, '', text)


def normalize_whitespace(text: str) -> str:
    """Normalize whitespace"""
    return re.sub(r'\s+', ' ', text).strip()


def extract_numbers(text: str) -> list[int]:
    """Extract all numbers from text"""
    return [int(n) for n in re.findall(r'\d+', text)]


def extract_float(text: str) -> Optional[float]:
    """Extract first float number"""
    match = re.search(r'[\d,]+\.?\d*', text)
    if match:
        return float(match.group().replace(',', ''))
    return None


def split_sentences(text: str) -> list[str]:
    """Split text into sentences"""
    return re.split(r'[.!?]+', text)


def extract_words(text: str) -> list[str]:
    """Extract words from text"""
    return re.findall(r'\b\w+\b', text.lower())


VIETNAMESE_STOPWORDS = {
    'và', 'của', 'là', 'có', 'được', 'cho', 'với', 'tại', 'từ',
    'này', 'kia', 'đó', 'nọ', 'năm', 'một', 'hai', 'ba', 'bốn',
    'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'các', 'những',
    'theo', 'về', 'trong', 'ra', 'vào', 'lên', 'xuống', 'đi',
    'bán', 'mua', 'cần', 'muốn', 'tìm', 'thuê', 'cho thuê'
}


def remove_stopwords(text: str) -> str:
    """Remove Vietnamese stopwords"""
    words = text.lower().split()
    return ' '.join(w for w in words if w not in VIETNAMESE_STOPWORDS)


def truncate_text(text: str, max_length: int = 500) -> str:
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length].rsplit(' ', 1)[0] + '...'
