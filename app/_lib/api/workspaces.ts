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

export interface WorkspaceMember {
  userId: string;
  role: string;
  joinedAt: string;
}

export interface AddMemberDto {
  userId: string;
}

export interface WorkspaceInvite {
  workspaceId: string;
  workspaceName: string;
  ownerId: string;
  role: string;
  joinedAt: string;
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

  /**
   * Add member to workspace
   * POST /workspaces/:workspaceId/members
   */
  async addMember(
    workspaceId: string,
    dto: AddMemberDto
  ): Promise<{ added: boolean }> {
    return apiClient.post<{ added: boolean }>(
      `/workspaces/${workspaceId}/members`,
      dto
    );
  }

  /**
   * List members of a workspace
   * GET /workspaces/:workspaceId/members
   */
  async listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return apiClient.get<WorkspaceMember[]>(
      `/workspaces/${workspaceId}/members`
    );
  }

  /**
   * List workspaces where user is member (invitations received)
   * GET /workspaces/invites/list
   */
  async listInvites(): Promise<WorkspaceInvite[]> {
    return apiClient.get<WorkspaceInvite[]>("/workspaces/invites/list");
  }
}

export const workspacesApi = new WorkspacesApi();
