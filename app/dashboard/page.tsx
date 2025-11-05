"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  workspacesApi,
  boardsApi,
  socketClient,
  type Workspace,
  type Board,
} from "@/app/_lib/api";
import { Users, Plus, Folder, Layout, LogOut, UserPlus } from "lucide-react";
import { InviteUserModal } from "@/app/_components/invite-user-modal-search";
import { WorkspaceMembers } from "@/app/_components/workspace-members";
import { NotificationBell } from "@/app/_components/notification-bell";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [membersKey, setMembersKey] = useState(0);

  useEffect(() => {
    // Check authentication
    const authenticated = authApi.isAuthenticated();
    const currentUser = authApi.getCurrentUser();

    if (!authenticated || !currentUser) {
      router.push("/login");
      return;
    }

    setUser(currentUser);
    loadWorkspaces();

    if (currentUser.id) {
      socketClient.connect({ userId: currentUser.id });
    }

    const handleWorkspaceInvitation = (payload: any) => {
      console.log("🤝 Workspace invitation received:", payload);

      // Check if it's a workspace invitation notification
      if (payload.type === "workspace_invitation") {
        // Reload workspaces silently (without showing loading spinner)
        loadWorkspacesQuietly();
      }
    };

    socketClient.on("notification:created", handleWorkspaceInvitation);

    return () => {
      socketClient.off("notification:created", handleWorkspaceInvitation);
    };
  }, [router]);

  // Join workspace room when selectedWorkspaceId changes
  useEffect(() => {
    if (selectedWorkspaceId && user?.id) {
      console.log(`🔌 Joining workspace room: ${selectedWorkspaceId}`);
      socketClient.join({ workspaceId: selectedWorkspaceId });
      
      return () => {
        console.log(`🔌 Leaving workspace room: ${selectedWorkspaceId}`);
        socketClient.leave({ workspaceId: selectedWorkspaceId });
      };
    }
  }, [selectedWorkspaceId, user?.id]);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);

      // Load both owned workspaces and invited workspaces
      const [ownedWorkspaces, invitedWorkspaces] = await Promise.all([
        workspacesApi.listWorkspaces(),
        workspacesApi.listInvites(),
      ]);

      // Transform invited workspaces to match Workspace interface
      const invitedAsWorkspaces = invitedWorkspaces.map((invite) => ({
        id: invite.workspaceId,
        name: `${invite.workspaceName} (${invite.role})`,
        ownerId: invite.ownerId,
        createdAt: invite.joinedAt,
      }));

      // Combine and deduplicate by workspace ID
      const workspaceMap = new Map<string, Workspace>();

      // Add owned workspaces first (they take priority)
      ownedWorkspaces.forEach((ws) => workspaceMap.set(ws.id, ws));

      // Add invited workspaces only if not already in map
      invitedAsWorkspaces.forEach((ws) => {
        if (!workspaceMap.has(ws.id)) {
          workspaceMap.set(ws.id, ws);
        }
      });

      const allWorkspaces = Array.from(workspaceMap.values());
      setWorkspaces(allWorkspaces);

      // Auto-select first workspace if available
      if (allWorkspaces.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(allWorkspaces[0].id);
        loadBoards(allWorkspaces[0].id);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load workspaces without showing loading spinner (for real-time updates)
  const loadWorkspacesQuietly = async () => {
    try {
      // Load both owned workspaces and invited workspaces
      const [ownedWorkspaces, invitedWorkspaces] = await Promise.all([
        workspacesApi.listWorkspaces(),
        workspacesApi.listInvites(),
      ]);

      // Transform invited workspaces to match Workspace interface
      const invitedAsWorkspaces = invitedWorkspaces.map((invite) => ({
        id: invite.workspaceId,
        name: `${invite.workspaceName} (${invite.role})`,
        ownerId: invite.ownerId,
        createdAt: invite.joinedAt,
      }));

      // Combine and deduplicate by workspace ID
      const workspaceMap = new Map<string, Workspace>();

      // Add owned workspaces first (they take priority)
      ownedWorkspaces.forEach((ws) => workspaceMap.set(ws.id, ws));

      // Add invited workspaces only if not already in map
      invitedAsWorkspaces.forEach((ws) => {
        if (!workspaceMap.has(ws.id)) {
          workspaceMap.set(ws.id, ws);
        }
      });

      const allWorkspaces = Array.from(workspaceMap.values());
      setWorkspaces(allWorkspaces);

      // Don't auto-select or reload boards - keep current selection
      console.log("✅ Workspaces updated silently in background");
    } catch (error) {
      console.error("Failed to reload workspaces:", error);
    }
  };

  const loadBoards = async (workspaceId: string) => {
    try {
      console.log(`Loading boards for workspace: ${workspaceId}`);
      const data = await boardsApi.listBoards(workspaceId);
      console.log(`Loaded ${data.length} boards:`, data);
      setBoards(data);
    } catch (error) {
      console.error("Failed to load boards:", error);
      // Clear boards on error
      setBoards([]);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    loadBoards(workspaceId);
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;

    try {
      setCreatingWorkspace(true);
      const workspace = await workspacesApi.createWorkspace({
        name: workspaceName,
      });
      setWorkspaces([workspace, ...workspaces]);
      setSelectedWorkspaceId(workspace.id);
      setWorkspaceName("");
      setCreatingWorkspace(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
      setCreatingWorkspace(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!boardTitle.trim() || !selectedWorkspaceId) return;

    try {
      setCreatingBoard(true);
      const board = await boardsApi.createBoard(selectedWorkspaceId, {
        title: boardTitle,
      });
      setBoards([board, ...boards]);
      setBoardTitle("");
      setCreatingBoard(false);
    } catch (error) {
      console.error("Failed to create board:", error);
      setCreatingBoard(false);
    }
  };

  const handleOpenBoard = (boardId: string) => {
    // Store selected board and workspace in localStorage for board page
    localStorage.setItem("agora-selected-board", boardId);
    localStorage.setItem("agora-selected-workspace", selectedWorkspaceId);
    router.push("/board");
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e1e1e]">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-semibold tracking-tight text-white">
            agora / dashboard
          </h1>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 bg-[#2d2d2d]">
                <Users className="w-4 h-4 text-[#00AFF0]" />
                <span className="font-semibold text-white text-sm sm:text-base hidden sm:inline">
                  {user.email}
                </span>
                <span className="font-semibold text-white text-sm sm:hidden">
                  {user.email.split("@")[0]}
                </span>
              </div>
            )}

            <NotificationBell />

            <button
              onClick={handleLogout}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div
          className={`grid grid-cols-1 gap-4 sm:gap-6 ${
            selectedWorkspaceId ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {/* Workspaces Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border-2 border-[#333333]">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#2d2d2d] border-b-2 border-[#333333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-[#00AFF0]" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Workspaces
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedWorkspaceId && (
                      <button
                        onClick={() => setInviteModalOpen(true)}
                        className="p-1.5 sm:p-2 bg-[#00AFF0]/20 hover:bg-[#00AFF0]/30 text-[#00AFF0] rounded transition-colors"
                        title="Invite user to workspace"
                      >
                        <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    <span className="text-xs sm:text-sm text-white/60">
                      {workspaces.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {/* Create Workspace */}
                <div className="mb-3 sm:mb-4 flex gap-2">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCreateWorkspace()
                    }
                    placeholder="New workspace name..."
                    className="flex-1 px-3 py-2 text-sm bg-[#000000] border-2 border-[#333333] focus:border-[#00AFF0] text-white placeholder:text-[#666666] outline-none"
                    disabled={creatingWorkspace}
                  />
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creatingWorkspace || !workspaceName.trim()}
                    className="px-3 sm:px-4 py-2 bg-[#00AFF0] hover:bg-[#0099d9] disabled:bg-[#2d2d2d] disabled:text-[#666666] text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace List */}
                <div className="space-y-2">
                  {workspaces.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-xs sm:text-sm">
                      No workspaces yet.
                      <br />
                      Create one to get started!
                    </div>
                  ) : (
                    workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors ${
                          selectedWorkspaceId === workspace.id
                            ? "bg-[#00AFF0] text-white"
                            : "bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white"
                        }`}
                      >
                        <div className="font-semibold text-sm sm:text-base">
                          {workspace.name}
                        </div>
                        <div className="text-xs opacity-60 mt-1">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Boards Panel */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1a] border-2 border-[#333333]">
              <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#2d2d2d] border-b-2 border-[#333333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-[#E3008C]" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Boards
                    </h2>
                  </div>
                  <span className="text-xs sm:text-sm text-white/60">
                    {boards.length}
                  </span>
                </div>
              </div>

              <div className="p-3 sm:p-4">
                {!selectedWorkspaceId ? (
                  <div className="text-center py-12 sm:py-16 text-white/40 text-xs sm:text-sm">
                    Select a workspace to view boards
                  </div>
                ) : (
                  <>
                    {/* Create Board */}
                    <div className="mb-3 sm:mb-4 flex gap-2">
                      <input
                        type="text"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleCreateBoard()
                        }
                        placeholder="New board title..."
                        className="flex-1 px-3 py-2 text-sm bg-[#000000] border-2 border-[#333333] focus:border-[#E3008C] text-white placeholder:text-[#666666] outline-none"
                        disabled={creatingBoard}
                      />
                      <button
                        onClick={handleCreateBoard}
                        disabled={creatingBoard || !boardTitle.trim()}
                        className="px-3 sm:px-4 py-2 bg-[#E3008C] hover:bg-[#c7007b] disabled:bg-[#2d2d2d] disabled:text-[#666666] text-white font-semibold transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Board Grid */}
                    {boards.length === 0 ? (
                      <div className="text-center py-12 sm:py-16 text-white/40 text-xs sm:text-sm">
                        No boards yet.
                        <br />
                        Create one to get started!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {boards.map((board) => (
                          <button
                            key={board.id}
                            onClick={() => handleOpenBoard(board.id)}
                            className="p-4 sm:p-6 bg-[#2d2d2d] hover:bg-[#3d3d3d] border-2 border-[#333333] hover:border-[#E3008C] transition-all text-left group"
                          >
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                              <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-[#E3008C] group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                              {board.title}
                            </h3>
                            <div className="text-xs text-white/40">
                              Created{" "}
                              {new Date(board.createdAt).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Members Panel - Only show when workspace is selected */}
          {selectedWorkspaceId && (
            <div className="lg:col-span-1 min-h-[600px] flex">
              <WorkspaceMembers
                key={`members-${selectedWorkspaceId}-${membersKey}`}
                workspaceId={selectedWorkspaceId}
                onInviteClick={() => setInviteModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Invite User Modal */}
      {selectedWorkspaceId && (
        <InviteUserModal
          workspaceId={selectedWorkspaceId}
          workspaceName={
            workspaces.find((w) => w.id === selectedWorkspaceId)?.name || ""
          }
          isOpen={inviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onInviteSent={() => {
            console.log("Invitation sent successfully");
            // Reload workspace members by updating the key
            setMembersKey((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
