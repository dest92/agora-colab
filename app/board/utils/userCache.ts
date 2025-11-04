/**
 * User Cache Utility
 * Caches user information to avoid repeated API calls
 */

import { usersApi } from "@/app/_lib/api/users";

// Cache for user info
const userCache = new Map<string, { email: string; name: string }>();

/**
 * Get user display name from ID
 * Uses cache to avoid repeated API calls
 */
export const getUserDisplayName = async (userId: string): Promise<string> => {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!.name;
  }

  try {
    const user = await usersApi.getUser(userId);
    const displayName = user.email?.split("@")[0] || userId.substring(0, 8);
    userCache.set(userId, { email: user.email, name: displayName });
    return displayName;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return userId.substring(0, 8) + "...";
  }
};

/**
 * Clear the user cache
 */
export const clearUserCache = () => {
  userCache.clear();
};
