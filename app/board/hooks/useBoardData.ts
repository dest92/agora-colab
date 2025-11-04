/**
 * Board Data Hook
 * Handles loading of lanes, cards, and comments
 */

import { useState } from "react";
import {
  boardsApi,
  commentsApi,
  authApi,
  votesApi,
  assigneesApi,
} from "@/app/_lib/api";
import { getUserDisplayName } from "../utils/userCache";
import { mapLaneToColumn } from "../utils/boardMappers";

export interface User {
  name: string;
  emoji: string;
  color: string;
  id?: string;
}

export interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: number;
}

export interface Card {
  id: string;
  content: string;
  author: User;
  column: string;
  priority: "low" | "normal" | "high" | "urgent";
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  assignedTo?: User;
  timestamp: number;
  tags: string[];
}

export const useBoardData = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [lanes, setLanes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLanes = async (boardId: string) => {
    try {
      const lanesData = await boardsApi.getLanes(boardId);
      const mappedLanes = lanesData.map((lane) => ({
        id: lane.id,
        name: lane.name,
      }));
      setLanes(mappedLanes);
      console.log("✅ Lanes loaded:", lanesData);
      return mappedLanes;
    } catch (error) {
      console.error("Failed to load lanes:", error);
      return [];
    }
  };

  const loadCards = async (
    boardId: string,
    currentLanes: { id: string; name: string }[],
    showLoading: boolean = true
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const apiCards = await boardsApi.listCards(boardId);

      console.log("📥 Loading cards:", {
        count: apiCards.length,
        lanesAvailable: currentLanes.length,
        lanes: currentLanes,
      });

      const currentUserId = authApi.getCurrentUser()?.id;

      // Transform API cards to UI cards
      const uiCards: Card[] = await Promise.all(
        apiCards.map(async (apiCard) => {
          const column = mapLaneToColumn(apiCard.laneId, currentLanes);
          console.log("🗺️ Mapping card:", {
            cardId: apiCard.id,
            laneId: apiCard.laneId,
            mappedColumn: column,
          });

          const isCurrentUser = apiCard.authorId === currentUserId;

          // Get author display name
          let authorName = "You";
          if (!isCurrentUser) {
            authorName = await getUserDisplayName(apiCard.authorId);
          }

          // Load comments for this card
          let comments: Comment[] = [];
          try {
            const apiComments = await commentsApi.listComments(
              boardId,
              apiCard.id
            );
            comments = await Promise.all(
              apiComments.map(async (comment) => {
                const isCommentAuthorCurrentUser =
                  comment.authorId === currentUserId;
                let commentAuthorName = "You";
                if (!isCommentAuthorCurrentUser) {
                  commentAuthorName = await getUserDisplayName(
                    comment.authorId
                  );
                }

                return {
                  id: comment.id,
                  author: {
                    name: commentAuthorName,
                    email: comment.authorId,
                    emoji: isCommentAuthorCurrentUser ? "👤" : "👥",
                    color: isCommentAuthorCurrentUser ? "#00AFF0" : "#999999",
                  },
                  content: comment.content,
                  timestamp: new Date(comment.createdAt).getTime(),
                };
              })
            );
          } catch (error) {
            console.error(
              `❌ Failed to load comments for card ${apiCard.id}:`,
              error
            );
          }

          // Load votes for this card
          let likes: string[] = [];
          let dislikes: string[] = [];
          try {
            const voters = await votesApi.getVoters(boardId, apiCard.id);

            // Convert voter IDs to display names
            for (const voter of voters) {
              const voterName = await getUserDisplayName(voter.voterId);
              if (voter.weight === 1) {
                likes.push(voterName);
              } else if (voter.weight === -1) {
                dislikes.push(voterName);
              }
            }

            console.log(`✅ Loaded votes for card ${apiCard.id}:`, {
              likes,
              dislikes,
            });
          } catch (error) {
            console.error(
              `❌ Failed to load votes for card ${apiCard.id}:`,
              error
            );
          }

          // Load assignees for this card
          let assignedTo: User | undefined = undefined;
          try {
            console.log(`🔄 Loading assignees for card ${apiCard.id}...`);
            const assignees = await assigneesApi.getAssignees(
              boardId,
              apiCard.id
            );

            console.log(
              `📥 Assignees response for card ${apiCard.id}:`,
              assignees
            );

            // For now, we only support one assignee (the first one)
            if (assignees.length > 0) {
              const assignee = assignees[0];
              const isAssigneeCurrentUser = assignee.userId === currentUserId;
              let assigneeName = "You";
              if (!isAssigneeCurrentUser) {
                assigneeName = await getUserDisplayName(assignee.userId);
              }

              assignedTo = {
                name: assigneeName,
                emoji: isAssigneeCurrentUser ? "👤" : "👥",
                color: isAssigneeCurrentUser ? "#00AFF0" : "#999999",
                id: assignee.userId,
              };

              console.log(
                `✅ Loaded assignee for card ${apiCard.id}:`,
                assignedTo
              );
            } else {
              console.log(`ℹ️ No assignees found for card ${apiCard.id}`);
            }
          } catch (error) {
            console.error(
              `❌ Failed to load assignees for card ${apiCard.id}:`,
              error
            );
          }

          return {
            id: apiCard.id,
            content: apiCard.content,
            author: {
              name: authorName,
              email: apiCard.authorId,
              emoji: isCurrentUser ? "👤" : "👥",
              color: isCurrentUser ? "#00AFF0" : "#999999",
            },
            column,
            priority: apiCard.priority,
            likes,
            dislikes,
            comments,
            assignedTo,
            timestamp: new Date(apiCard.createdAt).getTime(),
            tags: [],
          };
        })
      );

      console.log("✅ Cards loaded and mapped:", uiCards.length);
      setCards(uiCards);
    } catch (error) {
      console.error("❌ Failed to load cards:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  return {
    cards,
    setCards,
    lanes,
    setLanes,
    loading,
    setLoading,
    loadLanes,
    loadCards,
  };
};
