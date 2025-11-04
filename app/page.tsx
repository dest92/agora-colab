"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/app/_lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const authenticated = authApi.isAuthenticated();
    if (authenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#1e1e1e]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#00AFF0] border-t-transparent animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 uppercase text-xs tracking-wider">
          LOADING
        </p>
      </div>
    </main>
  );
}
