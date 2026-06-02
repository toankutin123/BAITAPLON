# BDS_NLP Data Pipeline Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCHEDULER (APScheduler)                           │
│                          00:00 Daily / Manual Trigger                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ETL PIPELINE LAYER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │   EXTRACT   │→ │  TRANSFORM  │→ │   LOAD      │→ │   VERSIONING    │   │
│  │  (Crawler)  │  │   (NLP)     │  │  (Postgres) │  │   (Audit Log)   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER (PostgreSQL)                           │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │listings  │  │listing_      │  │  locations │  │   price_history    │   │
│  │          │  │versions      │  │            │  │                    │   │
│  └──────────┘  └──────────────┘  └────────────┘  └────────────────────┘   │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────────┐   │
│  │crawl_    │  │  crawl_jobs  │  │area_       │  │   anomaly_log      │   │
│  │logs      │  │              │  │statistics  │  │                    │   │
│  └──────────┘  └──────────────┘  └────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANALYTICS & DASHBOARD LAYER                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │  Area Stats │  │ Price Trend │  │  Anomaly    │  │   Dashboard     │   │
│  │  Service    │  │  Service    │  │  Detection  │  │   API (FastAPI) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           VISUALIZATION (Optional)                          │
│              Metabase / Superset / Grafana / Custom React UI                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Crawl Phase
- Scheduler triggers at 00:00 daily
- Crawler extracts listings from batdongsan.com.vn
- Each listing is stored with raw HTML + parsed data

### 2. Extract Phase
- Parse HTML to structured data
- Extract: title, price, area, address, bedrooms, bathrooms, etc.
- NLP processing for location detection

### 3. Transform Phase
- Normalize addresses (ward, district, city)
- Standardize prices (convert all to VND)
- Calculate derived fields (price_per_m2)
- Deduplicate and validate

### 4. Load Phase
- Upsert to listings table
- Create version record for any changes
- Update price_history table
- Log crawl operation

### 5. Analytics Phase
- Aggregate statistics by area
- Calculate trends (price change, supply change)
- Detect anomalies
- Update area_statistics table

## Versioning Strategy

Every change to a listing creates a new version record:

```
Listing A - Price Change
├── Version 1 (2024-01-01): Price = 5,000,000,000 VND
├── Version 2 (2024-01-15): Price = 4,800,000,000 VND  ← Change detected
└── Version 3 (2024-02-01): Price = 4,500,000,000 VND  ← Change detected

Changes tracked:
- field_changed: "price"
- old_value: 5000000000
- new_value: 4800000000
- timestamp: 2024-01-15 00:00:00
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Crawler | Playwright + BeautifulSoup4 | Web scraping |
| NLP | underthesea + regex | Text processing |
| Database | PostgreSQL 15+ | Primary data store |
| ORM | SQLAlchemy 2.0 | Database operations |
| API | FastAPI | Dashboard endpoints |
| Scheduler | APScheduler | Job scheduling |
| Cache | Redis (optional) | Performance optimization |
| Container | Docker Compose | Deployment |

## Scaling Considerations

### For 100K listings:
- 1 crawler instance (8GB RAM)
- 1 PostgreSQL instance (4 vCPU, 16GB RAM)
- 1 API instance

### For 1M listings:
- 3-5 crawler instances (parallel)
- PostgreSQL with read replicas
- Redis for hot data cache
- Background analytics worker

## File Structure

```
bds_nlp/
├── config/
│   ├── __init__.py
│   ├── settings.py          # Environment configuration
│   └── database.py          # DB connection config
├── models/
│   ├── __init__.py
│   ├── listing.py           # Listing ORM model
│   ├── location.py          # Location model
│   ├── version.py           # Version tracking
│   ├── crawl.py             # Crawl log models
│   └── analytics.py         # Statistics models
├── crawler/
│   ├── __init__.py
│   ├── base.py              # Base crawler class
│   ├── scraper.py           # Detail page scraper
│   ├── list_crawler.py      # Listing page crawler
│   └── sources/
│       ├── __init__.py
│       └── batdongsan.py    # batdongsan.com.vn scraper
├── pipeline/
│   ├── __init__.py
│   ├── scheduler.py         # Job scheduler
│   ├── etl.py               # ETL orchestrator
│   ├── extractor.py        # Data extraction
│   ├── transformer.py       # Data transformation
│   └── loader.py            # Data loading
├── services/
│   ├── __init__.py
│   ├── versioning.py        # Change detection & versioning
│   ├── analytics.py         # Statistics calculation
│   └── anomaly.py           # Anomaly detection
├── api/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── dashboard.py     # Dashboard endpoints
│   │   ├── listings.py      # Listing endpoints
│   │   └── analytics.py     # Analytics endpoints
│   └── schemas/
│       ├── __init__.py
│       ├── listing.py       # Pydantic schemas
│       └── analytics.py     # Analytics schemas
├── utils/
│   ├── __init__.py
│   ├── normalizer.py        # Address normalization
│   ├── price_parser.py      # Price extraction
│   └── logger.py            # Logging setup
├── scripts/
│   ├── init_db.py           # Database initialization
│   └── seed_locations.py   # Location seed data
├── tests/
│   ├── __init__.py
│   ├── test_crawler.py
│   ├── test_pipeline.py
│   └── test_analytics.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── main.py                  # Entry point
```
