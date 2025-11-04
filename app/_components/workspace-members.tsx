/**
 * Workspace Members Component
 * Shows list of members in a workspace
 */

"use client";

import { useEffect, useState } from "react";
import { Users, Mail } from "lucide-react";
import { workspacesApi, type WorkspaceMember } from "@/app/_lib/api";

interface WorkspaceMembersProps {
  workspaceId: string;
  onInviteClick: () => void;
}

export function WorkspaceMembers({
  workspaceId,
  onInviteClick,
}: WorkspaceMembersProps) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
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
            {members.map((member, index) => (
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
                    </div>
                    {member.email && member.name !== member.email && (
                      <div className="text-xs text-[#666666]">
                        {member.email}
                      </div>
                    )}
                    <div className="text-xs text-[#999999]">{member.role}</div>
                  </div>
                </div>
                <div className="text-xs text-[#666666]">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
