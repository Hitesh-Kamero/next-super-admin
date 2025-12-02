"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  listWhitelabels,
  getWhitelabel,
  type AdminWhitelabelSummary,
  type AdminWhitelabelDetails,
} from "@/lib/whitelabels-api";
import { WalletUpdateDialog } from "@/components/wallet-update-dialog";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Calendar,
  User,
  Hash,
  ArrowLeft,
  Wallet,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react";

export default function WhitelabelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [whitelabel, setWhitelabel] = useState<AdminWhitelabelDetails | null>(null);

  // List state
  const [whitelabels, setWhitelabels] = useState<AdminWhitelabelSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Wallet dialog state
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);

  // Auto-search if whitelabelId is provided in query params
  useEffect(() => {
    const whitelabelId = searchParams.get("whitelabelId");
    if (whitelabelId && !whitelabel && !searchLoading && searchQuery === "") {
      setSearchQuery(whitelabelId);
      performSearch(whitelabelId);
    } else if (!whitelabelId) {
      // Load list on initial page load
      loadWhitelabels(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadWhitelabels = async (page: number) => {
    setListLoading(true);
    try {
      const result = await listWhitelabels(pageSize, page * pageSize);
      setWhitelabels(result.whitelabels);
      setTotalCount(result.totalCount);
      setCurrentPage(page);
    } catch (error: any) {
      toast.error(error.message || "Failed to load whitelabels");
    } finally {
      setListLoading(false);
    }
  };

  const performSearch = async (searchValue: string) => {
    if (!searchValue.trim()) {
      toast.error("Please enter a whitelabel ID");
      return;
    }

    setSearchLoading(true);
    setWhitelabel(null);
    try {
      const result = await getWhitelabel(searchValue.trim());
      setWhitelabel(result);
      toast.success("Whitelabel found successfully");
      router.replace(`/whitelabels?whitelabelId=${encodeURIComponent(searchValue)}`, { scroll: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to get whitelabel");
      setWhitelabel(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async () => {
    await performSearch(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setWhitelabel(null);
    router.replace("/whitelabels", { scroll: false });
    loadWhitelabels(0);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "N/A";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleWalletSuccess = async () => {
    if (whitelabel) {
      try {
        const result = await getWhitelabel(whitelabel.id);
        setWhitelabel(result);
        toast.success("Whitelabel data refreshed");
      } catch (error: any) {
        toast.error("Failed to refresh whitelabel data");
      }
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AuthGuard>
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

          {/* Search Section */}
          <Card className="p-6 mb-6">
            <h1 className="text-2xl font-semibold mb-6">Whitelabel Search</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search by Whitelabel ID</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search"
                    placeholder="Enter whitelabel ID (e.g., whitelabel-123)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={searchLoading}>
                    {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                  {whitelabel && (
                    <Button variant="outline" onClick={clearSearch}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Search Result - Whitelabel Details */}
          {whitelabel && (
            <Card className="p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  {whitelabel.name || whitelabel.id}
                </h2>
                <Button variant="outline" onClick={() => setWalletDialogOpen(true)}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Update Balance
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Whitelabel ID:</span>
                      <span className="font-mono text-xs">{whitelabel.id}</span>
                    </div>
                    {whitelabel.name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Company Name:</span>
                        <span>{whitelabel.name}</span>
                      </div>
                    )}
                    {whitelabel.appName && (
                      <div>
                        <span className="font-medium">App Name: </span>
                        <span>{whitelabel.appName}</span>
                      </div>
                    )}
                    {whitelabel.ownerId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Owner ID:</span>
                        <button
                          onClick={() => router.push(`/users?userId=${encodeURIComponent(whitelabel.ownerId!)}`) }
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                          {whitelabel.ownerId}
                        </button>
                      </div>
                    )}
                    {whitelabel.subscriptionId && (
                      <div>
                        <span className="font-medium">Subscription ID: </span>
                        <button
                          onClick={() => router.push(`/subscriptions?subscriptionId=${encodeURIComponent(whitelabel.subscriptionId!)}`) }
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                          {whitelabel.subscriptionId}
                        </button>
                      </div>
                    )}
                    {whitelabel.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(whitelabel.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Wallet</h3>
                  <div className="space-y-2 text-sm">
                    {whitelabel.wallet ? (
                      <>
                        <div>
                          <span className="font-medium">Balance (Paise): </span>
                          <span className="font-mono">{whitelabel.wallet.balance.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Balance (Rupees): </span>
                          <span className="text-2xl font-bold">
                            {formatCurrency(whitelabel.wallet.balanceInRupees)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground">No wallet found</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Wallet Update Dialog */}
              <WalletUpdateDialog
                targetId={whitelabel.id}
                targetType="whitelabel"
                currentBalance={whitelabel.wallet?.balance || 0}
                open={walletDialogOpen}
                onOpenChange={setWalletDialogOpen}
                onSuccess={handleWalletSuccess}
              />
            </Card>
          )}

          {/* Whitelabels List */}
          {!whitelabel && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">All Whitelabels</h2>
                <span className="text-sm text-muted-foreground">
                  Total: {totalCount}
                </span>
              </div>

              {listLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {whitelabels.map((wl) => (
                      <div
                        key={wl.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSearchQuery(wl.id);
                          performSearch(wl.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{wl.name || wl.id}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {wl.id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {wl.subscriptionId && (
                            <Badge variant="outline">Has Subscription</Badge>
                          )}
                          {wl.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(wl.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadWhitelabels(currentPage - 1)}
                        disabled={currentPage === 0 || listLoading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadWhitelabels(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1 || listLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
