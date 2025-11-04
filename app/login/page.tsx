"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/app/_lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.login({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[#1e1e1e]">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-light text-white mb-2">hello</h1>
          <p className="text-white/60 uppercase text-xs tracking-wider">
            SIGN IN TO CONTINUE
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-0">
          {/* Email Tile */}
          <div className="bg-[#0078D7] p-6 mb-1">
            <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/20 border-2 border-white/40 text-white px-4 py-3 text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
              placeholder="your email"
              required
            />
          </div>

          {/* Password Tile */}
          <div className="bg-[#00AFF0] p-6 mb-1">
            <label className="block text-white/80 uppercase text-xs tracking-wider mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/20 border-2 border-white/40 text-white px-4 py-3 text-lg focus:outline-none focus:border-white rounded-none placeholder:text-white/50"
              placeholder="your password"
              required
            />
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
          <div className="grid grid-cols-2 gap-1 mt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#8CBF26] p-6 text-white font-light text-xl hover:bg-[#7AA622] disabled:bg-[#666666] disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "signing in..." : "sign in"}
            </button>
            <Link
              href="/register"
              className="bg-[#FA6800] p-6 text-white font-light text-xl hover:bg-[#E05E00] transition-colors flex items-center justify-center"
            >
              register
            </Link>
          </div>
        </form>

        {/* Info Tiles */}
        <div className="grid grid-cols-2 gap-1 mt-1">
          <div className="bg-[#A200FF] p-4">
            <p className="text-white/80 text-xs uppercase tracking-wider">
              COLLABORATIVE
            </p>
            <p className="text-white text-sm font-light">decision platform</p>
          </div>
          <div className="bg-[#E3008C] p-4">
            <p className="text-white/80 text-xs uppercase tracking-wider">
              REAL-TIME
            </p>
            <p className="text-white text-sm font-light">teamwork</p>
          </div>
        </div>
      </div>
    </main>
  );
}
