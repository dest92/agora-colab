/**
 * Board Data Hook
 * Handles loading of lanes, cards, and comments
 */

import { useState, useCallback } from "react";
import {
  boardsApi,
  commentsApi,
  authApi,
  votesApi,
  assigneesApi,
  tagsApi,
  type Tag,
} from "@/app/_lib/api";
import { getUserInfo } from "../utils/userCache";
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
  tags: Tag[];
}

export const useBoardData = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [lanes, setLanes] = useState<{ id: string; name: string }[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTags = useCallback(async (boardId: string) => {
    try {
      const tags = await tagsApi.listTags(boardId);
      setAvailableTags(tags);
      console.log("✅ Tags loaded:", tags);
      return tags;
    } catch (error) {
      console.error("Failed to load tags:", error);
      return [];
    }
  }, []);

  const loadLanes = useCallback(async (boardId: string) => {
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
  }, []);

  const loadCards = useCallback(
    async (
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
          apiCards: apiCards.map((c) => ({
            id: c.id,
            laneId: c.laneId,
            content: c.content,
          })),
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
              content: apiCard.content.substring(0, 20),
            });

            const isCurrentUser = apiCard.authorId === currentUserId;

            // Get author info (name, emoji, color)
            let authorInfo = await getUserInfo(apiCard.authorId);
            if (isCurrentUser) {
              authorInfo = {
                ...authorInfo,
                name: "You",
                emoji: "👤",
                color: "#00AFF0",
              };
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

                  let commentAuthorInfo = await getUserInfo(comment.authorId);
                  if (isCommentAuthorCurrentUser) {
                    commentAuthorInfo = {
                      ...commentAuthorInfo,
                      name: "You",
                      emoji: "👤",
                      color: "#00AFF0",
                    };
                  }

                  return {
                    id: comment.id,
                    author: {
                      name: commentAuthorInfo.name,
                      email: comment.authorId,
                      emoji: commentAuthorInfo.emoji,
                      color: commentAuthorInfo.color,
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
                const voterInfo = await getUserInfo(voter.voterId);
                if (voter.weight === 1) {
                  likes.push(voterInfo.name);
                } else if (voter.weight === -1) {
                  dislikes.push(voterInfo.name);
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

                let assigneeInfo = await getUserInfo(assignee.userId);
                if (isAssigneeCurrentUser) {
                  assigneeInfo = {
                    ...assigneeInfo,
                    name: "You",
                    emoji: "👤",
                    color: "#00AFF0",
                  };
                }

                assignedTo = {
                  name: assigneeInfo.name,
                  emoji: assigneeInfo.emoji,
                  color: assigneeInfo.color,
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

            // Load tags for this card
            let cardTags: Tag[] = [];
            try {
              console.log(`🔄 Loading tags for card ${apiCard.id}...`);
              // TODO: Need to implement getCardTags endpoint in backend
              // For now, we'll keep it empty and rely on WebSocket updates
              console.log(`ℹ️ Tags will be loaded via WebSocket events`);
            } catch (error) {
              console.error(
                `❌ Failed to load tags for card ${apiCard.id}:`,
                error
              );
            }

            return {
              id: apiCard.id,
              content: apiCard.content,
              author: {
                name: authorInfo.name,
                email: apiCard.authorId,
                emoji: authorInfo.emoji,
                color: authorInfo.color,
              },
              column,
              priority: apiCard.priority,
              likes,
              dislikes,
              comments,
              assignedTo,
              timestamp: new Date(apiCard.createdAt).getTime(),
              tags: cardTags,
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
    },
    []
  );

  return {
    cards,
    setCards,
    lanes,
    setLanes,
    availableTags,
    setAvailableTags,
    loading,
    setLoading,
    loadLanes,
    loadCards,
    loadTags,
  };
};
