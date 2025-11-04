/**
 * HTTP Client para API Gateway
 * Base URL: http://localhost:3000
 * Auth: Bearer JWT (Supabase)
 */

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  }

  /**
   * Set JWT token for authentication
   */
  setToken(token: string | null) {
    this.token = token;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Build headers with Authorization
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
      console.log("🔑 Using token:", this.token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ No token set in apiClient");
    }

    return headers;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    method: string,
    path: string,
    body?: any,
    retry: boolean = true
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
      credentials: "include",
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retry && !path.includes("/auth/")) {
        console.warn("⚠️ 401 Unauthorized - attempting token refresh...");

        if (typeof window !== "undefined") {
          const refreshToken = localStorage.getItem("agora-refresh-token");

          if (refreshToken) {
            try {
              // Try to refresh the token
              const refreshResponse = await this.request<any>(
                "POST",
                "/auth/refresh",
                { refreshToken },
                false // Don't retry on refresh endpoint
              );

              if (refreshResponse.accessToken) {
                this.setToken(refreshResponse.accessToken);
                localStorage.setItem(
                  "agora-access-token",
                  refreshResponse.accessToken
                );

                // Retry the original request with new token
                console.log("✅ Token refreshed, retrying request...");
                return this.request<T>(method, path, body, false);
              }
            } catch (refreshError) {
              console.error("❌ Token refresh failed:", refreshError);
              // Clear tokens and redirect to login
              localStorage.removeItem("agora-access-token");
              localStorage.removeItem("agora-refresh-token");
              localStorage.removeItem("agora-user");
              if (typeof window !== "undefined") {
                window.location.href = "/login";
              }
              throw new Error("Session expired. Please login again.");
            }
          } else {
            // No refresh token available
            console.warn("⚠️ No refresh token available");
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            throw new Error("Authentication required");
          }
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${method} ${path}]:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  /**
   * POST request
   */
  async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  /**
   * PATCH request
   */
  async patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  /**
   * DELETE request
   */
  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

// Singleton instance
export const apiClient = new ApiClient();
