const API_URL = `${import.meta.env.VITE_API_URL}/api/predict`;

export interface PredictionRequest {
  location: string;
  property_type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  year_built?: number;
  features: string[];
}

export interface PredictionResponse {
  predicted_price: number;
  confidence: number;
  insights: string[];
}

export interface PredictionHistoryItem {
  id: number;
  location: string;
  property_type: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  predicted_price: number;
  confidence: number;
  insights: string;
  created_at: string;
  username?: string;
  full_name?: string;
}

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const predictService = {
  async predictPrice(request: PredictionRequest): Promise<PredictionResponse> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMessage = "Không thể dự đoán giá";
      try {
        const error = await response.json();
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join(', ');
          } else {
            errorMessage = JSON.stringify(error.detail);
          }
        }
      } catch (e) {
        // Ignore parse error
      }
      throw new Error(errorMessage);
    }

    const data: PredictionResponse = await response.json();
    return data;
  },

  async getPredictionHistory(limit: number = 20): Promise<PredictionHistoryItem[]> {
    const response = await fetch(`${API_URL}/history?limit=${limit}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error("Không thể lấy lịch sử dự đoán");
    }

    return response.json();
  },
};