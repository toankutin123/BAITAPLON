import { useState, useEffect, useRef } from "react";
import { chatService, ChatMessage, Conversation } from "../services/chat.service";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle, X, ChevronLeft, User as UserIcon } from "lucide-react";
import { authService } from "../services/auth.service";

export function AdminChatFloatingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const data = await chatService.getConversations();
      const prevCount = conversations.reduce((sum, c) => sum + c.message_count, 0);
      const newCount = data.reduce((sum, c) => sum + c.message_count, 0);
      setConversations(data);

      if (newCount > prevCount && !isOpen) {
        setUnreadCount((c) => c + (newCount - prevCount));
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  };

  const loadMessages = async (userId: number) => {
    try {
      const data = await chatService.getConversationMessages(userId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!authService.getToken()) return;
    const user = authService.getUser();
    if (!user || user.role !== 1) return;

    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser && isOpen) {
      loadMessages(selectedUser);
      const interval = setInterval(() => loadMessages(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectUser = (userId: number) => {
    setSelectedUser(userId);
    setShowList(false);
    setMessages([]);
  };

  const handleBack = () => {
    setShowList(true);
    setSelectedUser(null);
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
      console.error("Failed to send reply", e);
    } finally {
      setLoading(false);
    }
  };

  const user = authService.getUser();
  if (!user || user.role !== 1) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
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

      {/* Floating panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showList ? (
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
              ) : (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                >
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
              )}
              <span className="font-semibold text-white">
                {showList ? "Tin nhắn Admin" : `Chat với user ${selectedUser}`}
              </span>
            </div>
            <span className="text-white/80 text-xs">{conversations.length} cuộc trò chuyện</span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {showList ? (
              /* Conversations list */
              <div className="h-full overflow-y-auto">
                {conversations.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center p-6 mt-16">
                    Chưa có cuộc trò chuyện nào
                  </p>
                ) : (
                  <div className="divide-y">
                    {conversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => handleSelectUser(conv.user_id)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {conv.full_name || conv.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{conv.email}</p>
                          </div>
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-gray-400 mt-1 truncate pl-7">
                            {conv.last_message}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1 pl-7">
                          <span className="text-xs text-gray-400">
                            {conv.message_count} tin nhắn
                          </span>
                          {conv.last_message_at && (
                            <span className="text-xs text-gray-400">
                              {new Date(conv.last_message_at).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Chat area */
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center mt-16">
                      Chưa có tin nhắn nào
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
                            {msg.sender_role === 0 ? "User" : "Admin"}
                          </p>
                          <p>{msg.content}</p>
                          <p className="text-xs mt-0.5 opacity-50">
                            {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendReply} className="p-2 border-t bg-white flex gap-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập phản hồi..."
                    className="flex-1 h-9 text-sm"
                    disabled={loading}
                  />
                  <Button type="submit" size="sm" className="h-9 px-3" disabled={loading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}