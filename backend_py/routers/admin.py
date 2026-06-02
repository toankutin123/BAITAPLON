"""
Admin endpoints for dashboard statistics
"""

from fastapi import APIRouter, Depends
from config import get_connection
from middleware.auth import require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(require_role(1))):
    """Get admin dashboard statistics"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Total users
            cursor.execute("SELECT COUNT(*) as count FROM users")
            total_users = cursor.fetchone()['count']
            
            # Total properties
            cursor.execute("SELECT COUNT(*) as count FROM properties")
            total_properties = cursor.fetchone()['count']
            
            # Pending properties
            cursor.execute("SELECT COUNT(*) as count FROM properties WHERE status = 'pending'")
            pending_properties = cursor.fetchone()['count']
            
            # User growth (last 6 months)
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
            
            # Property growth (last 6 months)
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


@router.get("/recent-properties")
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
