"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOrderDetails, type Order } from "@/lib/orders-api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const result = await getOrderDetails(orderId);
      setOrder(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to load order details");
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

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/orders")}
              className="mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : order ? (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl font-semibold">Order Details</h1>
                  <Badge variant={getStateBadgeVariant(order.state)}>
                    {order.state}
                  </Badge>
                </div>
                <p className="text-muted-foreground">Order ID: {order.id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">Order ID:</span> {order.id}
                    </div>
                    <div>
                      <span className="font-medium">State:</span> {order.state}
                    </div>
                    <div>
                      <span className="font-medium">Created At:</span> {formatDate(order.createdAt)}
                    </div>
                    {order.amount && (
                      <div>
                        <span className="font-medium">Amount:</span> {formatAmount(order.amount)}
                      </div>
                    )}
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Items</h3>
                    <div className="space-y-2">
                      {order.items.map((item: any, index: number) => (
                        <Card key={index} className="p-3">
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Full Order Data</h3>
                  <Card className="p-4">
                    <pre className="text-xs overflow-auto max-h-96">
                      {JSON.stringify(order, null, 2)}
                    </pre>
                  </Card>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="text-center text-muted-foreground py-12">
                Order not found
              </div>
            </Card>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}



