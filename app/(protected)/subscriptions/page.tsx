"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getSubscription, type AdminSubscriptionDetails } from "@/lib/subscriptions-api";
import { SubscriptionUpdateDialog } from "@/components/subscription-update-dialog";
import { RawJsonViewer } from "@/components/raw-json-viewer";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Hash, Tag, ArrowLeft, Plus, ArrowUp } from "lucide-react";

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
          {/* Mobile: No outer card wrapper */}
          <div className="md:hidden mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold whitespace-nowrap">Subscriptions</h1>
              <div className="flex gap-2 flex-1">
                <Input
                  id="search-mobile"
                  placeholder="Subscription ID"
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

          {/* Desktop: With card wrapper */}
          <div className="hidden md:block">
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold whitespace-nowrap">Subscription Search</h1>
                <div className="flex gap-2 flex-1">
                  <Input
                    id="search-desktop"
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
            </Card>
          </div>

          {subscription && (
            <div className="space-y-6">
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <h2 className="text-xl font-semibold truncate">{subscription.name || "Subscription"}</h2>
                      <Badge variant="default">{subscription.type}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <Button variant="outline" size="sm" onClick={openAddonDialog} className="flex-1">
                      <Plus className="h-4 w-4 mr-1" />
                      Add On
                    </Button>
                    <Button size="sm" onClick={openUpgradeDialog} className="flex-1">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Doc ID:</span>
                      <span className="font-mono text-xs truncate">{subscription.id}</span>
                    </div>
                    {subscription.packageId && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        <span className="font-medium">Package:</span>
                        <span className="font-mono text-xs">{subscription.packageId}</span>
                      </div>
                    )}
                    {subscription.userId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">User ID:</span>
                        <button
                          onClick={() => router.push(`/users?userId=${encodeURIComponent(subscription.userId!)}`)}
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          {subscription.userId}
                        </button>
                      </div>
                    )}
                    {subscription.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(subscription.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Photo Statistics</h3>
                  <div className="space-y-2 text-sm">
                    {subscription.maxPhotosLimit !== undefined && (
                      <div>
                        <span className="font-medium">Max Photos: </span>
                        <span className="font-bold text-primary">{subscription.maxPhotosLimit.toLocaleString()}</span>
                      </div>
                    )}
                    {subscription.currentPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Current: </span>
                        <span className="font-bold text-blue-600">{subscription.currentPhotosCount.toLocaleString()}</span>
                      </div>
                    )}
                    {subscription.uploadedPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Uploaded: </span>
                        <span className="font-bold text-green-600">{subscription.uploadedPhotosCount.toLocaleString()}</span>
                      </div>
                    )}
                    {subscription.deletedPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Deleted: </span>
                        <span className="font-bold text-red-500">{subscription.deletedPhotosCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Event Statistics</h3>
                  <div className="space-y-2 text-sm">
                    {subscription.currentEvents !== undefined && (
                      <div>
                        <span className="font-medium">Current Events: </span>
                        <span className="font-bold text-purple-600">{subscription.currentEvents}</span>
                      </div>
                    )}
                    {subscription.createdEvents !== undefined && (
                      <div>
                        <span className="font-medium">Total Created: </span>
                        <span>{subscription.createdEvents}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Guest Upload</h3>
                  <div className="space-y-2 text-sm">
                    {subscription.guestPhotosLimit !== undefined && (
                      <div>
                        <span className="font-medium">Limit: </span>
                        <span>{subscription.guestPhotosLimit.toLocaleString()}</span>
                      </div>
                    )}
                    {subscription.guestPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Count: </span>
                        <span>{subscription.guestPhotosCount.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Validity</h3>
                  <div className="space-y-2 text-sm">
                    {subscription.whitelabelId && (
                      <div>
                        <span className="font-medium">Whitelabel: </span>
                        <span className="font-mono text-xs">{subscription.whitelabelId}</span>
                      </div>
                    )}
                    {subscription.expiresAt && (
                      <div>
                        <span className="font-medium">Expires: </span>
                        <span className="font-semibold">{formatDate(subscription.expiresAt)}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">{subscription.name || "Subscription"}</h2>
                      <Badge variant="default">{subscription.type}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={openAddonDialog}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add On
                      </Button>
                      <Button size="sm" onClick={openUpgradeDialog}>
                        <ArrowUp className="h-4 w-4 mr-1" />
                        Upgrade
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-5 gap-4 mb-5 p-4 bg-muted/30 rounded-lg">
                    {subscription.maxPhotosLimit !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Max Photos</div>
                        <div className="text-xl font-bold text-primary">{subscription.maxPhotosLimit.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.currentPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Current</div>
                        <div className="text-xl font-bold text-blue-600">{subscription.currentPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.currentEvents !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Events</div>
                        <div className="text-xl font-bold text-purple-600">{subscription.currentEvents}</div>
                      </div>
                    )}
                    {subscription.uploadedPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Uploaded</div>
                        <div className="text-xl font-bold text-green-600">{subscription.uploadedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {subscription.deletedPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Deleted</div>
                        <div className="text-xl font-bold text-red-500">{subscription.deletedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Doc ID</span>
                        <span className="font-mono text-xs">{subscription.id}</span>
                      </div>
                      {subscription.packageId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Package</span>
                          <span className="font-mono text-xs">{subscription.packageId}</span>
                        </div>
                      )}
                      {subscription.userId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">User ID</span>
                          <button
                            onClick={() => router.push(`/users?userId=${encodeURIComponent(subscription.userId!)}`)}
                            className="font-mono text-xs text-blue-500 hover:underline"
                          >
                            {subscription.userId}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {subscription.whitelabelId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Whitelabel</span>
                          <span className="font-mono text-xs">{subscription.whitelabelId}</span>
                        </div>
                      )}
                      {subscription.createdAt && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Created</span>
                          <span>{formatDate(subscription.createdAt)}</span>
                        </div>
                      )}
                      {subscription.expiresAt && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Expires</span>
                          <span className="font-semibold">{formatDate(subscription.expiresAt)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {subscription.createdEvents !== undefined && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Total Events</span>
                          <span>{subscription.createdEvents}</span>
                        </div>
                      )}
                      {subscription.guestPhotosLimit !== undefined && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Guest Limit</span>
                          <span>{subscription.guestPhotosLimit.toLocaleString()}</span>
                        </div>
                      )}
                      {subscription.guestPhotosCount !== undefined && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Guest Count</span>
                          <span>{subscription.guestPhotosCount.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Raw JSON Document */}
              <RawJsonViewer data={subscription} title="Raw Subscription JSON" />

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
