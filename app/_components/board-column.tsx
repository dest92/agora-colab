"use client";

import type React from "react";

import { useState } from "react";
import { BoardCard } from "./board-card";
import { Textarea } from "./ui/textarea";
import { Plus, X, Trash2 } from "lucide-react";

interface User {
  name: string;
  emoji: string;
  color: string;
}

interface Comment {
  id: string;
  author: User;
  content: string;
  timestamp: number;
}

interface Card {
  id: string;
  content: string;
  author: User;
  column: string;
  priority: "low" | "normal" | "high" | "urgent";
  likes: string[];
  dislikes: string[];
  comments: Comment[];
  assignedTo?: User;
  timestamp: number;
  tags: string[];
}

interface Column {
  id: string;
  title: string;
  color: string;
}

interface BoardColumnProps {
  column: Column;
  cards: Card[];
  onAddCard: (
    columnId: string,
    content: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => void;
  onMoveCard: (cardId: string, newColumn: string) => void;
  onDeleteCard: (cardId: string) => void;
  onVote: (cardId: string, type: "like" | "dislike") => void;
  onAddComment: (cardId: string, content: string) => void;
  onChangePriority: (
    cardId: string,
    priority: "low" | "normal" | "high" | "urgent"
  ) => void;
  onAssignUser: (cardId: string, user: User | undefined) => void;
  onAddTag: (cardId: string, tag: string) => void;
  onRemoveTag: (cardId: string, tag: string) => void;
  currentUser: User;
  activeUsers: User[];
  onDeleteLane?: (laneId: string) => void;
}

const COLOR_MAP: Record<string, string> = {
  "wp-cyan": "#00AFF0",
  "wp-magenta": "#E3008C",
  "wp-lime": "#8CBF26",
  "wp-orange": "#FA6800",
  "wp-purple": "#A200FF",
};

export function BoardColumn({
  column,
  cards,
  onAddCard,
  onMoveCard,
  onDeleteCard,
  onVote,
  onAddComment,
  onChangePriority,
  onAssignUser,
  onAddTag,
  onRemoveTag,
  currentUser,
  activeUsers,
  onDeleteLane,
}: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCardContent, setNewCardContent] = useState("");
  const [newCardPriority, setNewCardPriority] = useState<
    "low" | "normal" | "high" | "urgent"
  >("normal");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAdd = () => {
    if (!newCardContent.trim()) return;

    onAddCard(column.id, newCardContent.trim(), newCardPriority);
    setNewCardContent("");
    setNewCardPriority("normal");
    setIsAdding(false);
  };

  const handleCancel = () => {
    setNewCardContent("");
    setNewCardPriority("normal");
    setIsAdding(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const cardId = e.dataTransfer.getData("cardId");
    if (cardId) {
      onMoveCard(cardId, column.id);
    }
  };

  const sortedCards = [...cards].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.timestamp - a.timestamp;
  });

  return (
    <div
      className="flex flex-col h-full min-h-[500px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="p-5 mb-4"
        style={{ backgroundColor: COLOR_MAP[column.color] }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white tracking-tight lowercase">
            {column.title}
          </h2>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-black/30 text-white font-bold text-lg min-w-10 text-center">
              {cards.length}
            </div>
            {onDeleteLane && (
              <button
                onClick={() => onDeleteLane(column.id)}
                className="p-2 bg-black/30 hover:bg-[#e81123] text-white transition-colors"
                title="Delete column (including all cards)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`flex-1 space-y-3 overflow-y-auto px-1 transition-all ${
          isDragOver ? "bg-[#2d2d2d] border-2 border-dashed" : ""
        }`}
        style={isDragOver ? { borderColor: COLOR_MAP[column.color] } : {}}
      >
        {sortedCards.map((card) => (
          <BoardCard
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
            onVote={onVote}
            onAddComment={onAddComment}
            onChangePriority={onChangePriority}
            onAssignUser={onAssignUser}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            currentUser={currentUser}
            activeUsers={activeUsers}
          />
        ))}

        {isAdding && (
          <div className="bg-[#1a1a1a] border-2 border-[#333333] p-4 space-y-3">
            <Textarea
              value={newCardContent}
              onChange={(e) => setNewCardContent(e.target.value)}
              placeholder="type your idea..."
              className="min-h-[100px] bg-[#000000] border-2 border-[#333333] resize-none text-white placeholder:text-[#666666]"
              autoFocus
            />

            <div className="space-y-2">
              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">
                priority
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setNewCardPriority("urgent")}
                  className={`h-10 font-semibold text-white transition-colors ${
                    newCardPriority === "urgent"
                      ? "bg-[#e81123]"
                      : "bg-[#2d2d2d] hover:bg-[#3d3d3d]"
                  }`}
                >
                  urgent
                </button>
                <button
                  onClick={() => setNewCardPriority("high")}
                  className={`h-10 font-semibold text-white transition-colors ${
                    newCardPriority === "high"
                      ? "bg-[#FA6800]"
                      : "bg-[#2d2d2d] hover:bg-[#3d3d3d]"
                  }`}
                >
                  high
                </button>
                <button
                  onClick={() => setNewCardPriority("normal")}
                  className={`h-10 font-semibold text-white transition-colors ${
                    newCardPriority === "normal"
                      ? "bg-[#00AFF0]"
                      : "bg-[#2d2d2d] hover:bg-[#3d3d3d]"
                  }`}
                >
                  normal
                </button>
                <button
                  onClick={() => setNewCardPriority("low")}
                  className={`h-10 font-semibold text-white transition-colors ${
                    newCardPriority === "low"
                      ? "bg-[#8CBF26]"
                      : "bg-[#2d2d2d] hover:bg-[#3d3d3d]"
                  }`}
                >
                  low
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 h-12 font-semibold text-white"
                style={{ backgroundColor: COLOR_MAP[column.color] }}
              >
                add
              </button>
              <button
                onClick={handleCancel}
                className="h-12 w-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-4 w-full h-14 font-semibold border-2 transition-colors flex items-center justify-center gap-2"
          style={{
            borderColor: COLOR_MAP[column.color],
            color: COLOR_MAP[column.color],
            backgroundColor: "transparent",
          }}
        >
          <Plus className="w-5 h-5" />
          add card
        </button>
      )}
    </div>
  );
}
