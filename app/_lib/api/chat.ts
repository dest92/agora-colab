import { apiClient } from "./client";

export interface ChatMessage {
  id: string;
  boardId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatMessageDto {
  content: string;
}

class ChatApi {
  /**
   * Send a chat message to a board
   * POST /boards/:boardId/chat
   */
  async sendMessage(
    boardId: string,
    dto: CreateChatMessageDto
  ): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>(`/boards/${boardId}/chat`, dto);
  }

  /**
   * List chat messages for a board
   * GET /boards/:boardId/chat?limit=50
   */
  async listMessages(boardId: string, limit: number = 50): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/boards/${boardId}/chat?limit=${limit}`);
  }

  /**
   * Delete a chat message
   * DELETE /boards/:boardId/chat/:messageId
   */
  async deleteMessage(
    boardId: string,
    messageId: string
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/boards/${boardId}/chat/${messageId}`
    );
  }
}

export const chatApi = new ChatApi();
