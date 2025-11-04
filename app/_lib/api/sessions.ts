/**
 * Sessions API
 * Service: Sessions Service (via API Gateway)
 * Base: /workspaces/:workspaceId/sessions
 */

import { apiClient } from "./client";

export interface Session {
  id: string;
  workspaceId: string;
  title: string;
  createdAt: string;
}

export interface CreateSessionDto {
  title: string;
}

class SessionsApi {
  /**
   * Create a new session
   * POST /workspaces/:workspaceId/sessions
   */
  async createSession(
    workspaceId: string,
    dto: CreateSessionDto
  ): Promise<Session> {
    return apiClient.post<Session>(`/workspaces/${workspaceId}/sessions`, dto);
  }

  /**
   * Join a session
   * POST /sessions/:sessionId/join
   */
  async joinSession(sessionId: string): Promise<{ joined: boolean }> {
    return apiClient.post<{ joined: boolean }>(`/sessions/${sessionId}/join`);
  }

  /**
   * Leave a session
   * POST /sessions/:sessionId/leave
   */
  async leaveSession(sessionId: string): Promise<{ left: boolean }> {
    return apiClient.post<{ left: boolean }>(`/sessions/${sessionId}/leave`);
  }

  /**
   * Get presence in a session
   * GET /sessions/:sessionId/presence
   */
  async getPresence(sessionId: string): Promise<{ users: string[] }> {
    return apiClient.get<{ users: string[] }>(
      `/sessions/${sessionId}/presence`
    );
  }
}

export const sessionsApi = new SessionsApi();
