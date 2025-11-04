/**
 * User Cache Utility
 * Caches user information to avoid repeated API calls
 */

import { usersApi } from "@/app/_lib/api/users";

export interface UserInfo {
  name: string;
  emoji: string;
  color: string;
  email: string;
}

// Cache for user info
const userCache = new Map<string, UserInfo>();

/**
 * Get full user info (name, emoji, color) from ID
 * Uses cache to avoid repeated API calls
 */
export const getUserInfo = async (userId: string): Promise<UserInfo> => {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  try {
    const user = await usersApi.getUser(userId);
    const displayName = user.user_metadata?.name || user.email?.split("@")[0] || userId.substring(0, 8);
    const emoji = user.user_metadata?.emoji || "👤";
    const color = user.user_metadata?.color || "#999999";
    
    const userInfo: UserInfo = {
      name: displayName,
      emoji,
      color,
      email: user.email
    };
    
    userCache.set(userId, userInfo);
    return userInfo;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return {
      name: userId.substring(0, 8) + "...",
      emoji: "👤",
      color: "#999999",
      email: ""
    };
  }
};

/**
 * Get user display name from ID
 * Uses cache to avoid repeated API calls
 * @deprecated Use getUserInfo instead for full user data
 */
export const getUserDisplayName = async (userId: string): Promise<string> => {
  const userInfo = await getUserInfo(userId);
  return userInfo.name;
};

/**
 * Clear the user cache
 */
export const clearUserCache = () => {
  userCache.clear();
};
