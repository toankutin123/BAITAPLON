"""
AI Valuation Service for property price estimation
Uses comparable properties and AI insights
"""

import json
import os
from typing import Optional
from config import get_connection


class ValuationService:
    """Service for estimating property values"""
    
    # Property type multipliers
    TYPE_MULTIPLIERS = {
        'căn hộ': 1.0,
        'chung cư': 1.0,
        'nhà phố': 1.15,
        'nhà mặt phố': 1.25,
        'nhà ngõ': 0.95,
        'biệt thự': 1.3,
        'đất nền': 0.9,
        'đất': 0.85,
        'shophouse': 1.2,
        'penthouse': 1.4,
        'duplex': 1.1,
    }
    
    # Minimum price per m2 (VND)
    MIN_PRICE_PER_M2 = 2000000
    MAX_PRICE_PER_M2 = 300000000
    
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), '..', '..', 'bds_nlp', 'data.json')
        self.average_path = os.path.join(os.path.dirname(__file__), '..', '..', 'bds_nlp', 'average.json')
    
    def estimate_price(
        self,
        address: str,
        property_type: str,
        area: float,
        bedrooms: int = 0,
        bathrooms: int = 0,
        district: str = "",
        city: str = "TP.HCM",
        legal_status: str = "unknown",
        features: list[str] = None
    ) -> dict:
        """
        Estimate property price based on comparable properties
        """
        if features is None:
            features = []
        
        comparable = self._find_comparable(
            address, district, city, property_type, area
        )
        
        if not comparable:
            return self._estimate_from_district_average(
                district, property_type, area
            )
        
        base_price = self._calculate_base_price(comparable, area)
        
        type_multiplier = self.TYPE_MULTIPLIERS.get(
            property_type.lower(), 1.0
        )
        
        feature_adjustment = self._calculate_feature_adjustment(features)
        legal_adjustment = self._calculate_legal_adjustment(legal_status)
        bedroom_adjustment = self._calculate_bedroom_adjustment(bedrooms)
        
        adjusted_price = base_price * type_multiplier
        adjusted_price *= (1 + feature_adjustment)
        adjusted_price *= legal_adjustment
        adjusted_price += bedroom_adjustment * area
        
        confidence = min(0.95, 0.3 + len(comparable) / 100)
        
        low_estimate = adjusted_price * 0.9
        high_estimate = adjusted_price * 1.1
        
        return {
            'estimated_low': round(low_estimate),
            'estimated_avg': round(adjusted_price),
            'estimated_high': round(high_estimate),
            'confidence': round(confidence, 4),
            'comparable_count': len(comparable),
            'comparable_properties': comparable[:5],
            'factors': {
                'type_multiplier': type_multiplier,
                'feature_adjustment': feature_adjustment,
                'legal_adjustment': legal_adjustment,
                'bedroom_adjustment': bedroom_adjustment,
            }
        }
    
    def _find_comparable(
        self,
        address: str,
        district: str,
        city: str,
        property_type: str,
        area: float
    ) -> list[dict]:
        """Find comparable properties from database"""
        comparable = []
        
        if os.path.exists(self.data_path):
            try:
                with open(self.data_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    comparable = data.get('properties', [])[:50]
            except Exception:
                pass
        
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT id, title, price, area, district, city, property_type,
                           bedrooms, bathrooms, address
                    FROM properties
                    WHERE status = 'approved'
                    AND (
                        district = %s
                        OR city = %s
                    )
                    LIMIT 50
                """, (district, city))
                db_props = cursor.fetchall()
                
                for prop in db_props:
                    comparable.append({
                        'id': prop['id'],
                        'title': prop['title'],
                        'price': prop['price'],
                        'area': float(prop['area']) if prop['area'] else 0,
                        'district': prop['district'],
                        'property_type': prop['property_type'],
                    })
        finally:
            conn.close()
        
        filtered = []
        for prop in comparable:
            if prop.get('price') and prop.get('area'):
                price_per_m2 = prop['price'] / prop['area']
                if self.MIN_PRICE_PER_M2 <= price_per_m2 <= self.MAX_PRICE_PER_M2:
                    if abs(prop['area'] - area) / area <= 0.5:
                        filtered.append(prop)
        
        return filtered
    
    def _calculate_base_price(
        self,
        comparable: list[dict],
        target_area: float
    ) -> float:
        """Calculate base price from comparable properties"""
        if not comparable:
            return 0
        
        prices = []
        for prop in comparable:
            if prop.get('price') and prop.get('area') and prop['area'] > 0:
                price_per_m2 = prop['price'] / prop['area']
                estimated_price = price_per_m2 * target_area
                prices.append(estimated_price)
        
        if not prices:
            return 0
        
        prices.sort()
        median_idx = len(prices) // 2
        
        if len(prices) % 2 == 0:
            base_price = (prices[median_idx - 1] + prices[median_idx]) / 2
        else:
            base_price = prices[median_idx]
        
        return base_price
    
    def _estimate_from_district_average(
        self,
        district: str,
        property_type: str,
        area: float
    ) -> dict:
        """Estimate using district average prices"""
        avg_price = 50000000
        
        if os.path.exists(self.average_path):
            try:
                with open(self.average_path, 'r', encoding='utf-8') as f:
                    averages = json.load(f)
                    avg_price = averages.get(district, {}).get(
                        property_type, 50000000
                    )
            except Exception:
                pass
        
        type_multiplier = self.TYPE_MULTIPLIERS.get(
            property_type.lower(), 1.0
        )
        
        estimated = avg_price * area * type_multiplier
        
        return {
            'estimated_low': round(estimated * 0.85),
            'estimated_avg': round(estimated),
            'estimated_high': round(estimated * 1.15),
            'confidence': 0.35,
            'comparable_count': 0,
            'comparable_properties': [],
            'factors': {
                'type_multiplier': type_multiplier,
                'feature_adjustment': 0,
                'legal_adjustment': 1.0,
                'bedroom_adjustment': 0,
                'note': 'Estimated from district average'
            }
        }
    
    def _calculate_feature_adjustment(self, features: list[str]) -> float:
        """Calculate price adjustment based on features"""
        feature_weights = {
            'view': 0.05,
            'swimming_pool': 0.08,
            'garden': 0.05,
            'parking': 0.03,
            'security': 0.02,
            'elevator': 0.03,
            'furnished': 0.1,
            'renovated': 0.05,
            'new_construction': 0.08,
        }
        
        adjustment = 0
        for feature in features:
            feature_lower = feature.lower()
            for key, weight in feature_weights.items():
                if key in feature_lower:
                    adjustment += weight
                    break
        
        return adjustment
    
    def _calculate_legal_adjustment(self, legal_status: str) -> float:
        """Calculate price adjustment based on legal status"""
        adjustments = {
            'ready': 1.15,
            'pink_book': 1.10,
            'pending': 1.0,
            'unknown': 0.95,
            'disputed': 0.70,
        }
        return adjustments.get(legal_status.lower(), 1.0)
    
    def _calculate_bedroom_adjustment(self, bedrooms: int) -> float:
        """Calculate price adjustment per bedroom"""
        if bedrooms <= 2:
            return bedrooms * 5000000
        elif bedrooms <= 4:
            return 10000000 + (bedrooms - 2) * 8000000
        else:
            return 26000000 + (bedrooms - 4) * 10000000


valuation_service = ValuationService()
