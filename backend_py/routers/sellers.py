from fastapi import APIRouter, HTTPException, Depends
from config import get_connection
from middleware.auth import get_current_user, require_role
from models.schemas import SellerRequestCreate, SellerRequestResponse, SellerRequestReject
from datetime import datetime

router = APIRouter()


@router.post("/request", response_model=SellerRequestResponse)
def request_seller_role(request: SellerRequestCreate, current_user: dict = Depends(get_current_user)):
    """
    User submits a request to become a seller.
    Status: pending (waiting for admin approval)
    """
    user_id = current_user.get("id")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Check if user exists and is not already a seller
            cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()

            if not user:
                raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

            if user["role"] == 2:
                raise HTTPException(status_code=400, detail="Người dùng đã là người bán")

            # Check if user already has a pending request
            cursor.execute(
                "SELECT 1 FROM seller_requests WHERE user_id = %s AND status = %s",
                (user_id, "pending"),
            )
            if cursor.fetchone():
                raise HTTPException(
                    status_code=400,
                    detail="Bạn đã có yêu cầu chưa được duyệt. Vui lòng chờ admin phê duyệt."
                )

            # Create seller request
            cursor.execute(
                """
                INSERT INTO seller_requests
                (user_id, business_name, business_type, business_registration_number,
                 tax_id, phone_number, business_address, city, district, description, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id, user_id, business_name, business_type, phone_number,
                          business_address, city, district, status, requested_at, reviewed_at
                """,
                (
                    user_id,
                    request.business_name,
                    request.business_type,
                    request.business_registration_number,
                    request.tax_id,
                    request.phone_number,
                    request.business_address,
                    request.city,
                    request.district,
                    request.description,
                ),
            )
            seller_request = cursor.fetchone()
            conn.commit()

    return SellerRequestResponse(**seller_request)


@router.get("/requests")
def get_pending_requests(
    status: str = "pending",
    current_user: dict = Depends(require_role(1))
):
    """
    Admin: Get seller requests (pending, approved, rejected)
    """
    if status not in ["pending", "approved", "rejected", "all"]:
        raise HTTPException(status_code=400, detail="Status không hợp lệ")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            if status == "all":
                cursor.execute(
                    """
                    SELECT id, user_id, business_name, business_type, phone_number,
                           business_address, city, district, status, requested_at, reviewed_at
                    FROM seller_requests
                    ORDER BY requested_at DESC
                    """
                )
            else:
                cursor.execute(
                    """
                    SELECT id, user_id, business_name, business_type, phone_number,
                           business_address, city, district, status, requested_at, reviewed_at
                    FROM seller_requests
                    WHERE status = %s
                    ORDER BY requested_at DESC
                    """,
                    (status,),
                )
            requests = cursor.fetchall()

    return {"success": True, "requests": requests}


@router.get("/requests/user/me")
def get_my_seller_request(current_user: dict = Depends(get_current_user)):
    """
    Get seller request status for current user
    """
    user_id = current_user.get("id")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, user_id, business_name, business_type, phone_number,
                       business_address, city, district, status, reason_for_rejection,
                       requested_at, reviewed_at
                FROM seller_requests
                WHERE user_id = %s
                ORDER BY requested_at DESC
                LIMIT 1
                """,
                (user_id,),
            )
            request = cursor.fetchone()

    if not request:
        return {"message": "Chưa có yêu cầu", "request": None}

    return {"request": request}


@router.put("/requests/{request_id}/approve")
def approve_seller_request(
    request_id: int,
    current_user: dict = Depends(require_role(1))
):
    """
    Admin: Approve a seller request
    Updates user role from 3 (Buyer) to 2 (Seller)
    """
    admin_id = current_user.get("id")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Get seller request
            cursor.execute(
                "SELECT user_id, status FROM seller_requests WHERE id = %s",
                (request_id,),
            )
            seller_request = cursor.fetchone()

            if not seller_request:
                raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

            if seller_request["status"] != "pending":
                raise HTTPException(
                    status_code=400,
                    detail=f"Yêu cầu đã có trạng thái: {seller_request['status']}"
                )

            user_id = seller_request["user_id"]

            # Update seller request status
            cursor.execute(
                """
                UPDATE seller_requests
                SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (admin_id, request_id),
            )

            # Update user role from 3 (Buyer) to 2 (Seller)
            cursor.execute(
                """
                UPDATE users
                SET role = 2, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, username, email, role
                """,
                (user_id,),
            )
            updated_user = cursor.fetchone()
            conn.commit()

    return {
        "success": True,
        "message": "Đã phê duyệt yêu cầu",
        "user": updated_user,
    }


@router.put("/requests/{request_id}/reject")
def reject_seller_request(
    request_id: int,
    request_body: SellerRequestReject,
    current_user: dict = Depends(require_role(1))
):
    """
    Admin: Reject a seller request
    """
    admin_id = current_user.get("id")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Get seller request
            cursor.execute(
                "SELECT user_id, status FROM seller_requests WHERE id = %s",
                (request_id,),
            )
            seller_request = cursor.fetchone()

            if not seller_request:
                raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu")

            if seller_request["status"] != "pending":
                raise HTTPException(
                    status_code=400,
                    detail=f"Yêu cầu đã có trạng thái: {seller_request['status']}"
                )

            # Update seller request status
            cursor.execute(
                """
                UPDATE seller_requests
                SET status = 'rejected', reason_for_rejection = %s, reviewed_at = CURRENT_TIMESTAMP,
                    reviewed_by = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (request_body.reason_for_rejection, admin_id, request_id),
            )
            conn.commit()

    return {
        "success": True,
        "message": "Đã từ chối yêu cầu",
    }
