const API_URL = "http://localhost:8001/api";
const MARKET_URL = `${API_URL}/market`;
const DASHBOARD_URL = `${API_URL}/dashboard`;
const VALUATION_URL = `${API_URL}/valuation`;
const RECOMMEND_URL = `${API_URL}/recommendations`;
const ADMIN_URL = `${API_URL}/dashboard/admin`;

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface AveragePriceRecord {
  province: string;
  zone: string;
  avg_price_per_m2: number;
}

export interface AveragePriceResponse {
  success: boolean;
  result: AveragePriceRecord[];
}

export interface AIInsightsResponse {
  success: boolean;
  insights: string;
}

// Dashboard types
export interface DashboardStats {
  total_properties: number;
  total_users: number;
  avg_price: number;
  avg_price_change: number;
  new_listings_today: number;
  active_crawlers: number;
}

export interface TopDistrict {
  district: string;
  change_percent: number;
  current_avg: number;
  previous_avg: number;
}

export interface MarketTrend {
  period_start: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  listing_count: number;
}

export interface MarketTrendsResponse {
  trends: MarketTrend[];
  current_avg_price: number;
  change_percent: number;
  trend_direction: string;
  forecast: {
    forecast_price: number;
    forecast_change: number;
    confidence: number;
  };
}

export interface DistrictStats {
  district: string;
  avg_price_per_m2: number;
  total_listings: number;
  change_30d: number;
  change_90d: number;
}

export interface DistrictStatsResponse {
  districts: DistrictStats[];
  city_avg: number;
}

// Valuation types
export interface ValuationRequest {
  address: string;
  property_type: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  district: string;
  city?: string;
  legal_status?: string;
  features?: string[];
}

export interface ValuationResponse {
  estimated_low: number;
  estimated_avg: number;
  estimated_high: number;
  confidence: number;
  comparable_count: number;
  factors: Record<string, any>;
  comparable_properties: any[];
}

// Recommendation types
export interface BuyerRecommendationRequest {
  budget_min: number;
  budget_max: number;
  preferred_districts: string[];
  preferred_types: string[];
  min_area: number;
  min_bedrooms: number;
}

export interface ScoredProperty {
  property: any;
  match_score: number;
  price_score: number;
  location_score: number;
  size_score: number;
  features_score: number;
  reasons: string[];
}

export interface BuyerRecommendationResponse {
  recommendations: ScoredProperty[];
  total_found: number;
  average_price: number;
  market_trend: string;
}

export const marketService = {
  async getAveragePrices(province?: string): Promise<AveragePriceRecord[]> {
    const url = province
      ? `${MARKET_URL}/average-prices?province=${province}`
      : `${MARKET_URL}/average-prices`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể lấy dữ liệu thị trường");
    }
    const data: AveragePriceResponse = await response.json();
    return data.result;
  },

  async getAIInsights(province?: string): Promise<string> {
    const url = province
      ? `${MARKET_URL}/ai-insights?province=${province}`
      : `${MARKET_URL}/ai-insights`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể lấy thông tin AI");
    }
    const data: AIInsightsResponse = await response.json();
    return data.insights;
  },

  // Dashboard endpoints
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${DASHBOARD_URL}/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy dashboard stats");
    const data = await response.json();
    return data.stats;
  },

  async getTopGainers(limit = 10): Promise<TopDistrict[]> {
    const response = await fetch(`${DASHBOARD_URL}/top-gainers?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy top gainers");
    const data = await response.json();
    return data.gainers || [];
  },

  async getTopLosers(limit = 10): Promise<TopDistrict[]> {
    const response = await fetch(`${DASHBOARD_URL}/top-losers?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy top losers");
    const data = await response.json();
    return data.losers || [];
  },

  async getDashboardSummary(): Promise<{
    stats: DashboardStats;
    top_gainers: TopDistrict[];
    top_losers: TopDistrict[];
  }> {
    const response = await fetch(`${DASHBOARD_URL}/summary`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy dashboard summary");
    return response.json();
  },

  // Market analysis endpoints
  async getPriceTrends(params?: {
    district?: string;
    city?: string;
    property_type?: string;
    period?: string;
  }): Promise<MarketTrendsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.district) searchParams.set("district", params.district);
    if (params?.city) searchParams.set("city", params.city);
    if (params?.property_type) searchParams.set("property_type", params.property_type);
    if (params?.period) searchParams.set("period", params.period);

    const queryString = searchParams.toString();
    const response = await fetch(`${MARKET_URL}/trends${queryString ? `?${queryString}` : ''}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy price trends");
    return response.json();
  },

  async getDistrictStats(city = "TP.HCM"): Promise<DistrictStatsResponse> {
    const response = await fetch(`${MARKET_URL}/districts?city=${city}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy district stats");
    return response.json();
  },

  async getMarketForecast(params?: {
    district?: string;
    city?: string;
  }): Promise<any> {
    const searchParams = new URLSearchParams();
    if (params?.district) searchParams.set("district", params.district);
    if (params?.city) searchParams.set("city", params.city);

    const queryString = searchParams.toString();
    const response = await fetch(`${MARKET_URL}/forecast${queryString ? `?${queryString}` : ''}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy forecast");
    return response.json();
  },

  // Valuation endpoints
  async estimatePrice(data: ValuationRequest): Promise<ValuationResponse> {
    const response = await fetch(`${VALUATION_URL}/estimate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể định giá");
    }
    return response.json();
  },

  async saveValuation(data: ValuationRequest): Promise<{ success: boolean; valuation_id: number }> {
    const response = await fetch(`${VALUATION_URL}/save`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể lưu định giá");
    }
    return response.json();
  },

  // Recommendation endpoints
  async getRecommendations(data: BuyerRecommendationRequest): Promise<BuyerRecommendationResponse> {
    const response = await fetch(`${RECOMMEND_URL}/buyer`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể lấy đề xuất");
    }
    return response.json();
  },

  async updateBuyerProfile(data: {
    budget_min: number;
    budget_max: number;
    preferred_districts?: string[];
    preferred_types?: string[];
    min_area?: number;
    max_area?: number;
    min_bedrooms?: number;
  }): Promise<{ success: boolean }> {
    const response = await fetch(`${RECOMMEND_URL}/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể cập nhật profile");
    }
    return response.json();
  },

  async getBuyerProfile(): Promise<any> {
    const response = await fetch(`${RECOMMEND_URL}/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy profile");
    return response.json();
  },

  async getRecommendationsFromProfile(): Promise<BuyerRecommendationResponse> {
    const response = await fetch(`${RECOMMEND_URL}/profile/recommend`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể lấy đề xuất");
    }
    return response.json();
  },

  // Admin Dashboard APIs
  async getAdminStats(): Promise<{
    total_users: number;
    total_properties: number;
    pending_properties: number;
    total_revenue: number;
    users_growth: { month: string; count: number }[];
    property_growth: { month: string; count: number }[];
  }> {
    const response = await fetch(`${ADMIN_URL}/stats`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy thống kê admin");
    return response.json();
  },

  async getRecentProperties(limit = 10): Promise<any[]> {
    const response = await fetch(`${ADMIN_URL}/recent-properties?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error("Không thể lấy BĐS gần đây");
    const data = await response.json();
    return data.properties || [];
  },

  async deleteProperty(propertyId: number): Promise<void> {
    const response = await fetch(`${API_URL}/properties/${propertyId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Không thể xóa BĐS");
    }
  },
};
