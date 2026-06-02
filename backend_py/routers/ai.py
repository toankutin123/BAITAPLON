"""
AI/NLP endpoints for data processing
"""

from fastapi import APIRouter, HTTPException
from models.schemas import (
    NormalizeTextRequest, NormalizeTextResponse,
    ValidateDataRequest, ValidateDataResponse,
    DeduplicateRequest, DeduplicateResponse
)
from nlp.pipeline import process_real_estate_text, process_real_estate_dict, deduplicate_listings
from nlp.extractor import extract_all

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/normalize", response_model=NormalizeTextResponse)
async def normalize_text(request: NormalizeTextRequest):
    """Normalize raw text to structured data"""
    result = process_real_estate_text(request.text)
    
    return NormalizeTextResponse(
        original_text=request.text,
        normalized_data=result.get('data', {}),
        confidence=result.get('confidence', 0.0)
    )


@router.post("/extract")
async def extract_entities(text: str):
    """Extract entities from text"""
    entities = extract_all(text)
    return {"entities": entities}


@router.post("/validate", response_model=ValidateDataResponse)
async def validate_data(request: ValidateDataRequest):
    """Validate real estate data"""
    errors = []
    warnings = []
    data = request.data
    
    if not data.get('title'):
        errors.append("Thiếu tiêu đề")
    
    if not data.get('address'):
        warnings.append("Thiếu địa chỉ")
    
    if data.get('price') and data.get('price') < 100000000:
        warnings.append("Giá có vẻ thấp")
    
    if data.get('area') and data.get('area') < 10:
        errors.append("Diện tích quá nhỏ")
    
    if data.get('area') and data.get('price'):
        price_per_m2 = data['price'] / data['area']
        if price_per_m2 < 2000000:
            warnings.append("Giá/m² quá thấp")
        elif price_per_m2 > 300000000:
            warnings.append("Giá/m² quá cao")
    
    return ValidateDataResponse(
        is_valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


@router.post("/deduplicate", response_model=DeduplicateResponse)
async def deduplicate(request: DeduplicateRequest):
    """Find and deduplicate similar listings"""
    unique, duplicates = deduplicate_listings(request.listings)
    
    merge_suggestions = []
    for dup in duplicates:
        if dup['similarity'] > 0.8:
            merge_suggestions.append({
                'keep': dup['original'],
                'merge': dup['duplicate'],
                'confidence': dup['similarity']
            })
    
    return DeduplicateResponse(
        duplicates=duplicates,
        unique_listings=unique,
        merge_suggestions=merge_suggestions
    )
