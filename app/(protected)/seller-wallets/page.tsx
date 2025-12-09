"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  listSellerWallets,
  type AdminSellerWalletItem,
} from "@/lib/seller-wallets-api";
import { SettleBalanceDialog } from "@/components/settle-balance-dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function SellerWalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<AdminSellerWalletItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<"INR" | "USD" | undefined>(undefined);
  const [selectedWallet, setSelectedWallet] = useState<AdminSellerWalletItem | null>(null);
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const response = await listSellerWallets(limit, offset, currencyFilter);
      setWallets(response.wallets);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (error: any) {
      toast.error(error.message || "Failed to load seller wallets");
      setWallets([]);
      setTotal(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallets();
  }, [limit, offset, currencyFilter]);

  const handleSettleClick = (wallet: AdminSellerWalletItem) => {
    setSelectedWallet(wallet);
    setSettleDialogOpen(true);
  };

  const handleSettleSuccess = () => {
    loadWallets(); // Refresh the list
  };

  const formatCurrency = (amount: number, curr: "INR" | "USD") => {
    return new Intl.NumberFormat(curr === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
            onClick={() => router.push("/")}
            className="mb-3 md:mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Seller Wallets</h1>
          <p className="text-muted-foreground">
            Manage payment settlements for seller wallets with balance
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Currency Filter</Label>
              <Select
                value={currencyFilter || "all"}
                onValueChange={(value) => {
                  setCurrencyFilter(value === "all" ? undefined : (value as "INR" | "USD"));
                  setOffset(0); // Reset to first page
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="INR">INR Only</SelectItem>
                  <SelectItem value="USD">USD Only</SelectItem>
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
                Total: {total} wallets
              </div>
            </div>
          </div>
        </Card>

        {/* Wallets Table */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : wallets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No seller wallets found with balance</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>INR Balance</TableHead>
                      <TableHead>USD Balance</TableHead>
                      <TableHead>Total (INR)</TableHead>
                      <TableHead>Wallet Type</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.map((wallet) => (
                      <TableRow key={wallet.sellerId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {wallet.sellerName || "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {wallet.sellerId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {wallet.sellerEmail || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className={wallet.inrBalance > 0 ? "font-semibold" : ""}>
                            {formatCurrency(wallet.inrBalance, "INR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={wallet.usdBalance > 0 ? "font-semibold" : ""}>
                            {formatCurrency(wallet.usdBalance, "USD")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            {formatCurrency(wallet.totalBalanceInr, "INR")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={wallet.walletType === "individual" ? "default" : "secondary"}>
                            {wallet.walletType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/seller-wallets/${wallet.sellerId}/orders`)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Orders
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/seller-wallets/${wallet.sellerId}/settlements`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              History
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSettleClick(wallet)}
                              disabled={wallet.inrBalance === 0 && wallet.usdBalance === 0}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Settle
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} wallets
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

        {/* Settle Balance Dialog */}
        {selectedWallet && (
          <SettleBalanceDialog
            wallet={selectedWallet}
            open={settleDialogOpen}
            onOpenChange={setSettleDialogOpen}
            onSuccess={handleSettleSuccess}
          />
        )}
      </main>
    </div>
  );
}


