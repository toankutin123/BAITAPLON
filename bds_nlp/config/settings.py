import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = "BDS_NLP Data Pipeline"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bds_nlp"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # Crawler
    CRAWLER_HEADLESS: bool = True
    CRAWLER_TIMEOUT: int = 60000
    CRAWLER_RETRY_COUNT: int = 3
    CRAWLER_DELAY_SECONDS: float = 2.0
    CRAWLER_MAX_PAGES_PER_SOURCE: int = 50
    
    # Scheduler
    SCHEDULER_ENABLED: bool = True
    SCHEDULER_CRON_HOUR: int = 0
    SCHEDULER_CRON_MINUTE: int = 0
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False
    
    # Sources
    SOURCES: list = [
        "https://batdongsan.com.vn/ban-nha-rieng-ha-noi",
        "https://batdongsan.com.vn/ban-nha-rieng-tp-hcm",
        "https://batdongsan.com.vn/ban-nha-rieng-da-nang"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()
