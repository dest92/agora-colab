"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  workspacesApi,
  boardsApi,
  type Workspace,
  type Board,
} from "@/app/_lib/api";
import { Users, Plus, Folder, Layout, LogOut } from "lucide-react";

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
  }, [router]);

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

      // Combine both lists
      const allWorkspaces = [...ownedWorkspaces, ...invitedAsWorkspaces];
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
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            agora / dashboard
          </h1>

          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 px-4 py-2 bg-[#2d2d2d]">
                <Users className="w-4 h-4 text-[#00AFF0]" />
                <span className="font-semibold text-white">{user.email}</span>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="w-12 h-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workspaces Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a1a1a] border-2 border-[#333333]">
              <div className="px-6 py-4 bg-[#2d2d2d] border-b-2 border-[#333333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Folder className="w-5 h-5 text-[#00AFF0]" />
                    <h2 className="text-lg font-semibold text-white">
                      Workspaces
                    </h2>
                  </div>
                  <span className="text-sm text-white/60">
                    {workspaces.length}
                  </span>
                </div>
              </div>

              <div className="p-4">
                {/* Create Workspace */}
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleCreateWorkspace()
                    }
                    placeholder="New workspace name..."
                    className="flex-1 px-3 py-2 bg-[#000000] border-2 border-[#333333] focus:border-[#00AFF0] text-white placeholder:text-[#666666] outline-none"
                    disabled={creatingWorkspace}
                  />
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creatingWorkspace || !workspaceName.trim()}
                    className="px-4 py-2 bg-[#00AFF0] hover:bg-[#0099d9] disabled:bg-[#2d2d2d] disabled:text-[#666666] text-white font-semibold transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Workspace List */}
                <div className="space-y-2">
                  {workspaces.length === 0 ? (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No workspaces yet.
                      <br />
                      Create one to get started!
                    </div>
                  ) : (
                    workspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleSelectWorkspace(workspace.id)}
                        className={`w-full px-4 py-3 text-left transition-colors ${
                          selectedWorkspaceId === workspace.id
                            ? "bg-[#00AFF0] text-white"
                            : "bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white"
                        }`}
                      >
                        <div className="font-semibold">{workspace.name}</div>
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
              <div className="px-6 py-4 bg-[#2d2d2d] border-b-2 border-[#333333]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layout className="w-5 h-5 text-[#E3008C]" />
                    <h2 className="text-lg font-semibold text-white">Boards</h2>
                  </div>
                  <span className="text-sm text-white/60">{boards.length}</span>
                </div>
              </div>

              <div className="p-4">
                {!selectedWorkspaceId ? (
                  <div className="text-center py-16 text-white/40 text-sm">
                    Select a workspace to view boards
                  </div>
                ) : (
                  <>
                    {/* Create Board */}
                    <div className="mb-4 flex gap-2">
                      <input
                        type="text"
                        value={boardTitle}
                        onChange={(e) => setBoardTitle(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleCreateBoard()
                        }
                        placeholder="New board title..."
                        className="flex-1 px-3 py-2 bg-[#000000] border-2 border-[#333333] focus:border-[#E3008C] text-white placeholder:text-[#666666] outline-none"
                        disabled={creatingBoard}
                      />
                      <button
                        onClick={handleCreateBoard}
                        disabled={creatingBoard || !boardTitle.trim()}
                        className="px-4 py-2 bg-[#E3008C] hover:bg-[#c7007b] disabled:bg-[#2d2d2d] disabled:text-[#666666] text-white font-semibold transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Board Grid */}
                    {boards.length === 0 ? (
                      <div className="text-center py-16 text-white/40 text-sm">
                        No boards yet.
                        <br />
                        Create one to get started!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {boards.map((board) => (
                          <button
                            key={board.id}
                            onClick={() => handleOpenBoard(board.id)}
                            className="p-6 bg-[#2d2d2d] hover:bg-[#3d3d3d] border-2 border-[#333333] hover:border-[#E3008C] transition-all text-left group"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <Layout className="w-6 h-6 text-[#E3008C] group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
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
        </div>
      </div>
    </div>
  );
}
