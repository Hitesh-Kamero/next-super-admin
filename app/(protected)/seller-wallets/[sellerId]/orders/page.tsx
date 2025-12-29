"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getSellerOrders,
  type AdminSellerOrderItem,
} from "@/lib/seller-wallets-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

export default function SellerOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.sellerId as string;

  const [orders, setOrders] = useState<AdminSellerOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stateFilter, setStateFilter] = useState<string>("all");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const state = stateFilter === "all" ? undefined : stateFilter as any;
      const response = await getSellerOrders(sellerId, limit, offset, state);
      setOrders(response.orders);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (error: any) {
      toast.error(error.message || "Failed to load orders");
      setOrders([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      loadOrders();
    }
  }, [sellerId, limit, offset, stateFilter]);

  const formatCurrency = (amount: number, curr: "INR" | "USD") => {
    return new Intl.NumberFormat(curr === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "payment_initiated":
        return <Badge variant="outline">Payment Initiated</Badge>;
      case "payment_processing":
        return <Badge variant="outline">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Order ID", "Date", "Buyer Name", "Buyer Email", "Amount", "Currency", "State", "Payment Provider"];
    const rows = orders.map(order => [
      order.id,
      formatDate(order.createdAt),
      order.buyerName || "N/A",
      order.buyerEmail || "N/A",
      order.totalAmount.toString(),
      order.currency,
      order.state,
      order.paymentProvider || "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seller-orders-${sellerId}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("CSV exported successfully");
  };

  const handlePreviousPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <main className="container mx-auto flex-1 px-4 py-8">
        {/* Back button */}
        <div className="mb-4 md:mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/seller-wallets")}
            className="mb-3 md:mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Seller Wallets
          </Button>
        </div>

        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Seller Orders (MIS)</h1>
            <p className="text-muted-foreground">
              All orders for seller: <span className="font-mono">{sellerId}</span>
            </p>
          </div>
          {orders.length > 0 && (
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Order State Filter</Label>
              <Select
                value={stateFilter}
                onValueChange={(value) => {
                  setStateFilter(value);
                  setOffset(0); // Reset to first page
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="payment_initiated">Payment Initiated</SelectItem>
                  <SelectItem value="payment_processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Results per page</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => {
                  setLimit(parseInt(value));
                  setOffset(0); // Reset to first page
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Total: {total} orders
              </div>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found for this seller</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Buyer Email</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Payment Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <span className="font-mono text-xs">{order.id}</span>
                        </TableCell>
                        <TableCell>
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          {order.buyerName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {order.buyerEmail || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(order.totalAmount, order.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.currency}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStateBadge(order.state)}
                        </TableCell>
                        <TableCell>
                          {order.paymentProvider || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} orders
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={offset === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!hasMore || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}





























