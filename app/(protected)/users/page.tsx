"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getUser, getUserWallet, type AdminUserDetails, type AdminUserWalletBalance } from "@/lib/users-api";
import { getWhitelabel } from "@/lib/whitelabels-api";
import { UserEditDialog } from "@/components/user-edit-dialog";
import { WalletUpdateDialog } from "@/components/wallet-update-dialog";
import { UserRestoreDialog } from "@/components/user-restore-dialog";
import { RawJsonViewer } from "@/components/raw-json-viewer";
import { CreateSubscriptionDialog } from "@/components/create-subscription-dialog";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Mail, Phone, ArrowLeft, LogIn, Wallet, Pencil, RotateCcw, CreditCard } from "lucide-react";
import { generateLoginAsUserUrl } from "@/lib/utils";

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<AdminUserDetails | null>(null);
  const [walletBalance, setWalletBalance] = useState<AdminUserWalletBalance | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [createSubscriptionDialogOpen, setCreateSubscriptionDialogOpen] = useState(false);
  const [whitelabelSubscriptionId, setWhitelabelSubscriptionId] = useState<string | null>(null);

  // Auto-search if userId is provided in query params
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && !user && !loading && query === "") {
      setQuery(userId);
      // Perform search
      const performSearch = async () => {
        setLoading(true);
        setUser(null);
        setWhitelabelSubscriptionId(null);
        try {
          const result = await getUser(userId);
          setUser(result);
          toast.success("User found successfully");
          // Fetch wallet balance
          fetchWalletBalance(result.userId);
          // For whitelabel users, fetch whitelabel's subscription
          if (result.whitelabelId && result.whitelabelId !== "whitelabel-0") {
            fetchWhitelabelSubscription(result.whitelabelId);
          }
        } catch (error: any) {
          toast.error(error.message || "Failed to get user");
          setUser(null);
          setWalletBalance(null);
          setWhitelabelSubscriptionId(null);
        } finally {
          setLoading(false);
        }
      };
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = async (searchQuery?: string) => {
    const searchValue = searchQuery || query.trim();
    if (!searchValue) {
      toast.error("Please enter a user ID, email, or mobile number");
      return;
    }

    setLoading(true);
    setUser(null);
    setWhitelabelSubscriptionId(null);
    try {
      const result = await getUser(searchValue);
      setUser(result);
      toast.success("User found successfully");
      // Update URL without reloading
      router.replace(`/users?userId=${encodeURIComponent(searchValue)}`, { scroll: false });
      // Fetch wallet balance
      fetchWalletBalance(result.userId);
      // For whitelabel users, fetch whitelabel's subscription
      if (result.whitelabelId && result.whitelabelId !== "whitelabel-0") {
        fetchWhitelabelSubscription(result.whitelabelId);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to get user");
      setUser(null);
      setWalletBalance(null);
      setWhitelabelSubscriptionId(null);
    } finally {
      setLoading(false);
    }
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

  const fetchWalletBalance = async (userId: string) => {
    setWalletLoading(true);
    try {
      const wallet = await getUserWallet(userId);
      setWalletBalance(wallet);
    } catch (error: any) {
      // Silently fail - wallet might not exist for all users
      console.error("Failed to fetch wallet balance:", error);
      setWalletBalance(null);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchWhitelabelSubscription = async (whitelabelId: string) => {
    try {
      const whitelabel = await getWhitelabel(whitelabelId);
      setWhitelabelSubscriptionId(whitelabel.subscriptionId || null);
    } catch (error: any) {
      console.error("Failed to fetch whitelabel subscription:", error);
      setWhitelabelSubscriptionId(null);
    }
  };

  const handleEditSuccess = async () => {
    // Refresh user data after successful edit
    if (user) {
      try {
        const result = await getUser(user.id);
        setUser(result);
        // Also refresh whitelabel subscription if applicable
        if (result.whitelabelId && result.whitelabelId !== "whitelabel-0") {
          fetchWhitelabelSubscription(result.whitelabelId);
        }
        toast.success("User data refreshed");
      } catch (error: any) {
        toast.error("Failed to refresh user data");
      }
    }
  };

  // Helper to check if user/whitelabel has a subscription
  const hasSubscription = () => {
    if (!user) return true; // Don't show button if no user
    // For Kamero users, check user's subscriptionId
    if (!user.whitelabelId || user.whitelabelId === "whitelabel-0") {
      return !!user.subscriptionId;
    }
    // For whitelabel users, check whitelabel's subscriptionId
    return !!whitelabelSubscriptionId;
  };

  // Helper to get the effective subscription ID to display
  const getEffectiveSubscriptionId = () => {
    if (!user) return null;
    // For Kamero users, return user's subscriptionId
    if (!user.whitelabelId || user.whitelabelId === "whitelabel-0") {
      return user.subscriptionId;
    }
    // For whitelabel users, return whitelabel's subscriptionId
    return whitelabelSubscriptionId;
  };

  const handleWalletSuccess = async () => {
    // Refresh wallet data after successful update
    if (user) {
      fetchWalletBalance(user.userId);
      toast.success("Wallet data refreshed");
    }
  };

  const handleRestoreSuccess = async () => {
    // Refresh user data after successful restore
    if (user) {
      try {
        const result = await getUser(user.id);
        setUser(result);
        toast.success("User data refreshed");
      } catch (error: any) {
        toast.error("Failed to refresh user data");
      }
    }
  };

  const getPhoneVerificationBadgeVariant = (status?: string) => {
    switch (status) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "unavailable":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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
                onClick={() => {
                  const from = searchParams.get("from");
                  if (from === "recent-signups") {
                    router.push("/recent-signups");
                  } else {
                    router.push("/");
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold whitespace-nowrap">Users</h1>
              <div className="flex gap-2 flex-1">
                <Input
                  id="search-mobile"
                  placeholder="User ID, email, or mobile"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={() => handleSearch()} disabled={loading}>
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
                  onClick={() => {
                    const from = searchParams.get("from");
                    if (from === "recent-signups") {
                      router.push("/recent-signups");
                    } else {
                      router.push("/");
                    }
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold whitespace-nowrap">User Search</h1>
                <div className="flex gap-2 flex-1">
                  <Input
                    id="search-desktop"
                    placeholder="Enter user ID, email, or mobile number"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button onClick={() => handleSearch()} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {user && (
            <div className="space-y-6">
              {/* Mobile: Direct content cards */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold">
                        {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                      </h2>
                      {user.isAccountSelfDeleted && (
                        <Badge variant="destructive">Account Deleted</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.isAccountSelfDeleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRestoreDialogOpen(true)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {user.email && !user.isAccountSelfDeleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              const loginUrl = generateLoginAsUserUrl(user.email!);
                              window.open(loginUrl, '_blank', 'noopener,noreferrer');
                              toast.success(
                                <div className="space-y-2">
                                  <div>Opening login page in new tab</div>
                                  <div className="text-xs font-mono break-all bg-muted p-2 rounded mt-2">
                                    {loginUrl}
                                  </div>
                                </div>,
                                { duration: 10000 }
                              );
                            } catch (error: any) {
                              toast.error(error.message || "Failed to generate login URL");
                            }
                          }}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">User ID:</span>
                      <span className="font-mono text-xs">{user.userId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">Document ID:</span>
                      <span className="font-mono text-xs">{user.id}</span>
                    </div>
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="font-medium">Email:</span>
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="font-medium">Phone:</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Profile Information</h3>
                  <div className="space-y-2 text-sm">
                    {user.userType && (
                      <div>
                        <span className="font-medium">User Type: </span>
                        <Badge variant="outline">{user.userType}</Badge>
                      </div>
                    )}
                    {user.country && (
                      <div>
                        <span className="font-medium">Country: </span>
                        <span>{user.country}</span>
                      </div>
                    )}
                    {user.city && (
                      <div>
                        <span className="font-medium">City: </span>
                        <span>{user.city}</span>
                      </div>
                    )}
                    {user.whitelabelId && (
                      <div>
                        <span className="font-medium">Whitelabel ID: </span>
                        <span className="font-mono text-xs">{user.whitelabelId}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Phone Verification</h3>
                  <div className="space-y-2 text-sm">
                    {user.phoneVerificationStatus && (
                      <div>
                        <span className="font-medium">Status: </span>
                        <Badge variant={getPhoneVerificationBadgeVariant(user.phoneVerificationStatus)}>
                          {user.phoneVerificationStatus}
                        </Badge>
                      </div>
                    )}
                    {user.whatsappOtpVerified !== undefined && (
                      <div>
                        <span className="font-medium">WhatsApp OTP Verified: </span>
                        <Badge variant={user.whatsappOtpVerified ? "default" : "secondary"}>
                          {user.whatsappOtpVerified ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                    {user.whatsappAvailable !== undefined && (
                      <div>
                        <span className="font-medium">WhatsApp Available: </span>
                        <Badge variant={user.whatsappAvailable ? "default" : "secondary"}>
                          {user.whatsappAvailable ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                    {user.otpAttemptCount !== undefined && (
                      <div>
                        <span className="font-medium">OTP Attempts: </span>
                        <span>{user.otpAttemptCount}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    {user.isAccountSelfDeleted && (
                      <div>
                        <span className="font-medium">Account Status: </span>
                        <Badge variant="destructive">Deleted</Badge>
                        {user.accountSelfDeletedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Deleted at: {formatDate(user.accountSelfDeletedAt)}
                          </div>
                        )}
                      </div>
                    )}
                    {user.isEndUser !== undefined && (
                      <div>
                        <span className="font-medium">Is End User: </span>
                        <Badge variant={user.isEndUser ? "default" : "secondary"}>
                          {user.isEndUser ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                    {getEffectiveSubscriptionId() ? (
                      <div>
                        <span className="font-medium">Subscription ID: </span>
                        <button
                          onClick={() => router.push(`/subscriptions?subscriptionId=${encodeURIComponent(getEffectiveSubscriptionId()!)}`)}
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                          {getEffectiveSubscriptionId()}
                        </button>
                        {user.whitelabelId && user.whitelabelId !== "whitelabel-0" && (
                          <span className="text-xs text-muted-foreground ml-1">(Whitelabel)</span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">Subscription: </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCreateSubscriptionDialogOpen(true)}
                          className="ml-2"
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Create {user.whitelabelId && user.whitelabelId !== "whitelabel-0" ? "(for Whitelabel)" : ""}
                        </Button>
                      </div>
                    )}
                    {user.lastAccessedAt && (
                      <div>
                        <span className="font-medium">Last Accessed: </span>
                        <span>{formatDate(user.lastAccessedAt)}</span>
                      </div>
                    )}
                    {user.activeAsEndUser && (
                      <div>
                        <span className="font-medium">Active as End User: </span>
                        <span>{formatDate(user.activeAsEndUser)}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Wallet Balance</h3>
                    {walletBalance && (
                      <Button size="sm" variant="outline" onClick={() => setWalletDialogOpen(true)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    {walletLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading wallet balance...</span>
                      </div>
                    ) : walletBalance ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span className="font-medium">Balance: </span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(walletBalance.balanceInRupees || walletBalance.balance / 100)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Balance in Paise: </span>
                          <span className="font-mono">{walletBalance.balance.toLocaleString()}</span>
                        </div>
                        {walletBalance.whitelabelId && (
                          <div>
                            <span className="font-medium">Whitelabel ID: </span>
                            <span className="font-mono text-xs">{walletBalance.whitelabelId}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No wallet information available</p>
                    )}
                  </div>
                </Card>

                {user.authMethods && user.authMethods.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Authentication Methods</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.authMethods.map((method, idx) => (
                        <Badge key={idx} variant="outline">{method}</Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {(user.freeEnhancementsUsed !== undefined || user.freeEnhancementsLimit !== undefined) && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">AI Enhancements</h3>
                    <div className="space-y-2 text-sm">
                      {user.freeEnhancementsUsed !== undefined && (
                        <div>
                          <span className="font-medium">Used: </span>
                          <span>{user.freeEnhancementsUsed}</span>
                        </div>
                      )}
                      {user.freeEnhancementsLimit !== undefined && (
                        <div>
                          <span className="font-medium">Limit: </span>
                          <span>{user.freeEnhancementsLimit}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* Desktop: With card wrapper */}
              <div className="hidden md:block">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">
                        {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                      </h2>
                      {user.isAccountSelfDeleted && (
                        <Badge variant="destructive">Deleted</Badge>
                      )}
                      {user.userType && <Badge variant="outline">{user.userType}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {user.isAccountSelfDeleted && (
                        <Button size="sm" variant="outline" onClick={() => setRestoreDialogOpen(true)}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restore
                        </Button>
                      )}
                      {user.email && !user.isAccountSelfDeleted && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const loginUrl = generateLoginAsUserUrl(user.email!);
                            window.open(loginUrl, '_blank', 'noopener,noreferrer');
                            toast.success("Opening login page");
                          }}
                        >
                          <LogIn className="h-4 w-4 mr-1" />
                          Login As
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-6">
                    {/* Column 1: IDs & Contact */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">User ID</span>
                        <span className="font-mono text-xs">{user.userId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Doc ID</span>
                        <span className="font-mono text-xs">{user.id}</span>
                      </div>
                      {user.email && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Email</span>
                          <span>{user.email}</span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Phone</span>
                          <span>{user.phone}</span>
                        </div>
                      )}
                      {user.whitelabelId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Whitelabel</span>
                          <span className="font-mono text-xs">{user.whitelabelId}</span>
                        </div>
                      )}
                      {getEffectiveSubscriptionId() ? (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Subscription{user.whitelabelId && user.whitelabelId !== "whitelabel-0" ? " (WL)" : ""}</span>
                          <button
                            onClick={() => router.push(`/subscriptions?subscriptionId=${encodeURIComponent(getEffectiveSubscriptionId()!)}`)}
                            className="font-mono text-xs text-blue-500 hover:underline"
                          >
                            {getEffectiveSubscriptionId()!.slice(0, 8)}...
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Subscription</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2"
                            onClick={() => setCreateSubscriptionDialogOpen(true)}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            Create{user.whitelabelId && user.whitelabelId !== "whitelabel-0" ? " (WL)" : ""}
                          </Button>
                        </div>
                      )}
                      {user.createdAt && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Created</span>
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Verification & Status */}
                    <div className="space-y-2 text-sm">
                      {user.phoneVerificationStatus && (
                        <div className="flex justify-between items-center py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Phone Status</span>
                          <Badge variant={getPhoneVerificationBadgeVariant(user.phoneVerificationStatus)} className="text-xs">
                            {user.phoneVerificationStatus}
                          </Badge>
                        </div>
                      )}
                      {user.whatsappOtpVerified !== undefined && (
                        <div className="flex justify-between items-center py-1 border-b border-border/40">
                          <span className="text-muted-foreground">WhatsApp OTP</span>
                          <Badge variant={user.whatsappOtpVerified ? "default" : "secondary"} className="text-xs">
                            {user.whatsappOtpVerified ? "Verified" : "No"}
                          </Badge>
                        </div>
                      )}
                      {user.isEndUser !== undefined && (
                        <div className="flex justify-between items-center py-1 border-b border-border/40">
                          <span className="text-muted-foreground">End User</span>
                          <Badge variant={user.isEndUser ? "default" : "secondary"} className="text-xs">
                            {user.isEndUser ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                      {user.lastAccessedAt && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Last Access</span>
                          <span>{formatDate(user.lastAccessedAt)}</span>
                        </div>
                      )}
                      {user.authMethods && user.authMethods.length > 0 && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground">Auth</span>
                          <div className="flex gap-1">
                            {user.authMethods.map((m, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Wallet & Stats */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Wallet</span>
                        {walletLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : walletBalance ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-600">
                              {formatCurrency(walletBalance.balanceInRupees || walletBalance.balance / 100)}
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => setWalletDialogOpen(true)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </div>
                      {(user.freeEnhancementsUsed !== undefined || user.freeEnhancementsLimit !== undefined) && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">AI Enhance</span>
                          <span>{user.freeEnhancementsUsed ?? 0} / {user.freeEnhancementsLimit ?? 0}</span>
                        </div>
                      )}
                      {user.country && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Country</span>
                          <span>{user.country}</span>
                        </div>
                      )}
                      {user.city && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">City</span>
                          <span>{user.city}</span>
                        </div>
                      )}
                      {user.defaultSelfieId && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Selfie ID</span>
                          <span className="font-mono text-xs">{user.defaultSelfieId.slice(0, 8)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Raw JSON Document */}
          {user && (
            <RawJsonViewer data={user} title="Raw User JSON" />
          )}

          {/* Edit Dialogs */}
          {user && (
            <UserEditDialog
              user={user}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSuccess={handleEditSuccess}
            />
          )}
          {user && walletBalance && (
            <WalletUpdateDialog
              targetId={user.userId}
              targetType="user"
              currentBalance={walletBalance.balance}
              open={walletDialogOpen}
              onOpenChange={setWalletDialogOpen}
              onSuccess={handleWalletSuccess}
            />
          )}
          {user && (
            <UserRestoreDialog
              user={user}
              open={restoreDialogOpen}
              onOpenChange={setRestoreDialogOpen}
              onSuccess={handleRestoreSuccess}
            />
          )}
          {/* Create Subscription Dialog - for users without subscription */}
          {/* For Kamero users (whitelabel-0): create subscription for user */}
          {/* For whitelabel users: create subscription for their whitelabel */}
          {user && !hasSubscription() && (
            <CreateSubscriptionDialog
              targetId={user.whitelabelId && user.whitelabelId !== "whitelabel-0" ? user.whitelabelId : user.userId}
              targetType={user.whitelabelId && user.whitelabelId !== "whitelabel-0" ? "whitelabel" : "user"}
              targetName={user.whitelabelId && user.whitelabelId !== "whitelabel-0" 
                ? `Whitelabel: ${user.whitelabelId}` 
                : (user.name || user.email || user.userId)}
              open={createSubscriptionDialogOpen}
              onOpenChange={setCreateSubscriptionDialogOpen}
              onSuccess={handleEditSuccess}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

