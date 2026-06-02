# BAITAPLON - EstateAI Platform

Nền tảng Bất Động Sản Thông Minh với AI dự đoán giá, phân tích thị trường và quản lý giao dịch.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python) - port 8001 |
| Frontend | React + TypeScript + Vite |
| Database | PostgreSQL 16 |
| Auth | JWT + bcrypt |
| AI | OpenRouter API (Claude models) |
| Web Scraping | curl-cffi, BeautifulSoup4 |
| Container | Docker + Docker Compose |

## Quick Start

### Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8001
- **API Docs**: http://localhost:8001/docs
- **PostgreSQL**: localhost:5432

### Manual Setup

#### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 16

#### Backend

```bash
cd backend_py

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your settings

# Run server
python main.py
# Server runs at http://localhost:8001
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:8001

# Run dev server
npm run dev
# Frontend available at http://localhost:5173
```

## Project Structure

```
BAITAPLON/
├── backend_py/          # FastAPI backend (port 8001)
│   ├── main.py          # Entry point - 14 API routers
│   ├── config.py        # Database + env config
│   ├── middleware/      # JWT authentication
│   ├── models/          # Pydantic schemas
│   ├── routers/         # API endpoints
│   │   ├── auth.py      # Register, login, password reset
│   │   ├── user.py      # User management
│   │   ├── properties.py # Property CRUD + search
│   │   ├── sellers.py   # Seller registration workflow
│   │   ├── predict.py   # AI price prediction
│   │   ├── market.py    # Market data + trends
│   │   ├── valuation.py # Detailed valuation
│   │   ├── ai.py        # NLP processing
│   │   ├── crawl.py     # Web crawler management
│   │   ├── recommendations.py # Buyer recommendations
│   │   ├── dashboard.py # Dashboard statistics
│   │   ├── saved_properties.py # Saved listings
│   │   ├── admin.py     # Admin stats
│   │   └── admin_chat.py # User-Admin chat
│   ├── services/        # Business logic
│   ├── nlp/            # NLP pipeline
│   └── scripts/        # Migration scripts
├── bds_tool/           # Web scraping tool
│   ├── scraper.py      # Playwright scraper
│   └── average.json    # Price data
├── frontend/           # React frontend
│   ├── src/app/
│   │   ├── pages/      # 14 page components
│   │   ├── services/   # API services
│   │   ├── context/    # Auth context
│   │   └── components/ # UI components
│   └── ...
└── docker-compose.yml   # Container orchestration
```

## Environment Variables

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=real_estate_ai

# JWT
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# AI (Optional)
OPENROUTER_API_KEY=your_api_key
CLAUDE_API_KEY=your_api_key
CLAUDE_API_URL=https://api.anthropic.com/v1/complete
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8001
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/properties` | Search properties |
| GET | `/api/properties/:id` | Get property detail |
| POST | `/api/properties` | Create property |
| PUT | `/api/properties/:id` | Update property |
| DELETE | `/api/properties/:id` | Delete property |
| PUT | `/api/properties/:id/approve` | Approve (admin) |
| PUT | `/api/properties/:id/reject` | Reject (admin) |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/predict` | Predict property price |
| GET | `/api/market/average-prices` | Average prices by area |
| GET | `/api/market/trends` | Price trends |
| GET | `/api/market/districts` | District statistics |
| POST | `/api/valuation/estimate` | Detailed valuation |
| POST | `/api/ai/normalize` | NLP text normalization |
| POST | `/api/ai/validate` | Validate property data |
| POST | `/api/recommendations/buyer` | Buyer recommendations |

### User Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/saved-properties` | Get saved properties |
| POST | `/api/saved-properties` | Save property |
| DELETE | `/api/saved-properties/:id` | Remove saved |
| POST | `/api/sellers/request` | Request seller status |
| GET | `/api/admin/chat/my-messages` | Chat with admin |
| POST | `/api/admin/chat/messages` | Send message to admin |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard stats |
| GET | `/api/admin/recent-properties` | Recent properties |
| GET | `/api/users` | List all users |
| PUT | `/api/users/:id/role` | Update user role |
| PUT | `/api/users/:id/status` | Update user status |
| GET | `/api/admin/chat/conversations` | All conversations |
| POST | `/api/admin/chat/reply` | Reply to user |

## User Roles

| Role | ID | Permissions |
|------|----|-------------|
| Admin | 1 | Full system access |
| Seller | 2 | Create/manage properties |
| Buyer | 3 | Search, save, chat |

## Database Schema

Main tables:
- `users` - User accounts
- `properties` - Property listings
- `seller_requests` - Seller applications
- `prediction_history` - AI predictions
- `saved_properties` - User favorites
- `admin_chat_conversations` - Chat threads
- `admin_chat_messages` - Chat messages
- `crawl_sources` - Web crawl sources
- `crawl_listings` - Crawled data
- `property_valuations` - Valuation history

## Features

### Core
- User registration/login with JWT auth
- Property CRUD with approval workflow
- AI-powered price prediction
- Market analysis and trends
- Buyer recommendations based on profile

### Web Scraping
- Real estate data from multiple sources
- Price comparison and validation
- Automated data enrichment

### NLP
- Vietnamese text processing
- Entity extraction (price, area, bedrooms)
- Data deduplication
- Address normalization

### Admin
- User management (role, status)
- Property moderation
- Chat with users
- Dashboard statistics

## API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

## Troubleshooting

### Database Connection Failed
```
# Check PostgreSQL is running
docker-compose ps postgres

# Check credentials in .env
# Default: DB_PASSWORD=123456
```

### CORS Errors
Ensure frontend `.env` has correct `VITE_API_URL` pointing to backend.

### AI Prediction Not Working
Set `OPENROUTER_API_KEY` in backend `.env`.

## License

MIT
