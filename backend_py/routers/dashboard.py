"""
Dashboard endpoints for analytics
"""

from fastapi import APIRouter, Depends
from models.schemas import (
    DashboardStats, TopGainer, TopLoser, DashboardResponse
)
from middleware.auth import require_role
from services.market_analysis_service import market_analysis_service
from config import get_connection

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


# Admin Stats (mirrored for convenience)
@router.get("/admin/stats")
async def get_admin_stats(current_user: dict = Depends(require_role(1))):
    """Get admin dashboard statistics"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM properties")
            total_properties = cursor.fetchone()['count']

            cursor.execute("SELECT COUNT(*) as count FROM properties WHERE status = 'pending'")
            pending_properties = cursor.fetchone()['count']

            cursor.execute("""
                SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
                FROM users
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """)
            users_growth = [
                {'month': r['month'].strftime('%Y-%m'), 'count': r['count']}
                for r in cursor.fetchall()
            ]

            cursor.execute("""
                SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count
                FROM properties
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month
            """)
            property_growth = [
                {'month': r['month'].strftime('%Y-%m'), 'count': r['count']}
                for r in cursor.fetchall()
            ]

        return {
            'total_users': total_users,
            'total_properties': total_properties,
            'pending_properties': pending_properties,
            'total_revenue': 0,
            'users_growth': users_growth,
            'property_growth': property_growth
        }
    finally:
        conn.close()


@router.get("/admin/recent-properties")
async def get_recent_properties(limit: int = 10, current_user: dict = Depends(require_role(1))):
    """Get recent properties"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.*, u.username, u.full_name
                FROM properties p
                LEFT JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
                LIMIT %s
            """, (limit,))
            properties = cursor.fetchall()
        return {'properties': properties}
    finally:
        conn.close()


@router.get("/trends")
async def get_trends(
    district: str = None,
    city: str = "TP.HCM",
    property_type: str = None,
    period: str = "monthly"
):
    """Get price trends over time"""
    return market_analysis_service.get_price_trends(
        district=district,
        city=city,
        property_type=property_type,
        period=period
    )


@router.get("/districts")
async def get_districts(city: str = "TP.HCM"):
    """Get statistics by district"""
    return market_analysis_service.get_district_stats(city=city)


@router.get("/forecast")
async def get_forecast(district: str = None, city: str = "TP.HCM"):
    """Get price forecast"""
    trends = market_analysis_service.get_price_trends(district=district, city=city)
    return {
        "forecast": trends.get("forecast", {}),
        "current_avg": trends.get("current_avg_price", 0),
        "trend": trends.get("trend_direction", "stable")
    }


@router.get("/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    summary = market_analysis_service.get_market_summary()
    
    stats = DashboardStats(
        total_properties=summary.get('total_listings', 0),
        total_users=summary.get('total_users', 0),
        avg_price=summary.get('avg_price', 0),
        avg_price_change=summary.get('avg_price_change', 0),
        new_listings_today=summary.get('new_listings_today', 0),
        active_crawlers=0
    )
    
    return {"stats": stats}


@router.get("/top-gainers")
async def get_top_gainers(limit: int = 10):
    """Get top districts with highest price increase"""
    district_stats = market_analysis_service.get_district_stats()
    
    gainers = []
    for d in district_stats.get('districts', []):
        if d.get('change_30d', 0) > 0:
            gainers.append(TopGainer(
                district=d['district'],
                change_percent=d['change_30d'],
                current_avg=d['avg_price_per_m2'],
                previous_avg=d['avg_price_per_m2'] / (1 + d['change_30d']/100)
            ))
    
    gainers.sort(key=lambda x: x.change_percent, reverse=True)
    return {"gainers": gainers[:limit]}


@router.get("/top-losers")
async def get_top_losers(limit: int = 10):
    """Get top districts with highest price decrease"""
    district_stats = market_analysis_service.get_district_stats()
    
    losers = []
    for d in district_stats.get('districts', []):
        if d.get('change_30d', 0) < 0:
            losers.append(TopLoser(
                district=d['district'],
                change_percent=abs(d['change_30d']),
                current_avg=d['avg_price_per_m2'],
                previous_avg=d['avg_price_per_m2'] / (1 + d['change_30d']/100)
            ))
    
    losers.sort(key=lambda x: x.change_percent, reverse=True)
    return {"losers": losers[:limit]}


@router.get("/summary")
async def get_dashboard_summary():
    """Get complete dashboard summary"""
    summary = market_analysis_service.get_market_summary()
    district_stats = market_analysis_service.get_district_stats()
    
    stats = DashboardStats(
        total_properties=summary.get('total_listings', 0),
        total_users=summary.get('total_users', 0),
        avg_price=summary.get('avg_price', 0),
        avg_price_change=summary.get('avg_price_change', 0),
        new_listings_today=summary.get('new_listings_today', 0),
        active_crawlers=0
    )
    
    gainers = [
        TopGainer(
            district=d['district'],
            change_percent=d['change_30d'],
            current_avg=d['avg_price_per_m2'],
            previous_avg=d['avg_price_per_m2'] / (1 + d['change_30d']/100) if d['change_30d'] != 0 else d['avg_price_per_m2']
        )
        for d in district_stats.get('districts', [])[:5]
        if d.get('change_30d', 0) > 0
    ]
    gainers.sort(key=lambda x: x.change_percent, reverse=True)
    
    losers = [
        TopLoser(
            district=d['district'],
            change_percent=abs(d['change_30d']),
            current_avg=d['avg_price_per_m2'],
            previous_avg=d['avg_price_per_m2'] / (1 + d['change_30d']/100) if d['change_30d'] != 0 else d['avg_price_per_m2']
        )
        for d in district_stats.get('districts', [])[:5]
        if d.get('change_30d', 0) < 0
    ]
    losers.sort(key=lambda x: x.change_percent, reverse=True)
    
    return DashboardResponse(
        stats=stats,
        top_gainers=gainers,
        top_losers=losers,
        recent_activity=[]
    )
