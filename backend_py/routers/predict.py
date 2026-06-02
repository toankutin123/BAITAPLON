from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from models.schemas import PredictionRequest, PredictionResponse
from services.ai_service import predict_property_price
from config import get_connection
from middleware.auth import get_current_user

router = APIRouter()


@router.post("", response_model=PredictionResponse)
def predict_price(request: PredictionRequest, current_user: Optional[dict] = Depends(get_current_user)):
    """
    Dự đoán giá bất động sản sử dụng AI.
    """
    try:
        result = predict_property_price(
            location=request.location,
            property_type=request.property_type,
            area=request.area,
            bedrooms=request.bedrooms,
            bathrooms=request.bathrooms,
            year_built=request.year_built,
            features=request.features or []
        )

        # Save prediction to history
        user_id = current_user.get("id") if current_user else None
        try:
            conn = get_connection()
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO prediction_history
                    (user_id, location, property_type, area, bedrooms, bathrooms, predicted_price, confidence, insights)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    request.location,
                    request.property_type,
                    request.area,
                    request.bedrooms,
                    request.bathrooms,
                    result["predicted_price"],
                    result["confidence"],
                    "\n".join(result["insights"])
                ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[PREDICT] Could not save prediction history: {e}")

        return PredictionResponse(
            predicted_price=result["predicted_price"],
            confidence=result["confidence"],
            insights=result["insights"]
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Lỗi dự đoán: {str(exc)}")


@router.get("/history", response_model=List[dict])
def get_prediction_history(limit: int = 20, current_user: dict = Depends(get_current_user)):
    """
    Lấy lịch sử dự đoán của user hiện tại (admin xem tất cả).
    """
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            if current_user.get("role") == 1:  # Admin
                cursor.execute("""
                    SELECT ph.*, u.username, u.full_name
                    FROM prediction_history ph
                    LEFT JOIN users u ON ph.user_id = u.id
                    ORDER BY ph.created_at DESC
                    LIMIT %s
                """, (limit,))
            else:
                cursor.execute("""
                    SELECT * FROM prediction_history
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (current_user.get("id"), limit))

            predictions = cursor.fetchall()
        conn.close()

        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lấy lịch sử: {str(e)}")