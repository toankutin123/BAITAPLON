const API_URL = "http://localhost:8001/api/users";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: number;
  avatar?: string;
  status: boolean;
  content_restricted?: boolean;
  created_at: string;
  updated_at: string;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể lấy danh sách người dùng");
    }

    const data = await response.json();
    return data.users;
  },

  async updateUserRole(userId: number, role: number): Promise<void> {
    const response = await fetch(`${API_URL}/${userId}/role`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể cập nhật role");
    }
  },

  async updateUserStatus(userId: number, status: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/${userId}/status`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể cập nhật trạng thái");
    }
  },

  async updateUserRestriction(userId: number, content_restricted: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/${userId}/restrict`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ content_restricted }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể cập nhật giới hạn nội dung");
    }
  },

  async updateProfile(data: { full_name?: string; phone?: string }): Promise<void> {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể cập nhật thông tin");
    }
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    const response = await fetch(`${API_URL}/change-password`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Không thể đổi mật khẩu");
    }
  },
};
