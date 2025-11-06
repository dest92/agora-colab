/**
 * Board Actions Hook
 * Handles all board actions (create, update, delete cards, comments, etc.)
 */

import { useState, useRef } from "react";
import { boardsApi, commentsApi, votesApi, assigneesApi, tagsApi } from "@/app/_lib/api";
import { mapColumnToLaneId } from "../utils/boardMappers";
import type { Card, Comment, User } from "./useBoardData";
import type { Tag } from "@/app/_lib/api/types";

interface UseBoardActionsParams {
  boardId: string;
  lanes: { id: string; name: string }[];
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  user: User | null;
  availableTags?: Tag[];
  setAvailableTags?: React.Dispatch<React.SetStateAction<Tag[]>>;
}

export const useBoardActions = ({
  boardId,
  lanes,
  cards,
  setCards,
  user,
  availableTags = [],
  setAvailableTags,
}: UseBoardActionsParams) => {
  // Track cards being moved to prevent state overwrites
  const movingCardsRef = useRef<Set<string>>(new Set());
  const handleAddCard = async (
    columnId: string,
    content: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => {
    if (!user || !boardId) return;

    const laneId = mapColumnToLaneId(columnId, lanes);

    if (!laneId) {
      console.error("❌ Cannot find lane ID for column:", columnId);
      return;
    }

    // Find the lane name for the column
    const lane = lanes.find((l) => l.id === laneId);
    if (!lane) {
      console.error("❌ Cannot find lane for ID:", laneId);
      return;
    }

    // Generate temporary ID for optimistic update
    const tempId = `temp-${Date.now()}`;

    // Optimistic update: Add card to local state IMMEDIATELY
    // Use lane.name for column to match the filter
    const optimisticCard: Card = {
      id: tempId,
      content,
      author: user,
      column: lane.name, // Use lane name instead of columnId
      priority,
      likes: [],
      dislikes: [],
      comments: [],
      timestamp: Date.now(),
      tags: [],
    };

    setCards((prevCards) => [...prevCards, optimisticCard]);

    console.log("✅ Card added optimistically with temp ID:", tempId);

    // Then make the API call in the background
    try {
      console.log("📝 Creating card in backend:", {
        columnId,
        laneId,
        content,
        priority,
      });

      const newCard = await boardsApi.createCard(boardId, {
        content,
        priority,
        position: 1000,
        laneId,
      });

      // Replace temp card with real card from backend
      setCards((prevCards) =>
        prevCards.map((card) =>
          card.id === tempId
            ? {
                ...card,
                id: newCard.id,
                timestamp: new Date(newCard.createdAt).getTime(),
              }
            : card
        )
      );

      console.log("✅ Card created in backend, temp ID replaced:", {
        tempId,
        realId: newCard.id,
      });
    } catch (error) {
      console.error("❌ Failed to create card:", error);
      // Remove the optimistic card on error
      setCards((prevCards) => prevCards.filter((card) => card.id !== tempId));
    }
  };

  const handleMoveCard = async (cardId: string, newColumn: string) => {
    if (!boardId) return;

    console.log("🔄 Moving card:", {
      cardId,
      newColumn,
      lanesAvailable: lanes.length,
    });

    // Mark card as being moved
    movingCardsRef.current.add(cardId);

    // Convert lane ID to lane name for UI state
    // newColumn comes as UUID from BoardColumn component
    const targetLane = lanes.find((l) => l.id === newColumn);
    const columnName = targetLane ? targetLane.name : newColumn;

    console.log("🎯 Target column:", {
      receivedId: newColumn,
      laneName: columnName,
      targetLane,
    });

    // Update local state optimistically with lane name
    const updatedCards = cards.map((card) =>
      card.id === cardId ? { ...card, column: columnName } : card
    );
    setCards(updatedCards);

    try {
      const laneId = mapColumnToLaneId(newColumn, lanes);

      console.log("🗺️ Lane mapping:", { newColumn, laneId, allLanes: lanes });

      if (!laneId) {
        console.error("❌ Cannot find lane ID for column:", newColumn);
        setCards(cards); // Revert
        movingCardsRef.current.delete(cardId);
        return;
      }

      await boardsApi.updateCard(boardId, cardId, {
        laneId: laneId,
      });

      console.log(`✅ Card ${cardId} moved to ${columnName} (lane: ${laneId})`);
      
      // Keep the card marked as moving for a bit to prevent overwrites from events
      setTimeout(() => {
        movingCardsRef.current.delete(cardId);
      }, 2000);
    } catch (error) {
      console.error("❌ Failed to move card:", error);
      setCards(cards); // Revert optimistic update on error
      movingCardsRef.current.delete(cardId);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!boardId) return;

    // Update local state optimistically
    const updatedCards = cards.filter((card) => card.id !== cardId);
    setCards(updatedCards);

    try {
      await boardsApi.archiveCard(boardId, cardId);
      console.log(`✅ Card ${cardId} archived`);
    } catch (error) {
      console.error("Failed to archive card:", error);
      setCards(cards); // Revert optimistic update on error
    }
  };

  const handleVote = async (cardId: string, type: "like" | "dislike") => {
    if (!user || !boardId) return;

    const voteType = type === "like" ? "up" : "down";

    // Optimistic update
    setCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id !== cardId) return card;

        const newCard = { ...card };

        if (type === "like") {
          if (newCard.likes.includes(user.name)) {
            // Remove like
            newCard.likes = newCard.likes.filter((name) => name !== user.name);
          } else {
            // Add like and remove dislike if present
            newCard.likes = [...newCard.likes, user.name];
            newCard.dislikes = newCard.dislikes.filter(
              (name) => name !== user.name
            );
          }
        } else {
          if (newCard.dislikes.includes(user.name)) {
            // Remove dislike
            newCard.dislikes = newCard.dislikes.filter(
              (name) => name !== user.name
            );
          } else {
            // Add dislike and remove like if present
            newCard.dislikes = [...newCard.dislikes, user.name];
            newCard.likes = newCard.likes.filter((name) => name !== user.name);
          }
        }

        return newCard;
      })
    );

    // Call API
    try {
      await votesApi.vote(boardId, cardId, voteType);
      console.log(`✅ Vote ${voteType} registered for card ${cardId}`);
    } catch (error) {
      console.error("❌ Failed to vote:", error);
      // Revert optimistic update on error
      setCards(cards);
    }
  };

  const handleAddComment = async (cardId: string, content: string) => {
    if (!user || !boardId) return;

    try {
      const newComment = await commentsApi.createComment(boardId, cardId, {
        content,
      });

      // Update local state with the new comment
      setCards(
        cards.map((card) => {
          if (card.id !== cardId) return card;

          const commentWithLocalFormat: Comment = {
            id: newComment.id,
            author: user,
            content: newComment.content,
            timestamp: new Date(newComment.createdAt).getTime(),
          };

          return {
            ...card,
            comments: [...card.comments, commentWithLocalFormat],
          };
        })
      );

      console.log("✅ Comment created:", newComment);
    } catch (error) {
      console.error("❌ Failed to create comment:", error);
    }
  };

  const handleChangePriority = (
    cardId: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => {
    setCards(
      cards.map((card) => (card.id === cardId ? { ...card, priority } : card))
    );
  };

  const handleAssignUser = async (
    cardId: string,
    assignedUser: User | undefined
  ) => {
    console.log("👤 Assigning user to card:", { cardId, assignedUser });

    // Optimistic update
    const previousCards = [...cards];
    setCards(
      cards.map((card) =>
        card.id === cardId ? { ...card, assignedTo: assignedUser } : card
      )
    );

    try {
      if (assignedUser && assignedUser.id) {
        // Assign user
        console.log("📞 Calling API to assign user...");
        await assigneesApi.addAssignee(boardId, cardId, assignedUser.id);
        console.log("✅ User assigned successfully");
      } else {
        // Unassign user - we need to get the current assignee first
        const currentCard = cards.find((c) => c.id === cardId);
        if (currentCard?.assignedTo?.id) {
          console.log("📞 Calling API to remove assignee...");
          await assigneesApi.removeAssignee(
            boardId,
            cardId,
            currentCard.assignedTo.id
          );
          console.log("✅ Assignee removed successfully");
        }
      }
    } catch (error) {
      console.error("❌ Failed to update assignee:", error);
      // Revert on error
      setCards(previousCards);
    }
  };

  const handleAddTag = async (cardId: string, label: string, color?: string) => {
    if (!boardId) return;

    console.log("🏷️ Adding tag to card:", { cardId, label, color });

    try {
      // Step 1: Create or find existing tag
      const newTag = await tagsApi.createTag(boardId, { label, color });
      console.log("✅ Tag created/found:", newTag);

      // Add to available tags if not already there
      if (setAvailableTags && !availableTags.find(t => t.id === newTag.id)) {
        setAvailableTags([...availableTags, newTag]);
      }

      // Step 2: Assign tag to card
      await tagsApi.assignTag(boardId, cardId, newTag.id);
      console.log("✅ Tag assigned to card");

      // Step 3: Update local state (optimistic)
      setCards(
        cards.map((card) => {
          if (card.id !== cardId) return card;
          // Check if tag already exists
          if (card.tags.some(t => t.id === newTag.id)) return card;
          return { ...card, tags: [...card.tags, newTag] };
        })
      );
    } catch (error) {
      console.error("❌ Failed to add tag:", error);
    }
  };

  const handleRemoveTag = async (cardId: string, tagId: string) => {
    if (!boardId) return;

    console.log("🏷️ Removing tag from card:", { cardId, tagId });

    // Optimistic update
    const previousCards = [...cards];
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card;
        return { ...card, tags: card.tags.filter((t) => t.id !== tagId) };
      })
    );

    try {
      await tagsApi.unassignTag(boardId, cardId, tagId);
      console.log("✅ Tag unassigned from card");
    } catch (error) {
      console.error("❌ Failed to remove tag:", error);
      // Revert on error
      setCards(previousCards);
    }
  };

  return {
    handleAddCard,
    handleMoveCard,
    handleDeleteCard,
    handleVote,
    handleAddComment,
    handleChangePriority,
    handleAssignUser,
    handleAddTag,
    handleRemoveTag,
    movingCardsRef,
  };
};
