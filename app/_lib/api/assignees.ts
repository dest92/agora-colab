/**
 * Assignees API - User Assignment to Cards
 * Service: Collab Service (via API Gateway)
 * Base: /boards/:boardId/cards/:cardId/assignees
 */

import { apiClient } from "./client";
import type { AssigneeAddResult, AssigneeRemoveResult } from "./types";

class AssigneesApi {
  /**
   * Add assignee to card
   * POST /boards/:boardId/cards/:cardId/assignees/:userId
   */
  async addAssignee(
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<AssigneeAddResult> {
    return apiClient.post<AssigneeAddResult>(
      `/boards/${boardId}/cards/${cardId}/assignees/${userId}`
    );
  }

  /**
   * Remove assignee from card
   * DELETE /boards/:boardId/cards/:cardId/assignees/:userId
   */
  async removeAssignee(
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<AssigneeRemoveResult> {
    return apiClient.delete<AssigneeRemoveResult>(
      `/boards/${boardId}/cards/${cardId}/assignees/${userId}`
    );
  }
}

export const assigneesApi = new AssigneesApi();
