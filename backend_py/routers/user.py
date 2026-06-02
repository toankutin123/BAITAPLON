from fastapi import APIRouter, HTTPException, Depends
from config import get_connection
from middleware.auth import get_current_user, require_role
from models.schemas import UpdateRoleRequest, UpdateStatusRequest
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Role values:
# 1 = Admin (Quản lý toàn bộ hệ thống)
# 2 = Người bán BĐS (Đăng bán, quản lý BĐS)
# 3 = Người mua BĐS (Tìm kiếm, phân tích BĐS)


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


@router.get("/")
def get_all_users(current_user: dict = Depends(require_role(1))):
    """Lấy danh sách tất cả users - Chỉ Admin"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, username, full_name, email, phone, role, avatar, status, content_restricted, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                """
            )
            users = cursor.fetchall()

    return {"success": True, "users": users}


@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    request: UpdateRoleRequest,
    current_user: dict = Depends(require_role(1))
):
    """Cập nhật role của user - Chỉ Admin"""
    if request.role not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE users
                SET role = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, username, email, role
                """,
                (request.role, user_id),
            )
            user = cursor.fetchone()
            conn.commit()

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    return {
        "success": True,
        "message": "Cập nhật role thành công",
        "user": user,
    }


@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    request: UpdateStatusRequest,
    current_user: dict = Depends(require_role(1))
):
    """Cập nhật trạng thái user - Chỉ Admin"""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE users
                SET status = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, username, email, status
                """,
                (request.status, user_id),
            )
            user = cursor.fetchone()
            conn.commit()

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    return {
        "success": True,
        "message": "Kích hoạt tài khoản thành công" if request.status else "Vô hiệu hóa tài khoản thành công",
        "user": user,
    }


@router.put("/profile")
def update_profile(
    request: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Cập nhật thông tin cá nhân của user hiện tại"""
    user_id = current_user.get("id")
    
    updates = []
    values = []
    
    if request.full_name is not None:
        updates.append("full_name = %s")
        values.append(request.full_name)
    if request.phone is not None:
        updates.append("phone = %s")
        values.append(request.phone)
    
    if not updates:
        raise HTTPException(status_code=400, detail="Không có thông tin để cập nhật")
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            query = f"""
                UPDATE users SET {', '.join(updates)} WHERE id = %s
                RETURNING id, username, full_name, email, phone
            """
            cursor.execute(query, [*values, user_id])
            user = cursor.fetchone()
            conn.commit()

    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    return {
        "success": True,
        "message": "Cập nhật thông tin thành công",
        "user": user,
    }


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Đổi mật khẩu - Yêu cầu xác minh mật khẩu hiện tại"""
    import bcrypt
    
    user_id = current_user.get("id")
    
    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")
    
    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Lấy password hash hiện tại
            cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
            
            # Xác minh mật khẩu hiện tại
            if not bcrypt.checkpw(request.currentPassword.encode(), user["password_hash"].encode()):
                raise HTTPException(status_code=401, detail="Mật khẩu hiện tại không đúng")
            
            # Hash mật khẩu mới và cập nhật
            new_hash = bcrypt.hashpw(request.newPassword.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (new_hash, user_id)
            )
            conn.commit()

    return {
        "success": True,
        "message": "Đổi mật khẩu thành công"
    }
