/**
 * Board WebSocket Hook
 * Handles WebSocket connection and event listeners
 */

import { useEffect, useRef } from "react";
import { socketClient, authApi } from "@/app/_lib/api";
import { getUserInfo } from "../utils/userCache";
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

    // Ensure we explicitly join the board/workspace room if the socket was
    // already connected (connect() will emit join when already connected,
    // but calling join here is idempotent and acts as a safe guarantee).
    if (socketClient.isConnected()) {
      try {
        socketClient.join({ boardId, workspaceId });
      } catch (e) {
        console.warn("Failed to emit join from useBoardWebSocket:", e);
      }
    }

    return () => {
      // Leave the board room when unmounting or changing board
      console.log(`Leaving board ${boardId} and workspace ${workspaceId}`);
      try {
        socketClient.leave({ boardId, workspaceId });
      } catch (e) {
        console.warn("Failed to emit leave from useBoardWebSocket:", e);
      }
      // Don't disconnect the socket - we might still be in the workspace
      // socketClient.disconnect();
    };
  }, [boardId, workspaceId]);

  // Register event listeners
  useEffect(() => {
    if (!boardId) return;

    console.log("🔌 Registering WebSocket event listeners");

    const handleCardCreated = async (payload: any) => {
      console.log("Card created event:", payload);

      const { cardId, authorId } = payload;

      // Check if the card was created by the current user
      const currentUserId = authApi.getCurrentUser()?.id;
      if (authorId === currentUserId) {
        console.log(
          "Card created by current user (optimistic update already applied)"
        );
        return;
      }

      // Check if card already exists in UI using ref
      const cardExists = cardsRef.current.some((c) => c.id === cardId);

      if (cardExists) {
        console.log("Card already in UI");
        return;
      }

      console.log("Reloading cards (new card from other user)");
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
      console.log("Card moved event:", payload);

      const { cardId, targetLaneId, userId } = payload;

      const currentUserId = authApi.getCurrentUser()?.id;
      if (userId === currentUserId) {
        console.log(
          "Card moved by current user (optimistic update already applied)"
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
        `Card ${cardId} moved to column ${targetColumn} by another user`
      );
    };

    const handleCommentCreated = async (payload: any) => {
      console.log("🔔 Comment created event:", payload);

      const { commentId, cardId, authorId, content, createdAt } = payload;

      const currentUserId = authApi.getCurrentUser()?.id;
      if (authorId === currentUserId) {
        console.log("Comment already in UI (optimistic update)");
        return;
      }

      try {
        const commentAuthorInfo = await getUserInfo(authorId);

        const newComment: Comment = {
          id: commentId,
          author: {
            name: commentAuthorInfo.name,
            emoji: commentAuthorInfo.emoji,
            color: commentAuthorInfo.color,
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

        console.log("Comment added from another user");
      } catch (error) {
        console.error("Failed to add comment:", error);
      }
    };

    const handleCardArchived = async (payload: any) => {
      console.log("Card archived event:", payload);

      const { cardId } = payload;

      // Remove the archived card from the UI
      setCards((prevCards) => prevCards.filter((card) => card.id !== cardId));

      console.log(`Card ${cardId} archived and removed from UI`);
    };

    const handleCardUnarchived = async (payload: any) => {
      console.log("Card unarchived event:", payload);

      // Reload cards to show the unarchived card
      if (boardId) {
        loadCards(boardId, lanesRef.current, false); // false = don't show loading
      }

      console.log("Cards reloaded after unarchive");
    };

    const handleVoteChanged = async (payload: any) => {
      console.log("Vote changed event:", payload);

      const { cardId, voterId, action, summary } = payload;

      // Check if the vote was made by the current user
      const currentUserId = authApi.getCurrentUser()?.id;
      if (voterId === currentUserId) {
        console.log("Vote by current user (optimistic update already applied)");
        return;
      }

      // Get voter info
      const voterInfo = await getUserInfo(voterId);
      const voterName = voterInfo.name;

      // Update the card's vote counts
      setCards((prevCards) =>
        prevCards.map((card) => {
          if (card.id !== cardId) return card;

          // For simplicity, we'll just update the likes/dislikes arrays
          // In a real scenario, you might want to store the actual vote data
          const newCard = { ...card };

          // This is a simplified update - you may want to track actual voters
          // For now, we'll just ensure the voter is in the right list
          if (action === "removed") {
            newCard.likes = newCard.likes.filter((name) => name !== voterName);
            newCard.dislikes = newCard.dislikes.filter(
              (name) => name !== voterName
            );
          } else if (action === "added" || action === "changed") {
            const voteType = payload.voteType;
            if (voteType === "up") {
              if (!newCard.likes.includes(voterName)) {
                newCard.likes = [...newCard.likes, voterName];
              }
              newCard.dislikes = newCard.dislikes.filter(
                (name) => name !== voterName
              );
            } else if (voteType === "down") {
              if (!newCard.dislikes.includes(voterName)) {
                newCard.dislikes = [...newCard.dislikes, voterName];
              }
              newCard.likes = newCard.likes.filter(
                (name) => name !== voterName
              );
            }
          }

          return newCard;
        })
      );

      console.log(`Vote ${action} for card ${cardId} by ${voterName}`);
    };

    const handleAssigneeAdded = async (payload: any) => {
      console.log("📥 WebSocket: assignee:added", payload);

      const { cardId, userId } = payload;

      const currentUser = getCurrentUser();
      const isCurrentUser = userId === currentUser?.id;

      let assigneeInfo = await getUserInfo(userId);
      if (isCurrentUser) {
        assigneeInfo = {
          ...assigneeInfo,
          name: "You",
          emoji: "👤",
          color: "#00AFF0",
        };
      }

      cardsRef.current = cardsRef.current.map((card) => {
        if (card.id !== cardId) return card;

        return {
          ...card,
          assignedTo: {
            name: assigneeInfo.name,
            emoji: assigneeInfo.emoji,
            color: assigneeInfo.color,
            id: userId,
          },
        };
      });

      setCards(cardsRef.current);
      console.log(`✅ Assignee added to card ${cardId}: ${assigneeInfo.name}`);
    };

    const handleAssigneeRemoved = (payload: any) => {
      console.log("📥 WebSocket: assignee:removed", payload);

      const { cardId } = payload;

      cardsRef.current = cardsRef.current.map((card) => {
        if (card.id !== cardId) return card;

        return {
          ...card,
          assignedTo: undefined,
        };
      });

      setCards(cardsRef.current);
      console.log(`Assignee removed from card ${cardId}`);
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

          const userInfo = await getUserInfo(userId);
          return {
            name: userInfo.name,
            emoji: userInfo.emoji,
            color: userInfo.color,
            id: userId,
          };
        })
      );

      setActiveUsers(presenceUsers);
      console.log("Active users updated:", presenceUsers.length);
    };

    const handleLaneCreated = async (payload: any) => {
      console.log("🚨🚨🚨 LANE CREATED EVENT RECEIVED 🚨🚨🚨");
      console.log("Lane created event:", payload);

      const { laneId, name } = payload;

      console.log("📊 Current lanes before update:", {
        count: lanesRef.current.length,
        lanes: lanesRef.current,
      });

      // Check if the lane already exists in current state
      const laneExists = lanesRef.current.some((l) => l.id === laneId);

      if (laneExists) {
        console.log("✅ Lane already in UI (optimistic update)");
        return;
      }

      console.log("🔄 Reloading lanes for other users...");

      // Reload lanes to show the new lane (for other users)
      if (boardId) {
        const updatedLanes = await loadLanes(boardId);
        console.log("✅ Lanes reloaded:", {
          count: updatedLanes.length,
          lanes: updatedLanes,
        });
      }

      console.log("✅ Lanes updated after lane creation");
    };

    const handleLaneUpdated = async (payload: any) => {
      console.log("Lane updated event:", payload);

      // Reload lanes to show the updated positions
      if (boardId) {
        await loadLanes(boardId);
      }

      console.log("Lanes reloaded after lane update");
    };

    const handleLaneDeleted = async (payload: any) => {
      console.log("Lane deleted event:", payload);

      const { laneId } = payload;

      console.log("Current state before reload:", {
        lanesCount: lanesRef.current.length,
        cardsCount: cardsRef.current.length,
        laneToDelete: lanesRef.current.find((l) => l.id === laneId),
      });

      // Reload lanes first to get the updated list
      if (boardId) {
        const updatedLanes = await loadLanes(boardId);
        console.log("Lanes after reload:", {
          count: updatedLanes.length,
          lanes: updatedLanes,
        });

        // Then reload cards with the updated lanes
        // This will automatically filter out cards from the deleted lane
        await loadCards(boardId, updatedLanes, false);

        console.log("Cards after reload:", {
          count: cardsRef.current.length,
        });
      }

      const handleLaneDeleted = async (payload: any) => {
        console.log("LANE DELETED EVENT RECEIVED");
        console.log("Lane deleted event:", payload);

        const { laneId } = payload;

        // Check if the lane still exists in current state
        const laneExists = lanesRef.current.some((l) => l.id === laneId);

        if (!laneExists) {
          console.log("Lane already removed from UI (optimistic update)");
          return;
        }

        console.log("Current state before update:", {
          lanesCount: lanesRef.current.length,
          cardsCount: cardsRef.current.length,
        });

        // Remove cards from the deleted lane immediately
        const laneToDelete = lanesRef.current.find((l) => l.id === laneId);
        if (laneToDelete) {
          setCards((prevCards) =>
            prevCards.filter((card) => {
              const cardLaneId = lanesRef.current.find(
                (l) => l.name === card.column
              )?.id;
              return cardLaneId !== laneId && card.column !== laneId;
            })
          );
        }

        // Reload lanes in background to sync with backend
        if (boardId) {
          await loadLanes(boardId);
        }

        console.log(`Lane ${laneId} deleted and UI updated`);
      };
    };

    // Register listeners
    socketClient.on("card:created", handleCardCreated);
    socketClient.on("card:updated", handleCardUpdated);
    socketClient.on("card:moved", handleCardMoved);
    socketClient.on("comment:created", handleCommentCreated);
    socketClient.on("card:archived", handleCardArchived);
    socketClient.on("card:unarchived", handleCardUnarchived);
    socketClient.on("vote:changed", handleVoteChanged);
    socketClient.on("assignee:added", handleAssigneeAdded);
    socketClient.on("assignee:removed", handleAssigneeRemoved);
    socketClient.on("presence:update", handlePresenceUpdate);
    socketClient.on("lane:created", handleLaneCreated);
    socketClient.on("lane:updated", handleLaneUpdated);
    socketClient.on("lane:deleted", handleLaneDeleted);

    return () => {
      console.log("🔌 Unregistering WebSocket event listeners");
      socketClient.off("card:created", handleCardCreated);
      socketClient.off("card:updated", handleCardUpdated);
      socketClient.off("card:moved", handleCardMoved);
      socketClient.off("comment:created", handleCommentCreated);
      socketClient.off("card:archived", handleCardArchived);
      socketClient.off("card:unarchived", handleCardUnarchived);
      socketClient.off("vote:changed", handleVoteChanged);
      socketClient.off("assignee:added", handleAssigneeAdded);
      socketClient.off("assignee:removed", handleAssigneeRemoved);
      socketClient.off("presence:update", handlePresenceUpdate);
      socketClient.off("lane:created", handleLaneCreated);
      socketClient.off("lane:updated", handleLaneUpdated);
      socketClient.off("lane:deleted", handleLaneDeleted);
    };
  }, [boardId, setCards, setActiveUsers, loadCards, loadLanes, getCurrentUser]);
};
