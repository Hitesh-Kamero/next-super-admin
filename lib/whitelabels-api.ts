import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminWhitelabelSummary {
  id: string;
  name?: string;
  appName?: string;
  subscriptionId?: string;
  createdAt?: string;
}

export interface AdminWhitelabelListResponse {
  whitelabels: AdminWhitelabelSummary[];
  totalCount: number;
}

export interface AdminWhitelabelWalletBalance {
  whitelabelId: string;
  balance: number;
  balanceInRupees?: number;
}

export interface AdminWhitelabelDetails {
  id: string;
  name?: string;
  appName?: string;
  subscriptionId?: string;
  ownerId?: string;
  createdAt?: string;
  wallet?: AdminWhitelabelWalletBalance;
}

/**
 * List all whitelabels with pagination
 */
export async function listWhitelabels(
  limit: number = 50,
  offset: number = 0
): Promise<AdminWhitelabelListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/whitelabels?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to list whitelabels" }));
    throw new Error(error.message || "Failed to list whitelabels");
  }

  return response.json();
}

/**
 * Get a whitelabel by ID
 */
export async function getWhitelabel(whitelabelId: string): Promise<AdminWhitelabelDetails> {
  const params = new URLSearchParams({
    whitelabelId: whitelabelId.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/whitelabels/get?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get whitelabel" }));
    throw new Error(error.message || "Failed to get whitelabel");
  }

  return response.json();
}

/**
 * Get wallet balance for a whitelabel
 */
export async function getWhitelabelWallet(whitelabelId: string): Promise<AdminWhitelabelWalletBalance> {
  const params = new URLSearchParams({
    whitelabelId: whitelabelId.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/whitelabels/wallet?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get whitelabel wallet" }));
    throw new Error(error.message || "Failed to get whitelabel wallet");
  }

  return response.json();
}
