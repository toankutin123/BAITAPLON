# Database Schema - BDS_NLP Data Pipeline

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────────┐
│   locations      │       │      listings        │
├─────────────────┤       ├─────────────────────┤
│ PK id            │◄──────│ FK location_id       │
│    city          │       │ PK id                │
│    district      │       │    title             │
│    ward          │       │    price             │
│    full_address  │       │    area              │
│    lat/lng       │       │    price_per_m2      │
│    created_at    │       │    property_type     │
└─────────────────┘       │    bedrooms          │
                          │    bathrooms         │
                          │    direction         │
                          │    legal_status      │
                          │    description       │
                          │    images            │
                          │    url               │
                          │    source_id         │
                          │    status            │
                          │    created_at        │
                          │    updated_at        │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  listing_versions    │
                          ├─────────────────────┤
                          │ PK id                │
                          │ FK listing_id        │
                          │    field_changed     │
                          │    old_value         │
                          │    new_value         │
                          │    version_number    │
                          │    crawl_job_id      │
                          │    created_at        │
                          └──────────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│   crawl_jobs    │       │      crawl_logs     │
├─────────────────┤       ├─────────────────────┤
│ PK id            │◄──────│ FK crawl_job_id     │
│    status        │       │ PK id               │
│    started_at    │       │    level            │
│    finished_at   │       │    message          │
│    listings_added│       │    context          │
│    listings_updated       │    created_at      │
│    errors_count │       └─────────────────────┘
│    created_at   │
└─────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│  price_history  │       │  area_statistics    │
├─────────────────┤       ├─────────────────────┤
│ PK id            │       │ PK id               │
│ FK listing_id    │       │ FK location_id      │
│    price         │       │    date             │
│    recorded_at   │       │    avg_price        │
└─────────────────┘       │    median_price      │
                          │    avg_price_per_m2  │
                          │    total_listings    │
                          │    new_listings      │
                          │    removed_listings  │
                          │    absorption_rate   │
                          │    price_change_pct  │
                          │    created_at        │
                          └──────────────────────┘

┌─────────────────┐
│  anomaly_log   │
├─────────────────┤
│ PK id            │
│ FK listing_id    │
│    anomaly_type │
│    description  │
│    severity     │
│    detected_at  │
│    resolved_at  │
│    resolved     │
└─────────────────┘
```

---

## Table Definitions

### 1. locations

Bảng lưu trữ thông tin địa lý theo cấu trúc phân cấp.

```sql
CREATE TABLE locations (
    id              SERIAL PRIMARY KEY,
    city            VARCHAR(100) NOT NULL,
    district        VARCHAR(100) NOT NULL,
    ward            VARCHAR(100),
    full_address    VARCHAR(500),
    
    -- Geocoding
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    
    -- Metadata
    population      INTEGER,
    area_km2        DECIMAL(10, 2),
    
    -- Normalization
    city_normalized     VARCHAR(100),
    district_normalized VARCHAR(100),
    ward_normalized     VARCHAR(100),
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_location UNIQUE (city, district, ward)
);

-- Indexes
CREATE INDEX idx_locations_city ON locations(city);
CREATE INDEX idx_locations_district ON locations(district);
CREATE INDEX idx_locations_ward ON locations(ward);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_locations_normalized ON locations(city_normalized, district_normalized);
```

### 2. listings

Bảng chính lưu trữ thông tin bất động sản.

```sql
CREATE TABLE listings (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER REFERENCES locations(id),
    
    -- Basic Info
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    
    -- Price (in VND)
    price           BIGINT,
    price_per_m2    BIGINT,
    price_rent      BIGINT,
    
    -- Physical Properties
    area            DECIMAL(12, 2),          -- m²
    bedrooms        INTEGER,
    bathrooms       INTEGER,
    floors          INTEGER,
    
    -- Orientation & Legal
    direction       VARCHAR(50),
    legal_status    VARCHAR(100),
    
    -- Property Type
    property_type   VARCHAR(50),             -- house, apartment, land, etc.
    
    -- Media
    images          JSONB DEFAULT '[]',      -- Array of image URLs
    
    -- Source Tracking
    source_id       VARCHAR(100) UNIQUE,     -- ID from source website
    url             VARCHAR(1000) UNIQUE,
    
    -- Status
    status          VARCHAR(20) DEFAULT 'active',  -- active, sold, rented, expired
    
    -- Timestamps
    posted_date     DATE,
    updated_date    DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_crawled_at TIMESTAMP,
    
    -- Versioning
    current_version INTEGER DEFAULT 1,
    
    -- Soft delete
    deleted_at      TIMESTAMP
);

