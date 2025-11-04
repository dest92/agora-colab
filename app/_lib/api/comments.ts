/**
 * Comments API Service
 * Endpoints for managing card comments
 * Microservice: boards-service (via API Gateway)
 */

import { apiClient } from "./client";
import type { Comment, CreateCommentDto } from "./types";

export const commentsApi = {
  /**
   * Create a new comment on a card
   * POST /boards/:boardId/cards/:cardId/comments
   */
  async createComment(
    boardId: string,
    cardId: string,
    dto: CreateCommentDto
  ): Promise<Comment> {
    return apiClient.post<Comment>(
      `/boards/${boardId}/cards/${cardId}/comments`,
      dto
    );
  },

  /**
   * List all comments for a card
   * GET /boards/:boardId/cards/:cardId/comments
   */
  async listComments(boardId: string, cardId: string): Promise<Comment[]> {
    return apiClient.get<Comment[]>(
      `/boards/${boardId}/cards/${cardId}/comments`
    );
  },
};
