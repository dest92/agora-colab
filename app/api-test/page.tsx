"use client";

import { useState, useEffect } from "react";
import {
  authApi,
  boardsApi,
  tagsApi,
  assigneesApi,
  workspacesApi,
  apiClient,
  socketClient,
  type Card,
  type Tag,
  type Workspace,
  type Board,
} from "@/app/_lib/api";

export default function ApiTestPage() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [boardId, setBoardId] = useState("");
  const [boardName, setBoardName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [boardTitle, setBoardTitle] = useState("");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [cardContent, setCardContent] = useState("");
  const [cardPriority, setCardPriority] = useState<
    "low" | "normal" | "high" | "urgent"
  >("normal");
  const [savedBoards, setSavedBoards] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize auth on mount
    authApi.initializeAuth();
    const user = authApi.getCurrentUser();
    const authenticated = authApi.isAuthenticated();
    setIsAuthenticated(authenticated);
    setCurrentUser(user);
    log(`🔐 Auth initialized: ${authenticated ? "logged in" : "logged out"}`);

    // Load saved boards from localStorage
    const saved = localStorage.getItem("agora-saved-boards");
    if (saved) {
      try {
        setSavedBoards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved boards:", e);
      }
    }
  }, []);

  const log = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  };

  // Test 0: Register
  const testRegister = async () => {
    try {
      log(`📝 Registering user ${email}...`);
      log(`⏳ POST http://localhost:3000/auth/register`);
      const response = await authApi.register({ email, password });
      log(`✅ Registered: ${response.user.email} (${response.user.id})`);
      log(`🔑 Access token: ${response.accessToken?.substring(0, 20)}...`);
      setIsAuthenticated(true);
      setCurrentUser(response.user);
    } catch (error: any) {
      log(`❌ Register error: ${error.message || error}`);
      console.error("Full register error:", error);
    }
  };

  // Test 1: Login
  const testLogin = async () => {
    try {
      log(`🔐 Logging in user ${email}...`);
      log(`⏳ POST http://localhost:3000/auth/login`);
      const response = await authApi.login({ email, password });
      log(`✅ Logged in: ${response.user.email} (${response.user.id})`);
      log(`🔑 Access token: ${response.accessToken?.substring(0, 20)}...`);
      setIsAuthenticated(true);
      setCurrentUser(response.user);
    } catch (error: any) {
      log(`❌ Login error: ${error.message || error}`);
      console.error("Full login error:", error);
    }
  };

  // Test 2: Logout
  const testLogout = async () => {
    try {
      log("🚪 Logging out...");
      await authApi.logout();
      log("✅ Logged out");
      setIsAuthenticated(false);
      setCurrentUser(null);
    } catch (error: any) {
      log(`❌ Logout error: ${error.message || error}`);
      console.error("Full logout error:", error);
    }
  };

  // Test 3: Health Check
  const testHealth = async () => {
    try {
      log("🔍 Testing health endpoint...");
      const response = await fetch("http://localhost:3000/health");
      const data = await response.json();
      log(`✅ Health: ${JSON.stringify(data)}`);
    } catch (error) {
      log(`❌ Health error: ${error}`);
    }
  };

  // Save current board
  const saveCurrentBoard = () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    const name = boardName || `Board ${savedBoards.length + 1}`;
    const newBoard = { id: boardId, name };
    const updated = [...savedBoards, newBoard];
    setSavedBoards(updated);
    localStorage.setItem("agora-saved-boards", JSON.stringify(updated));
    log(`💾 Saved board: ${name} (${boardId.substring(0, 8)}...)`);
    setBoardName("");
  };

  // Select a saved board
  const selectBoard = (id: string, name: string) => {
    setBoardId(id);
    log(`📌 Selected board: ${name} (${id.substring(0, 8)}...)`);
  };

  // Delete a saved board
  const deleteBoard = (id: string) => {
    const updated = savedBoards.filter((b) => b.id !== id);
    setSavedBoards(updated);
    localStorage.setItem("agora-saved-boards", JSON.stringify(updated));
    log(`🗑️ Deleted board ${id.substring(0, 8)}...`);
  };

  // Test 4: Create Workspace
  const testCreateWorkspace = async () => {
    const name =
      workspaceName.trim() || `Workspace ${new Date().toLocaleTimeString()}`;
    try {
      log(`🏢 Creating workspace "${name}"...`);
      const workspace = await workspacesApi.createWorkspace({ name });
      log(`✅ Workspace created: ${workspace.id}`);
      setWorkspaces([workspace, ...workspaces]);
      setWorkspaceName(""); // Clear input
    } catch (error) {
      log(`❌ Create workspace error: ${error}`);
    }
  };

  // Test 3: List Workspaces
  const testListWorkspaces = async () => {
    try {
      log("📋 Listing workspaces...");
      const data = await workspacesApi.listWorkspaces();
      log(`✅ Found ${data.length} workspaces`);
      setWorkspaces(data);
    } catch (error) {
      log(`❌ List workspaces error: ${error}`);
    }
  };

  // Test 3.1: Create Board
  const testCreateBoard = async () => {
    if (!selectedWorkspaceId) {
      log("❌ Please select a workspace first");
      return;
    }

    const title =
      boardTitle.trim() || `Board ${new Date().toLocaleTimeString()}`;
    try {
      log(
        `📋 Creating board "${title}" in workspace ${selectedWorkspaceId}...`
      );
      const board = await boardsApi.createBoard(selectedWorkspaceId, { title });
      log(`✅ Board created: ${board.id}`);
      log(`   Team ID: ${board.teamId}`);
      setBoards([board, ...boards]);
      setBoardTitle(""); // Clear input
      setBoardId(board.id); // Auto-select the new board
    } catch (error) {
      log(`❌ Create board error: ${error}`);
    }
  };

  // Test 3.2: List Boards
  const testListBoards = async () => {
    if (!selectedWorkspaceId) {
      log("❌ Please select a workspace first");
      return;
    }

    try {
      log(`📋 Listing boards in workspace ${selectedWorkspaceId}...`);
      const data = await boardsApi.listBoards(selectedWorkspaceId);
      log(`✅ Found ${data.length} boards`);
      setBoards(data);
    } catch (error) {
      log(`❌ List boards error: ${error}`);
    }
  };

  // Test 4: Create Card
  const testCreateCard = async () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    const content =
      cardContent.trim() || `Test card ${new Date().toLocaleTimeString()}`;
    try {
      log(`📝 Creating card in board ${boardId}...`);
      const card = await boardsApi.createCard(boardId, {
        content,
        priority: cardPriority,
        // laneId is optional - backend will assign to first lane
      });
      log(`✅ Card created: ${card.id}`);
      setCards([card, ...cards]);
      setCardContent(""); // Clear input
    } catch (error) {
      log(`❌ Create card error: ${error}`);
    }
  };

  // Test 5: List Cards
  const testListCards = async () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    try {
      log(`📋 Listing cards from board ${boardId}...`);
      const data = await boardsApi.listCards(boardId);
      log(`✅ Found ${data.length} cards`);
      setCards(data);
    } catch (error) {
      log(`❌ List cards error: ${error}`);
    }
  };

  // Test 6: Create Tag
  const testCreateTag = async () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    try {
      log(`🏷️ Creating tag in board ${boardId}...`);
      const tag = await tagsApi.createTag(boardId, {
        label: "Test Tag",
        color: "#ff0000",
      });
      log(`✅ Tag created: ${tag.id}`);
      setTags([tag, ...tags]);
    } catch (error) {
      log(`❌ Create tag error: ${error}`);
    }
  };

  // Test 7: List Tags
  const testListTags = async () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    try {
      log(`📋 Listing tags from board ${boardId}...`);
      const data = await tagsApi.listTags(boardId);
      log(`✅ Found ${data.length} tags`);
      setTags(data);
    } catch (error) {
      log(`❌ List tags error: ${error}`);
    }
  };

  // Test 8: Connect WebSocket
  const testConnectSocket = () => {
    if (!boardId) {
      log("❌ Please enter a Board ID first");
      return;
    }

    try {
      log(`🔌 Connecting to WebSocket with board ${boardId}...`);
      socketClient.connect({ boardId });
      setIsConnected(true);

      // Listen to events
      socketClient.on("card:created", (payload) => {
        log(`🔔 WebSocket: card:created ${JSON.stringify(payload)}`);
      });

      socketClient.on("card:updated", (payload) => {
        log(`🔔 WebSocket: card:updated ${JSON.stringify(payload)}`);
      });

      socketClient.on("tag:created", (payload) => {
        log(`🔔 WebSocket: tag:created ${JSON.stringify(payload)}`);
      });

      log("✅ WebSocket connected");
    } catch (error) {
      log(`❌ WebSocket error: ${error}`);
    }
  };

  // Test 9: Disconnect WebSocket
  const testDisconnectSocket = () => {
    try {
      log("🔌 Disconnecting WebSocket...");
      socketClient.disconnect();
      setIsConnected(false);
      log("✅ WebSocket disconnected");
    } catch (error) {
      log(`❌ Disconnect error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          🧪 API Test Suite
        </h1>

        {/* Auth Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            🔐 Authentication {isAuthenticated && "(Logged In)"}
          </h2>
          {!isAuthenticated ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email..."
                  className="px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password..."
                  className="px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={testLogin}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  🔐 Login
                </button>
                <button
                  onClick={testRegister}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition"
                >
                  📝 Register
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white/5 rounded-lg p-4 border border-white/20">
                <p className="text-white mb-2">
                  Logged in as:{" "}
                  <span className="font-semibold">{currentUser?.email}</span>
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-400">User ID:</label>
                  <code className="flex-1 bg-black/30 px-3 py-1.5 rounded text-green-400 font-mono text-sm">
                    {currentUser?.id}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser?.id || "");
                      log("📋 User ID copied to clipboard!");
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <button
                onClick={testLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>

        {/* Workspace Creation */}
        {isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">🏢 Workspaces</h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Workspace name (e.g., 'My Project')..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={testCreateWorkspace}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition whitespace-nowrap"
                >
                  ➕ Create
                </button>
              </div>

              <button
                onClick={testListWorkspaces}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                📋 List My Workspaces
              </button>

              {workspaces.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">
                    Your Workspaces ({workspaces.length}):
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        className={`bg-white/10 rounded p-2 cursor-pointer transition ${
                          selectedWorkspaceId === workspace.id
                            ? "ring-2 ring-purple-500"
                            : "hover:bg-white/20"
                        }`}
                        onClick={() => {
                          setSelectedWorkspaceId(workspace.id);
                          log(`📌 Selected workspace: ${workspace.name}`);
                        }}
                      >
                        <p className="text-white font-medium">
                          {workspace.name}
                        </p>
                        <p className="text-gray-400 text-xs font-mono">
                          {workspace.id}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Board Creation */}
        {isAuthenticated && selectedWorkspaceId && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              📋 Boards
              <span className="text-sm text-gray-400 ml-2">
                (in selected workspace)
              </span>
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  placeholder="Board title (e.g., 'Sprint Planning')..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
                <button
                  onClick={testCreateBoard}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition whitespace-nowrap"
                >
                  ➕ Create Board
                </button>
              </div>

              <button
                onClick={testListBoards}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                📋 List Boards
              </button>

              {boards.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">
                    Boards in Workspace ({boards.length}):
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {boards.map((board) => (
                      <div
                        key={board.id}
                        className={`bg-white/10 rounded p-2 cursor-pointer transition ${
                          boardId === board.id
                            ? "ring-2 ring-green-500"
                            : "hover:bg-white/20"
                        }`}
                        onClick={() => {
                          setBoardId(board.id);
                          log(`📌 Selected board: ${board.title}`);
                        }}
                      >
                        <p className="text-white font-medium">{board.title}</p>
                        <p className="text-gray-400 text-xs font-mono">
                          {board.id}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Creation */}
        {isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📝 Cards</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Board ID{" "}
                  <span className="text-gray-400">
                    (paste from boards table)
                  </span>
                </label>
                <input
                  type="text"
                  value={boardId}
                  onChange={(e) => setBoardId(e.target.value)}
                  placeholder="Board UUID..."
                  className="w-full px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={cardContent}
                  onChange={(e) => setCardContent(e.target.value)}
                  placeholder="Card content (e.g., 'Fix bug in auth')..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                />
                <select
                  value={cardPriority}
                  onChange={(e) =>
                    setCardPriority(
                      e.target.value as "low" | "normal" | "high" | "urgent"
                    )
                  }
                  className="px-4 py-2 rounded-lg bg-white/5 text-white border border-white/20 focus:border-purple-500 focus:outline-none"
                >
                  <option value="low">🟢 Low</option>
                  <option value="normal">⚪ Normal</option>
                  <option value="high">🟡 High</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
                <button
                  onClick={testCreateCard}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition whitespace-nowrap"
                >
                  ➕ Create
                </button>
              </div>

              <button
                onClick={testListCards}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                📋 List Cards
              </button>

              {cards.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">
                    Cards in Board ({cards.length}):
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cards.map((card) => (
                      <div key={card.id} className="bg-white/10 rounded p-2">
                        <p className="text-white">{card.content}</p>
                        <p className="text-gray-400 text-xs">
                          {card.laneId} • {card.priority}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Other Test Buttons */}
        {isAuthenticated && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4">
              🧪 Other Tests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Health */}
              <button
                onClick={testHealth}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                ✅ Health Check
              </button>

              {/* Tags */}
              <button
                onClick={testCreateTag}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                🏷️ Create Tag
              </button>
              <button
                onClick={testListTags}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition"
              >
                📋 List Tags
              </button>

              {/* WebSocket */}
              <button
                onClick={isConnected ? testDisconnectSocket : testConnectSocket}
                className={`${
                  isConnected
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                } text-white font-semibold py-3 px-4 rounded-lg transition`}
              >
                {isConnected ? "🔌 Disconnect Socket" : "🔌 Connect Socket"}
              </button>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            � Logs ({logs.length})
          </h2>
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs bg-black/30 rounded p-4">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