-- Indexes
CREATE INDEX idx_listings_location ON listings(location_id);
CREATE INDEX idx_listings_price ON listings(price) WHERE price IS NOT NULL;
CREATE INDEX idx_listings_area ON listings(area) WHERE area IS NOT NULL;
CREATE INDEX idx_listings_price_per_m2 ON listings(price_per_m2) WHERE price_per_m2 IS NOT NULL;
CREATE INDEX idx_listings_property_type ON listings(property_type);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_posted_date ON listings(posted_date);
CREATE INDEX idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX idx_listings_source_id ON listings(source_id);

-- Composite indexes for analytics
CREATE INDEX idx_listings_loc_price ON listings(location_id, price);
CREATE INDEX idx_listings_loc_area ON listings(location_id, area);
CREATE INDEX idx_listings_type_price ON listings(property_type, price);

-- Full text search
CREATE INDEX idx_listings_title_fts ON listings USING gin(to_tsvector('vietnamese', title));
CREATE INDEX idx_listings_desc_fts ON listings USING gin(to_tsvector('vietnamese', description));
```

### 3. listing_versions

Bảng lưu trữ lịch sử thay đổi của từng listing.

```sql
CREATE TABLE listing_versions (
    id              SERIAL PRIMARY KEY,
    listing_id      INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    crawl_job_id    INTEGER REFERENCES crawl_jobs(id),
    
    -- Version info
    version_number  INTEGER NOT NULL,
    
    -- Change tracking
    field_changed   VARCHAR(50) NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    old_value_numeric BIGINT,
    new_value_numeric BIGINT,
    
    -- Full snapshot (JSON)
    snapshot        JSONB,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_listing_version UNIQUE (listing_id, version_number)
);

-- Indexes
CREATE INDEX idx_versions_listing ON listing_versions(listing_id);
CREATE INDEX idx_versions_listing_created ON listing_versions(listing_id, created_at DESC);
CREATE INDEX idx_versions_field ON listing_versions(field_changed);
CREATE INDEX idx_versions_job ON listing_versions(crawl_job_id);
```

### 4. crawl_jobs

Bảng theo dõi mỗi lần chạy crawler.

```sql
CREATE TABLE crawl_jobs (
    id              SERIAL PRIMARY KEY,
    
    -- Status
    status          VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
    
    -- Timing
    started_at      TIMESTAMP,
    finished_at     TIMESTAMP,
    duration_secs   INTEGER GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (finished_at - started_at))::INTEGER
    ) STORED,
    
    -- Statistics
    pages_crawled   INTEGER DEFAULT 0,
    listings_found  INTEGER DEFAULT 0,
    listings_added  INTEGER DEFAULT 0,
    listings_updated INTEGER DEFAULT 0,
    listings_removed INTEGER DEFAULT 0,
    errors_count    INTEGER DEFAULT 0,
    
    -- Configuration
    sources         JSONB DEFAULT '[]',
    max_pages       INTEGER DEFAULT 10,
    
    -- Error info
    error_message   TEXT,
    error_traceback TEXT,
    
    -- Trigger
    triggered_by    VARCHAR(50) DEFAULT 'scheduler',  -- scheduler, manual, api
    manual_params    JSONB,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_jobs_status ON crawl_jobs(status);
