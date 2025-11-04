/**
 * Assignees API - User Assignment to Cards
 * Service: Boards Service (via API Gateway)
 * Base: /boards/:boardId/cards/:cardId/assignees
 */

import { apiClient } from "./client";

export interface Assignee {
  userId: string;
  assignedAt: string;
}

export interface Assignment {
  cardId: string;
  assignedAt: string;
}

class AssigneesApi {
  /**
   * Add assignee to card
   * POST /boards/:boardId/cards/:cardId/assignees/:userId
   */
  async addAssignee(
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<{ message: string; alreadyAssigned?: boolean }> {
    return apiClient.post(
      `/boards/${boardId}/cards/${cardId}/assignees/${userId}`,
      {}
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
  ): Promise<{ message: string }> {
    return apiClient.delete(
      `/boards/${boardId}/cards/${cardId}/assignees/${userId}`
    );
  }

  /**
   * Get all assignees for a card
   * GET /boards/:boardId/cards/:cardId/assignees
   */
  async getAssignees(boardId: string, cardId: string): Promise<Assignee[]> {
    return apiClient.get<Assignee[]>(
      `/boards/${boardId}/cards/${cardId}/assignees`
    );
  }

  /**
   * Get current user's assignments
   * GET /boards/:boardId/assignees/me
   */
  async getMyAssignments(boardId: string): Promise<Assignment[]> {
    return apiClient.get<Assignment[]>(`/boards/${boardId}/assignees/me`);
  }
}

export const assigneesApi = new AssigneesApi();
