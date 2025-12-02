import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminSubscriptionDetails {
  id: string;
  type: string;
  name?: string;
  packageId?: string;
  createdAt?: string;
  expiresAt?: string;
  maxPhotosLimit?: number;
  uploadedPhotosCount?: number;
  deletedPhotosCount?: number;
  currentPhotosCount?: number;
  userId?: string;
  whitelabelId?: string;
  currency?: string;
  currentEvents?: number;
  createdEvents?: number;
  guestPhotosLimit?: number;
  guestPhotosCount?: number;
  modification?: Record<string, any>;
}

/**
 * Get a subscription by subscription document ID
 */
export async function getSubscription(subscriptionId: string): Promise<AdminSubscriptionDetails> {
  const params = new URLSearchParams({
    subscriptionId: subscriptionId.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/subscriptions/get?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get subscription" }));
    throw new Error(error.message || "Failed to get subscription");
  }

  return response.json();
}

export interface AdminSubscriptionAddOnRequest {
  subscriptionId: string;
  packageId: string;
  startDate: string;
  proofFileUrl: string;
}

export interface AdminSubscriptionUpgradeRequest {
  subscriptionId: string;
  packageId: string;
  startDate: string;
  proofFileUrl: string;
}

export interface AdminSubscriptionUpdateResponse {
  success: boolean;
  subscriptionId: string;
  message?: string;
  newMaxPhotosLimit?: number;
  newExpiresAt?: string;
}

/**
 * Add an addon pack to an existing subscription
 */
export async function addOnSubscription(data: AdminSubscriptionAddOnRequest): Promise<AdminSubscriptionUpdateResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/subscriptions/addon`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to add subscription addon" }));
    throw new Error(error.message || "Failed to add subscription addon");
  }

  return response.json();
}

/**
 * Upgrade an existing subscription to a new plan
 */
export async function upgradeSubscription(data: AdminSubscriptionUpgradeRequest): Promise<AdminSubscriptionUpdateResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/subscriptions/upgrade`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to upgrade subscription" }));
    throw new Error(error.message || "Failed to upgrade subscription");
  }

  return response.json();
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  period?: string;
  interval?: number;
  uploadLimit: number;
  maxPhotosLimit: number;
  amountINR?: number;
  amountUSD?: number;
}

/**
 * Get available subscription plans (to be implemented)
 * For now, returns hardcoded plans based on Flutter app's logic
 */
export function getAvailablePlans(currentMaxPhotos: number, isUpgrade: boolean): SubscriptionPlan[] {
  // These are sample plans - in production, this should fetch from the API
  const allPlans: SubscriptionPlan[] = [
    { id: "plan_quarterly_1000", name: "Quarterly 1000", interval: 3, uploadLimit: 1000, maxPhotosLimit: 1000, amountINR: 2999 },
    { id: "plan_quarterly_2500", name: "Quarterly 2500", interval: 3, uploadLimit: 2500, maxPhotosLimit: 2500, amountINR: 4999 },
    { id: "plan_quarterly_5000", name: "Quarterly 5000", interval: 3, uploadLimit: 5000, maxPhotosLimit: 5000, amountINR: 7999 },
    { id: "plan_quarterly_10000", name: "Quarterly 10000", interval: 3, uploadLimit: 10000, maxPhotosLimit: 10000, amountINR: 12999 },
    { id: "plan_yearly_1000", name: "Yearly 1000", interval: 12, uploadLimit: 1000, maxPhotosLimit: 1000, amountINR: 9999 },
    { id: "plan_yearly_2500", name: "Yearly 2500", interval: 12, uploadLimit: 2500, maxPhotosLimit: 2500, amountINR: 15999 },
    { id: "plan_yearly_5000", name: "Yearly 5000", interval: 12, uploadLimit: 5000, maxPhotosLimit: 5000, amountINR: 24999 },
    { id: "plan_yearly_10000", name: "Yearly 10000", interval: 12, uploadLimit: 10000, maxPhotosLimit: 10000, amountINR: 39999 },
  ];

  if (isUpgrade) {
    // For upgrades, show only plans with higher photo limit
    return allPlans.filter(plan => plan.maxPhotosLimit > currentMaxPhotos);
  } else {
    // For addons, show all plans (they add to existing limit)
    return allPlans;
  }
}
