const API_URL = "http://localhost:8001/api/sellers";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface SellerRequest {
  id: number;
  user_id: number;
  business_name: string;
  business_type: string;
  phone_number: string;
  business_address: string;
  city: string;
  district: string;
  status: string;
  reason_for_rejection?: string;
  requested_at: string;
  reviewed_at?: string;
  // added from join
  username?: string;
  full_name?: string;
  email?: string;
}

export interface SellerRequestCreatePayload {
  business_name: string;
  business_type: string;
  business_registration_number?: string;
  tax_id?: string;
  phone_number: string;
  business_address: string;
  city: string;
  district: string;
  description?: string;
}

export const sellerService = {
  // User: Submit seller request
  async submitSellerRequest(
    data: SellerRequestCreatePayload
  ): Promise<SellerRequest> {
    const response = await fetch(`${API_URL}/request`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể gửi yêu cầu trở thành người bán");
    }
    return await response.json();
  },

  // User: Get their seller request status
  async getMySellerRequest(): Promise<{ message?: string; request: SellerRequest | null }> {
    const response = await fetch(`${API_URL}/requests/user/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể lấy trạng thái yêu cầu");
    }
    return await response.json();
  },

  // Admin: Get seller requests (filter by status)
  async getRequests(status: string = "pending"): Promise<SellerRequest[]> {
    const response = await fetch(`${API_URL}/requests?status=${status}`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể lấy danh sách yêu cầu");
    }
    const data = await response.json();
    return data.requests || [];
  },

  // Admin: Get pending seller requests
  async getPendingRequests(): Promise<SellerRequest[]> {
    return this.getRequests("pending");
  },

  // Admin: Approve seller request
  async approveSellerRequest(requestId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/requests/${requestId}/approve`, {
      method: "PUT",
      headers: getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể phê duyệt yêu cầu");
    }
    return await response.json();
  },

  // Admin: Reject seller request
  async rejectSellerRequest(requestId: number, reason: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ reason_for_rejection: reason }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể từ chối yêu cầu");
    }
    return await response.json();
  },
};
