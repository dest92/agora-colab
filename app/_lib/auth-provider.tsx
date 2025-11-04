"use client";

import { useEffect } from "react";
import { authApi } from "./api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth from localStorage on app load
    authApi.initializeAuth();
    console.log("🔄 Auth initialized from localStorage");
  }, []);

  return <>{children}</>;
}
