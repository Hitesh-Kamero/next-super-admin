import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface WebLead {
  id: string;
  name: string;
  company?: string;
  city?: string;
  mobile: string;
  email: string;
  role?: string;
  message?: string;
  createdAt: string;
}

export interface WebLeadsResponse {
  total: number;
  skip: number;
  limit: number;
  registrations: WebLead[];
}

/**
 * Get web leads with optional role filter
 */
export async function getWebLeads(
  skip: number = 0,
  limit: number = 20,
  role?: string
): Promise<WebLeadsResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  if (role) {
    params.append("role", role);
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/web-leads?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get web leads" }));
    throw new Error(error.message || "Failed to get web leads");
  }

  return response.json();
}




