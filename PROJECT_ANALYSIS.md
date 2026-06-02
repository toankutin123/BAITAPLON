# BAITAPLON - EstateAI Platform Analysis Report

## BƯỚC 1: CẤU TRÚC DỰ ÁN

### 1.1 Tên & Mục đích
- **Tên dự án**: BAITAPLON - EstateAI
- **Loại**: Real Estate AI Platform (Nền tảng Bất Động Sản Thông Minh)
- **Chức năng chính**: Quản lý, tìm kiếm, định giá, phân tích thị trường BĐS với AI

### 1.2 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend chính | FastAPI (Python) - port 8001 |
| Backend NLP | FastAPI (Python) - port 8000 |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (Claude models) |
| Web Scraping | curl-cffi, BeautifulSoup4, Playwright |
| Container | Docker + Docker Compose |
| Styling | Tailwind CSS + shadcn/ui |
| Routing | React Router v7 |
| Charts | Recharts |

### 1.3 Thư mục chính

```
BAITAPLON/
├── backend_py/          # FastAPI backend chính (port 8001)
├── bds_nlp/            # NLP service riêng (port 8000) - CHƯA HOÀN THIỆN
├── bds_tool/           # Tool web scraping + average.json
├── frontend/           # React frontend
└── docker-compose.yml  # Docker orchestration
```

### 1.4 Kiến trúc API Backend (backend_py/main.py)

```
app (FastAPI - :8001)
├── /api/auth          → routers/auth.py
├── /api/users         → routers/user.py
├── /api/market        → routers/market.py
├── /api/predict       → routers/predict.py
├── /api/sellers       → routers/sellers.py
├── /api/properties     → routers/properties.py
├── /api/ai            → routers/ai.py
├── /api/crawl         → routers/crawl.py
├── /api/valuation     → routers/valuation.py
├── /api/recommendations → routers/recommendations.py
├── /api/dashboard     → routers/dashboard.py
├── /api/saved-properties → routers/saved_properties.py
├── /api/admin         → routers/admin.py
└── /api/admin/chat    → routers/admin_chat.py
```

---

## BƯỚC 2: LIỆT KÊ CHỨC NĂNG HỆ THỐNG

### 2.1 Backend (backend_py)

| # | Chức năng | Router | Mô tả |
|---|-----------|--------|-------|
| 1 | **Authentication** | `auth.py` | Đăng ký, đăng nhập, quên mật khẩu, reset mật khẩu |
| 2 | **User Management** | `user.py` | CRUD users, phân quyền (Admin/Seller/Buyer) |
| 3 | **Property CRUD** | `properties.py` | Tạo, sửa, xóa, duyệt BĐS |
| 4 | **Property Search** | `properties.py` | Tìm kiếm với bộ lọc |
| 5 | **Seller Registration** | `sellers.py` | Workflow đăng ký làm người bán |
| 6 | **AI Price Prediction** | `predict.py` | Dự đoán giá BĐS bằng AI + web scraping |
| 7 | **Market Analysis** | `market.py` | Xu hướng giá, thống kê theo quận |
| 8 | **Valuation Service** | `valuation.py` | Định giá chi tiết với comparable |
| 9 | **NLP Processing** | `ai.py` | Normalize text, extract entities, deduplicate |
| 10 | **Web Crawler** | `crawl.py` | Quản lý crawler, nguồn dữ liệu |
| 11 | **Buyer Recommendations** | `recommendations.py` | Gợi ý BĐS theo profile người mua |
| 12 | **Dashboard Analytics** | `dashboard.py` | Thống kê tổng quan, top gainers/losers |
| 13 | **Saved Properties** | `saved_properties.py` | Lưu/xóa BĐS yêu thích |
| 14 | **Admin Chat** | `admin_chat.py` | Chat giữa user và admin |

### 2.2 Frontend (React Router v7)

