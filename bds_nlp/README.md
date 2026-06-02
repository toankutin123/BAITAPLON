# BDS NLP - AI-Powered Real Estate Platform

## Features

### 1. Crawler & Data Collection
- Web crawler for real estate listings from multiple sources
- Playwright-based browser automation with anti-detection
- ETL pipeline for data extraction, transformation, and loading

### 2. AI Property Valuation
- Automatic property valuation based on comparable market data
- Progressive search expansion (street → ward → district → city)
- Price assessment (below market / fair / above market)
- Confidence scoring based on data availability

### 3. Smart Property Search
- AI-powered property recommendations with match scoring
- Weight-based scoring: Location (40%), Price (30%), Area (15%), Amenities (15%)
- Alternative suggestions when exact matches are limited
- Detailed analysis with strengths, weaknesses, and reasoning

### 4. AI Analytics Dashboard
- Market overview with real-time statistics
- District rankings by price and listing count
- Rising/declining area trends
- Market health score (0-100)
- Top searched and recommended areas

### 5. User Listings
- Post properties for sale/rent
- Automatic AI analysis and valuation
- Price competitiveness assessment
- Suggested price range

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Crawler   │────▶│  Data Pipeline  │────▶│   PostgreSQL DB   │
└─────────────┘     └─────────────────┘     └──────────────────┘
                            │                        │
                            ▼                        ▼
                    ┌─────────────────┐     ┌──────────────────┐
                    │   AI Services   │◀────▶│   API Layer      │
                    │  - Valuation    │      │  - FastAPI       │
                    │  - Recommend    │      │  - REST API      │
                    │  - Analytics    │      └──────────────────┘
                    └─────────────────┘              │
                                                  ▼
                                          ┌──────────────────┐
                                          │   Frontend       │
                                          │  - React + Vite  │
                                          │  - TailwindCSS   │
                                          └──────────────────┘
```

## Database Schema

### New Tables (AI Features)

| Table | Description |
|-------|-------------|
| `user_listings` | User-submitted listings for sale/rent |
| `property_valuations` | AI-generated valuations |
| `user_search_profiles` | User search preferences |
| `property_recommendations` | Personalized recommendations |
| `market_insights` | AI-generated market insights |
| `dashboard_metrics` | Pre-computed dashboard data |

## API Endpoints

### Valuation
- `POST /valuation/property` - Get property valuation
- `GET /valuation/comparable` - Get comparable properties
- `GET /valuation/market-analysis` - Get market analysis

### Recommendations
- `POST /recommendations/search` - Smart property search
- `GET /recommendations/for-you` - Personalized recommendations
- `GET /recommendations/similar/{id}` - Similar properties
- `GET /recommendations/under-valued` - Undervalued properties

### User Listings
- `POST /listings/user` - Create user listing
- `GET /listings/user/{id}` - Get listing details
- `GET /listings/user` - List user listings
- `POST /listings/user/{id}/refresh-analysis` - Refresh AI analysis

### Analytics
- `GET /analytics/dashboard` - AI Analytics Dashboard
- `GET /analytics/market-overview` - Market overview
- `GET /analytics/district-rankings` - District rankings
- `GET /analytics/area-trends` - Area trends
- `GET /analytics/market-health` - Market health score

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Migration
```bash
python scripts/migrate_ai_features.py
```

### 3. Run API Server
```bash
uvicorn api.main:app --reload
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bds_nlp
DEBUG=true
LOG_LEVEL=INFO
```

## Example Usage

### Property Valuation
```bash
curl -X POST http://localhost:8000/valuation/property \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Hà Nội",
    "district": "Cầu Giấy",
    "property_type": "house",
    "area": 100,
    "price": 5000000000
  }'
```

### Smart Search
```bash
curl -X POST http://localhost:8000/recommendations/search \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Hà Nội",
    "district": "Cầu Giấy",
    "budget_max": 5000000000,
    "min_area": 60,
    "min_bedrooms": 2
  }'
```

### Dashboard
```bash
curl http://localhost:8000/analytics/dashboard?city=Hà%20Nội
```

## Technology Stack

- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: PostgreSQL
- **Crawler**: Playwright, BeautifulSoup
- **NLP**: Underthesea (Vietnamese NLP)
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Charts**: Recharts
