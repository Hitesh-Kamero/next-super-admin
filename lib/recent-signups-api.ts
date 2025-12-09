import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface RecentSignupEntry {
  email: string;
  userId: string;
  name?: string;
  phone?: string;
  userType?: string;
  createdAt: string;
  isEndUser: boolean;
  isContacted: boolean;
  note?: string;
  contactedBy?: string;
  contactedAt?: string;
}

export interface RecentSignupsResponse {
  signups: RecentSignupEntry[];
  total: number;
  startDate: string;
  endDate: string;
  skip: number;
  limit: number;
}

export interface UpdateRecentSignupOutreachRequest {
  email: string;
  isContacted?: boolean;
  note?: string;
}

/**
 * Get recent signups within a date range
 * @param isEndUser - If true, returns only end users. If false, returns only business users. If undefined, returns all users.
 */
export async function getRecentSignups(
  startDate: string,
  endDate: string,
  skip: number = 0,
  limit: number = 200,
  isEndUser?: boolean
): Promise<RecentSignupsResponse> {
  const params = new URLSearchParams({
    startDate: startDate,
    endDate: endDate,
    skip: skip.toString(),
    limit: limit.toString(),
  });

  if (isEndUser !== undefined) {
    params.append("isEndUser", isEndUser.toString());
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/recent-signups?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get recent signups" }));
    throw new Error(error.message || "Failed to get recent signups");
  }

  return response.json();
}

/**
 * Update outreach status and/or notes for a signup
 */
export async function updateRecentSignupOutreach(
  data: UpdateRecentSignupOutreachRequest
): Promise<RecentSignupEntry> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/recent-signups/outreach`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update outreach" }));
    throw new Error(error.message || "Failed to update outreach");
  }

  return response.json();
}




