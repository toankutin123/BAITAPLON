"""
Recommendation Service for buyer property matching
"""

from typing import Optional
from config import get_connection


class RecommendationService:
    """Service for matching properties to buyer requirements"""
    
    # Score weights
    PRICE_WEIGHT = 0.4
    LOCATION_WEIGHT = 0.3
    SIZE_WEIGHT = 0.2
    FEATURES_WEIGHT = 0.1
    
    def __init__(self):
        self.min_score_threshold = 0.5
    
    def find_recommendations(
        self,
        budget_min: int,
        budget_max: int,
        preferred_districts: list[str] = None,
        preferred_types: list[str] = None,
        min_area: float = 0,
        min_bedrooms: int = 0,
        limit: int = 20
    ) -> list[dict]:
        """
        Find and score properties for buyer requirements
        """
        if preferred_districts is None:
            preferred_districts = []
        if preferred_types is None:
            preferred_types = []
        
        properties = self._search_properties(
            budget_max, preferred_districts, preferred_types, min_area, min_bedrooms
        )
        
        scored_properties = []
        for prop in properties:
            score_result = self._score_property(
                prop, budget_min, budget_max, preferred_districts, preferred_types, min_area
            )
            
            if score_result['match_score'] >= self.min_score_threshold:
                scored_properties.append({
                    'property': prop,
                    **score_result
                })
        
        scored_properties.sort(key=lambda x: x['match_score'], reverse=True)
        
        return scored_properties[:limit]
    
    def _search_properties(
        self,
        budget_max: int,
        districts: list[str],
        types: list[str],
        min_area: float,
        min_bedrooms: int
    ) -> list[dict]:
        """Search for matching properties in database"""
        conn = get_connection()
        properties = []
        
        try:
            with conn.cursor() as cursor:
                query = """
                    SELECT p.*, u.username
                    FROM properties p
                    LEFT JOIN users u ON p.user_id = u.id
                    WHERE p.status = 'approved'
                    AND p.price <= %s
                """
                params = [budget_max]
                
                if districts:
                    query += " AND p.district = ANY(%s)"
                    params.append(districts)
                
                if types:
                    query += " AND p.property_type = ANY(%s)"
                    params.append(types)
                
                if min_area > 0:
                    query += " AND p.area >= %s"
                    params.append(min_area)
                
                if min_bedrooms > 0:
                    query += " AND p.bedrooms >= %s"
                    params.append(min_bedrooms)
                
                query += " ORDER BY p.created_at DESC LIMIT 100"
                
                cursor.execute(query, params)
                properties = cursor.fetchall()
        finally:
            conn.close()
        
        return properties
    
    def _score_property(
        self,
        property: dict,
        budget_min: int,
        budget_max: int,
        preferred_districts: list[str],
        preferred_types: list[str],
        min_area: float
    ) -> dict:
        """Score a property against buyer requirements"""
        price_score = self._score_price(
            property.get('price', 0), budget_min, budget_max
        )
        
        location_score = self._score_location(
            property.get('district', ''), preferred_districts
        )
        
        size_score = self._score_size(
            property.get('area', 0), min_area
        )
        
        features_score = self._score_features(property)
        
        match_score = (
            price_score * self.PRICE_WEIGHT +
            location_score * self.LOCATION_WEIGHT +
            size_score * self.SIZE_WEIGHT +
            features_score * self.FEATURES_WEIGHT
        )
        
        reasons = self._generate_reasons(
            property, price_score, location_score, size_score, features_score
        )
        
        return {
            'match_score': round(match_score, 4),
            'price_score': round(price_score, 4),
            'location_score': round(location_score, 4),
            'size_score': round(size_score, 4),
            'features_score': round(features_score, 4),
            'reasons': reasons
        }
    
    def _score_price(
        self,
        price: int,
        budget_min: int,
        budget_max: int
    ) -> float:
        """Score price fit (0-1, higher is better)"""
        if not price:
            return 0.5
        
        if budget_min <= price <= budget_max:
            center = (budget_min + budget_max) / 2
            distance = abs(price - center) / center
            return max(0, 1 - distance)
        elif price < budget_min:
            savings = (budget_min - price) / budget_min
            return max(0, 0.7 - savings * 0.5)
        else:
            over = (price - budget_max) / budget_max
            return max(0, 0.5 - over)
    
    def _score_location(
        self,
        district: str,
        preferred_districts: list[str]
    ) -> float:
        """Score location match (0-1, higher is better)"""
        if not preferred_districts:
            return 0.7
        
        if district in preferred_districts:
            return 1.0
        
        return 0.3
    
    def _score_size(
        self,
        area: float,
        min_area: float
    ) -> float:
        """Score size fit (0-1, higher is better)"""
        if not area:
            return 0.5
        
        if area < min_area:
            return max(0, 0.3 - (min_area - area) / min_area)
        
        ideal_area = min_area * 1.5
        if area >= ideal_area:
            return 1.0
        
        return (area - min_area) / (ideal_area - min_area)
    
    def _score_features(self, property: dict) -> float:
        """Score based on property features (0-1)"""
        score = 0.7
        
        if property.get('verified'):
            score += 0.1
        
        if property.get('images') and len(property.get('images', [])) >= 3:
            score += 0.1
        
        if property.get('bedrooms', 0) >= 2:
            score += 0.05
        
        if property.get('bathrooms', 0) >= 2:
            score += 0.05
        
        return min(score, 1.0)
    
    def _generate_reasons(
        self,
        property: dict,
        price_score: float,
        location_score: float,
        size_score: float,
        features_score: float
    ) -> list[str]:
        """Generate human-readable reasons for recommendation"""
        reasons = []
        
        if price_score >= 0.8:
            reasons.append("Giá phù hợp với ngân sách")
        elif price_score >= 0.6:
            reasons.append("Giá hợp lý")
        elif price_score < 0.4:
            reasons.append("Giá cao hơn ngân sách một chút")
        
        if location_score >= 0.9:
            reasons.append(f"Nằm tại {property.get('district', 'khu vực mong muốn')}")
        elif location_score >= 0.5:
            reasons.append("Gần khu vực quan tâm")
        
        if size_score >= 0.8:
            reasons.append("Diện tích rộng rãi")
        elif size_score >= 0.6:
            reasons.append("Diện tích đáp ứng nhu cầu")
        
        if property.get('verified'):
            reasons.append("Đã được xác minh")
        
        if property.get('bedrooms', 0) >= 3:
            reasons.append(f"Có {property.get('bedrooms')} phòng ngủ")
        
        return reasons
    
    def update_buyer_profile(
        self,
        user_id: int,
        budget_min: int,
        budget_max: int,
        preferred_districts: list[str] = None,
        preferred_types: list[str] = None,
        min_area: float = 0,
        max_area: float = 0,
        min_bedrooms: int = 0,
        min_bathrooms: int = 0,
        additional_requirements: str = None
    ) -> dict:
        """Update buyer profile in database"""
        if preferred_districts is None:
            preferred_districts = []
        if preferred_types is None:
            preferred_types = []
        
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO buyer_profiles 
                    (user_id, budget_min, budget_max, preferred_districts, preferred_types,
                     min_area, max_area, min_bedrooms, min_bathrooms, additional_requirements)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (user_id) DO UPDATE SET
                        budget_min = EXCLUDED.budget_min,
                        budget_max = EXCLUDED.budget_max,
                        preferred_districts = EXCLUDED.preferred_districts,
                        preferred_types = EXCLUDED.preferred_types,
                        min_area = EXCLUDED.min_area,
                        max_area = EXCLUDED.max_area,
                        min_bedrooms = EXCLUDED.min_bedrooms,
                        min_bathrooms = EXCLUDED.min_bathrooms,
                        additional_requirements = EXCLUDED.additional_requirements,
                        updated_at = CURRENT_TIMESTAMP
                    RETURNING id
                """, (
                    user_id, budget_min, budget_max,
                    preferred_districts, preferred_types,
                    min_area, max_area, min_bedrooms, min_bathrooms,
                    additional_requirements
                ))
                result = cursor.fetchone()
                conn.commit()
                
                return {'success': True, 'profile_id': result['id']}
        finally:
            conn.close()
    
    def get_buyer_profile(self, user_id: int) -> Optional[dict]:
        """Get buyer profile from database"""
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT * FROM buyer_profiles WHERE user_id = %s
                """, (user_id,))
                return cursor.fetchone()
        finally:
            conn.close()


recommendation_service = RecommendationService()
