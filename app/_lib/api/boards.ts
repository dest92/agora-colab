/**
 * Boards API - Board & Cards Management
 *
 * Service: Boards Service (via API Gateway)
 *
 * Board Management:
 * - POST /boards/workspaces/:workspaceId/boards - Create board
 * - GET /boards/workspaces/:workspaceId/boards - List boards
 * - GET /boards/:boardId - Get board
 *
 * Cards Management:
 * - Base: /boards/:boardId/cards
 */

import { apiClient } from "./client";
import type {
  Card,
  CreateCardDto,
  UpdateCardDto,
  ListCardsQuery,
} from "./types";

export interface Board {
  id: string;
  workspaceId: string;
  teamId: string;
  title: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateBoardDto {
  title: string;
}

export interface Lane {
  id: string;
  boardId: string;
  name: string;
  position: number;
}

class BoardsApi {
  // ===== Board Management =====

  /**
   * Create a new board in a workspace
   * POST /boards/workspaces/:workspaceId/boards
   *
   * Automatically creates:
   * - Default team (if doesn't exist)
   * - 3 default lanes: ideas, discuss, decided
   *
   * @param workspaceId - Workspace UUID
   * @param dto - Board data: {title}
   */
  async createBoard(workspaceId: string, dto: CreateBoardDto): Promise<Board> {
    return apiClient.post<Board>(
      `/boards/workspaces/${workspaceId}/boards`,
      dto
    );
  }

  /**
   * List all boards in a workspace
   * GET /boards/workspaces/:workspaceId/boards
   */
  async listBoards(workspaceId: string): Promise<Board[]> {
    return apiClient.get<Board[]>(`/boards/workspaces/${workspaceId}/boards`);
  }

  /**
   * Get a single board
   * GET /boards/:boardId
   */
  async getBoard(boardId: string): Promise<Board> {
    return apiClient.get<Board>(`/boards/${boardId}`);
  }

  /**
   * Get lanes of a board
   * GET /boards/:boardId/lanes
   */
  async getLanes(boardId: string): Promise<Lane[]> {
    return apiClient.get<Lane[]>(`/boards/${boardId}/lanes`);
  }

  /**
   * Create a new lane in a board
   * POST /boards/:boardId/lanes
   */
  async createLane(boardId: string, name: string): Promise<Lane> {
    return apiClient.post<Lane>(`/boards/${boardId}/lanes`, { name });
  }

  /**
   * Update lane position
   * PATCH /boards/:boardId/lanes/:laneId/position
   */
  async updateLanePosition(
    boardId: string,
    laneId: string,
    position: number
  ): Promise<{ updated: boolean }> {
    return apiClient.patch<{ updated: boolean }>(
      `/boards/${boardId}/lanes/${laneId}/position`,
      { position }
    );
  }

  /**
   * Delete a lane (column)
   * DELETE /boards/:boardId/lanes/:laneId
   */
  async deleteLane(
    boardId: string,
    laneId: string
  ): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(
      `/boards/${boardId}/lanes/${laneId}`
    );
  }

  // ===== Card Management =====
  /**
   * Create a new card in a board
   * POST /boards/:boardId/cards
   *
   * @param boardId - Board UUID (must be created via SQL first)
   * @param dto - Card data: {content, priority?, position?, laneId?}
   */
  async createCard(boardId: string, dto: CreateCardDto): Promise<Card> {
    return apiClient.post<Card>(`/boards/${boardId}/cards`, dto);
  }

  /**
   * List cards in a board
   * GET /boards/:boardId/cards?laneId=xxx
   */
  async listCards(boardId: string, query?: ListCardsQuery): Promise<Card[]> {
    const queryString = query?.laneId ? `?laneId=${query.laneId}` : "";
    const cards = await apiClient.get<Card[]>(
      `/boards/${boardId}/cards${queryString}`
    );
    console.log("🌐 API returned cards:", {
      boardId,
      count: cards.length,
      cards: cards.map((c) => ({
        id: c.id,
        laneId: c.laneId,
        content: c.content.substring(0, 30),
      })),
    });
    return cards;
  }

  /**
   * Update a card
   * PATCH /boards/:boardId/cards/:cardId
   */
  async updateCard(
    boardId: string,
    cardId: string,
    dto: UpdateCardDto
  ): Promise<Card> {
    return apiClient.patch<Card>(`/boards/${boardId}/cards/${cardId}`, dto);
  }

  /**
   * Archive a card
   * POST /boards/:boardId/cards/:cardId/archive
   */
  async archiveCard(boardId: string, cardId: string): Promise<Card> {
    return apiClient.post<Card>(`/boards/${boardId}/cards/${cardId}/archive`);
  }

  /**
   * Unarchive a card
   * POST /boards/:boardId/cards/:cardId/unarchive
   */
  async unarchiveCard(boardId: string, cardId: string): Promise<Card> {
    return apiClient.post<Card>(`/boards/${boardId}/cards/${cardId}/unarchive`);
  }

  /**
   * Refresh projections (CQRS)
   * POST /boards/:boardId/projections/refresh
   */
  async refreshProjections(boardId: string): Promise<{ refreshed: boolean }> {
    return apiClient.post<{ refreshed: boolean }>(
      `/boards/${boardId}/projections/refresh`
    );
  }
}

export const boardsApi = new BoardsApi();
