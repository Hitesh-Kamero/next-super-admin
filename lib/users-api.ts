import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminUserDetails {
  id: string;
  userId: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emails?: string[];
  phone?: string;
  whitelabelId?: string;
  createdAt?: string;
  userType?: string;
  country?: string;
  city?: string;
  subscriptionId?: string;
  phoneVerificationStatus?: "unverified" | "pending" | "verified" | "failed" | "skipped" | "unavailable";
  whatsappOtpVerified?: boolean;
  whatsappAvailable?: boolean;
  lastOtpAttempt?: string;
  otpAttemptCount?: number;
  lastAccessedAt?: string;
  activeAsEndUser?: string;
  isEndUser?: boolean;
  googleId?: string;
  profilePictureUrl?: string;
  authMethods?: string[];
  lastGoogleLoginAt?: string;
  metadata?: Record<string, any>;
  freeEnhancementsUsed?: number;
  freeEnhancementsLimit?: number;
  defaultSelfieId?: string;
}

export interface AdminUserWalletBalance {
  userId: string;
  balance: number; // in paise
  balanceInRupees?: number; // converted to rupees
  whitelabelId?: string;
}

/**
 * Get a user by user ID, email, or mobile number
 */
export async function getUser(query: string): Promise<AdminUserDetails> {
  const params = new URLSearchParams({
    query: query.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/users/get?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get user" }));
    throw new Error(error.message || "Failed to get user");
  }

  return response.json();
}

/**
 * Get wallet balance for a user
 */
export async function getUserWallet(userId: string): Promise<AdminUserWalletBalance> {
  const params = new URLSearchParams({
    userId: userId.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/users/wallet?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get wallet balance" }));
    throw new Error(error.message || "Failed to get wallet balance");
  }

  return response.json();
}

