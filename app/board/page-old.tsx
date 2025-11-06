"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BoardColumn } from "../_components/board-column";
import {
  Users,
  LogOut,
  Search,
  Filter,
  BarChart3,
  Download,
  Upload,
  Clock,
} from "lucide-react";
import { Input } from "../_components/ui/input";
import {
  authApi,
  boardsApi,
  socketClient,
  commentsApi,
  type Card as ApiCard,
  type Tag,
} from "@/app/_lib/api";
import { usersApi } from "@/app/_lib/api/users";

interface User {
  name: string;
  emoji: string;
  color: string;
  id?: string; // Add id field
}

// Cache for user info
const userCache = new Map<string, { email: string; name: string }>();

interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: number;
}

interface Card {
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

const getCurrentUser = (): User => {
  const user = authApi.getCurrentUser();
  return {
    name: user?.email?.split("@")[0] || "User",
    emoji: "👤",
    color: "#00AFF0",
    id: user?.id || undefined,
  };
};

// Helper to get user display name from ID
const getUserDisplayName = async (userId: string): Promise<string> => {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!.name;
  }

  try {
    const user = await usersApi.getUser(userId);
    const displayName = user.email?.split("@")[0] || userId.substring(0, 8);
    userCache.set(userId, { email: user.email, name: displayName });
    return displayName;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return userId.substring(0, 8) + "...";
  }
};

const COLUMNS = [
  { id: "ideas", title: "Ideas", color: "wp-cyan" },
  { id: "discuss", title: "Discuss", color: "wp-magenta" },
  { id: "decided", title: "Decided", color: "wp-lime" },
];

