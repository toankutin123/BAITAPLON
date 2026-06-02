"""
Valuation endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ValuationRequest, ValuationResponse
from middleware.auth import get_current_user
from services.valuation_service import valuation_service

router = APIRouter(prefix="/api/valuation", tags=["Valuation"])


@router.post("/estimate", response_model=ValuationResponse)
async def estimate_price(
    request: ValuationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Estimate property price using AI"""
    result = valuation_service.estimate_price(
        address=request.address,
        property_type=request.property_type,
        area=request.area,
        bedrooms=request.bedrooms,
        bathrooms=request.bathrooms,
        district=request.district,
        city=request.city,
        legal_status=request.legal_status,
        features=request.features
    )
    
    return ValuationResponse(**result)


@router.get("/history/{user_id}")
async def get_valuation_history(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get valuation history for a user"""
    if current_user.get('id') != user_id and current_user.get('role') != 1:
        raise HTTPException(status_code=403, detail="Không có quyền xem")
    
    from config import get_connection
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM property_valuations
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 20
            """, (user_id,))
            history = cursor.fetchall()
        return {"valuations": history}
    finally:
        conn.close()


@router.post("/save")
async def save_valuation(
    request: ValuationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a valuation to history"""
    result = valuation_service.estimate_price(
        address=request.address,
        property_type=request.property_type,
        area=request.area,
        bedrooms=request.bedrooms,
        bathrooms=request.bathrooms,
        district=request.district,
        city=request.city,
        legal_status=request.legal_status,
        features=request.features
    )
    
    from config import get_connection
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO property_valuations
                (user_id, address, property_type, area, bedrooms, bathrooms,
                 district, city, estimated_low, estimated_avg, estimated_high,
                 confidence, comparable_count, factors)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                current_user.get('id'),
                request.address,
                request.property_type,
                request.area,
                request.bedrooms,
                request.bathrooms,
                request.district,
                request.city,
                result['estimated_low'],
                result['estimated_avg'],
                result['estimated_high'],
                result['confidence'],
                result['comparable_count'],
                result['factors']
            ))
            saved = cursor.fetchone()
            conn.commit()
        return {"success": True, "valuation_id": saved['id']}
    finally:
        conn.close()
