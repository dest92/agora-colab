/**
 * Auth API - Authentication with Supabase
 * Service: API Gateway (proxy to Supabase)
 * Base: /auth
 */

import { apiClient } from "./client";

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string | null;
    email: string | null;
  };
}

export interface RegisterDto {
  email: string;
  password: string;
  metadata?: {
    name?: string;
    emoji?: string;
    color?: string;
  };
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface LogoutDto {
  accessToken: string;
}

class AuthApi {
  /**
   * Register new user
   * POST /auth/register
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/register", dto);

    // Auto-set token after successful registration
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
      this.saveTokens(response);
    }

    return response;
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/login", dto);

    console.log("📥 Login response:", {
      hasAccessToken: !!response.accessToken,
      tokenPreview: response.accessToken?.substring(0, 20),
      userId: response.user?.id,
    });

    // Auto-set token after successful login
    if (response.accessToken) {
      console.log("🔐 Setting token in apiClient...");
      apiClient.setToken(response.accessToken);
      this.saveTokens(response);
      console.log(
        "✅ Token set, current token:",
        apiClient.getToken()?.substring(0, 20)
      );
    } else {
      console.error("❌ No accessToken in response!");
    }

    return response;
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });

    // Auto-set new token
    if (response.accessToken) {
      apiClient.setToken(response.accessToken);
      this.saveTokens(response);
    }

    return response;
  }

  /**
   * Logout user
   * POST /auth/logout
   */
  async logout(): Promise<void> {
    const accessToken = apiClient.getToken();

    if (accessToken) {
      try {
        await apiClient.post<AuthResponse>("/auth/logout", { accessToken });
      } catch (error) {
        console.error("Logout error:", error);
      }
    }

    // Clear token and local storage
    apiClient.setToken(null);
    this.clearTokens();
  }

  /**
   * Get current user from stored token
   */
  getCurrentUser(): AuthResponse["user"] | null {
    if (typeof window === "undefined") return null;

    const userStr = localStorage.getItem("agora-user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    const token = localStorage.getItem("agora-access-token");
    return !!token;
  }

  /**
   * Initialize auth from localStorage (call on app startup)
   */
  initializeAuth(): void {
    if (typeof window === "undefined") {
      console.log("⚠️ initializeAuth called on server side");
      return;
    }

    const token = localStorage.getItem("agora-access-token");
    console.log("🔍 Checking localStorage for token:", {
      hasToken: !!token,
      tokenPreview: token?.substring(0, 20),
    });

    if (token) {
      apiClient.setToken(token);
      console.log("✅ Token restored from localStorage");
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(response: AuthResponse): void {
    if (typeof window === "undefined") return;

    if (response.accessToken) {
      localStorage.setItem("agora-access-token", response.accessToken);
    }

    if (response.refreshToken) {
      localStorage.setItem("agora-refresh-token", response.refreshToken);
    }

    if (response.user) {
      localStorage.setItem("agora-user", JSON.stringify(response.user));
    }
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokens(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem("agora-access-token");
    localStorage.removeItem("agora-refresh-token");
    localStorage.removeItem("agora-user");
  }
}

export const authApi = new AuthApi();
