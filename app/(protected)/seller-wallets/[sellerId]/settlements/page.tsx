"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  getSellerSettlements,
  type AdminPaymentSettlement,
} from "@/lib/seller-wallets-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function SellerSettlementsPage() {
  const router = useRouter();
  const params = useParams();
  const sellerId = params.sellerId as string;

  const [settlements, setSettlements] = useState<AdminPaymentSettlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadSettlements = async () => {
    setLoading(true);
    try {
      const response = await getSellerSettlements(sellerId, limit, offset);
      setSettlements(response.settlements);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (error: any) {
      toast.error(error.message || "Failed to load settlements");
      setSettlements([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sellerId) {
      loadSettlements();
    }
  }, [sellerId, limit, offset]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Settlement History</h1>
          <p className="text-muted-foreground">
            Payment settlement history for seller: <span className="font-mono">{sellerId}</span>
          </p>
        </div>

        {/* Settlements Table */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No settlements found for this seller</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Payment Proof</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((settlement) => (
                      <TableRow key={settlement.id}>
                        <TableCell>
                          <div>
                            <div>{formatDate(settlement.createdAt)}</div>
                            {settlement.completedAt && (
                              <div className="text-xs text-muted-foreground">
                                Completed: {formatDate(settlement.completedAt)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(settlement.settlementAmount, settlement.currency)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{settlement.currency}</Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(settlement.status)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{settlement.adminEmail}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {settlement.adminUserId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {settlement.paymentProofUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(settlement.paymentProofUrl, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {settlement.notes ? (
                            <div className="max-w-xs truncate" title={settlement.notes}>
                              {settlement.notes}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} settlements
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


