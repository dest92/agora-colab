/**
 * Active Users Dropdown Component
 * Shows list of active users in the board session
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Users, UserPlus } from "lucide-react";

interface User {
  name: string;
  emoji: string;
  color: string;
  id?: string;
}

interface ActiveUsersDropdownProps {
  activeUsers: User[];
  onInviteClick: () => void;
}

export function ActiveUsersDropdown({
  activeUsers,
  onInviteClick,
}: ActiveUsersDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
      >
        <Users className="w-4 h-4 text-white" />
        <span className="text-sm font-semibold text-white">
          {activeUsers.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-[#1a1a1a] border-2 border-[#333333] shadow-2xl z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 bg-[#2d2d2d] border-b-2 border-[#333333] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00AFF0]" />
              <h3 className="text-sm font-semibold text-white">Active Users</h3>
            </div>
            <span className="text-xs text-[#999999]">
              {activeUsers.length} online
            </span>
          </div>

          {/* Users List */}
          <div className="p-2">
            {activeUsers.length === 0 ? (
              <div className="text-center py-6 text-[#666666] text-sm">
                No users online
              </div>
            ) : (
              <div className="space-y-1">
                {activeUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[#2d2d2d] transition-colors"
                  >
                    <span className="text-2xl">{user.emoji}</span>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">
                        {user.name}
                      </div>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Button */}
          <div className="p-2 border-t-2 border-[#333333]">
            <button
              onClick={() => {
                setIsOpen(false);
                onInviteClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#00AFF0] hover:bg-[#0099d9] text-black font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Users
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
