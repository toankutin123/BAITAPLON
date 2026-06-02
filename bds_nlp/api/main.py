from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from api.routes import listings, analytics, dashboard
from api.routes import valuation, recommendations, user_listings, ai_analytics

settings = get_settings()

app = FastAPI(
    title="BDS_NLP Dashboard API",
    description="Real Estate Data Pipeline API for crawling, analytics, AI valuation, and market insights",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(listings.router)
app.include_router(analytics.router)
app.include_router(dashboard.router)

# AI-powered features
app.include_router(valuation.router)
app.include_router(recommendations.router)
app.include_router(user_listings.router)
app.include_router(ai_analytics.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": "BDS_NLP Dashboard API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/dashboard/health"
    }


@app.get("/health")
def health():
    """Health check."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
