/**
 * API Types para Agora Backend (Microservices Architecture)
 * Base URL: http://localhost:3000 (API Gateway)
 */

// ============================================
// Cards (Boards Service)
// ============================================

export interface Card {
  id: string;
  boardId: string;
  authorId: string;
  content: string;
  laneId: string;
  priority: "low" | "normal" | "high" | "urgent";
  position: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardDto {
  content: string;
  priority?: "low" | "normal" | "high" | "urgent";
  position?: number;
  laneId?: string;
}

export interface UpdateCardDto {
  content?: string;
  laneId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  position?: number;
}

export interface ListCardsQuery {
  laneId?: string;
}

// ============================================
// Tags (Collab Service)
// ============================================

export interface Tag {
  id: string;
  boardId: string;
  label: string;
  color: string | null;
  createdAt?: string;
}

export interface CreateTagDto {
  label: string;
  color?: string;
}

export interface TagAssignResult {
  assigned: boolean;
}

export interface TagUnassignResult {
  unassigned: boolean;
}

// ============================================
// Assignees (Collab Service)
// ============================================

export interface AssigneeAddResult {
  assigned: boolean;
}

export interface AssigneeRemoveResult {
  removed: boolean;
}

// ============================================
// Comments (Legacy - Por migrar)
// ============================================

export interface Comment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface CreateCommentDto {
  content: string;
}

// ============================================
// Votes (Legacy - Por migrar)
// ============================================

export interface Vote {
  id: string;
  cardId: string;
  userId: string;
  voteType: "up" | "down";
  createdAt: string;
}

// ============================================
// Workspaces
// ============================================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

// ============================================
// Sessions
// ============================================

export interface Session {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
}

export interface CreateSessionDto {
  workspaceId: string;
  name: string;
}

// ============================================
// WebSocket Events
// ============================================

export type WebSocketEvent =
  // Cards
  | "card:created"
  | "card:updated"
  | "card:moved"
  | "card:archived"
  | "card:unarchived"
  // Tags
  | "tag:created"
  | "tag:assigned"
  | "tag:unassigned"
  // Assignees
  | "assignee:added"
  | "assignee:removed"
  // Comments
  | "comment:created"
  // Votes (cuando se migren)
  | "vote:cast"
  | "vote:removed"
  // Presence
  | "presence:update";

export interface DomainEventPayload {
  [key: string]: any;
}
