"""
NLP Pipeline for Vietnamese real estate data processing
Combines preprocessing, extraction, and normalization
"""

from typing import Optional
from .preprocess import clean_text, remove_stopwords
from .extractor import (
    extract_property_type,
    extract_area,
    extract_price,
    extract_price_per_m2,
    extract_bedrooms,
    extract_bathrooms,
    extract_floors,
    extract_address_parts,
    extract_utilities,
)
from .normalizer import (
    normalize_price,
    normalize_area,
    normalize_property_type,
    normalize_address,
    normalize_data,
    validate_price_range,
    validate_area_range,
)


class RealEstatePipeline:
    """Complete NLP pipeline for real estate data"""
    
    def __init__(self):
        self.results = {}
        self.confidence = 0.0
        self.warnings = []
    
    def process_text(self, raw_text: str) -> dict:
        """Process raw text through NLP pipeline"""
        self.results = {}
        self.warnings = []
        self.confidence = 0.0
        
        cleaned = clean_text(raw_text)
        self.results['cleaned_text'] = cleaned
        
        self.results['property_type'] = extract_property_type(raw_text)
        self.results['area'] = extract_area(raw_text)
        self.results['price'] = extract_price(raw_text)
        self.results['price_per_m2'] = extract_price_per_m2(raw_text)
        self.results['bedrooms'] = extract_bedrooms(raw_text)
        self.results['bathrooms'] = extract_bathrooms(raw_text)
        self.results['floors'] = extract_floors(raw_text)
        self.results['address_parts'] = extract_address_parts(raw_text)
        self.results['utilities'] = extract_utilities(raw_text)
        
        self._calculate_confidence()
        
        return self.get_results()
    
    def process_dict(self, raw_data: dict) -> dict:
        """Process raw dict through NLP pipeline"""
        self.results = raw_data.copy()
        self.warnings = []
        self.confidence = 0.0
        
        if raw_data.get('property_type'):
            self.results['property_type'] = normalize_property_type(
                raw_data['property_type']
            )
        
        if raw_data.get('area'):
            self.results['area'] = normalize_area(
                raw_data['area'],
                raw_data.get('area_unit', 'm2')
            )
        
        if raw_data.get('price'):
            self.results['price'] = normalize_price(
                raw_data['price'],
                raw_data.get('price_unit', 'vnd')
            )
        
        if raw_data.get('address'):
            addr = normalize_address(raw_data['address'])
            self.results.update(addr)
        
        if self.results.get('area') > 0 and self.results.get('price') > 0:
            self.results['price_per_m2'] = self.results['price'] / self.results['area']
        
        self._validate_results()
        self._calculate_confidence()
        
        return self.get_results()
    
    def _validate_results(self):
        """Validate extracted results"""
        if self.results.get('price') and self.results.get('area'):
            is_valid, msg = validate_price_range(
                self.results['price'],
                self.results['area']
            )
            if not is_valid:
                self.warnings.append(msg)
        
        if self.results.get('area') and self.results.get('property_type'):
            is_valid, msg = validate_area_range(
                self.results['area'],
                self.results['property_type']
            )
            if not is_valid:
                self.warnings.append(msg)
    
    def _calculate_confidence(self):
        """Calculate overall confidence score"""
        score = 0.0
        max_score = 0.0
        
        fields = ['property_type', 'area', 'price', 'bedrooms', 'address_parts']
        for field in fields:
            max_score += 1.0
            if self.results.get(field):
                score += 1.0
        
        if self.results.get('price') and self.results.get('area'):
            max_score += 1.0
            if validate_price_range(self.results['price'], self.results['area'])[0]:
                score += 1.0
        
        self.confidence = score / max_score if max_score > 0 else 0.0
    
    def get_results(self) -> dict:
        """Get processed results with metadata"""
        return {
            'data': self.results,
            'confidence': self.confidence,
            'warnings': self.warnings,
            'is_complete': self.confidence >= 0.7,
        }


def process_real_estate_text(text: str) -> dict:
    """Convenience function to process text"""
    pipeline = RealEstatePipeline()
    return pipeline.process_text(text)


def process_real_estate_dict(data: dict) -> dict:
    """Convenience function to process dict"""
    pipeline = RealEstatePipeline()
    return pipeline.process_dict(data)


def deduplicate_listings(listings: list[dict]) -> tuple[list[dict], list[dict]]:
    """Find and group duplicate listings"""
    unique = []
    duplicates = []
    
    for listing in listings:
        is_duplicate = False
        
        for existing in unique:
            if _is_duplicate_pair(listing, existing):
                duplicates.append({
                    'original': existing,
                    'duplicate': listing,
                    'similarity': _calculate_similarity(listing, existing),
                })
                is_duplicate = True
                break
        
        if not is_duplicate:
            unique.append(listing)
    
    return unique, duplicates


def _is_duplicate_pair(a: dict, b: dict) -> bool:
    """Check if two listings are duplicates"""
    same_address = a.get('address') == b.get('address') and a.get('address')
    same_price = abs(a.get('price', 0) - b.get('price', 0)) < 100000000
    same_area = abs(a.get('area', 0) - b.get('area', 0)) < 5
    
    score = sum([same_address, same_price, same_area])
    return score >= 2


def _calculate_similarity(a: dict, b: dict) -> float:
    """Calculate similarity score between two listings"""
    score = 0.0
    max_score = 5.0
    
    if a.get('title') and b.get('title'):
        from difflib import SequenceMatcher
        ratio = SequenceMatcher(None, a['title'], b['title']).ratio()
        score += ratio * 2
    
    if a.get('price') and b.get('price') and a['price'] > 0:
        diff = abs(a['price'] - b['price']) / a['price']
        score += max(0, 1 - diff)
    
    if a.get('area') and b.get('area') and a['area'] > 0:
        diff = abs(a['area'] - b['area']) / a['area']
        score += max(0, 1 - diff)
    
    if a.get('address') == b.get('address'):
        score += 1
    
    return min(score / max_score, 1.0)
