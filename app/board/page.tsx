/**
 * Board Page - Refactored
 * Main board view with all functionality split into custom hooks
 */

"use client";

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
  UserPlus,
  ArrowLeft,
} from "lucide-react";
import { Input } from "../_components/ui/input";
import { authApi, workspacesApi } from "@/app/_lib/api";
import { useBoardData, type User } from "./hooks/useBoardData";
import { useBoardActions } from "./hooks/useBoardActions";
import { useBoardWebSocket } from "./hooks/useBoardWebSocket";
import { InviteUserModal } from "@/app/_components/invite-user-modal-search";
import { ActiveUsersDropdown } from "@/app/_components/active-users-dropdown";
import { NotificationBell } from "@/app/_components/notification-bell";

const getCurrentUser = (): User => {
  const user = authApi.getCurrentUser();
  return {
    name: user?.email?.split("@")[0] || "User",
    emoji: "👤",
    color: "#00AFF0",
    id: user?.id || undefined,
  };
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
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "normal" | "high" | "urgent"
  >("all");
  const [filterUser, setFilterUser] = useState<string | "all">("all");
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string>("");

  // Custom hooks for data management
  const { cards, setCards, lanes, loading, loadLanes, loadCards } =
    useBoardData();

  const boardActions = useBoardActions({
    boardId,
    lanes,
    cards,
    setCards,
    user,
  });

  // WebSocket connection and listeners
  useBoardWebSocket({
    boardId,
    workspaceId,
    lanes,
    cards,
    setCards,
    setActiveUsers,
    loadLanes,
    loadCards,
    getCurrentUser,
  });

  // Initialize board
  useEffect(() => {
    const authenticated = authApi.isAuthenticated();
    if (!authenticated) {
      router.push("/login");
      return;
    }

    const selectedBoard = localStorage.getItem("agora-selected-board");
    const selectedWorkspace = localStorage.getItem("agora-selected-workspace");

    if (!selectedBoard || !selectedWorkspace) {
      router.push("/dashboard");
      return;
    }

    setBoardId(selectedBoard);
    setWorkspaceId(selectedWorkspace);
    setUser(getCurrentUser());

    // Load workspace name
    const loadWorkspaceName = async () => {
      try {
        const workspaces = await workspacesApi.listWorkspaces();
        const workspace = workspaces.find((w) => w.id === selectedWorkspace);
        if (workspace) {
          setWorkspaceName(workspace.name);
        }
      } catch (error) {
        console.error("Failed to load workspace name:", error);
      }
    };
    loadWorkspaceName();

    const initializeBoard = async () => {
      const loadedLanes = await loadLanes(selectedBoard);
      await loadCards(selectedBoard, loadedLanes);
    };
    initializeBoard();
  }, [router]);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Export/Import handlers
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

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  // Filtering
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      searchQuery === "" ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesPriority =
      filterPriority === "all" || card.priority === filterPriority;

    const matchesUser =
      filterUser === "all" ||
      card.author.name === filterUser ||
      card.assignedTo?.name === filterUser;

    return matchesSearch && matchesPriority && matchesUser;
  });

  // Stats
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
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Top row - Title and User */}
          <div className="flex items-center justify-between mb-3 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] hover:bg-[#00AFF0] transition-colors flex items-center justify-center group"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-white">
                decision board
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-[#2d2d2d]">
                <span className="text-xl sm:text-2xl">{user.emoji}</span>
                <span className="hidden sm:inline font-semibold text-white">
                  {user.name}
                </span>
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  style={{ backgroundColor: user.color }}
                />
              </div>

              <NotificationBell />

              <button
                onClick={handleLogout}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Bottom row - Actions (only on desktop) */}
          <div className="hidden sm:flex items-center gap-4 mt-3">
            <ActiveUsersDropdown
              activeUsers={activeUsers}
              onInviteClick={() => setInviteModalOpen(true)}
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <Clock className="w-4 h-4 text-[#00AFF0]" />
              <span className="text-sm font-semibold text-white">
                {formatSessionTime(sessionTime)}
              </span>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#00AFF0]/20 hover:bg-[#00AFF0]/30 text-[#00AFF0] transition-colors"
              title="Invite user to workspace"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-semibold">Invite</span>
            </button>
          </div>

          {/* Mobile actions row */}
          <div className="flex sm:hidden items-center gap-2 mt-3 overflow-x-auto pb-2">
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[#00AFF0]/20 text-[#00AFF0] whitespace-nowrap text-sm"
              title="Invite user"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] whitespace-nowrap">
              <Clock className="w-4 h-4 text-[#00AFF0]" />
              <span className="text-sm font-semibold text-white">
                {formatSessionTime(sessionTime)}
              </span>
            </div>
            <ActiveUsersDropdown
              activeUsers={activeUsers}
              onInviteClick={() => setInviteModalOpen(true)}
            />
          </div>
        </div>
      </header>

      {/* Search and filters bar */}
      <div className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-3 sm:px-6 py-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex-1 min-w-[150px] sm:min-w-[200px] max-w-full sm:max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search cards..."
                className="h-9 sm:h-10 pl-10 bg-[#000000] border-2 border-[#333333] focus:border-[#00AFF0] text-white placeholder:text-[#666666] rounded-none text-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-9 sm:h-10 px-3 sm:px-4 font-semibold flex items-center gap-2 transition-colors text-sm ${
                showFilters
                  ? "bg-[#00AFF0] text-white"
                  : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">filters</span>
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`h-9 sm:h-10 px-3 sm:px-4 font-semibold flex items-center gap-2 transition-colors text-sm ${
                showStats
                  ? "bg-[#00AFF0] text-white"
                  : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">stats</span>
            </button>

            <button
              onClick={handleExport}
              className="h-9 sm:h-10 px-3 sm:px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">export</span>
            </button>

            <label className="h-9 sm:h-10 px-3 sm:px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors cursor-pointer text-sm">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t-2 border-[#333333] flex items-start sm:items-center gap-3 flex-wrap">
              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                priority:
              </span>
              <div className="flex gap-2 flex-wrap">
                {(["all", "urgent", "high", "normal", "low"] as const).map(
                  (priority) => (
                    <button
                      key={priority}
                      onClick={() => setFilterPriority(priority)}
                      className={`h-7 sm:h-8 px-2 sm:px-3 font-semibold text-xs sm:text-sm transition-colors ${
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

              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider sm:ml-4 w-full sm:w-auto">
                user:
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterUser("all")}
                  className={`h-7 sm:h-8 px-2 sm:px-3 font-semibold text-xs sm:text-sm transition-colors ${
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
                    className={`h-7 sm:h-8 px-2 sm:px-3 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-2 sm:gap-3">
                <div className="bg-[#2d2d2d] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.total}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#999999] uppercase tracking-wider">
                    total cards
                  </div>
                </div>
                <div className="bg-[#00AFF0] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.ideas}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    ideas
                  </div>
                </div>
                <div className="bg-[#E3008C] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.discuss}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    discuss
                  </div>
                </div>
                <div className="bg-[#8CBF26] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.decided}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    decided
                  </div>
                </div>
                <div className="bg-[#e81123] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.urgent}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    urgent
                  </div>
                </div>
                <div className="bg-[#FA6800] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.high}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    high priority
                  </div>
                </div>
                <div className="bg-[#00AFF0] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.normal}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    normal
                  </div>
                </div>
                <div className="bg-[#8CBF26] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.low}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white uppercase tracking-wider">
                    low
                  </div>
                </div>
                <div className="bg-[#2d2d2d] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.totalLikes}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#999999] uppercase tracking-wider">
                    total votes
                  </div>
                </div>
                <div className="bg-[#2d2d2d] p-2 sm:p-3">
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {stats.totalComments}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[#999999] uppercase tracking-wider">
                    comments
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active users bar */}
      <div className="bg-[#1a1a1a] border-b-2 border-[#333333] hidden lg:block">
        <div className="container mx-auto px-3 sm:px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
              active now
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {activeUsers.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d] whitespace-nowrap"
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

      {/* Board columns */}
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              cards={filteredCards.filter((card) => card.column === column.id)}
              onAddCard={boardActions.handleAddCard}
              onMoveCard={boardActions.handleMoveCard}
              onDeleteCard={boardActions.handleDeleteCard}
              onVote={boardActions.handleVote}
              onAddComment={boardActions.handleAddComment}
              onChangePriority={boardActions.handleChangePriority}
              onAssignUser={boardActions.handleAssignUser}
              onAddTag={boardActions.handleAddTag}
              onRemoveTag={boardActions.handleRemoveTag}
              currentUser={user}
              activeUsers={activeUsers}
            />
          ))}
        </div>
      </main>

      {/* Invite User Modal */}
      {workspaceId && (
        <InviteUserModal
          workspaceId={workspaceId}
          workspaceName={workspaceName || "Workspace"}
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInviteSent={() => {
            console.log("Invitation sent from board view");
            // Optionally show a success notification
          }}
        />
      )}
    </div>
  );
}
