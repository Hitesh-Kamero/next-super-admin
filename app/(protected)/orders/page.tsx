"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrders, type AdminOrderSummary } from "@/lib/orders-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const result = await getOrders(page * pageSize, pageSize);
      setOrders(result.orders);
      setTotal(result.total);
    } catch (error: any) {
      toast.error(error.message || "Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  };

  const getStateBadgeVariant = (state: string) => {
    switch (state) {
      case "paid":
      case "confirmed":
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      case "attempted":
        return "secondary";
      default:
        return "outline";
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Orders</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={loadOrders}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {total} orders | Page {page + 1} of {totalPages}
            </div>
          </Card>

          {/* Orders List */}
          {loading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <Card className="p-6">
              <div className="text-center text-muted-foreground py-12">
                No orders found
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card className="p-4 cursor-pointer hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {order.razorPayOrderId || order.id}
                          </h3>
                          <Badge variant={getStateBadgeVariant(order.state)}>
                            {order.state}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Order ID:</span> {order.id}
                          </div>
                          {order.razorPayOrderId && (
                            <div>
                              <span className="font-medium">Razorpay Order ID:</span>{" "}
                              {order.razorPayOrderId}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Amount:</span> {formatAmount(order.amount)}
                          </div>
                          <div>
                            <span className="font-medium">User ID:</span> {order.userId}
                          </div>
                          <div className="text-muted-foreground">
                            Created: {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}




