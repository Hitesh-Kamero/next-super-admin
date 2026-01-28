import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  whitelabelId: string;
  userEmail: string;
  userMobile: string;
  subject?: string;
  description: string;
  eventDocID?: string;
  eventName?: string;
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED";
  attachments: SupportTicketAttachment[];
  replies: SupportTicketReply[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  assignedAt?: string;
}

export interface SupportTicketAttachment {
  storageKey: string;
  fileName: string;
  fileType: "screenshot" | "video";
  contentType?: string;
  fileSize?: number;
}

export interface SupportTicketReply {
  id: string;
  from: "user" | "admin";
  message: string;
  attachments: SupportTicketAttachment[];
  createdAt: string;
  createdBy: string;
}

export interface SupportTicketsListResponse {
  tickets: SupportTicket[];
  totalCount: number;
  hasMore: boolean;
}

export interface UpdateStatusRequest {
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED";
}

export interface ReplyRequest {
  message: string;
  attachments?: SupportTicketAttachment[];
}

// Activity types for ticket audit log (internal use only)
export type TicketActivityType =
  | "REPLY"
  | "STATUS_CHANGE"
  | "CLOSED"
  | "REOPENED"
  | "ASSIGNED"
  | "ATTACHMENT_ADD";

export interface TicketActivity {
  id: number;
  ticketId: string;
  activityType: TicketActivityType;
  adminUserId: string;
  adminEmail: string;
  adminDisplayName?: string;
  adminPhotoUrl?: string;
  description?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TicketActivityListResponse {
  activities: TicketActivity[];
  totalCount: number;
}

/**
 * Get all support tickets with pagination, optional status filter, sorting, and assignment filter
 */
export async function getAllSupportTickets(
  skip: number = 0,
  limit: number = 20,
  status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED",
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber" | "status",
  sortOrder?: "asc" | "desc",
  assignedTo?: string, // Use "me" to get tickets assigned to current user
  excludeClosed?: boolean // If true, excludes CLOSED tickets from results
): Promise<SupportTicketsListResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (status) {
    params.append("status", status);
  }
  if (sortBy) {
    params.append("sortBy", sortBy);
  }
  if (sortOrder) {
    params.append("sortOrder", sortOrder);
  }
  if (assignedTo) {
    params.append("assignedTo", assignedTo);
  }
  if (excludeClosed !== undefined) {
    params.append("excludeClosed", excludeClosed.toString());
  }

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch tickets" }));
    throw new Error(error.message || "Failed to fetch support tickets");
  }

  return response.json();
}

/**
 * Get a single support ticket by ID
 */
export async function getSupportTicket(ticketId: string): Promise<SupportTicket> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Ticket not found" }));
    throw new Error(error.message || "Failed to fetch support ticket");
  }

  return response.json();
}

/**
 * Update support ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED"
): Promise<SupportTicket> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update status" }));
    throw new Error(error.message || "Failed to update ticket status");
  }

  return response.json();
}

/**
 * Add admin reply to a support ticket
 */
export async function replyToTicket(
  ticketId: string,
  message: string,
  attachments?: SupportTicketAttachment[]
): Promise<SupportTicket> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/reply`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        attachments: attachments || [],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to add reply" }));
    throw new Error(error.message || "Failed to add reply");
  }

  return response.json();
}

/**
 * Close a support ticket
 */
export async function closeTicket(ticketId: string): Promise<SupportTicket> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/close`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to close ticket" }));
    throw new Error(error.message || "Failed to close ticket");
  }

  return response.json();
}

/**
 * Get ticket activities (audit log) - internal use only
 */
export async function getTicketActivities(
  ticketId: string,
  limit: number = 50,
  skip: number = 0
): Promise<TicketActivityListResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/activities?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch activities" }));
    throw new Error(error.message || "Failed to fetch ticket activities");
  }

  return response.json();
}

/**
 * Get public URL for a file stored in GCS
 */
export function getFileUrl(storageKey: string): string {
  const bucketName = "kamero-support";
  return `https://storage.googleapis.com/${bucketName}/${storageKey}`;
}

/**
 * Get presigned URL for uploading admin attachment
 */
export async function getAdminPresignedUrl(
  ticketId: string,
  fileName: string,
  contentType: string,
  fileSize: number,
  fileType: "screenshot" | "video"
): Promise<{ presignedUrl: string; storageKey: string }> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/presigned-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        contentType,
        fileSize,
        fileType,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get upload URL" }));
    throw new Error(error.message || "Failed to get presigned URL");
  }

  const data = await response.json();
  // Map backend response fields to expected frontend fields
  return {
    presignedUrl: data.url,
    storageKey: data.objectName,
  };
}

/**
 * List all super admin users
 */
export async function listAdminUsers(): Promise<AdminUserInfo[]> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/users/list`
  );  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to fetch admin users" }));
    throw new Error(error.message || "Failed to fetch admin users");
  }  const data = await response.json();
  return data.users || [];
}/**
 * Assign a support ticket to an admin user
 */
export async function assignTicket(
  ticketId: string,
  assignedToUserID: string
): Promise<SupportTicket> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/support_tickets/${ticketId}/assign`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ assignedToUserID }),
    }
  );  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to assign ticket" }));
    throw new Error(error.message || "Failed to assign ticket");
  }  return response.json();
}export interface AdminUserInfo {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}