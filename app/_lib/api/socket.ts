/**
 * Socket.IO Client for Real-time Events
 * WebSocket URL: ws://localhost:3000
 * Architecture: Redis-backed Socket.IO for horizontal scaling
 */

import { io, Socket } from "socket.io-client";
import type { WebSocketEvent, DomainEventPayload } from "./types";

type EventHandler = (payload: DomainEventPayload) => void;

class SocketClient {
  private socket: Socket | null = null;
  private url: string;
  private lastJoinOptions?: {
    boardId?: string;
    workspaceId?: string;
    sessionId?: string;
  };
  private handlers: Map<WebSocketEvent, Set<EventHandler>> = new Map();

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";
  }

  /**
   * Connect to Socket.IO server
   * Auto-join rooms based on context
   */
  connect(options?: {
    boardId?: string;
    workspaceId?: string;
    sessionId?: string;
    userId?: string;
  }): Socket {
    // Remember last join options so we can re-join rooms after reconnects
    if (options) {
      this.lastJoinOptions = {
        boardId: options.boardId,
        workspaceId: options.workspaceId,
        sessionId: options.sessionId,
      };
    }

    if (this.socket?.connected) {
      console.warn("Socket already connected");
      // If the socket is already connected, emit a join for the new context
      if (options) {
        try {
          console.log("🔌 Emitting join for already-connected socket:", {
            boardId: options.boardId,
            workspaceId: options.workspaceId,
            sessionId: options.sessionId,
          });
          this.socket.emit("join", {
            boardId: options.boardId,
            workspaceId: options.workspaceId,
            sessionId: options.sessionId,
          });
        } catch (e) {
          console.warn("Failed to emit join on existing socket:", e);
        }
      }
      return this.socket;
    }

    this.socket = io(this.url, {
      query: {
        boardId: options?.boardId,
        workspaceId: options?.workspaceId,
        sessionId: options?.sessionId,
        userId: options?.userId,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.IO connected:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    // Re-attach event handlers after reconnection
    this.socket.on("connect", () => {
      this.reattachHandlers();
      // Re-join last rooms (if any)
      if (this.lastJoinOptions) {
        try {
          this.socket!.emit("join", this.lastJoinOptions);
        } catch (e) {
          console.warn("Failed to re-emit join after reconnect:", e);
        }
      }
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.handlers.clear();
    }
  }

  /**
   * Subscribe to a domain event
   */
  on(event: WebSocketEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    if (this.socket?.connected) {
      this.socket.on(event, handler);
    }
  }

  /**
   * Unsubscribe from a domain event
   */
  off(event: WebSocketEvent, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(event);
      }
    }

    if (this.socket?.connected) {
      this.socket.off(event, handler);
    }
  }

  /**
   * Join a room manually
   */
  join(context: {
    boardId?: string;
    workspaceId?: string;
    sessionId?: string;
  }): void {
    if (!this.socket?.connected) {
      console.warn("Cannot join room: socket not connected");
      return;
    }
    console.log("🔌 Manually joining room:", context);
    this.socket.emit("join", context);
  }

  /**
   * Leave a room manually
   */
  leave(context: {
    boardId?: string;
    workspaceId?: string;
    sessionId?: string;
  }): void {
    if (!this.socket?.connected) {
      console.warn("Cannot leave room: socket not connected");
      return;
    }
    this.socket.emit("leave", context);
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (use carefully)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Re-attach all event handlers (after reconnection)
   */
  private reattachHandlers(): void {
    if (!this.socket?.connected) return;

    this.handlers.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.socket!.on(event, handler);
      });
    });
  }
}

// Singleton instance
export const socketClient = new SocketClient();

/**
 * React Hook for Socket.IO (opcional, crear más adelante)
 */
export function useSocket(options?: {
  boardId?: string;
  workspaceId?: string;
  sessionId?: string;
}) {
  // TODO: Implement React hook with useEffect
  return socketClient;
}
