import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminSellerWalletItem {
  sellerId: string;
  sellerName?: string;
  sellerEmail?: string;
  whitelabelId?: string;
  inrBalance: number;
  usdBalance: number;
  walletType: "individual" | "whitelabel";
  totalBalanceInr: number;
}

export interface AdminSellerWalletListResponse {
  wallets: AdminSellerWalletItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AdminSettleSellerWalletRequest {
  sellerId: string;
  currency: "INR" | "USD";
  settlementAmount: number;
  paymentProofUrl: string;
  notes?: string;
}

export interface AdminSettleSellerWalletResponse {
  success: boolean;
  settlementId: string;
  previousBalance: {
    inr: number;
    usd: number;
  };
  newBalance: {
    inr: number;
    usd: number;
  };
  message?: string;
}

export interface AdminPaymentSettlement {
  id: string;
  sellerId: string;
  whitelabelId?: string;
  settlementAmount: number;
  currency: "INR" | "USD";
  paymentProofUrl?: string;
  adminUserId: string;
  adminEmail: string;
  status: "pending" | "completed" | "failed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AdminSellerSettlementsResponse {
  settlements: AdminPaymentSettlement[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AdminSellerOrderItem {
  id: string;
  sellerId: string;
  userId: string;
  buyerName?: string;
  buyerEmail?: string;
  eventDocId?: string;
  totalAmount: number;
  currency: "INR" | "USD";
  state: "pending" | "payment_initiated" | "payment_processing" | "completed" | "failed" | "cancelled";
  paymentProvider?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSellerOrdersResponse {
  orders: AdminSellerOrderItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * List all seller wallets with balance > 0
 */
export async function listSellerWallets(
  limit: number = 50,
  offset: number = 0,
  currency?: "INR" | "USD"
): Promise<AdminSellerWalletListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (currency) {
    params.append("currency", currency);
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/seller-wallets?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to list seller wallets" }));
    throw new Error(error.message || "Failed to list seller wallets");
  }

  return response.json();
}

/**
 * Settle seller wallet balance
 */
export async function settleSellerWallet(
  data: AdminSettleSellerWalletRequest
): Promise<AdminSettleSellerWalletResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/seller-wallets/settle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to settle wallet" }));
    throw new Error(error.message || "Failed to settle wallet");
  }

  return response.json();
}

/**
 * Get seller settlement history
 */
export async function getSellerSettlements(
  sellerId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AdminSellerSettlementsResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/seller-wallets/${encodeURIComponent(sellerId)}/settlements?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get settlements" }));
    throw new Error(error.message || "Failed to get settlements");
  }

  return response.json();
}

/**
 * Get seller orders (for MIS/dashboard)
 */
export async function getSellerOrders(
  sellerId: string,
  limit: number = 50,
  offset: number = 0,
  state?: "pending" | "payment_initiated" | "payment_processing" | "completed" | "failed" | "cancelled"
): Promise<AdminSellerOrdersResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (state) {
    params.append("state", state);
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/seller-wallets/${encodeURIComponent(sellerId)}/orders?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get seller orders" }));
    throw new Error(error.message || "Failed to get seller orders");
  }

  return response.json();
}

