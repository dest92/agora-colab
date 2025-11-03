"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const EMOJIS = ["👤", "🎯", "💡", "🚀", "⭐", "🔥", "💪", "🎨", "🌟", "⚡"];
const COLORS = [
  { name: "cyan", value: "#00AFF0" },
  { name: "magenta", value: "#E3008C" },
  { name: "lime", value: "#8CBF26" },
  { name: "orange", value: "#FA6800" },
  { name: "purple", value: "#A200FF" },
  { name: "blue", value: "#0078D7" },
];

type StoredUser = {
  name: string;
  email: string;
  password: string;
  emoji: string;
  color: string;
  createdAt: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [error, setError] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) {
      setError("name too short");
      return;
    }

    if (password.length < 4) {
      setError("password too short");
      return;
    }

    // Get existing users
    const usersData = localStorage.getItem("wp-users");
    const users: StoredUser[] = usersData
      ? (JSON.parse(usersData) as StoredUser[])
      : [];

    // Check if email exists
    if (
      users.some(
        (u: StoredUser) => u.email.toLowerCase() === email.toLowerCase()
      )
    ) {
      setError("email already exists");
      return;
    }

    // Add new user
    const newUser: StoredUser = {
      name,
      email,
      password,
      emoji: selectedEmoji,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("wp-users", JSON.stringify(users));

    // Auto login
    localStorage.setItem(
      "wp-user",
      JSON.stringify({
        name: newUser.name,
        emoji: newUser.emoji,
        color: newUser.color,
        email: newUser.email,
      })
    );

    router.push("/board");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-[#1e1e1e]">
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-2">
            create account
          </h1>
          <p className="text-white/60 uppercase text-[10px] sm:text-xs tracking-wider">
            JOIN THE COLLABORATION
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-1">
            {/* Name Tile */}
            <div className="bg-[#0078D7] p-4 sm:p-6 md:p-8">
              <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
                YOUR NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
                placeholder="enter name"
                required
              />
            </div>

            {/* Email Tile */}
            <div className="bg-[#00AFF0] p-4 sm:p-6 md:p-8">
              <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
                placeholder="your email"
                required
              />
            </div>
          </div>

          {/* Password Tile */}
          <div className="bg-[#8CBF26] p-4 sm:p-6 md:p-8 mb-1">
            <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
              placeholder="min 4 characters"
              required
            />
          </div>

          {/* Emoji Selection */}
          <div className="bg-[#FA6800] p-4 sm:p-6 md:p-8 mb-1">
            <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
              CHOOSE EMOJI
            </label>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-10 h-10 sm:w-12 sm:h-12 text-xl sm:text-2xl flex items-center justify-center transition-all ${
                    selectedEmoji === emoji
                      ? "bg-white scale-110"
                      : "bg-white/20 hover:bg-white/30 active:scale-95"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-[#A200FF] p-4 sm:p-6 md:p-8 mb-1">
            <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
              CHOOSE COLOR
            </label>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 transition-all ${
                    selectedColor === color.value
                      ? "scale-110 ring-2 sm:ring-4 ring-white"
                      : "hover:scale-105 active:scale-95"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#E3008C] p-3 sm:p-4 mb-1">
              <p className="text-white text-xs sm:text-sm uppercase tracking-wider">
                {error}
              </p>
            </div>
          )}

          {/* Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
            <button
              type="submit"
              className="bg-[#8CBF26] p-4 sm:p-6 md:p-8 text-white font-light text-base sm:text-xl md:text-2xl hover:bg-[#7AA622] transition-colors active:scale-95"
            >
              create account
            </button>
            <Link
              href="/login"
              className="bg-[#E3008C] p-4 sm:p-6 md:p-8 text-white font-light text-base sm:text-xl md:text-2xl hover:bg-[#D1007D] transition-colors flex items-center justify-center active:scale-95"
            >
              back to login
            </Link>
          </div>
        </form>

        {/* Preview Tile */}
        <div
          className="mt-1 p-4 sm:p-6 md:p-8"
          style={{ backgroundColor: selectedColor }}
        >
          <p className="text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2">
            PREVIEW
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-3xl sm:text-4xl">{selectedEmoji}</span>
            <span className="text-white text-xl sm:text-2xl md:text-3xl font-light">
              {name || "your name"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
