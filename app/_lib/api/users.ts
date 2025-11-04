/**
 * Users API
 * Base: /users
 */

import { apiClient } from "./client";

export interface UserMetadata {
  name?: string;
  emoji?: string;
  color?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  user_metadata?: UserMetadata;
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
