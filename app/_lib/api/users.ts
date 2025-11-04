/**
 * Users API
 * Base: /users
 */

import { apiClient } from "./client";

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

class UsersApi {
  /**
   * List all registered users
   * GET /users
   */
  async listUsers(): Promise<User[]> {
    return apiClient.get<User[]>("/users");
  }

  /**
   * Get a specific user by ID
   * GET /users/:id
   */
  async getUser(userId: string): Promise<User> {
    return apiClient.get<User>(`/users/${userId}`);
  }
}

export const usersApi = new UsersApi();