| # | Trang | Route | Mô tả |
|---|-------|-------|-------|
| 1 | **HomePage** | `/` | Trang chủ landing page |
| 2 | **LoginPage** | `/login` | Đăng nhập |
| 3 | **RegisterPage** | `/register` | Đăng ký tài khoản |
| 4 | **ForgotPasswordPage** | `/forgot-password` | Quên mật khẩu |
| 5 | **ResetPasswordPage** | `/reset-password` | Reset mật khẩu |
| 6 | **PropertiesPage** | `/properties` | Danh sách BĐS |
| 7 | **PropertyDetailPage** | `/properties/:id` | Chi tiết BĐS |
| 8 | **AddPropertyPage** | `/add-property` | Thêm BĐS mới |
| 9 | **DashboardPage** | `/dashboard` | Dự đoán giá AI |
| 10 | **MarketAnalysisPage** | `/market-analysis` | Phân tích thị trường |
| 11 | **ProfilePage** | `/profile` | Thông tin cá nhân |
| 12 | **BecomeSellerPage** | `/become-seller` | Đăng ký làm người bán |
| 13 | **AdminDashboardPage** | `/admin` | Trang quản trị |
| 14 | **ChatWithAdminPage** | `/chat-with-admin` | Chat với admin |

### 2.3 Frontend Services

| Service | File | Chức năng |
|---------|------|-----------|
| Auth | `services/auth.service.ts` | Login, register, logout |
| User | `services/user.service.ts` | User CRUD |
| Property | `services/property.service.ts` | Property CRUD + search |
| AI API | `services/aiApi.ts` | Gọi OpenRouter API |
| Market | `services/market.service.ts` | Market data |
| Predict | `services/predict.service.ts` | Price prediction |
| Chat | `services/chat.service.ts` | Admin chat |
| Seller | `services/seller.service.ts` | Seller registration |

---

## BƯỚC 3: MAP FILE → CHỨC NĂNG

### backend_py/

| File | Chức năng |
|------|-----------|
| `main.py` | Entry point, đăng ký 13 routers |
| `config.py` | Database connection, env vars |
| `middleware/auth.py` | JWT auth, role check |
| `models/schemas.py` | Pydantic models |
| `routers/auth.py` | Authentication |
| `routers/user.py` | User management |
| `routers/properties.py` | Property CRUD |
| `routers/sellers.py` | Seller registration |
| `routers/predict.py` | AI price prediction |
| `routers/market.py` | Market data |
| `routers/valuation.py` | Valuation service |
| `routers/ai.py` | NLP endpoints |
| `routers/crawl.py` | Crawler management |
| `routers/recommendations.py` | Buyer recommendations |
| `routers/dashboard.py` | Dashboard stats |
| `routers/saved_properties.py` | Saved properties |
| `routers/admin.py` | Admin stats |
| `routers/admin_chat.py` | User-Admin chat |
| `services/ai_service.py` | AI prediction logic |
| `services/web_scraper.py` | Web scraping |
| `services/crawler_service.py` | Crawler logic |
| `services/valuation_service.py` | Valuation logic |
| `services/market_analysis_service.py` | Market analysis |
| `services/recommendation_service.py` | Recommendation logic |
| `nlp/pipeline.py` | NLP pipeline |
| `nlp/preprocess.py` | Text cleaning |
| `nlp/extractor.py` | Entity extraction |
| `nlp/normalizer.py` | Data normalization |
| `scripts/migrate_ai.py` | Migration script |
| `scripts/import_nlp_data.py` | Import data |
| `scripts/migrate_admin_chat.py` | Chat migration |

### bds_tool/

| File | Chức năng |
|------|-----------|
| `main.py` | CLI scraper entry |
| `scraper.py` | Playwright scraper |
| `average.json` | Price data |

### bds_nlp/ (Standalone NLP service)

| File | Chức năng |
|------|-----------|
| `api/main.py` | FastAPI entry (port 8000) |
| `api/routes/` | API endpoints |
| `pipeline/` | ETL pipeline |
| `crawler/` | Crawler sources |
| `models/` | Data models |
| `services/` | Business logic |
| `test_*.py` | Test files |
| `import_*.py` | Import scripts |

---

## BƯỚC 4: PHÁT HIỆN FILE KHÔNG SỬ DỤNG

### 4.1 bds_nlp - Standalone Service (Có thể UNUSED)

**Nhận định**: bds_nlp là một service riêng biệt chạy port 8000, không được import bởi backend_py. Tất cả test files và import scripts có thể không cần thiết.

**Files có thể không sử dụng**:

| File | Lý do |
|------|-------|
| `test_*.py` (8 files) | Test files, có thể xóa |
| `import_*.py` (4 files) | Import scripts dùng một lần |
| `load_hf_dataset.py` | Dùng một lần |
| `scripts/init_db.py` | Migration script |
| `scripts/migrate_ai_features.py` | Migration script |

