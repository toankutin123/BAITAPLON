from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.auth import router as auth_router
from routers.user import router as user_router
from routers.market import router as market_router
from routers.predict import router as predict_router
from routers.sellers import router as sellers_router
from routers.properties import router as properties_router
from routers.ai import router as ai_router
from routers.crawl import router as crawl_router
from routers.valuation import router as valuation_router
from routers.recommendations import router as recommendations_router
from routers.dashboard import router as dashboard_router
from routers.saved_properties import router as saved_properties_router
from routers.admin import router as admin_router
from routers.admin_chat import router as admin_chat_router
from config import get_connection

app = FastAPI(
    title="BAITAPLON API",
    description="Real Estate AI Platform - Single Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Auth routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

# User management routes
app.include_router(user_router, prefix="/api/users", tags=["users"])

# Market data routes
app.include_router(market_router, prefix="/api/market", tags=["market"])

# Price prediction routes
app.include_router(predict_router, prefix="/api/predict", tags=["predict"])

# Seller management routes
app.include_router(sellers_router, prefix="/api/sellers", tags=["sellers"])

# Property management routes
app.include_router(properties_router, prefix="/api/properties", tags=["properties"])

# AI/NLP routes
app.include_router(ai_router, tags=["AI"])

# Crawl management routes
app.include_router(crawl_router, tags=["Crawl"])

# Valuation routes
app.include_router(valuation_router, tags=["Valuation"])

# Recommendation routes
app.include_router(recommendations_router, tags=["Recommendations"])

# Dashboard routes
app.include_router(dashboard_router, tags=["Dashboard"])

# Saved properties routes
app.include_router(saved_properties_router, tags=["SavedProperties"])

# Admin routes
app.include_router(admin_router, tags=["Admin"])

# Admin Chat routes
app.include_router(admin_chat_router, prefix="/api/admin/chat", tags=["AdminChat"])


@app.get("/")
def root():
    return {
        "name": "BAITAPLON API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/test-db")
def test_db():
    try:
        with get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT NOW()")
                row = cursor.fetchone()
        return {"now": row["now"], "status": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
