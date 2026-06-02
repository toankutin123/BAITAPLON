import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage } from "../services/chat.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Send } from "lucide-react";

export function ChatWithAdmin() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await chatService.getMyMessages();
      setMessages(data);
    } catch (e) {
      setError("Không thể tải tin nhắn");
      console.error(e);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      const data = await chatService.sendMessage(input.trim());
      setMessages(data);
      setInput("");
    } catch (e) {
      setError("Không thể gửi tin nhắn");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Chat với Admin</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>
        )}

        <div className="h-80 overflow-y-auto border rounded-lg p-3 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-20">
              Chưa có tin nhắn nào. Gửi tin nhắn cho admin để bắt đầu.
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
                    {msg.sender_role === 0 ? "Bạn" : "Admin"} -{" "}
                    {new Date(msg.created_at).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}