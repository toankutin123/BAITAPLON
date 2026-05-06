# Hướng dẫn sử dụng hệ thống Login và Register

## Cài đặt Database

1. Kết nối vào PostgreSQL và chạy file schema:
```bash
psql -U postgres -d real_estate_ai -f backend/src/database/schema.sql
```

Hoặc chạy trực tiếp SQL:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Chạy Backend

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: http://localhost:5000

## Chạy Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## Các trang đã tạo

- `/login` - Trang đăng nhập
- `/register` - Trang đăng ký
- `/dashboard` - Trang dashboard (yêu cầu đăng nhập)

## API Endpoints

- `POST /api/auth/register` - Đăng ký tài khoản mới
- `POST /api/auth/login` - Đăng nhập

## Tính năng

Đăng ký với username, email, password, phone
Đăng nhập với email và password
Mã hóa mật khẩu với bcrypt
JWT token authentication (7 ngày)
Protected routes
Auth context để quản lý trạng thái đăng nhập
UI đẹp với shadcn/ui components
Validation và error handling
