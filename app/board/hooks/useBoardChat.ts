import { useState, useEffect, useCallback, useRef } from "react";
import { socketClient, chatApi, type ChatMessage } from "@/app/_lib/api";

interface UseBoardChatParams {
  boardId: string;
}

export const useBoardChat = ({ boardId }: UseBoardChatParams) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadMessages = useCallback(async () => {
    if (!boardId) return;
    try {
      const data = await chatApi.listMessages(boardId);
      console.log("📨 Loaded chat messages:", data);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) return;

    console.log("🔌 [CHAT] Registering chat event listeners for board:", boardId);
    console.log("🔌 [CHAT] Socket connected:", socketClient.isConnected());

    const handleMessageSent = (payload: any) => {
      console.log("💬 [CHAT] Chat message sent event:", payload);

      const newMessage: ChatMessage = {
        id: payload.id,
        boardId: payload.boardId,
        userId: payload.userId,
        userName: payload.userName,
        content: payload.content,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt,
      };

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id);
        if (exists) {
          console.log("💬 [CHAT] Message already exists, skipping");
          return prev;
        }
        console.log("💬 [CHAT] Adding new message to state");
        return [...prev, newMessage];
      });
    };

    const handleMessageDeleted = (payload: any) => {
      console.log("🗑️ [CHAT] Chat message deleted event:", payload);

      const { messageId } = payload;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socketClient.on("chat:message:sent", handleMessageSent);
    socketClient.on("chat:message:deleted", handleMessageDeleted);

    return () => {
      console.log("🔌 [CHAT] Unregistering chat event listeners");
      socketClient.off("chat:message:sent", handleMessageSent);
      socketClient.off("chat:message:deleted", handleMessageDeleted);
    };
  }, [boardId]);

  return {
    messages,
    setMessages,
    loadMessages,
  };
};
