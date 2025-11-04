"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/_lib/api";

const EMOJIS = ["👤", "🎯", "💡", "🚀", "⭐", "🔥", "💪", "🎨", "🌟", "⚡"];
const COLORS = [
  { name: "cyan", value: "#00AFF0" },
  { name: "magenta", value: "#E3008C" },
  { name: "lime", value: "#8CBF26" },
  { name: "orange", value: "#FA6800" },
  { name: "purple", value: "#A200FF" },
  { name: "blue", value: "#0078D7" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) {
      setError("name too short");
      return;
    }

    if (password.length < 6) {
      setError("password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Register with custom metadata (emoji, color, name)
      await authApi.register({
        email,
        password,
        metadata: {
          name: name.trim(),
          emoji: selectedEmoji,
          color: selectedColor,
        },
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-[#1e1e1e]">
      <div className="w-full max-w-sm sm:max-w-xl md:max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-light text-white mb-2">
            create account
          </h1>
          <p className="text-white/60 uppercase text-xs tracking-wider">
            JOIN THE COLLABORATION
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-1">
            {/* Name Tile */}
            <div className="bg-[#0078D7] p-6">
              <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
                YOUR NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
                placeholder="enter name"
                required
                disabled={loading}
              />
            </div>

            {/* Email Tile */}
            <div className="bg-[#00AFF0] p-6">
              <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
                placeholder="your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Tile */}
          <div className="bg-[#8CBF26] p-6 mb-1">
            <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/20 border-2 border-white/40 text-white px-4 py-3 text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
              placeholder="min 6 characters"
              required
              disabled={loading}
            />
          </div>

          {/* Emoji Selection */}
          <div className="bg-[#FA6800] p-6 mb-1">
            <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
              CHOOSE EMOJI
            </label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  disabled={loading}
                  className={`w-12 h-12 text-2xl flex items-center justify-center transition-all ${
                    selectedEmoji === emoji
                      ? "bg-white scale-110"
                      : "bg-white/20 hover:bg-white/30"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="bg-[#A200FF] p-6 mb-1">
            <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
              CHOOSE COLOR
            </label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  disabled={loading}
                  className={`w-16 h-16 transition-all ${
                    selectedColor === color.value
                      ? "scale-110 ring-4 ring-white"
                      : "hover:scale-105"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-[#E3008C] p-4 mb-1">
              <p className="text-white text-sm uppercase tracking-wider">
                {error}
              </p>
            </div>
          )}

          {/* Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#8CBF26] p-6 text-white font-light text-xl hover:bg-[#7AA622] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "creating..." : "create account"}
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
        <div className="mt-1 p-6" style={{ backgroundColor: selectedColor }}>
          <p className="text-white/80 uppercase text-xs tracking-wider mb-2">
            PREVIEW
          </p>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selectedEmoji}</span>
            <span className="text-white text-2xl font-light">
              {name || "your name"}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