export default function BoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [boardId, setBoardId] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);
  const [lanes, setLanes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "normal" | "high" | "urgent"
  >("all");
  const [filterUser, setFilterUser] = useState<string | "all">("all");
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    // Check authentication
    const authenticated = authApi.isAuthenticated();
    if (!authenticated) {
      router.push("/login");
      return;
    }

    // Get selected board from localStorage
    const selectedBoard = localStorage.getItem("agora-selected-board");
    const selectedWorkspace = localStorage.getItem("agora-selected-workspace");

    if (!selectedBoard || !selectedWorkspace) {
      router.push("/dashboard");
      return;
    }

    setBoardId(selectedBoard);
    setWorkspaceId(selectedWorkspace);
    setUser(getCurrentUser());

    // Load lanes first, then cards (to ensure proper mapping)
    const initializeBoard = async () => {
      const loadedLanes = await loadLanes(selectedBoard);
      await loadCards(selectedBoard, loadedLanes);
    };
    initializeBoard();

    // Connect WebSocket
    const currentUserId = authApi.getCurrentUser()?.id;
    socketClient.connect({
      boardId: selectedBoard,
      workspaceId: selectedWorkspace,
      userId: currentUserId || undefined,
    });

    return () => {
      socketClient.disconnect();
    };
  }, [router]);

  // Register WebSocket event listeners (separate useEffect to ensure handlers are defined)
  useEffect(() => {
    if (!boardId) return;

    console.log("🔌 Registering WebSocket event listeners");

    // Listen to card events
    socketClient.on("card:created", handleCardCreated);
    socketClient.on("card:updated", handleCardUpdated);
    socketClient.on("card:moved", handleCardMoved);

    // Listen to comment events
    socketClient.on("comment:created", handleCommentCreated);

    // Listen to presence events
    socketClient.on("presence:update", handlePresenceUpdate);

    return () => {
      console.log("🔌 Unregistering WebSocket event listeners");
      socketClient.off("card:created", handleCardCreated);
      socketClient.off("card:updated", handleCardUpdated);
      socketClient.off("card:moved", handleCardMoved);
      socketClient.off("comment:created", handleCommentCreated);
      socketClient.off("presence:update", handlePresenceUpdate);
    };
  }, [boardId, cards, lanes]); // Re-register when dependencies change

  const loadLanes = async (boardId: string) => {
    try {
      const lanesData = await boardsApi.getLanes(boardId);
      const mappedLanes = lanesData.map((lane) => ({
        id: lane.id,
        name: lane.name,
      }));
      setLanes(mappedLanes);
      console.log("✅ Lanes loaded:", lanesData);
      return mappedLanes; // Return lanes so we can use them immediately
    } catch (error) {
      console.error("Failed to load lanes:", error);
      return [];
    }
  };

  const loadCards = async (
    boardId: string,
    currentLanes: { id: string; name: string }[]
  ) => {
    try {
      setLoading(true);
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
          const column = mapLaneToColumnWithLanes(apiCard.laneId, currentLanes);
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

          return {
            id: apiCard.id,
            content: apiCard.content,
            author: {
              name: authorName,
              email: apiCard.authorId, // Store full ID
              emoji: isCurrentUser ? "👤" : "👥",
              color: isCurrentUser ? "#00AFF0" : "#999999",
            },
            column,
            priority: apiCard.priority, // Use backend priority directly
            likes: [],
            dislikes: [],
            comments,
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
      setLoading(false);
    }
  };

  const mapLaneToColumnWithLanes = (
    laneId: string | null,
    lanesArray: { id: string; name: string }[]
  ): string => {
    if (!laneId || lanesArray.length === 0) {
      console.warn("⚠️ mapLaneToColumn: No laneId or lanes empty", {
        laneId,
        lanesCount: lanesArray.length,
      });
      return "ideas"; // Default
    }

    const lane = lanesArray.find((l) => l.id === laneId);
    if (!lane) {
      console.warn("⚠️ mapLaneToColumn: Lane not found", {
        laneId,
        availableLanes: lanesArray,
      });
      return "ideas"; // Default if lane not found
    }

    // Map lane name to column ID
    console.log("✅ mapLaneToColumn:", { laneId, laneName: lane.name });
    return lane.name; // lanes are created with names: "ideas", "discuss", "decided"
  };

  const mapColumnToLaneId = (columnName: string): string | undefined => {
    const lane = lanes.find((l) => l.name === columnName);
    console.log("🗺️ mapColumnToLaneId:", {
      columnName,
      laneId: lane?.id,
      allLanes: lanes,
    });
    return lane?.id;
  };

  const handleCardCreated = async (payload: any) => {
    console.log("🔔 Card created event:", payload);

    // Check if card already exists in UI (from optimistic update)
    const cardExists = cards.some((c) => c.id === payload.cardId);

    if (cardExists) {
      console.log("✅ Card already in UI (optimistic update)");
      return;
    }

    console.log("🔄 Reloading cards (new card from other user)");
    // Reload cards when a new card is created by another user
    if (boardId) {
      loadCards(boardId, lanes);
    }
  };

  const handleCardUpdated = async (payload: any) => {
    console.log("🔔 Card updated event:", payload);
    // Always reload to show the latest changes from any user
    if (boardId) {
      loadCards(boardId, lanes);
    }
  };

  const handleCardMoved = async (payload: any) => {
    console.log("🔔 Card moved event:", payload);
    // Always reload to show the latest position from any user
    if (boardId) {
      // Force reload lanes first to ensure proper mapping
      const loadedLanes = await loadLanes(boardId);
      await loadCards(boardId, loadedLanes);
    }
  };

  const handleCommentCreated = async (payload: any) => {
    console.log("🔔 Comment created event:", payload);

    const { commentId, cardId, authorId, content, createdAt } = payload;

    // Check if comment is from current user (optimistic update already done)
    const currentUserId = authApi.getCurrentUser()?.id;
    if (authorId === currentUserId) {
      console.log("✅ Comment already in UI (optimistic update)");
      return;
    }

    // Add comment from another user to the local state
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

      setCards(
        cards.map((card) => {
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

  const handlePresenceUpdate = async (payload: any) => {
    console.log("👥 Presence update:", payload);

    if (!payload.users || !Array.isArray(payload.users)) {
      console.warn("Invalid presence payload:", payload);
      return;
    }

    // Transform presence users to UI users
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

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddCard = async (
    columnId: string,
    content: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => {
    if (!user || !boardId) return;

    try {
      // Map column to laneId
      const laneId = mapColumnToLaneId(columnId);

      if (!laneId) {
        console.error("❌ Cannot find lane ID for column:", columnId);
        return;
      }

      console.log("📝 Creating card:", { columnId, laneId, content, priority });

      await boardsApi.createCard(boardId, {
        content,
        priority,
        position: 1000,
        laneId, // Important: Set the lane when creating
      });

      console.log("✅ Card created in lane:", laneId);

      // Cards will be reloaded via WebSocket event
    } catch (error) {
      console.error("❌ Failed to create card:", error);
    }
  };

  const handleMoveCard = async (cardId: string, newColumn: string) => {
    if (!boardId) return;

    console.log("🔄 Moving card:", {
      cardId,
      newColumn,
      lanesAvailable: lanes.length,
    });

    // Update local state optimistically
    const updatedCards = cards.map((card) =>
      card.id === cardId ? { ...card, column: newColumn } : card
    );
    setCards(updatedCards);

    try {
      // Map column to laneId
      const laneId = mapColumnToLaneId(newColumn);

      console.log("🗺️ Lane mapping:", { newColumn, laneId, allLanes: lanes });

      if (!laneId) {
        console.error("❌ Cannot find lane ID for column:", newColumn);
        setCards(cards); // Revert
        return;
      }

      await boardsApi.updateCard(boardId, cardId, {
        laneId: laneId,
      });

      console.log(`✅ Card ${cardId} moved to ${newColumn} (lane: ${laneId})`);
    } catch (error) {
      console.error("❌ Failed to move card:", error);
      // Revert optimistic update on error
      setCards(cards);
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
      // Revert optimistic update on error
      setCards(cards);
    }
  };

  const handleVote = (cardId: string, type: "like" | "dislike") => {
    if (!user) return;

    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card;

        const newCard = { ...card };

        if (type === "like") {
          if (newCard.likes.includes(user.name)) {
            newCard.likes = newCard.likes.filter((name) => name !== user.name);
          } else {
            newCard.likes = [...newCard.likes, user.name];
            newCard.dislikes = newCard.dislikes.filter(
              (name) => name !== user.name
            );
          }
        } else {
          if (newCard.dislikes.includes(user.name)) {
            newCard.dislikes = newCard.dislikes.filter(
              (name) => name !== user.name
            );
          } else {
            newCard.dislikes = [...newCard.dislikes, user.name];
            newCard.likes = newCard.likes.filter((name) => name !== user.name);
          }
        }

        return newCard;
      })
    );
  };

  const handleAddComment = async (cardId: string, content: string) => {
    if (!user || !boardId) return;

    try {
      // Call backend API to create comment
      const newComment = await commentsApi.createComment(boardId, cardId, {
        content,
      });

      // Update local state with the new comment
      setCards(
        cards.map((card) => {
          if (card.id !== cardId) return card;

          const commentWithLocalFormat: Comment = {
            id: newComment.id,
            author: user, // Use current user
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
      // Optionally show error to user
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

  const handleAssignUser = (cardId: string, assignedUser: User | undefined) => {
    setCards(
      cards.map((card) =>
        card.id === cardId ? { ...card, assignedTo: assignedUser } : card
      )
    );
  };

  const handleAddTag = (cardId: string, label: string, color?: string) => {
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card;
        // Check if tag with this label already exists
        if (card.tags.some((t) => t.label === label)) return card;
        // Create a new Tag object
        const newTag: Tag = {
          id: `tag-${Date.now()}-${Math.random()}`,
          boardId: boardId,
          label,
          color: color || null,
        };
        return { ...card, tags: [...card.tags, newTag] };
      })
    );
  };

  const handleRemoveTag = (cardId: string, tagId: string) => {
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card;
        return { ...card, tags: card.tags.filter((t) => t.id !== tagId) };
      })
    );
  };

  const handleExport = () => {
    const data = {
      cards,
      exportDate: new Date().toISOString(),
      user: user?.name,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decision-board-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.cards) {
          setCards(data.cards);
        }
      } catch (error) {
        console.error("Failed to import data:", error);
      }
    };
    reader.readAsText(file);
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      searchQuery === "" ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) =>
        tag.label.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesPriority =
      filterPriority === "all" || card.priority === filterPriority;

    const matchesUser =
      filterUser === "all" ||
      card.author.name === filterUser ||
      card.assignedTo?.name === filterUser;

    return matchesSearch && matchesPriority && matchesUser;
  });

  const [activeUsers, setActiveUsers] = useState<User[]>([]);

  const stats = {
    total: cards.length,
    ideas: cards.filter((c) => c.column === "ideas").length,
    discuss: cards.filter((c) => c.column === "discuss").length,
    decided: cards.filter((c) => c.column === "decided").length,
    urgent: cards.filter((c) => c.priority === "urgent").length,
    high: cards.filter((c) => c.priority === "high").length,
    normal: cards.filter((c) => c.priority === "normal").length,
    low: cards.filter((c) => c.priority === "low").length,
    totalLikes: cards.reduce((sum, c) => sum + c.likes.length, 0),
    totalComments: cards.reduce((sum, c) => sum + c.comments.length, 0),
  };

  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#00AFF0] border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 uppercase text-xs tracking-wider">
            Loading board...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              decision board
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">
                {activeUsers.length}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <Clock className="w-4 h-4 text-[#00AFF0]" />
              <span className="text-sm font-semibold text-white">
                {formatSessionTime(sessionTime)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-[#2d2d2d]">
              <span className="text-2xl">{user.emoji}</span>
              <span className="font-semibold text-white">{user.name}</span>
              <div
                className="w-4 h-4"
                style={{ backgroundColor: user.color }}
              />
            </div>

            <button
              onClick={handleLogout}
              className="w-12 h-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search cards..."
                className="h-10 pl-10 bg-[#000000] border-2 border-[#333333] focus:border-[#00AFF0] text-white placeholder:text-[#666666] rounded-none"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-4 font-semibold flex items-center gap-2 transition-colors ${
                showFilters
                  ? "bg-[#00AFF0] text-white"
                  : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <Filter className="w-4 h-4" />
              filters
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`h-10 px-4 font-semibold flex items-center gap-2 transition-colors ${
                showStats
                  ? "bg-[#00AFF0] text-white"
                  : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              stats
            </button>

            <button
              onClick={handleExport}
              className="h-10 px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              export
            </button>

            <label className="h-10 px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t-2 border-[#333333] flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                priority:
              </span>
              <div className="flex gap-2">
                {(["all", "urgent", "high", "normal", "low"] as const).map(
                  (priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`h-8 px-3 font-semibold text-sm transition-colors ${
                        filterPriority === priority
                          ? "bg-[#00AFF0] text-white"
                          : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                      }`}
                    >
                      {priority}
                    </button>
                  )
                )}
              </div>

              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider ml-4">
                user:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterUser("all")}
                  className={`h-8 px-3 font-semibold text-sm transition-colors ${
                    filterUser === "all"
                      ? "bg-[#00AFF0] text-white"
                      : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                  }`}
                >
                  all
                </button>
                {activeUsers.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => setFilterUser(u.name)}
                    className={`h-8 px-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
                      filterUser === u.name
                        ? "bg-[#00AFF0] text-white"
                        : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                    }`}
                  >
                    <span>{u.emoji}</span>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showStats && (
            <div className="mt-3 pt-3 border-t-2 border-[#333333]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.total}
                  </div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">
                    total cards
                  </div>
                </div>
                <div className="bg-[#00AFF0] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.ideas}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    ideas
                  </div>
                </div>
                <div className="bg-[#E3008C] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.discuss}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    discuss
                  </div>
                </div>
                <div className="bg-[#8CBF26] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.decided}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    decided
                  </div>
                </div>
                <div className="bg-[#e81123] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.urgent}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    urgent
                  </div>
                </div>
                <div className="bg-[#FA6800] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.high}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    high priority
                  </div>
                </div>
                <div className="bg-[#00AFF0] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.normal}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    normal
                  </div>
                </div>
                <div className="bg-[#8CBF26] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.low}
                  </div>
                  <div className="text-xs text-white uppercase tracking-wider">
                    low
                  </div>
                </div>
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.totalLikes}
                  </div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">
                    total votes
                  </div>
                </div>
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">
                    {stats.totalComments}
                  </div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">
                    comments
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
              active now
            </span>
            <div className="flex gap-2">
              {activeUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d]"
                >
                  <span className="text-lg">{u.emoji}</span>
                  <span className="text-sm font-medium text-white">
                    {u.name}
                  </span>
                  <div
                    className="w-3 h-3"
                    style={{ backgroundColor: u.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              cards={filteredCards.filter((card) => card.column === column.id)}
              onAddCard={handleAddCard}
              onMoveCard={handleMoveCard}
              onDeleteCard={handleDeleteCard}
              onVote={handleVote}
              onAddComment={handleAddComment}
              onChangePriority={handleChangePriority}
              onAssignUser={handleAssignUser}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              currentUser={user}
              activeUsers={activeUsers}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
