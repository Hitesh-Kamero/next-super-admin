import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminOrderSummary {
  id: string;
  razorPayOrderId?: string;
  amount: number; // in paise
  createdAt: string;
  state: "created" | "attempted" | "paid" | "confirmed" | "completed" | "failed";
  userId: string;
  whitelabelId?: string;
}

export interface AdminOrdersResponse {
  orders: AdminOrderSummary[];
  total: number;
  skip: number;
  limit: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: any[];
  state: string;
  amount: number;
  [key: string]: any; // For additional fields
}

/**
 * Get paginated list of orders
 */
export async function getOrders(
  skip: number = 0,
  limit: number = 20
): Promise<AdminOrdersResponse> {
  const params = new URLSearchParams({
    skip: skip.toString(),
    limit: limit.toString(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/orders?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get orders" }));
    throw new Error(error.message || "Failed to get orders");
  }

  return response.json();
}

/**
 * Get order details by order ID
 */
export async function getOrderDetails(orderId: string): Promise<Order> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/orders/${orderId}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get order details" }));
    throw new Error(error.message || "Failed to get order details");
  }

  return response.json();
}




