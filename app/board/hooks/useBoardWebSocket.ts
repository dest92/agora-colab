/**
 * Board WebSocket Hook
 * Handles WebSocket connection and event listeners
 */

import { useEffect, useRef } from "react";
import { socketClient, authApi } from "@/app/_lib/api";
import { getUserDisplayName } from "../utils/userCache";
import { mapLaneToColumn } from "../utils/boardMappers";
import type { Card, Comment, User } from "./useBoardData";

interface UseBoardWebSocketParams {
  boardId: string;
  workspaceId: string;
  lanes: { id: string; name: string }[];
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  setActiveUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loadLanes: (boardId: string) => Promise<{ id: string; name: string }[]>;
  loadCards: (
    boardId: string,
    lanes: { id: string; name: string }[],
    showLoading?: boolean
  ) => Promise<void>;
  getCurrentUser: () => User;
}

export const useBoardWebSocket = ({
  boardId,
  workspaceId,
  lanes,
  cards,
  setCards,
  setActiveUsers,
  loadLanes,
  loadCards,
  getCurrentUser,
}: UseBoardWebSocketParams) => {
  // Use refs to avoid re-registering listeners when cards/lanes change
  const cardsRef = useRef(cards);
  const lanesRef = useRef(lanes);

  // Update refs when values change
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    lanesRef.current = lanes;
  }, [lanes]);

  // Connect WebSocket
  useEffect(() => {
    if (!boardId || !workspaceId) return;

    const currentUserId = authApi.getCurrentUser()?.id;
    socketClient.connect({
      boardId,
      workspaceId,
      userId: currentUserId || undefined,
    });

    return () => {
      socketClient.disconnect();
    };
  }, [boardId, workspaceId]);

  // Register event listeners
  useEffect(() => {
    if (!boardId) return;

    console.log("🔌 Registering WebSocket event listeners");

    const handleCardCreated = async (payload: any) => {
      console.log("🔔 Card created event:", payload);

      const { cardId, authorId } = payload;

      // Check if the card was created by the current user
      const currentUserId = authApi.getCurrentUser()?.id;
      if (authorId === currentUserId) {
        console.log(
          "✅ Card created by current user (optimistic update already applied)"
        );
        return;
      }

      // Check if card already exists in UI using ref
      const cardExists = cardsRef.current.some((c) => c.id === cardId);

      if (cardExists) {
        console.log("✅ Card already in UI");
        return;
      }

      console.log("🔄 Reloading cards (new card from other user)");
      if (boardId) {
        loadCards(boardId, lanesRef.current, false); // false = don't show loading
      }
    };

    const handleCardUpdated = async (payload: any) => {
      console.log("🔔 Card updated event:", payload);

      // For updates from other users, reload to get the latest data
      // This is simpler than trying to merge partial updates
      if (boardId) {
        loadCards(boardId, lanesRef.current, false); // false = don't show loading
      }
    };

    const handleCardMoved = async (payload: any) => {
      console.log("🔔 Card moved event:", payload);

      const { cardId, targetLaneId, userId } = payload;

      const currentUserId = authApi.getCurrentUser()?.id;
      if (userId === currentUserId) {
        console.log(
          "✅ Card moved by current user (optimistic update already applied)"
        );
        return;
      }

      // Map lane ID to column name using the utility
      const targetColumn = mapLaneToColumn(targetLaneId, lanesRef.current);

      // Update card position for moves from other users
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === cardId ? { ...card, column: targetColumn } : card
        )
      );

      console.log(
        `✅ Card ${cardId} moved to column ${targetColumn} by another user`
      );
    };

    const handleCommentCreated = async (payload: any) => {
      console.log("🔔 Comment created event:", payload);

      const { commentId, cardId, authorId, content, createdAt } = payload;

      const currentUserId = authApi.getCurrentUser()?.id;
      if (authorId === currentUserId) {
        console.log("✅ Comment already in UI (optimistic update)");
        return;
      }

      try {
        const commentAuthorName = await getUserDisplayName(authorId);

        const newComment: Comment = {
          id: commentId,
          author: {
            name: commentAuthorName,
            emoji: "👥",
            color: "#999999",
          },
          content,
          timestamp: new Date(createdAt).getTime(),
        };

        setCards((prevCards) =>
          prevCards.map((card) => {
            if (card.id === cardId) {
              return { ...card, comments: [...card.comments, newComment] };
            }
            return card;
          })
        );

        console.log("✅ Comment added from another user");
      } catch (error) {
        console.error("❌ Failed to add comment:", error);
      }
    };

    const handleCardArchived = async (payload: any) => {
      console.log("🔔 Card archived event:", payload);

      const { cardId } = payload;

      // Remove the archived card from the UI
      setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));

      console.log(`✅ Card ${cardId} archived and removed from UI`);
    };

    const handleCardUnarchived = async (payload: any) => {
      console.log("🔔 Card unarchived event:", payload);

      // Reload cards to show the unarchived card
      if (boardId) {
        loadCards(boardId, lanesRef.current, false); // false = don't show loading
      }

      console.log("✅ Cards reloaded after unarchive");
    };

    const handlePresenceUpdate = async (payload: any) => {
      console.log("👥 Presence update:", payload);

      if (!payload.users || !Array.isArray(payload.users)) {
        console.warn("Invalid presence payload:", payload);
        return;
      }

      const presenceUsers: User[] = await Promise.all(
        payload.users.map(async (userId: string) => {
          const currentUserId = authApi.getCurrentUser()?.id;
          const isCurrentUser = userId === currentUserId;

          if (isCurrentUser) {
            return getCurrentUser();
          }

          const displayName = await getUserDisplayName(userId);
          return {
            name: displayName,
            emoji: "👥",
            color: "#999999",
            id: userId,
          };
        })
      );

      setActiveUsers(presenceUsers);
      console.log("✅ Active users updated:", presenceUsers.length);
    };

    // Register listeners
    socketClient.on("card:created", handleCardCreated);
    socketClient.on("card:updated", handleCardUpdated);
    socketClient.on("card:moved", handleCardMoved);
    socketClient.on("comment:created", handleCommentCreated);
    socketClient.on("card:archived", handleCardArchived);
    socketClient.on("card:unarchived", handleCardUnarchived);
    socketClient.on("presence:update", handlePresenceUpdate);

    return () => {
      console.log("🔌 Unregistering WebSocket event listeners");
      socketClient.off("card:created", handleCardCreated);
      socketClient.off("card:updated", handleCardUpdated);
      socketClient.off("card:moved", handleCardMoved);
      socketClient.off("comment:created", handleCommentCreated);
      socketClient.off("card:archived", handleCardArchived);
      socketClient.off("card:unarchived", handleCardUnarchived);
      socketClient.off("presence:update", handlePresenceUpdate);
    };
  }, [boardId, setCards, setActiveUsers, loadCards, getCurrentUser]);
};
