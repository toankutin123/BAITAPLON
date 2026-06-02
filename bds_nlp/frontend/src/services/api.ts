export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Valuation
  valuateProperty: (data: any) =>
    fetch(`${API_BASE_URL}/valuation/property`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getComparables: (params: any) =>
    fetch(`${API_BASE_URL}/valuation/comparable?${new URLSearchParams(params)}`).then(r => r.json()),

  // Recommendations
  searchProperties: (data: any) =>
    fetch(`${API_BASE_URL}/recommendations/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getUndervalued: (city: string, district?: string) =>
    fetch(`${API_BASE_URL}/recommendations/under-valued?city=${city}${district ? `&district=${district}` : ''}`).then(r => r.json()),

  // User Listings
  createListing: (data: any) =>
    fetch(`${API_BASE_URL}/listings/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

  getListing: (id: number) =>
    fetch(`${API_BASE_URL}/listings/user/${id}`).then(r => r.json()),

  // Analytics
  getDashboard: (city?: string) =>
    fetch(`${API_BASE_URL}/analytics/dashboard${city ? `?city=${city}` : ''}`).then(r => r.json()),

  getMarketOverview: (city?: string) =>
    fetch(`${API_BASE_URL}/analytics/market-overview${city ? `?city=${city}` : ''}`).then(r => r.json()),

  getDistrictRankings: (params: any) =>
    fetch(`${API_BASE_URL}/analytics/district-rankings?${new URLSearchParams(params)}`).then(r => r.json()),

  getAreaTrends: (params: any) =>
    fetch(`${API_BASE_URL}/analytics/area-trends?${new URLSearchParams(params)}`).then(r => r.json()),

  getMarketHealth: (city?: string) =>
    fetch(`${API_BASE_URL}/analytics/market-health${city ? `?city=${city}` : ''}`).then(r => r.json()),
};
