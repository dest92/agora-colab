/**
 * Invite User Modal Component
 * Modal for inviting users to a workspace with user search
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { X, UserPlus, Mail, Search } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess(false);

      // Send invitation with email - backend will look up user
      await workspacesApi.addMember(workspaceId, { userId: email });

      setSuccess(true);
      setEmail("");

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
        errorMessage =
          "User with this email is not registered. They need to create an account first.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

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
              htmlFor="email"
              className="block text-sm font-medium text-[#999999] mb-2"
            >
              User Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666666]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={isLoading}
                className="w-full bg-[#0d0d0d] border border-[#333333] rounded px-10 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#00AFF0] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
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
              disabled={isLoading || !email.trim()}
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
