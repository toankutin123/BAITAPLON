from fastapi import APIRouter, HTTPException, BackgroundTasks
from config import get_connection, JWT_SECRET
from models.schemas import RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
import bcrypt
import jwt
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os

router = APIRouter()

# Email configuration (can be overridden in .env)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USER)

def send_reset_email(email: str, token: str):
    """Send password reset email"""
    if not SMTP_USER or not SMTP_PASS:
        print(f"[DEV MODE] Password reset link: http://localhost:5173/reset-password?token={token}")
        return

    reset_link = f"http://localhost:5173/reset-password?token={token}"
    subject = "Đặt lại mật khẩu - EstateAI"

    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EstateAI</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <h2 style="color: #374151; margin-top: 0;">Yêu cầu đặt lại mật khẩu</h2>
            <p style="color: #6b7280;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p style="color: #6b7280;">Nhấn vào nút bên dưới để đặt lại mật khẩu mới:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Đặt Lại Mật Khẩu</a>
            </div>
            <p style="color: #9ca3af; font-size: 12px;">Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">EstateAI - Real Estate AI Platform</p>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Yêu cầu đặt lại mật khẩu - EstateAI

    Nhấn vào link sau để đặt lại mật khẩu:
    {reset_link}

    Link này sẽ hết hạn sau 1 giờ.
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = FROM_EMAIL
        msg["To"] = email

        part1 = MIMEText(text_content, "plain")
        part2 = MIMEText(html_content, "html")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(FROM_EMAIL, [email], msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")
        print(f"[FALLBACK] Reset link: {reset_link}")


@router.post("/register")
def register(request: RegisterRequest):
    if not request.username or not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            # Check if this is the first user (make them admin)
            cursor.execute("SELECT COUNT(*) as count FROM users")
            user_count = cursor.fetchone()
            is_first_user = user_count["count"] == 0
            default_role = 1 if is_first_user else 3  # 1=Admin, 3=Buyer

            cursor.execute("SELECT 1 FROM users WHERE email = %s", (request.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email đã tồn tại")

            if request.phone:
                cursor.execute("SELECT 1 FROM users WHERE phone = %s", (request.phone,))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Số điện thoại đã tồn tại")

            password_hash = bcrypt.hashpw(request.password.encode(), bcrypt.gensalt()).decode()

            # Default role = 3 (Người mua BĐS / Real Estate Buyer)
            # But if first user, role = 1 (Admin)
            cursor.execute(
                """
                INSERT INTO users (username, full_name, email, phone, password_hash, role, status)
                VALUES (%s, %s, %s, %s, %s, %s, true)
                RETURNING id, username, full_name, email, phone, role, avatar, status, created_at
                """,
                (request.username, request.full_name, request.email, request.phone, password_hash, default_role),
            )
            user = cursor.fetchone()
            conn.commit()

    token = jwt.encode(
        {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    return {
        "message": "Đăng ký thành công",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"],
            "avatar": user["avatar"],
            "status": user["status"],
        },
    }


@router.post("/login")
def login(request: LoginRequest):
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Vui lòng điền đầy đủ thông tin")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE email = %s", (request.email,))
            user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if not user["status"]:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")

    if not bcrypt.checkpw(request.password.encode(), user["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = jwt.encode(
        {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    return {
        "message": "Đăng nhập thành công",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "phone": user["phone"],
            "role": user["role"],
            "avatar": user["avatar"],
            "status": user["status"],
        },
    }


# In-memory token storage: {token: {"email": email, "expires": datetime}}
reset_tokens = {}


@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    """Gửi email đặt lại mật khẩu"""
    if not request.email:
        raise HTTPException(status_code=400, detail="Vui lòng nhập email")

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (request.email,))
            user = cursor.fetchone()

    if not user:
        # Don't reveal that email doesn't exist for security
        return {"message": "Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi"}

    token = secrets.token_urlsafe(32)
    expires = datetime.now() + timedelta(hours=1)
    reset_tokens[token] = {"email": request.email, "expires": expires}

    send_reset_email(request.email, token)

    return {"message": "Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi"}


@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    """Đặt lại mật khẩu với token"""
    if not request.token or not request.newPassword:
        raise HTTPException(status_code=400, detail="Token và mật khẩu mới là bắt buộc")

    if len(request.newPassword) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 6 ký tự")

    token_data = reset_tokens.get(request.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Token không hợp lệ hoặc đã hết hạn")

    if datetime.now() > token_data["expires"]:
        del reset_tokens[request.token]
        raise HTTPException(status_code=400, detail="Token đã hết hạn")

    email = token_data["email"]
    password_hash = bcrypt.hashpw(request.newPassword.encode(), bcrypt.gensalt()).decode()

    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE email = %s",
                (password_hash, email),
            )
            conn.commit()

    del reset_tokens[request.token]

    return {"message": "Đặt lại mật khẩu thành công"}
