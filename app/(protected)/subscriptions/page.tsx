"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getSubscription, type AdminSubscriptionDetails } from "@/lib/subscriptions-api";
import { SubscriptionUpdateDialog } from "@/components/subscription-update-dialog";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Hash, ArrowLeft, Plus, ArrowUp } from "lucide-react";

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<AdminSubscriptionDetails | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateType, setUpdateType] = useState<"addon" | "upgrade">("addon");

  // Auto-search if subscriptionId is provided in query params
  useEffect(() => {
    const subscriptionId = searchParams.get("subscriptionId");
    if (subscriptionId && !subscription && !loading && query === "") {
      setQuery(subscriptionId);
      performSearch(subscriptionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (searchValue: string) => {
    if (!searchValue.trim()) {
      toast.error("Please enter a subscription ID");
      return;
    }

    setLoading(true);
    setSubscription(null);
    try {
      const result = await getSubscription(searchValue.trim());
      setSubscription(result);
      toast.success("Subscription found successfully");
      // Update URL without reloading
      router.replace(`/subscriptions?subscriptionId=${encodeURIComponent(searchValue)}`, { scroll: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to get subscription");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    await performSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleUpdateSuccess = async () => {
    // Refresh subscription data after successful update
    if (subscription) {
      try {
        const result = await getSubscription(subscription.id);
        setSubscription(result);
        toast.success("Subscription data refreshed");
      } catch (error: any) {
        toast.error("Failed to refresh subscription data");
      }
    }
  };

  const openAddonDialog = () => {
    setUpdateType("addon");
    setUpdateDialogOpen(true);
  };

  const openUpgradeDialog = () => {
    setUpdateType("upgrade");
    setUpdateDialogOpen(true);
  };

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
            <h1 className="text-2xl font-semibold mb-6">Subscription Search</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Search Subscription</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search"
                    placeholder="Enter subscription document ID"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {subscription && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    {subscription.name || "Subscription"}
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={openAddonDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add On Pack
                    </Button>
                    <Button onClick={openUpgradeDialog}>
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3">Basic Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">Document ID:</span>
                        <span className="font-mono text-xs">{subscription.id}</span>
                      </div>
                      {subscription.packageId && (
                        <div>
                          <span className="font-medium">Package ID: </span>
                          <span className="font-mono text-xs">{subscription.packageId}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Type: </span>
                        <Badge variant="outline">{subscription.type}</Badge>
                      </div>
                      {subscription.userId && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">User ID:</span>
                          <button
                            onClick={() => router.push(`/users?userId=${encodeURIComponent(subscription.userId!)}`)}
                            className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                          >
                            {subscription.userId}
                          </button>
                        </div>
                      )}
                      {subscription.whitelabelId && (
                        <div>
                          <span className="font-medium">Whitelabel ID: </span>
                          <span className="font-mono text-xs">{subscription.whitelabelId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Dates</h3>
                    <div className="space-y-2 text-sm">
                      {subscription.createdAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Created:</span>
                          <span>{formatDate(subscription.createdAt)}</span>
                        </div>
                      )}
                      {subscription.expiresAt && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">Expires:</span>
                          <span>{formatDate(subscription.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Photo Statistics</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    {subscription.maxPhotosLimit !== undefined && (
                      <div>
                        <div className="font-medium">Max Limit</div>
                        <div className="text-2xl font-bold">{subscription.maxPhotosLimit.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.currentPhotosCount !== undefined && (
                      <div>
                        <div className="font-medium">Current</div>
                        <div className="text-2xl font-bold">{subscription.currentPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.uploadedPhotosCount !== undefined && (
                      <div>
                        <div className="font-medium">Uploaded</div>
                        <div className="text-2xl font-bold">{subscription.uploadedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.deletedPhotosCount !== undefined && (
                      <div>
                        <div className="font-medium">Deleted</div>
                        <div className="text-2xl font-bold">{subscription.deletedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                </div>

                {(subscription.currentEvents !== undefined || subscription.createdEvents !== undefined) && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-3">Event Statistics</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {subscription.currentEvents !== undefined && (
                        <div>
                          <div className="font-medium">Current Events</div>
                          <div className="text-2xl font-bold">{subscription.currentEvents}</div>
                        </div>
                      )}
                      {subscription.createdEvents !== undefined && (
                        <div>
                          <div className="font-medium">Total Created</div>
                          <div className="text-2xl font-bold">{subscription.createdEvents}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(subscription.guestPhotosLimit !== undefined || subscription.guestPhotosCount !== undefined) && (
                  <div>
                    <h3 className="font-semibold mb-3">Guest Photos</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {subscription.guestPhotosLimit !== undefined && (
                        <div>
                          <div className="font-medium">Limit</div>
                          <div className="text-2xl font-bold">{subscription.guestPhotosLimit.toLocaleString()}</div>
                        </div>
                      )}
                      {subscription.guestPhotosCount !== undefined && (
                        <div>
                          <div className="font-medium">Count</div>
                          <div className="text-2xl font-bold">{subscription.guestPhotosCount.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>

              {/* Update Dialog */}
              <SubscriptionUpdateDialog
                subscription={subscription}
                updateType={updateType}
                open={updateDialogOpen}
                onOpenChange={setUpdateDialogOpen}
                onSuccess={handleUpdateSuccess}
              />
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
