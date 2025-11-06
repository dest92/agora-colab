"use client";

import type React from "react";

import { useState } from "react";
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import type { Tag } from "@/app/_lib/api";

interface Comment {
  id: string;
  author: any;
  content: string;
  timestamp: number;
}

interface Card {
  id: string;
  content: string;
  author: any;
  column: string;
  priority: "low" | "normal" | "high" | "urgent";
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  assignedTo?: any;
  timestamp: number;
  tags: Tag[];
}

interface BoardCardProps {
  card: Card;
  onDelete: (cardId: string) => void;
  onVote: (cardId: string, type: "like" | "dislike") => void;
  onAddComment: (cardId: string, content: string) => void;
  onChangePriority: (
    cardId: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => void;
  onAssignUser: (cardId: string, user: any | undefined) => void;
  onAddTag: (cardId: string, label: string, color?: string) => void;
  onRemoveTag: (cardId: string, tagId: string) => void;
  currentUser: any;
  activeUsers: any[];
}

const PRIORITY_COLORS = {
  urgent: "#e81123",
  high: "#FA6800",
  normal: "#00AFF0",
  low: "#8CBF26",
};

export function BoardCard({
  card,
  onDelete,
  onVote,
  onAddComment,
  onChangePriority,
  onAssignUser,
  onAddTag,
  onRemoveTag,
  currentUser,
  activeUsers,
}: BoardCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showAssignMenu, setShowAssignMenu] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("cardId", card.id);
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    onAddComment(card.id, commentInput.trim());
    setCommentInput("");
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    onAddTag(card.id, tagInput.trim());
    setTagInput("");
    setShowTagInput(false);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-[#1a1a1a] border-2 border-[#333333] group hover:border-[#666666] transition-colors cursor-move"
    >
      <div
        className="h-2"
        style={{ backgroundColor: PRIORITY_COLORS[card.priority] }}
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{card.author.emoji}</span>
            <span className="text-sm font-semibold text-white">
              {card.author.name}
            </span>
            <div
              className="w-3 h-3"
              style={{ backgroundColor: card.author.color }}
            />
            <span className="text-xs text-[#666666]">
              {formatTime(card.timestamp)}
            </span>
          </div>

          <button
            onClick={() => onDelete(card.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 bg-[#2d2d2d] hover:bg-[#e81123] flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 text-white" />
          </button>
        </div>

        <p className="text-sm leading-relaxed whitespace-pre-wrap text-white mb-4">
          {card.content}
        </p>

        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {card.tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onRemoveTag(card.id, tag.id)}
                className="px-2 py-1 text-white text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity"
                style={{ backgroundColor: tag.color || "#A200FF" }}
              >
                {tag.label} ×
              </button>
            ))}
          </div>
        )}

        {card.assignedTo && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#2d2d2d]">
            <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
              assigned to
            </span>
            <span className="text-lg">{card.assignedTo.emoji}</span>
            <span className="text-sm font-semibold text-white">
              {card.assignedTo.name}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => onVote(card.id, "like")}
            className={`flex items-center gap-2 px-3 py-2 transition-colors ${
              card.likes.includes(currentUser.name)
                ? "bg-[#8CBF26] text-white"
                : "bg-[#2d2d2d] text-[#999999] hover:bg-[#3d3d3d]"
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span className="text-sm font-bold">{card.likes.length}</span>
          </button>

          <button
            onClick={() => onVote(card.id, "dislike")}
            className={`flex items-center gap-2 px-3 py-2 transition-colors ${
              card.dislikes.includes(currentUser.name)
                ? "bg-[#e81123] text-white"
                : "bg-[#2d2d2d] text-[#999999] hover:bg-[#3d3d3d]"
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
            <span className="text-sm font-bold">{card.dislikes.length}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] text-[#999999] hover:bg-[#3d3d3d] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-bold">{card.comments.length}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto h-9 w-9 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3 pt-3 border-t-2 border-[#333333]">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                  priority
                </span>
                <button
                  onClick={() => setShowPriorityMenu(!showPriorityMenu)}
                  className="text-xs text-[#00AFF0] font-semibold uppercase hover:text-[#00CFF0]"
                >
                  change
                </button>
              </div>

              {showPriorityMenu && (
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      onChangePriority(card.id, "urgent");
                      setShowPriorityMenu(false);
                    }}
                    className="h-9 font-semibold text-white bg-[#e81123] hover:bg-[#c81020]"
                  >
                    urgent
                  </button>
                  <button
                    onClick={() => {
                      onChangePriority(card.id, "high");
                      setShowPriorityMenu(false);
                    }}
                    className="h-9 font-semibold text-white bg-[#FA6800] hover:bg-[#da5800]"
                  >
                    high
                  </button>
                  <button
                    onClick={() => {
                      onChangePriority(card.id, "normal");
                      setShowPriorityMenu(false);
                    }}
                    className="h-9 font-semibold text-white bg-[#00AFF0] hover:bg-[#00CFF0]"
                  >
                    normal
                  </button>
                  <button
                    onClick={() => {
                      onChangePriority(card.id, "low");
                      setShowPriorityMenu(false);
                    }}
                    className="h-9 font-semibold text-white bg-[#8CBF26] hover:bg-[#7caf16]"
                  >
                    low
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                  assign to
                </span>
                <button
                  onClick={() => setShowAssignMenu(!showAssignMenu)}
                  className="text-xs text-[#00AFF0] font-semibold uppercase hover:text-[#00CFF0]"
                >
                  {card.assignedTo ? "change" : "assign"}
                </button>
              </div>

              {showAssignMenu && (
                <div className="space-y-2">
                  {activeUsers.map((user) => (
                    <button
                      key={user.name}
                      onClick={() => {
                        onAssignUser(card.id, user);
                        setShowAssignMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] transition-colors"
                    >
                      <span className="text-lg">{user.emoji}</span>
                      <span className="text-sm font-semibold text-white">
                        {user.name}
                      </span>
                      <div
                        className="w-3 h-3"
                        style={{ backgroundColor: user.color }}
                      />
                    </button>
                  ))}
                  {card.assignedTo && (
                    <button
                      onClick={() => {
                        onAssignUser(card.id, undefined);
                        setShowAssignMenu(false);
                      }}
                      className="w-full h-9 font-semibold text-white bg-[#e81123] hover:bg-[#c81020]"
                    >
                      unassign
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                  tags
                </span>
                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-xs text-[#00AFF0] font-semibold uppercase hover:text-[#00CFF0]"
                >
                  add tag
                </button>
              </div>

              {showTagInput && (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    placeholder="tag name..."
                    className="h-9 bg-[#000000] border-2 border-[#333333] text-white placeholder:text-[#666666] rounded-none"
                  />
                  <button
                    onClick={handleAddTag}
                    className="h-9 px-4 bg-[#A200FF] hover:bg-[#8200DF] text-white font-semibold"
                  >
                    <TagIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {showComments && (
          <div className="space-y-3 pt-3 border-t-2 border-[#333333]">
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {card.comments.map((comment) => (
                <div key={comment.id} className="bg-[#2d2d2d] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{comment.author.emoji}</span>
                    <span className="text-xs font-semibold text-white">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-[#666666]">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-white leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="add a comment..."
                className="min-h-[60px] bg-[#000000] border-2 border-[#333333] resize-none text-white placeholder:text-[#666666]"
              />
              <button
                onClick={handleAddComment}
                className="w-full h-10 font-semibold text-white bg-[#00AFF0] hover:bg-[#00CFF0]"
              >
                post comment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
