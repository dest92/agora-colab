/**
 * API Module - Centralized Exports
 * Architecture: Microservices via API Gateway
 */

// Types
export * from "./types";

// HTTP Client
export { apiClient } from "./client";

// API Services
export { authApi } from "./auth";
export type { AuthResponse, RegisterDto, LoginDto } from "./auth";
export { boardsApi } from "./boards";
export type { Board, CreateBoardDto } from "./boards";
export { tagsApi } from "./tags";
export { assigneesApi } from "./assignees";
export { commentsApi } from "./comments";
export { workspacesApi } from "./workspaces";
export type { Workspace, CreateWorkspaceDto } from "./workspaces";
export { sessionsApi } from "./sessions";
export type { Session, CreateSessionDto } from "./sessions";

// Socket.IO Client
export { socketClient, useSocket } from "./socket";
