from fastapi import APIRouter, HTTPException, Depends
from config import get_connection
from middleware.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/saved-properties", tags=["saved-properties"])


class SavePropertyRequest(BaseModel):
    propertyId: int


@router.get("")
async def get_saved_properties(current_user: dict = Depends(get_current_user)):
    """Get user's saved properties"""
    user_id = current_user.get("id")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.* 
                FROM properties p
                JOIN saved_properties sp ON p.id = sp.property_id
                WHERE sp.user_id = %s
                ORDER BY sp.created_at DESC
            """, (user_id,))
            properties = cursor.fetchall()
        return properties
    finally:
        conn.close()


@router.post("")
async def save_property(
    request: SavePropertyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a property"""
    user_id = current_user.get("id")
    property_id = request.propertyId
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO saved_properties (user_id, property_id)
                VALUES (%s, %s)
                ON CONFLICT (user_id, property_id) DO NOTHING
                RETURNING id
            """, (user_id, property_id))
            result = cursor.fetchone()
            conn.commit()
        return {"success": True, "saved": result is not None}
    finally:
        conn.close()


@router.delete("/{property_id}")
async def unsave_property(
    property_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove saved property"""
    user_id = current_user.get("id")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                DELETE FROM saved_properties 
                WHERE user_id = %s AND property_id = %s
                RETURNING id
            """, (user_id, property_id))
            result = cursor.fetchone()
            conn.commit()
        return {"success": True, "deleted": result is not None}
    finally:
        conn.close()


@router.get("/check/{property_id}")
async def check_saved(
    property_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Check if property is saved"""
    user_id = current_user.get("id")
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM saved_properties 
                WHERE user_id = %s AND property_id = %s
            """, (user_id, property_id))
            exists = cursor.fetchone() is not None
        return {"saved": exists}
    finally:
        conn.close()
