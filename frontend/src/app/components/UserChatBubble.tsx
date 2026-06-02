import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage } from "../services/chat.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle, X, Minimize2 } from "lucide-react";
import { authService } from "../services/auth.service";

export function UserChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      setError(null);
      const data = await chatService.getMyMessages();
      const prevLength = messages.length;
      setMessages(data);

      if (data.length > prevLength && !isOpen) {
        setUnreadCount((c) => c + (data.length - prevLength));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!authService.getToken()) return;

    const user = authService.getUser();
    if (!user) return;

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

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
    } finally {
      setLoading(false);
    }
  };

  if (!authService.getToken()) return null;

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-white">Chat với Admin</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</div>
            )}
            {messages.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-16">
                Gửi tin nhắn cho admin để bắt đầu
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_role === 0 ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-1.5 rounded-lg text-sm ${
                      msg.sender_role === 0
                        ? "bg-blue-500 text-white"
                        : "bg-white border text-gray-800"
                    }`}
                  >
                    <p className="text-xs mt-0.5 opacity-75">
                      {msg.sender_role === 0 ? "Bạn" : "Admin"}
                    </p>
                    <p>{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-2 border-t bg-white flex gap-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 h-9 text-sm"
              disabled={loading}
            />
            <Button type="submit" size="sm" className="h-9 px-3" disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}