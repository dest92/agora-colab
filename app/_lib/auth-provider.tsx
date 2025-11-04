"use client";

import { authApi } from "./api";

// Initialize auth IMMEDIATELY (synchronously) before any renders
if (typeof window !== "undefined") {
  authApi.initializeAuth();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
