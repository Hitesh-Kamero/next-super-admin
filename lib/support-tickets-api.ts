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

/**
 * Get all support tickets with pagination and optional status filter
 */
export async function getAllSupportTickets(
  skip: number = 0,
  limit: number = 20,
  status?: "OPEN" | "IN_PROGRESS" | "WAITING_FOR_USER" | "CLOSED"
): Promise<SupportTicketsListResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });
  if (status) {
    params.append("status", status);
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
 * Get public URL for a file stored in GCS
 */
export function getFileUrl(storageKey: string): string {
  const bucketName = "kamero-support";
  return `https://storage.googleapis.com/${bucketName}/${storageKey}`;
}

