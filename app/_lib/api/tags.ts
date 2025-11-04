/**
 * Tags API - Tag Management
 * Service: Collab Service (via API Gateway)
 * Base: /boards/:boardId/tags
 */

import { apiClient } from "./client";
import type {
  Tag,
  CreateTagDto,
  TagAssignResult,
  TagUnassignResult,
} from "./types";

class TagsApi {
  /**
   * Create a new tag
   * POST /boards/:boardId/tags
   */
  async createTag(boardId: string, dto: CreateTagDto): Promise<Tag> {
    return apiClient.post<Tag>(`/boards/${boardId}/tags`, dto);
  }

  /**
   * List all tags in a board
   * GET /boards/:boardId/tags
   */
  async listTags(boardId: string): Promise<Tag[]> {
    return apiClient.get<Tag[]>(`/boards/${boardId}/tags`);
  }

  /**
   * Assign tag to card
   * POST /boards/:boardId/cards/:cardId/tags/:tagId
   */
  async assignTag(
    boardId: string,
    cardId: string,
    tagId: string
  ): Promise<TagAssignResult> {
    return apiClient.post<TagAssignResult>(
      `/boards/${boardId}/cards/${cardId}/tags/${tagId}`
    );
  }

  /**
   * Unassign tag from card
   * DELETE /boards/:boardId/cards/:cardId/tags/:tagId
   */
  async unassignTag(
    boardId: string,
    cardId: string,
    tagId: string
  ): Promise<TagUnassignResult> {
    return apiClient.delete<TagUnassignResult>(
      `/boards/${boardId}/cards/${cardId}/tags/${tagId}`
    );
  }
}

export const tagsApi = new TagsApi();
