from fastapi import APIRouter, HTTPException, Depends, Query
from config import get_connection
from middleware.auth import get_current_user, require_role
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

router = APIRouter(prefix="", tags=["properties"])


class PropertyCreate(BaseModel):
    title: str
    description: str
    property_type: str
    price: int
    price_unit: str = "VND"
    area: float
    address: str
    city: str
    district: str
    bedrooms: int = 0
    bathrooms: int = 0
    images: List[str] = []


@router.get("/search")
def search_properties(
    search: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    property_type: Optional[str] = Query(None),
    min_price: Optional[int] = Query(None),
    max_price: Optional[int] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    bedrooms: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("newest")
):
    """Tìm kiếm properties với filters"""
    offset = (page - 1) * limit

    # Build WHERE clause
    conditions = ["p.status = 'approved'"]
    params = []

    if search:
        conditions.append("(p.title ILIKE %s OR p.description ILIKE %s OR p.address ILIKE %s)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    if district:
        conditions.append("p.district ILIKE %s")
        params.append(f"%{district}%")

    if property_type:
        conditions.append("p.property_type = %s")
        params.append(property_type)

    if min_price:
        conditions.append("p.price >= %s")
        params.append(min_price)

    if max_price:
        conditions.append("p.price <= %s")
        params.append(max_price)

    if min_area:
        conditions.append("p.area >= %s")
        params.append(min_area)

    if max_area:
        conditions.append("p.area <= %s")
        params.append(max_area)

    if bedrooms:
        conditions.append("p.bedrooms >= %s")
        params.append(bedrooms)

    if city:
        conditions.append("p.city ILIKE %s")
        params.append(f"%{city}%")

    where_clause = " AND ".join(conditions)

    # Build ORDER BY clause
    order_mapping = {
        "newest": "p.created_at DESC",
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "area_desc": "p.area DESC",
        "views": "p.views DESC"
    }
    order_by = order_mapping.get(sort_by, "p.created_at DESC")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                f"""SELECT p.*, u.username, u.full_name
                   FROM properties p
                   LEFT JOIN users u ON p.user_id = u.id
                   WHERE {where_clause}
                   ORDER BY {order_by}
                   LIMIT %s OFFSET %s""",
                params + [limit, offset]
            )
            properties = cursor.fetchall()

            cursor.execute(
                f"""SELECT COUNT(*) as count FROM properties p WHERE {where_clause}""",
                params
            )
            total = cursor.fetchone()["count"]

    return {"properties": properties, "total": total, "page": page, "limit": limit}


