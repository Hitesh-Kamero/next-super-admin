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
  isAccountSelfDeleted?: boolean;
  accountSelfDeletedAt?: string;
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

export interface AdminUserUpdateRequest {
  userId: string;
  email?: string;
  reason?: string;
}

export interface AdminUserUpdateResponse {
  success: boolean;
  userId: string;
  message?: string;
  updatedFields?: string[];
}

/**
 * Update user by super admin
 */
export async function updateUser(data: AdminUserUpdateRequest): Promise<AdminUserUpdateResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/users/update`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update user" }));
    throw new Error(error.message || "Failed to update user");
  }

  return response.json();
}

export interface AdminWalletUpdateRequest {
  targetId: string;
  targetType: "user" | "whitelabel";
  newBalance: number; // in paise
  reason: string;
  proofFileUrl?: string;
}

export interface AdminWalletUpdateResponse {
  success: boolean;
  targetId: string;
  oldBalance?: number;
  newBalance?: number;
  difference?: number;
  message?: string;
}

/**
 * Update wallet balance by super admin
 */
export async function updateWallet(data: AdminWalletUpdateRequest): Promise<AdminWalletUpdateResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/wallet/update`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update wallet" }));
    throw new Error(error.message || "Failed to update wallet");
  }

  return response.json();
}

export interface AdminUserRestoreRequest {
  userId: string;
  reason?: string;
}

export interface AdminUserRestoreResponse {
  success: boolean;
  userId: string;
  message?: string;
  restoredAt?: string;
}

/**
 * Restore a deleted user account by super admin
 */
export async function restoreUserAccount(data: AdminUserRestoreRequest): Promise<AdminUserRestoreResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/users/restore`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to restore account" }));
    throw new Error(error.message || "Failed to restore account");
  }

  return response.json();
}