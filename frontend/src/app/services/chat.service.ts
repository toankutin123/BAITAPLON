import { authService } from "./auth.service";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";

export interface ChatMessage {
  id: number;
  user_id: number;
  sender_role: number;
  sender_user_id: number | null;
  content: string;
  created_at: string;
}

export interface Conversation {
  user_id: number;
  username: string;
  full_name: string | null;
  email: string;
  conversation_started: string;
  last_message: string | null;
  last_message_at: string | null;
  message_count: number;
}

export const chatService = {
  async sendMessage(message: string): Promise<ChatMessage[]> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/api/admin/chat/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  async getMyMessages(): Promise<ChatMessage[]> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/api/admin/chat/my-messages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to get messages");
    return res.json();
  },

  async getConversations(): Promise<Conversation[]> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/api/admin/chat/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to get conversations");
    return res.json();
  },

  async getConversationMessages(userId: number): Promise<ChatMessage[]> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/api/admin/chat/messages?user_id=${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to get messages");
    return res.json();
  },

  async replyToUser(userId: number, message: string): Promise<ChatMessage> {
    const token = authService.getToken();
    const res = await fetch(`${API_BASE}/api/admin/chat/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: userId, message }),
    });
    if (!res.ok) throw new Error("Failed to send reply");
    return res.json();
  },
};