@router.get("")
def get_properties(
    status: str = Query("all"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Lấy danh sách properties"""
    offset = (page - 1) * limit
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Build query
            if status == "all":
                cursor.execute(
                    """SELECT p.*, u.username, u.full_name 
                       FROM properties p 
                       LEFT JOIN users u ON p.user_id = u.id
                       ORDER BY p.created_at DESC
                       LIMIT %s OFFSET %s""",
                    (limit, offset)
                )
            else:
                cursor.execute(
                    """SELECT p.*, u.username, u.full_name 
                       FROM properties p 
                       LEFT JOIN users u ON p.user_id = u.id
                       WHERE p.status = %s
                       ORDER BY p.created_at DESC
                       LIMIT %s OFFSET %s""",
                    (status, limit, offset)
                )
            properties = cursor.fetchall()
            
            # Get total count
            if status == "all":
                cursor.execute("SELECT COUNT(*) as count FROM properties")
            else:
                cursor.execute("SELECT COUNT(*) as count FROM properties WHERE status = %s", (status,))
            total = cursor.fetchone()["count"]
            
    return {"properties": properties, "total": total, "page": page, "limit": limit}


@router.get("/pending")
def get_pending_properties(current_user: dict = Depends(require_role(1))):
    """Lấy properties chờ duyệt - Chỉ Admin"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT p.*, u.username, u.full_name 
                   FROM properties p 
                   LEFT JOIN users u ON p.user_id = u.id
                   WHERE p.status = 'pending'
                   ORDER BY p.created_at DESC"""
            )
            properties = cursor.fetchall()
            
    return {"properties": properties, "total": len(properties)}


@router.get("/{property_id}")
def get_property(property_id: int):
    """Lấy chi tiết property"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT p.*, u.username, u.full_name, u.email
                   FROM properties p 
                   LEFT JOIN users u ON p.user_id = u.id
                   WHERE p.id = %s""",
                (property_id,)
            )
            prop = cursor.fetchone()
            
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return prop


@router.post("")
def create_property(
    data: PropertyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Tạo property mới"""
    user_id = current_user.get("id")
    
    # Convert images list to JSON for jsonb column
    images_json = json.dumps(data.images) if data.images else '[]'
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO properties 
                   (title, description, property_type, price, price_unit, area, address, city, district, bedrooms, bathrooms, images, user_id, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, 'pending')
                   RETURNING *""",
                (data.title, data.description, data.property_type, data.price, data.price_unit, 
                 data.area, data.address, data.city, data.district, data.bedrooms, data.bathrooms, 
                 images_json, user_id)
            )
            prop = cursor.fetchone()
            conn.commit()
            
    return {"success": True, "property": prop}


@router.put("/{property_id}")
def update_property(
    property_id: int,
    data: PropertyCreate,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật property"""
    user_id = current_user.get("id")
    user_role = current_user.get("role", 3)
    
    # Convert images list to JSON for jsonb column
    images_json = json.dumps(data.images) if data.images else '[]'
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Check ownership or admin
            if user_role != 1:
                cursor.execute("SELECT user_id FROM properties WHERE id = %s", (property_id,))
                prop = cursor.fetchone()
                if not prop or prop["user_id"] != user_id:
                    raise HTTPException(status_code=403, detail="Không có quyền sửa property này")
            
            cursor.execute(
                """UPDATE properties 
                   SET title=%s, description=%s, property_type=%s, price=%s, price_unit=%s, 
                       area=%s, address=%s, city=%s, district=%s, bedrooms=%s, bathrooms=%s, images=%s::jsonb,
                       status='pending', updated_at=CURRENT_TIMESTAMP
                   WHERE id=%s
                   RETURNING *""",
                (data.title, data.description, data.property_type, data.price, data.price_unit,
                 data.area, data.address, data.city, data.district, data.bedrooms, data.bathrooms,
                 images_json, property_id)
            )
            prop = cursor.fetchone()
            conn.commit()
            
    return {"success": True, "property": prop}


@router.put("/{property_id}/approve")
def approve_property(
    property_id: int,
    current_user: dict = Depends(require_role(1))
):
    """Duyệt property - Chỉ Admin"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE properties SET status='approved', verified=true, updated_at=CURRENT_TIMESTAMP WHERE id=%s RETURNING *",
                (property_id,)
            )
            prop = cursor.fetchone()
            conn.commit()
            
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return {"success": True, "property": prop}


@router.put("/{property_id}/reject")
def reject_property(
    property_id: int,
    current_user: dict = Depends(require_role(1))
):
    """Từ chối property - Chỉ Admin"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE properties SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=%s RETURNING *",
                (property_id,)
            )
            prop = cursor.fetchone()
            conn.commit()
            
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
        
    return {"success": True, "property": prop}


@router.delete("/{property_id}")
def delete_property(
    property_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Xóa property"""
    user_id = current_user.get("id")
    user_role = current_user.get("role", 3)
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            if user_role != 1:
                cursor.execute("SELECT user_id FROM properties WHERE id = %s", (property_id,))
                prop = cursor.fetchone()
                if not prop or prop["user_id"] != user_id:
                    raise HTTPException(status_code=403, detail="Không có quyền xóa property này")
            
            cursor.execute("DELETE FROM properties WHERE id=%s RETURNING id", (property_id,))
            deleted = cursor.fetchone()
            conn.commit()
            
    return {"success": True, "deleted": deleted}