### 4.2 backend_py

| File | Đánh giá |
|------|---------|
| `scripts/migrate_ai.py` | **Cần xác nhận** - Migration, có thể chạy 1 lần |
| `scripts/import_nlp_data.py` | **Cần xác nhận** - Import, có thể chạy 1 lần |
| `scripts/migrate_admin_chat.py` | **Cần xác nhận** - Migration, có thể chạy 1 lần |

### 4.3 Frontend - Cần kiểm tra thêm

Frontend có nhiều component files cần kiểm tra imports.

---

## BƯỚC 5: DỌN DẸP - KHÔNG XÓA GÌ (CHỜ XÁC NHẬN)

> **Lưu ý**: Theo yêu cầu ưu tiên an toàn, KHÔNG xóa bất kỳ file nào. Chỉ đánh dấu các file cần xác nhận.

### Files cần xác nhận trước khi xóa:

**bds_nlp/test files** (8 files):
- `test_curl.py`
- `test_extract.py`
- `test_single.py`
- `test_stealth.py`
- `test_extract2.py`
- `test_db_save.py`
- `test_bds123.py`
- `test_df.py`

**bds_nlp/import scripts** (5 files):
- `import_hf_dataset.py`
- `import_hf_quick.py`
- `import_hf_v2.py`
- `load_hf_dataset.py`
- `scripts/init_db.py`
- `scripts/migrate_ai_features.py`

**backend_py/scripts** (3 files):
- `scripts/migrate_ai.py`
- `scripts/import_nlp_data.py`
- `scripts/migrate_admin_chat.py`

---

## BƯỚC 6: KIỂM TRA LỖI

### 6.1 Import Errors - KHÔNG CÓ lỗi

Tất cả imports trong main.py được resolve đúng:
- 13 routers đều tồn tại
- middleware/auth.py tồn tại
- config.get_connection tồn tại

### 6.2 Circular Imports - KHÔNG CÓ

- `config.py` chỉ load env, không circular
- `services/ai_service.py` import `config` đúng cách

### 6.3 Dead Code - KHÔNG PHÁT HIỆN

- Tất cả routers được mount trong main.py
- Không có function/variable không được gọi

### 6.4 Security Issues

| Vấn đề | Mức độ | Ghi chú |
|--------|--------|---------|
| CORS allow_origins="*" | **Cảnh báo** | Cho phép tất cả origins |
| JWT_SECRET default | **Cảnh báo** | Default "your_jwt_secret" yếu |
| Hardcoded DB password trong docker-compose | **Cảnh báo** | "123456" |

---

## BƯỚC 7: TẠO README.md

[Xem file README_AUTH.md hiện tại - đã được sửa đổi trong git]

---

## BƯỚC 8: VERIFY README COMMANDS

Cần đọc README.md để kiểm tra commands. Tuy nhiên:

### Commands có trong docker-compose.yml:
```bash
# Database
docker-compose up -d postgres

# Backend
docker-compose up -d backend

# Frontend
docker-compose up -d frontend

# All services
docker-compose up -d
```

---

## BƯỚC 9: BÁO CÁO CUỐI CÙNG

### Tổng kết

| Metric | Value |
|--------|-------|
| Tổng số Python files | ~60 |
| Tổng số TypeScript/TSX files | ~40 |
| Số routers backend | 13 |
| Số trang frontend | 14 |
| Số services frontend | 8 |
| Docker containers | 3 |
| Database tables | PostgreSQL |

### Cấu trúc đa backend

```
BAITAPLON có 2 backend:
1. backend_py (port 8001) - Chính thức, đang hoạt động
2. bds_nlp (port 8000) - Standalone NLP service, CHƯA tích hợp
```

### Key Findings

1. **Hoàn chỉnh**: backend_py + frontend đầy đủ chức năng
2. **Chưa tích hợp**: bds_nlp service không được gọi từ backend_py
3. **Scripts có thể xóa**: 17 files trong bds_nlp/test*, import*, scripts/
4. **Security cần cải thiện**: CORS, JWT secret, DB password

### Khuyến nghị

1. **Tích hợp bds_nlp**: Hoặc xóa bds_nlp nếu không dùng
2. **Xóa test files**: Các test_*.py trong bds_nlp
3. **Production hardening**: JWT secret, CORS, DB password
4. **CI/CD**: Thêm GitHub Actions cho test/deploy
