// AI Services API - calls main backend (port 8001)
const API_BASE_URL = 'http://localhost:8001';

export const aiApi = {
  // Dashboard
  getDashboard: async (city?: string) => {
    const url = city 
      ? `${API_BASE_URL}/api/dashboard/summary`
      : `${API_BASE_URL}/api/dashboard/summary`;
    const res = await fetch(url);
    return res.json();
  },

  // Market Overview
  getMarketOverview: async (city?: string) => {
    const url = `${API_BASE_URL}/api/market/trends${city ? `?city=${encodeURIComponent(city)}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  // District Stats
  getDistrictStats: async (city?: string) => {
    const url = `${API_BASE_URL}/api/market/districts${city ? `?city=${encodeURIComponent(city)}` : ''}`;
    const res = await fetch(url);
    return res.json();
  },

  // Valuation
  valuateProperty: async (data: {
    city: string;
    district?: string;
    ward?: string;
    property_type: string;
    area?: number;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/valuation/estimate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        address: data.district || '',
        district: data.district || '',
        city: data.city || 'TP.HCM',
        property_type: data.property_type,
        area: data.area || 0,
        bedrooms: data.bedrooms || 0,
        bathrooms: data.bathrooms || 0,
      }),
    });
    return res.json();
  },

  // Search
  searchProperties: async (data: {
    city: string;
    district?: string;
    budget_max?: number;
    min_area?: number;
    min_bedrooms?: number;
    property_type?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/recommendations/buyer`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        budget_min: 0,
        budget_max: data.budget_max || 100000000000,
        preferred_districts: data.district ? [data.district] : [],
        preferred_types: data.property_type ? [data.property_type] : [],
        min_area: data.min_area || 0,
        min_bedrooms: data.min_bedrooms || 0,
      }),
    });
    return res.json();
  },
};

// Format price helper (for market data in triệu/m²)
export const formatMarketPrice = (price: number): string => {
  if (!price) return '-';
  return `${price.toFixed(2)} triệu/m²`;
};

// Format price helper (for VNĐ)
export const formatPrice = (price: number): string => {
  if (!price) return '0';
  if (price >= 1e9) return `${(price / 1e9).toFixed(2)} tỷ`;
  if (price >= 1e6) return `${(price / 1e6).toFixed(0)} triệu`;
  return price.toLocaleString('vi-VN');
};
