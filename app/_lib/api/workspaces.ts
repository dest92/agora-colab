/**
 * Workspaces API
 * Service: Sessions Service (via API Gateway)
 * Base: /workspaces
 */

import { apiClient } from "./client";

export interface Workspace {
  id: string;
  ownerId: string;
  name: string;
  createdAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
}

class WorkspacesApi {
  /**
   * Create a new workspace
   * POST /workspaces
   */
  async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    return apiClient.post<Workspace>("/workspaces", dto);
  }

  /**
   * List all workspaces for current user
   * GET /workspaces
   */
  async listWorkspaces(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>("/workspaces");
  }
}

export const workspacesApi = new WorkspacesApi();
