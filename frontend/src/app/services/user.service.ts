const API_URL = "http://localhost:5000/api/users";

export interface User {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: number;
  avatar?: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể lấy danh sách người dùng");
    }

    const data = await response.json();
    return data.users;
  },

  async updateUserRole(userId: number, role: number): Promise<void> {
    const response = await fetch(`${API_URL}/${userId}/role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể cập nhật role");
    }
  },

  async updateUserStatus(userId: number, status: boolean): Promise<void> {
    const response = await fetch(`${API_URL}/${userId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Không thể cập nhật trạng thái");
    }
  },
};
