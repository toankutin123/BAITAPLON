import { authService } from "./auth.service";

const API_URL = "http://localhost:8001/api/properties";

export interface Property {
  id: number;
  title: string;
  description: string;
  property_type: string;
  price: number;
  price_unit: string;
  area: number;
  address: string;
  city: string;
  district: string;
  bedrooms: number;
  bathrooms: number;
  status: "pending" | "approved" | "rejected";
  verified: boolean;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  property_type: string;
  price: number;
  price_unit: string;
  area: number;
  address: string;
  city: string;
  district: string;
  bedrooms: number;
  bathrooms: number;
  images: string[];
}

const getHeaders = () => {
  const token = authService.getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const propertyService = {
  async getMyProperties(): Promise<Property[]> {
    const response = await fetch(`${API_URL}?status=all`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải danh sách BĐS");
    }
    const data = await response.json();
    return data.properties || [];
  },

  async getApprovedProperties(): Promise<Property[]> {
    const response = await fetch(`${API_URL}?status=approved`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải danh sách BĐS");
    }
    const data = await response.json();
    return data.properties || [];
  },

  async searchProperties(params: {
    search?: string;
    district?: string;
    property_type?: string;
    min_price?: number;
    max_price?: number;
    min_area?: number;
    max_area?: number;
    bedrooms?: number;
    city?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
  }): Promise<{ properties: Property[]; total: number; page: number; limit: number }> {
    // Use /search endpoint for filtered/sorted queries
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.set("search", params.search);
    if (params.district && params.district !== "all") queryParams.set("district", params.district);
    if (params.property_type && params.property_type !== "all") queryParams.set("property_type", params.property_type);
    if (params.min_price) queryParams.set("min_price", params.min_price.toString());
    if (params.max_price) queryParams.set("max_price", params.max_price.toString());
    if (params.min_area) queryParams.set("min_area", params.min_area.toString());
    if (params.max_area) queryParams.set("max_area", params.max_area.toString());
    if (params.bedrooms) queryParams.set("bedrooms", params.bedrooms.toString());
    if (params.city) queryParams.set("city", params.city);
    if (params.page) queryParams.set("page", params.page.toString());
    if (params.limit) queryParams.set("limit", params.limit.toString());
    if (params.sort_by) queryParams.set("sort_by", params.sort_by);

    try {
      const response = await fetch(`${API_URL}/search?${queryParams.toString()}`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Không thể tải BĐS");
      const data = await response.json();
      return { properties: data.properties || [], total: data.total || 0, page: params.page || 1, limit: params.limit || 20 };
    } catch (error) {
      return { properties: [], total: 0, page: 1, limit: 20 };
    }
  },

  async getPropertyById(id: number): Promise<Property> {
    const response = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải thông tin BĐS");
    }
    return response.json();
  },

  async createProperty(data: PropertyFormData): Promise<Property> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể tạo BĐS");
    }
    return response.json();
  },

  async updateProperty(id: number, data: Partial<PropertyFormData>): Promise<Property> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Không thể cập nhật BĐS");
    }
    return response.json();
  },

  async deleteProperty(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể xóa BĐS");
    }
  },

  async getPendingProperties(): Promise<Property[]> {
    const response = await fetch(`${API_URL}/pending`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải danh sách BĐS chờ duyệt");
    }
    const data = await response.json();
    return data.properties || [];
  },

  async approveProperty(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}/approve`, {
      method: "PUT",
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể duyệt BĐS");
    }
  },

  async rejectProperty(id: number, reason?: string): Promise<void> {
    const response = await fetch(`${API_URL}/${id}/reject`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error("Không thể từ chối BĐS");
    }
  },

  async getSavedProperties(): Promise<Property[]> {
    const SAVED_API_URL = "http://localhost:8001/api/saved-properties";
    const response = await fetch(`${SAVED_API_URL}`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể tải BĐS đã lưu");
    }
    return response.json();
  },

  async saveProperty(propertyId: number): Promise<void> {
    const SAVED_API_URL = "http://localhost:8001/api/saved-properties";
    const response = await fetch(`${SAVED_API_URL}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ propertyId }),
    });
    if (!response.ok) {
      throw new Error("Không thể lưu BĐS");
    }
  },

  async removeSavedProperty(propertyId: number): Promise<void> {
    const SAVED_API_URL = "http://localhost:8001/api/saved-properties";
    const response = await fetch(`${SAVED_API_URL}/${propertyId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error("Không thể xóa BĐS đã lưu");
    }
  },
};