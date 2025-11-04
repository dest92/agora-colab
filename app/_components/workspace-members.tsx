/**
 * Workspace Members Component
 * Shows list of members in a workspace
 */

"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Crown, Shield, User as UserIcon } from "lucide-react";
import { workspacesApi, type WorkspaceMember, authApi } from "@/app/_lib/api";

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

  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  }, []);

  useEffect(() => {
    if (workspaceId) {
      loadMembers();
    }
  }, [workspaceId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await workspacesApi.listMembers(workspaceId);
      console.log("Members data received:", data);
      setMembers(data);

      // Check if current user is owner
      const currentMember = data.find((m) => m.userId === currentUserId);
      setIsOwner(currentMember?.role === "owner");
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await workspacesApi.updateMemberRole(
        workspaceId,
        userId,
        newRole as "owner" | "admin" | "member"
      );
      // Reload members to reflect changes
      await loadMembers();
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role. You may not have permission.");
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
    <div className="bg-[#1a1a1a] border-2 border-[#333333]">
      <div className="px-6 py-4 bg-[#2d2d2d] border-b-2 border-[#333333]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#00AFF0]" />
            <h3 className="text-lg font-semibold text-white">Members</h3>
          </div>
          <span className="text-sm text-white/60">{members.length}</span>
        </div>
      </div>

      <div className="p-4">
        {members.length === 0 ? (
          <div className="text-center py-8">
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
          <div className="space-y-2">
            {members.map((member, index) => {
              const roleConfig =
                ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ||
                ROLE_CONFIG.member;
              const RoleIcon = roleConfig.icon;
              const isCurrentUser = member.userId === currentUserId;

              return (
                <div
                  key={`${member.userId}-${index}`}
                  className="flex items-center justify-between p-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00AFF0]/20 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-[#00AFF0]" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {member.name || member.email || member.userId}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-[#00AFF0]">
                            (You)
                          </span>
                        )}
                      </div>
                      {member.email && member.name !== member.email && (
                        <div className="text-xs text-[#666666]">
                          {member.email}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold ${roleConfig.bgColor} ${roleConfig.textColor} rounded`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {roleConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Role dropdown for owners (can't change own role or other owners) */}
                    {isOwner && !isCurrentUser && member.role !== "owner" && (
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value)
                        }
                        className="bg-[#3d3d3d] text-white border border-[#555555] px-2 py-1 text-xs rounded hover:bg-[#4d4d4d] cursor-pointer transition-colors"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    )}

                    <div className="text-xs text-[#666666]">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </div>
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
