/**
 * Invite User Modal Component with User Search
 * Modal for inviting users to a workspace with autocomplete search
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { X, UserPlus, Search, User } from "lucide-react";
import { workspacesApi, type SearchUserResult } from "@/app/_lib/api";

interface InviteUserModalProps {
  workspaceId: string;
  workspaceName: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
}

export function InviteUserModal({
  workspaceId,
  workspaceName,
  isOpen,
  onClose,
  onInviteSent,
}: InviteUserModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Search users with debounce
  useEffect(() => {
    if (!isOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await workspacesApi.searchUsers(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error("Failed to search users:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown, isOpen]);

  const handleSelectUser = (user: SearchUserResult) => {
    setSelectedUser(user);
    setSearchQuery(user.name + " (" + user.email + ")");
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("Please select a user from the search results");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess(false);

      // Send invitation with user ID
      await workspacesApi.addMember(workspaceId, { userId: selectedUser.id });

      setSuccess(true);
      setSearchQuery("");
      setSelectedUser(null);

      // Call callback if provided
      if (onInviteSent) {
        onInviteSent();
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("Failed to invite user:", err);

      // Extract error message
      let errorMessage = "Failed to send invitation. Please try again.";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Improve user not found message
      if (errorMessage.includes("not found")) {
        errorMessage = "User not found or already a member of this workspace.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setSearchQuery("");
      setSelectedUser(null);
      setSearchResults([]);
      setError("");
      setSuccess(false);
      setShowDropdown(false);
      onClose();
    }
  };

  // Early return AFTER all hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border-2 border-[#333333] rounded-lg w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#00AFF0]/20 p-2 rounded">
              <UserPlus className="w-5 h-5 text-[#00AFF0]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Invite User</h2>
              <p className="text-sm text-[#999999]">{workspaceName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-[#999999] hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-[#999999] mb-2"
            >
              Search User
            </label>
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                }}
                onFocus={() =>
                  searchResults.length > 0 && setShowDropdown(true)
                }
                placeholder="Search by name or email..."
                disabled={isLoading}
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded px-10 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#00AFF0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#00AFF0]/30 border-t-[#00AFF0] rounded-full animate-spin" />
                </div>
              )}

              {/* Dropdown */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border-2 border-[#333333] rounded max-h-60 overflow-y-auto z-10">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2d2d2d] transition-colors text-left"
                    >
                      <div className="w-8 h-8 bg-[#00AFF0]/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#00AFF0]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-[#999999] truncate">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {!isSearching &&
                searchQuery.length >= 2 &&
                searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border-2 border-[#333333] rounded px-4 py-3 text-sm text-[#666666] text-center">
                    No users found. Try a different search.
                  </div>
                )}
            </div>
            <p className="text-xs text-[#666666] mt-2">
              Type at least 2 characters to search
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded px-4 py-3 text-green-400 text-sm">
              ✓ Invitation sent successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-[#2d2d2d] text-white px-4 py-3 rounded font-semibold hover:bg-[#3d3d3d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedUser}
              className="flex-1 bg-[#00AFF0] text-black px-4 py-3 rounded font-semibold hover:bg-[#00AFF0]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-[#333333]">
          <p className="text-xs text-[#666666]">
            The invited user will be able to access all boards in this
            workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
