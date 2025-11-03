"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Get stored users
    const usersData = localStorage.getItem("wp-users");
    const users = usersData ? JSON.parse(usersData) : [];

    // Find user
    const user = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (user) {
      // Store current user session
      localStorage.setItem(
        "wp-user",
        JSON.stringify({
          name: user.name,
          emoji: user.emoji,
          color: user.color,
          email: user.email,
        })
      );
      router.push("/board");
    } else {
      setError("invalid credentials");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-[#1e1e1e]">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        {/* Header */}
        <div className="mb-6 sm:mb-8 px-2 sm:px-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-2">
            hello
          </h1>
          <p className="text-white/60 uppercase text-[10px] sm:text-xs tracking-wider">
            SIGN IN TO CONTINUE
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-0">
          {/* Email Tile */}
          <div className="bg-[#0078D7] p-4 sm:p-6 md:p-8 mb-1">
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

          {/* Password Tile */}
          <div className="bg-[#00AFF0] p-4 sm:p-6 md:p-8 mb-1">
            <label className="block text-white/80 uppercase text-[10px] sm:text-xs tracking-wider mb-2 sm:mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/20 border-2 border-white/40 text-white px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
              placeholder="your password"
              required
            />
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
          <div className="grid grid-cols-2 gap-1 mt-1">
            <button
              type="submit"
              className="bg-[#8CBF26] p-4 sm:p-6 md:p-8 text-white font-light text-base sm:text-xl md:text-2xl hover:bg-[#7AA622] transition-colors active:scale-95"
            >
              sign in
            </button>
            <Link
              href="/register"
              className="bg-[#FA6800] p-4 sm:p-6 md:p-8 text-white font-light text-base sm:text-xl md:text-2xl hover:bg-[#E05E00] transition-colors flex items-center justify-center active:scale-95"
            >
              register
            </Link>
          </div>
        </form>

        {/* Info Tiles */}
        <div className="grid grid-cols-2 gap-1 mt-1">
          <div className="bg-[#A200FF] p-3 sm:p-4 md:p-6 min-h-[60px] sm:min-h-20">
            <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wider mb-1">
              COLLABORATIVE
            </p>
            <p className="text-white text-xs sm:text-sm md:text-base font-light">
              decision platform
            </p>
          </div>
          <div className="bg-[#E3008C] p-3 sm:p-4 md:p-6 min-h-[60px] sm:min-h-20">
            <p className="text-white/80 text-[10px] sm:text-xs uppercase tracking-wider mb-1">
              REAL-TIME
            </p>
            <p className="text-white text-xs sm:text-sm md:text-base font-light">
              teamwork
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
