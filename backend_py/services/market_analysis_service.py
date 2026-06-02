"""
Market Analysis Service for price trends and forecasting
"""

from typing import Optional
from datetime import datetime, timedelta
from config import get_connection


class MarketAnalysisService:
    """Service for analyzing market trends and forecasting"""
    
    def __init__(self):
        self.cache_duration = 3600
    
    def get_price_trends(
        self,
        district: Optional[str] = None,
        city: str = "TP.HCM",
        property_type: Optional[str] = None,
        period: str = "monthly"
    ) -> dict:
        """
        Get price trends over time
        """
        trends = self._get_historical_trends(district, city, property_type, period)
        
        if not trends:
            return self._empty_trend_response()
        
        current_avg = trends[-1]['avg_price'] if trends else 0
        previous_avg = trends[-2]['avg_price'] if len(trends) >= 2 else current_avg
        
        if previous_avg > 0:
            change_percent = ((current_avg - previous_avg) / previous_avg) * 100
        else:
            change_percent = 0
        
        trend_direction = "up" if change_percent > 1 else "down" if change_percent < -1 else "stable"
        
        forecast = self._forecast_next_period(trends)
        
        return {
            'trends': trends,
            'current_avg_price': current_avg,
            'change_percent': round(change_percent, 2),
            'trend_direction': trend_direction,
            'forecast': forecast
        }
    
    def _get_historical_trends(
        self,
        district: Optional[str],
        city: str,
        property_type: Optional[str],
        period: str
    ) -> list[dict]:
        """Get historical price data"""
        conn = get_connection()
        trends = []
        
        try:
            with conn.cursor() as cursor:
                date_trunc = {
                    'daily': 'day',
                    'weekly': 'week',
                    'monthly': 'month',
                    'quarterly': 'quarter',
                    'yearly': 'year'
                }.get(period, 'month')
                
                query = f"""
                    SELECT 
                        DATE_TRUNC('{date_trunc}', recorded_at) as period_start,
                        AVG(price_per_m2) as avg_price,
                        MIN(price_per_m2) as min_price,
                        MAX(price_per_m2) as max_price,
                        COUNT(*) as listing_count
                    FROM price_history
                    WHERE 1=1
                """
                params = []
                
                if district:
                    query += " AND district = %s"
                    params.append(district)
                
                query += " AND city = %s"
                params.append(city)
                
                if property_type:
                    query += " AND property_type = %s"
                    params.append(property_type)
                
                query += f"""
                    GROUP BY DATE_TRUNC('{date_trunc}', recorded_at)
                    ORDER BY period_start DESC
                    LIMIT 24
                """
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                trends = [
                    {
                        'period_start': row['period_start'].isoformat() if row['period_start'] else None,
                        'avg_price': int(row['avg_price']) if row['avg_price'] else 0,
                        'min_price': int(row['min_price']) if row['min_price'] else 0,
                        'max_price': int(row['max_price']) if row['max_price'] else 0,
                        'listing_count': row['listing_count']
                    }
                    for row in reversed(rows)
                ]
        finally:
            conn.close()
        
        if not trends:
            trends = self._generate_mock_trends(district, period)
        
        return trends
    
    def _generate_mock_trends(self, district: Optional[str], period: str) -> list[dict]:
        """Generate mock trends for demo"""
        months = 12 if period == "monthly" else 24
        trends = []
        base_price = 50000000
        
        for i in range(months):
            date = datetime.now() - timedelta(days=30 * (months - i - 1))
            base_price *= 1.02
            noise = (i % 3 - 1) * 2000000
            
            trends.append({
                'period_start': date.strftime('%Y-%m-01'),
                'avg_price': int(base_price + noise),
                'min_price': int(base_price * 0.8),
                'max_price': int(base_price * 1.3),
                'listing_count': 100 + i * 10
            })
        
        return trends
    
    def _forecast_next_period(self, trends: list[dict]) -> dict:
        """Simple moving average forecast"""
        if len(trends) < 3:
            return {'forecast_price': 0, 'confidence': 0}
        
        recent = trends[-3:]
        avg_change = 0
        
        for i in range(1, len(recent)):
            if recent[i-1]['avg_price'] > 0:
                change = (recent[i]['avg_price'] - recent[i-1]['avg_price']) / recent[i-1]['avg_price']
                avg_change += change
        
        avg_change /= (len(recent) - 1)
        
        last_price = trends[-1]['avg_price']
        forecast_price = last_price * (1 + avg_change)
        
        variance = sum((t['avg_price'] - last_price) ** 2 for t in recent) / len(recent)
        std_dev = variance ** 0.5
        confidence = max(0.1, min(0.9, 1 - (std_dev / last_price)))
        
        return {
            'forecast_price': int(forecast_price),
            'forecast_change': round(avg_change * 100, 2),
            'confidence': round(confidence, 2)
        }
    
    def _empty_trend_response(self) -> dict:
        return {
            'trends': [],
            'current_avg_price': 0,
            'change_percent': 0,
            'trend_direction': 'stable',
            'forecast': {'forecast_price': 0, 'confidence': 0}
        }
    
    def get_district_stats(
        self,
        city: str = "TP.HCM",
        property_type: Optional[str] = None
    ) -> dict:
        """Get statistics by district"""
        conn = get_connection()
        districts = []
        
        try:
            with conn.cursor() as cursor:
                query = """
                    SELECT 
                        district,
                        AVG(p.price / NULLIF(p.area, 0)) as avg_price_per_m2,
                        COUNT(*) as total_listings,
                        MIN(p.price / NULLIF(p.area, 0)) as min_price,
                        MAX(p.price / NULLIF(p.area, 0)) as max_price
                    FROM properties p
                    WHERE p.status = 'approved'
                    AND p.city = %s
                    AND p.price > 0 AND p.area > 0
                """
                params = [city]
                
                if property_type:
                    query += " AND p.property_type = %s"
                    params.append(property_type)
                
                query += " GROUP BY p.district ORDER BY avg_price_per_m2 DESC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                district_prices = {}
                for row in rows:
                    if row['district']:
                        district_prices[row['district']] = {
                            'avg': int(row['avg_price_per_m2']) if row['avg_price_per_m2'] else 0,
                            'count': row['total_listings']
                        }
                
                change_query = """
                    SELECT district, AVG(price_per_m2) as avg_price
                    FROM price_history
                    WHERE recorded_at >= CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY district
                """
                cursor.execute(change_query)
                price_30d = {r['district']: int(r['avg_price']) for r in cursor.fetchall() if r['district']}
                
                change_query_90d = """
                    SELECT district, AVG(price_per_m2) as avg_price
                    FROM price_history
                    WHERE recorded_at >= CURRENT_DATE - INTERVAL '90 days'
                    AND recorded_at < CURRENT_DATE - INTERVAL '30 days'
                    GROUP BY district
                """
                cursor.execute(change_query_90d)
                price_90d = {r['district']: int(r['avg_price']) for r in cursor.fetchall() if r['district']}
                
                city_avg = sum(d['avg'] for d in district_prices.values()) / len(district_prices) if district_prices else 0
                
                for district, data in district_prices.items():
                    change_30d = 0
                    change_90d = 0
                    
                    if district in price_30d and district in price_90d and price_90d[district] > 0:
                        change_30d = ((price_30d[district] - price_90d[district]) / price_90d[district]) * 100
                    
                    districts.append({
                        'district': district,
                        'avg_price_per_m2': data['avg'],
                        'total_listings': data['count'],
                        'change_30d': round(change_30d, 2),
                        'change_90d': 0
                    })
        finally:
            conn.close()
        
        return {
            'districts': districts,
            'city_avg': int(city_avg)
        }
    
    def get_market_summary(self, city: str = "TP.HCM") -> dict:
        """Get overall market summary"""
        conn = get_connection()
        
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_listings,
                        AVG(price / NULLIF(area, 0)) as avg_price,
                        MIN(price / NULLIF(area, 0)) as min_price,
                        MAX(price / NULLIF(area, 0)) as max_price
                    FROM properties
                    WHERE status = 'approved'
                    AND city = %s
                    AND price > 0 AND area > 0
                """, (city,))
                
                row = cursor.fetchone()
                
                cursor.execute("""
                    SELECT COUNT(*) FROM users
                """)
                user_count = cursor.fetchone()['count']
                
                cursor.execute("""
                    SELECT COUNT(*) FROM properties
                    WHERE status = 'approved'
                    AND created_at >= CURRENT_DATE
                """)
                today_listings = cursor.fetchone()['count']
                
        finally:
            conn.close()
        
        return {
            'total_listings': row['total_listings'] if row else 0,
            'total_users': user_count,
            'avg_price': int(row['avg_price']) if row and row['avg_price'] else 0,
            'avg_price_change': 0,
            'new_listings_today': today_listings
        }


market_analysis_service = MarketAnalysisService()
