import { useState, useEffect } from "react";
import { chatService, ChatMessage, Conversation } from "../services/chat.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Send, User as UserIcon, MessageSquare } from "lucide-react";

export function AdminChatManage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      setError(null);
      const data = await chatService.getConversationMessages(userId);
      setMessages(data);
    } catch (e) {
      setError("Không thể tải tin nhắn");
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
      const interval = setInterval(() => loadMessages(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const handleSelectUser = (userId: number) => {
    setSelectedUser(userId);
    setMessages([]);
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser || loading) return;

    setLoading(true);
    try {
      await chatService.replyToUser(selectedUser, input.trim());
      setInput("");
      await loadMessages(selectedUser);
      await loadConversations();
    } catch (e) {
      setError("Không thể gửi phản hồi");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Conversations List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Cuộc trò chuyện
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center p-4">
                Chưa có cuộc trò chuyện nào
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => handleSelectUser(conv.user_id)}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                    selectedUser === conv.user_id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conv.full_name || conv.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{conv.email}</p>
                    </div>
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {conv.last_message}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {conv.message_count} tin nhắn
                    </span>
                    {conv.last_message_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(conv.last_message_at).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedUser
              ? `Chat với ${
                  conversations.find((c) => c.user_id === selectedUser)?.full_name ||
                  conversations.find((c) => c.user_id === selectedUser)?.username ||
                  "User"
                }`
              : "Chọn một cuộc trò chuyện"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-[calc(100%-60px)]">
          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-2 rounded mb-2">
              {error}
            </div>
          )}

          {!selectedUser ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Chọn một cuộc trò chuyện từ danh sách bên trái</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto border rounded-lg p-3 space-y-3 bg-gray-50 mb-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center mt-20">
                    Chưa có tin nhắn nào
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_role === 0 ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                          msg.sender_role === 0
                            ? "bg-blue-500 text-white"
                            : "bg-white border text-gray-800"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sender_role === 0 ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {msg.sender_role === 0 ? "User" : "Admin"} -{" "}
                          {new Date(msg.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={sendReply} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập phản hồi..."
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}