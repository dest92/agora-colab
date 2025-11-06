"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, X, Trash2 } from "lucide-react";
import { chatApi, authApi, type ChatMessage } from "@/app/_lib/api";
import { useBoardChat } from "@/app/board/hooks/useBoardChat";
import { getUserInfo } from "@/app/board/utils/userCache";
import { Input } from "./ui/input";

interface BoardChatProps {
  boardId: string;
  onNewMessage?: (message: ChatMessage) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function BoardChat({
  boardId,
  onNewMessage,
  onDeleteMessage,
}: BoardChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = authApi.getCurrentUser()?.id;

  // Use the WebSocket-enabled chat hook
  const { messages, setMessages, loadMessages } = useBoardChat({ boardId });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadMessages();
    }
  }, [isOpen, loadMessages, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage("");

    try {
      setSending(true);
      const message = await chatApi.sendMessage(boardId, { content });
      console.log("✉️ Sent message response:", message);
      // Don't add optimistically - the WebSocket event will add it
      if (onNewMessage) {
        onNewMessage(message);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(boardId, messageId);
      // Don't update state here - the WebSocket event will handle it
      if (onDeleteMessage) {
        onDeleteMessage(messageId);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getUserName = async (userId: string) => {
    if (userId === currentUserId) return "You";
    const userInfo = await getUserInfo(userId);
    return userInfo.name;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#00AFF0] hover:bg-[#0099D6] text-white flex items-center justify-center shadow-lg transition-colors z-50"
        title="Toggle chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-[#1a1a1a] border-2 border-[#333333] flex flex-col shadow-2xl z-50">
          {/* Header */}
          <div className="bg-[#00AFF0] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold">Board Chat</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-black/20 p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="text-center text-[#666666] py-8">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-[#666666] py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.userId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        isOwnMessage
                          ? "bg-[#00AFF0] text-white"
                          : "bg-[#2d2d2d] text-white"
                      } p-3 relative group`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold opacity-80">
                          {isOwnMessage
                            ? "You"
                            : message.userName || message.userId}
                        </span>
                        {isOwnMessage && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete message"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-60 mt-1 block">
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t-2 border-[#333333]">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 bg-[#000000] border-2 border-[#333333] text-white placeholder:text-[#666666]"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-12 h-10 bg-[#00AFF0] hover:bg-[#0099D6] disabled:bg-[#2d2d2d] disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