CREATE INDEX idx_jobs_started ON crawl_jobs(started_at DESC);
CREATE INDEX idx_jobs_triggered_by ON crawl_jobs(triggered_by);
```

### 5. crawl_logs

Bảng log chi tiết cho từng operation.

```sql
CREATE TABLE crawl_logs (
    id              SERIAL PRIMARY KEY,
    crawl_job_id    INTEGER REFERENCES crawl_jobs(id) ON DELETE CASCADE,
    
    -- Log info
    level           VARCHAR(10) NOT NULL,      -- DEBUG, INFO, WARNING, ERROR
    message         TEXT NOT NULL,
    context         JSONB DEFAULT '{}',
    
    -- Source info
    url             VARCHAR(1000),
    listing_id      INTEGER,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_logs_job ON crawl_logs(crawl_job_id);
CREATE INDEX idx_logs_level ON crawl_logs(level);
CREATE INDEX idx_logs_created ON crawl_logs(created_at DESC);
CREATE INDEX idx_logs_listing ON crawl_logs(listing_id) WHERE listing_id IS NOT NULL;
```

### 6. price_history

Bảng lưu lịch sử giá theo thời gian.

```sql
CREATE TABLE price_history (
    id              SERIAL PRIMARY KEY,
    listing_id      INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    
    -- Price snapshot
    price           BIGINT NOT NULL,
    price_per_m2    BIGINT,
    
    -- Timing
    recorded_at     DATE NOT NULL DEFAULT CURRENT_DATE,
    crawl_job_id    INTEGER REFERENCES crawl_jobs(id),
    
    -- Source
    source_url      VARCHAR(1000),
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_listing_date UNIQUE (listing_id, recorded_at)
);

-- Indexes
CREATE INDEX idx_price_history_listing ON price_history(listing_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_listing_recorded ON price_history(listing_id, recorded_at DESC);
```

### 7. area_statistics

Bảng thống kê tổng hợp theo khu vực (ward, district, city).

```sql
CREATE TABLE area_statistics (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES locations(id),
    
    -- Period
    date            DATE NOT NULL,
    period_type     VARCHAR(10) NOT NULL,      -- daily, weekly, monthly
    
    -- Price metrics
    avg_price       BIGINT,
    median_price    BIGINT,
    min_price       BIGINT,
    max_price       BIGINT,
    avg_price_per_m2 BIGINT,
    median_price_per_m2 BIGINT,
    
    -- Listing metrics
    total_listings      INTEGER DEFAULT 0,
    new_listings        INTEGER DEFAULT 0,
    removed_listings    INTEGER DEFAULT 0,
    active_listings     INTEGER DEFAULT 0,
    
    -- Trend metrics
    price_change_pct    DECIMAL(8, 4),         -- % change from previous period
    price_change_abs    BIGINT,
    volume_change_pct   DECIMAL(8, 4),
    
    -- Absorption rate
    absorption_rate     DECIMAL(5, 2),          -- (new - removed) / total * 100
    
    -- Price distribution
    price_percentile_25 BIGINT,
    price_percentile_75 BIGINT,
    price_std_dev       BIGINT,
    
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT uq_area_date_period UNIQUE (location_id, date, period_type)
);

-- Indexes
CREATE INDEX idx_area_stats_location ON area_statistics(location_id);
CREATE INDEX idx_area_stats_date ON area_statistics(date DESC);
CREATE INDEX idx_area_stats_period ON area_statistics(period_type);
CREATE INDEX idx_area_stats_change ON area_statistics(price_change_pct DESC);
```

### 8. anomaly_log

Bảng theo dõi các anomalies phát hiện được.

```sql
CREATE TABLE anomaly_log (
    id              SERIAL PRIMARY KEY,
    listing_id      INTEGER REFERENCES listings(id) ON DELETE SET NULL,
    location_id     INTEGER REFERENCES locations(id),
    
    -- Anomaly info
    anomaly_type    VARCHAR(50) NOT NULL,      -- price_drop, price_surge, suspicious, duplicate
    severity        VARCHAR(10) NOT NULL,       -- low, medium, high, critical
    description     TEXT,
    
    -- Values at detection time
    detected_price  BIGINT,
    expected_price_range_min BIGINT,
    expected_price_range_max BIGINT,
    deviation_pct   DECIMAL(8, 4),
    
    -- Resolution
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMP,
    resolution_notes TEXT,
    
    -- Timing
    detected_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Related data
    crawl_job_id    INTEGER REFERENCES crawl_jobs(id),
    related_listing_id INTEGER REFERENCES listings(id)
);

-- Indexes
CREATE INDEX idx_anomaly_listing ON anomaly_log(listing_id);
CREATE INDEX idx_anomaly_location ON anomaly_log(location_id);
CREATE INDEX idx_anomaly_type ON anomaly_log(anomaly_type);
CREATE INDEX idx_anomaly_severity ON anomaly_log(severity);
CREATE INDEX idx_anomaly_resolved ON anomaly_log(resolved);
CREATE INDEX idx_anomaly_detected ON anomaly_log(detected_at DESC);
```

---

## Partitioning Strategy

### For large scale (1M+ listings)

```sql
-- Partition price_history by month
CREATE TABLE price_history_partitioned (
    LIKE price_history INCLUDING ALL
) PARTITION BY RANGE (recorded_at);

CREATE TABLE price_history_2024_01 PARTITION OF price_history_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE price_history_2024_02 PARTITION OF price_history_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Continue for other months...

-- Partition area_statistics by month
CREATE TABLE area_statistics_partitioned (
    LIKE area_statistics INCLUDING ALL
) PARTITION BY RANGE (date);

-- Partition crawl_logs by week
CREATE TABLE crawl_logs_partitioned (
    LIKE crawl_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

---

## Views for Common Queries

### Active Listings Summary
```sql
CREATE VIEW v_active_listings AS
SELECT 
    l.*,
    loc.city,
    loc.district,
    loc.ward
FROM listings l
LEFT JOIN locations loc ON l.location_id = loc.id
WHERE l.deleted_at IS NULL 
    AND l.status = 'active';
```

### Price Change Summary
```sql
CREATE VIEW v_price_changes AS
SELECT 
    l.id,
    l.title,
    loc.district,
    loc.city,
    lv.field_changed,
    lv.old_value_numeric,
    lv.new_value_numeric,
    CASE 
        WHEN lv.old_value_numeric > 0 THEN 
            ROUND((lv.new_value_numeric - lv.old_value_numeric)::NUMERIC / lv.old_value_numeric * 100, 2)
        ELSE NULL
    END as change_pct,
    lv.created_at
FROM listing_versions lv
JOIN listings l ON lv.listing_id = l.id
LEFT JOIN locations loc ON l.location_id = loc.id
WHERE lv.field_changed = 'price'
ORDER BY lv.created_at DESC;
```

### Area Trend Summary
```sql
CREATE VIEW v_area_trends AS
SELECT 
    loc.district,
    loc.city,
    as1.date,
    as1.avg_price,
    as1.total_listings,
    as1.price_change_pct,
    LAG(as1.avg_price) OVER (PARTITION BY loc.id ORDER BY as1.date) as prev_avg_price,
    LAG(as1.total_listings) OVER (PARTITION BY loc.id ORDER BY as1.date) as prev_total_listings
FROM area_statistics as1
JOIN locations loc ON as1.location_id = loc.id
WHERE as1.period_type = 'daily'
ORDER BY as1.date DESC, loc.district;
```

---

## Functions

### Auto-update updated_at trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Get listing history
```sql
CREATE OR REPLACE FUNCTION get_listing_history(listing_id_param INTEGER)
RETURNS TABLE (
    version_number INTEGER,
    field_changed VARCHAR,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lv.version_number,
        lv.field_changed,
        lv.old_value,
        lv.new_value,
        lv.created_at
    FROM listing_versions lv
    WHERE lv.listing_id = listing_id_param
    ORDER BY lv.version_number DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Estimated Storage

| Table | Est. Rows | Est. Size (100K listings) |
|-------|-----------|---------------------------|
| listings | 100,000 | ~500 MB |
| listing_versions | 300,000 | ~300 MB |
| locations | 10,000 | ~10 MB |
| price_history | 500,000 | ~200 MB |
| area_statistics | 50,000 | ~50 MB |
| crawl_logs | 1,000,000 | ~500 MB |
| crawl_jobs | 365 | ~1 MB |
| anomaly_log | 10,000 | ~20 MB |
| **Total** | | **~1.6 GB** |

---

## Cost Estimation (Cloud)

### AWS (us-east-1)
- RDS PostgreSQL db.r6g.large: ~$200/month
- EBS Storage 2TB: ~$200/month
- Total: ~$400/month

### Google Cloud
- Cloud SQL PostgreSQL db-n1-standard-2: ~$150/month
- Persistent Disk 2TB: ~$170/month
- Total: ~$320/month

### Azure
- Azure Database for PostgreSQL: ~$180/month
- Managed Disk 2TB: ~$180/month
- Total: ~$360/month
