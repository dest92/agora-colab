/**
 * Workspace Members Component
 * Shows list of members in a workspace
 */

"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Crown, Shield, User as UserIcon } from "lucide-react";
import { workspacesApi, type WorkspaceMember, authApi, socketClient } from "@/app/_lib/api";

interface WorkspaceMembersProps {
  workspaceId: string;
  onInviteClick: () => void;
}

const ROLE_CONFIG = {
  owner: {
    label: "OWNER",
    bgColor: "bg-yellow-500",
    textColor: "text-black",
    icon: Crown,
  },
  admin: {
    label: "ADMIN",
    bgColor: "bg-blue-500",
    textColor: "text-white",
    icon: Shield,
  },
  member: {
    label: "MEMBER",
    bgColor: "bg-gray-500",
    textColor: "text-white",
    icon: UserIcon,
  },
};

export function WorkspaceMembers({
  workspaceId,
  onInviteClick,
}: WorkspaceMembersProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [activeUserIds, setActiveUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (workspaceId && currentUserId) {
      loadMembers();
    }
  }, [workspaceId, currentUserId]);

  // Listen for workspace presence updates
  useEffect(() => {
    if (!workspaceId) return;

    const handlePresenceUpdate = (payload: any) => {
      const data = payload as { users: string[] };
      console.log("Workspace presence update received:", data);
      setActiveUserIds(new Set(data.users));
    };

    socketClient.on("workspace:presence:update", handlePresenceUpdate);

    return () => {
      socketClient.off("workspace:presence:update", handlePresenceUpdate);
    };
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await workspacesApi.listMembers(workspaceId);
      console.log("Members data received:", data);
      console.log("Current user ID:", currentUserId);
      setMembers(data);

      // Check if current user is owner
      const currentMember = data.find((m) => m.userId === currentUserId);
      console.log("Current member:", currentMember);
      console.log("Is owner:", currentMember?.role === "owner");
      setIsOwner(currentMember?.role === "owner");
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      await workspacesApi.updateMemberRole(
        workspaceId,
        userId,
        newRole as "owner" | "admin" | "member"
      );
      // Reload members to reflect changes
      await loadMembers();

      // Show success message
      const memberName =
        members.find((m) => m.userId === userId)?.name || "Member";
      console.log(`✅ Successfully updated ${memberName} to ${newRole}`);
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role. You may not have permission.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border-2 border-[#333333] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#00AFF0]/30 border-t-[#00AFF0] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border-2 border-[#333333] flex flex-col h-full">
      <div className="px-6 py-4 bg-[#2d2d2d] border-b-2 border-[#333333] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00AFF0]" />
            <h3 className="text-lg font-semibold text-white">Members</h3>
            <span className="px-2 py-0.5 bg-[#00AFF0]/20 text-[#00AFF0] text-xs font-bold rounded">
              {members.length}
            </span>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-white/60 hidden sm:inline">
                You can manage roles
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {members.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-white/40 text-sm mb-4">No members yet</p>
            <button
              onClick={onInviteClick}
              className="px-4 py-2 bg-[#00AFF0] hover:bg-[#0099d9] text-black font-semibold transition-colors inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Invite Members
            </button>
          </div>
        ) : (
          <div>
            {members.map((member, index) => {
              const roleConfig =
                ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ||
                ROLE_CONFIG.member;
              const RoleIcon = roleConfig.icon;
              const isCurrentUser = member.userId === currentUserId;
              const isActive = activeUserIds.has(member.userId);

              return (
                <div
                  key={`${member.userId}-${index}`}
                  className="p-4 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors border-b border-[#333333] last:border-b-0"
                >
                  {/* Top row: Avatar + Name + Badges */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-10 h-10 bg-[#00AFF0]/20 rounded-full flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#00AFF0]" />
                      {isActive && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#2d2d2d] rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium mb-2 flex items-center gap-2">
                        {member.name || member.email || member.userId}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-[#00AFF0] text-black rounded">
                            YOU
                          </span>
                        )}
                        {isActive && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-green-500 text-black rounded">
                            ONLINE
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold ${roleConfig.bgColor} ${roleConfig.textColor} rounded shrink-0`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                        <span className="text-xs text-[#666666] shrink-0">
                          {new Date(member.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: Email + Dropdown */}
                  <div className="flex items-center justify-between gap-4 pl-13">
                    {/* Email */}
                    {member.email && member.name !== member.email && (
                      <div className="text-xs text-[#666666] overflow-hidden">
                        {member.email}
                      </div>
                    )}

                    {/* Role dropdown for owners (can't change own role or other owners) */}
                    {isOwner && !isCurrentUser && member.role !== "owner" && (
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {updatingUserId === member.userId && (
                          <div className="w-4 h-4 border-2 border-[#00AFF0]/30 border-t-[#00AFF0] rounded-full animate-spin" />
                        )}
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.userId, e.target.value)
                          }
                          disabled={updatingUserId === member.userId}
                          className={`bg-[#1a1a1a] text-white border-2 border-[#00AFF0] px-3 py-2 text-sm font-semibold rounded hover:bg-[#2d2d2d] cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-[#00AFF0]/50 ${
                            updatingUserId === member.userId
                              ? "opacity-50 cursor-wait"
                              : ""
                          }`}
                        >
                          <option value="admin" className="bg-[#1a1a1a]">
                            👮 Admin
                          </option>
                          <option value="member" className="bg-[#1a1a1a]">
                            👤 Member
                          </option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
