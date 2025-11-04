/**
 * Votes API
 * Service: Boards Service (via API Gateway)
 * Base: /boards/:boardId/cards/:cardId
 */

import { apiClient } from "./client";

export interface VoteSummary {
  upvotes: number;
  downvotes: number;
  total: number;
}

export interface VoteResponse {
  action: "added" | "removed" | "changed";
  voteType: "up" | "down" | null;
  summary: VoteSummary;
}

export interface Voter {
  voterId: string;
  weight: number;
}

export interface UserVote {
  voteType: "up" | "down";
  weight: number;
  createdAt: string;
}

class VotesApi {
  /**
   * Vote on a card (upvote or downvote)
   * POST /boards/:boardId/cards/:cardId/vote
   * Toggle behavior: voting the same way removes the vote
   */
  async vote(
    boardId: string,
    cardId: string,
    voteType: "up" | "down"
  ): Promise<VoteResponse> {
    return apiClient.post<VoteResponse>(
      `/boards/${boardId}/cards/${cardId}/vote`,
      { voteType }
    );
  }

  /**
   * Remove vote from a card
   * DELETE /boards/:boardId/cards/:cardId/vote
   */
  async removeVote(
    boardId: string,
    cardId: string
  ): Promise<{ summary: VoteSummary }> {
    return apiClient.delete<{ summary: VoteSummary }>(
      `/boards/${boardId}/cards/${cardId}/vote`
    );
  }

  /**
   * Get vote summary for a card
   * GET /boards/:boardId/cards/:cardId/votes/summary
   */
  async getSummary(boardId: string, cardId: string): Promise<VoteSummary> {
    return apiClient.get<VoteSummary>(
      `/boards/${boardId}/cards/${cardId}/votes/summary`
    );
  }

  /**
   * Get all voters for a card
   * GET /boards/:boardId/cards/:cardId/votes/voters
   */
  async getVoters(boardId: string, cardId: string): Promise<Voter[]> {
    return apiClient.get<Voter[]>(
      `/boards/${boardId}/cards/${cardId}/votes/voters`
    );
  }

  /**
   * Get current user's vote on a card
   * GET /boards/:boardId/cards/:cardId/votes/me
   */
  async getMyVote(boardId: string, cardId: string): Promise<UserVote | null> {
    return apiClient.get<UserVote | null>(
      `/boards/${boardId}/cards/${cardId}/votes/me`
    );
  }
}

export const votesApi = new VotesApi();
