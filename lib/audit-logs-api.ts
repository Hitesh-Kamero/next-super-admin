import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AuditLogEntry {
  id: number;
  operationType: string; // CREATE, UPDATE, DELETE
  resourceType: string; // Event, User, Subscription, Wallet
  resourceId?: string;
  adminUserId: string;
  adminEmail: string;
  adminDisplayName?: string;
  description?: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogListResponse {
  logs: AuditLogEntry[];
  totalCount: number;
}

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(
  offset: number = 0,
  limit: number = 50,
  resourceType?: string,
  resourceId?: string
): Promise<AuditLogListResponse> {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  if (resourceType) {
    params.append("resourceType", resourceType);
  }
  if (resourceId) {
    params.append("resourceId", resourceId);
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/audit-logs?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get audit logs" }));
    throw new Error(error.message || "Failed to get audit logs");
  }

  const data = await response.json();
  // Map backend response to our interface
  return {
    logs: data.logs || [],
    totalCount: data.totalCount || 0,
  };
}




