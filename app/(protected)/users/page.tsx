"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getUser, getUserWallet, type AdminUserDetails, type AdminUserWalletBalance } from "@/lib/users-api";
import { UserEditDialog } from "@/components/user-edit-dialog";
import { WalletUpdateDialog } from "@/components/wallet-update-dialog";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Mail, Phone, ArrowLeft, LogIn, Wallet, Pencil } from "lucide-react";
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

  // Auto-search if userId is provided in query params
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId && !user && !loading && query === "") {
      setQuery(userId);
      // Perform search
      const performSearch = async () => {
        setLoading(true);
        setUser(null);
        try {
          const result = await getUser(userId);
          setUser(result);
          toast.success("User found successfully");
          // Fetch wallet balance
          fetchWalletBalance(result.userId);
        } catch (error: any) {
          toast.error(error.message || "Failed to get user");
          setUser(null);
          setWalletBalance(null);
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
    try {
      const result = await getUser(searchValue);
      setUser(result);
      toast.success("User found successfully");
      // Update URL without reloading
      router.replace(`/users?userId=${encodeURIComponent(searchValue)}`, { scroll: false });
      // Fetch wallet balance
      fetchWalletBalance(result.userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to get user");
      setUser(null);
      setWalletBalance(null);
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

  const handleEditSuccess = async () => {
    // Refresh user data after successful edit
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

  const handleWalletSuccess = async () => {
    // Refresh wallet data after successful update
    if (user) {
      fetchWalletBalance(user.userId);
      toast.success("Wallet data refreshed");
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

          {/* Mobile: No outer card wrapper */}
          <div className="md:hidden mb-6">
            <h1 className="text-2xl font-semibold mb-6">User Search</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-mobile">Search User</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search-mobile"
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
            </div>
          </div>

          {/* Desktop: With card wrapper */}
          <div className="hidden md:block">
            <Card className="p-6 mb-6">
              <h1 className="text-2xl font-semibold mb-6">User Search</h1>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-desktop">Search User</Label>
                  <div className="flex gap-2 mt-2">
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
              </div>
            </Card>
          </div>

          {user && (
            <div className="space-y-6">
              {/* Mobile: Direct content cards */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                    </h2>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {user.email && (
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
                    {user.isEndUser !== undefined && (
                      <div>
                        <span className="font-medium">Is End User: </span>
                        <Badge variant={user.isEndUser ? "default" : "secondary"}>
                          {user.isEndUser ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                    {user.subscriptionId && (
                      <div>
                        <span className="font-medium">Subscription ID: </span>
                        <span className="font-mono text-xs">{user.subscriptionId}</span>
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold">
                      {user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User"}
                    </h2>
                    <div className="flex gap-2">
                      <Button onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit User
                      </Button>
                      {user.email && (
                        <Button
                          variant="outline"
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
                          <LogIn className="h-4 w-4 mr-2" />
                          Login as User
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">User ID: </span><span className="font-mono text-xs">{user.userId}</span></div>
                        <div><span className="font-medium">Document ID: </span><span className="font-mono text-xs">{user.id}</span></div>
                        {user.email && <div><span className="font-medium">Email: </span><span>{user.email}</span></div>}
                        {user.phone && <div><span className="font-medium">Phone: </span><span>{user.phone}</span></div>}
                        {user.createdAt && <div><span className="font-medium">Created: </span><span>{formatDate(user.createdAt)}</span></div>}
                        {user.whitelabelId && <div><span className="font-medium">Whitelabel ID: </span><span className="font-mono text-xs">{user.whitelabelId}</span></div>}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Profile Information</h3>
                      <div className="space-y-2 text-sm">
                        {user.userType && (
                          <div>
                            <span className="font-medium">User Type: </span>
                            <Badge variant="outline">{user.userType}</Badge>
                          </div>
                        )}
                        {user.country && <div><span className="font-medium">Country: </span><span>{user.country}</span></div>}
                        {user.city && <div><span className="font-medium">City: </span><span>{user.city}</span></div>}
                        {user.firstName && <div><span className="font-medium">First Name: </span><span>{user.firstName}</span></div>}
                        {user.lastName && <div><span className="font-medium">Last Name: </span><span>{user.lastName}</span></div>}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
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
                          <div><span className="font-medium">OTP Attempts: </span><span>{user.otpAttemptCount}</span></div>
                        )}
                        {user.lastOtpAttempt && (
                          <div><span className="font-medium">Last OTP Attempt: </span><span>{formatDate(user.lastOtpAttempt)}</span></div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Account Information</h3>
                      <div className="space-y-2 text-sm">
                        {user.isEndUser !== undefined && (
                          <div>
                            <span className="font-medium">Is End User: </span>
                            <Badge variant={user.isEndUser ? "default" : "secondary"}>
                              {user.isEndUser ? "Yes" : "No"}
                            </Badge>
                          </div>
                        )}
                        {user.subscriptionId && (
                          <div><span className="font-medium">Subscription ID: </span><span className="font-mono text-xs">{user.subscriptionId}</span></div>
                        )}
                        {user.lastAccessedAt && (
                          <div><span className="font-medium">Last Accessed: </span><span>{formatDate(user.lastAccessedAt)}</span></div>
                        )}
                        {user.activeAsEndUser && (
                          <div><span className="font-medium">Active as End User: </span><span>{formatDate(user.activeAsEndUser)}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Wallet Balance</h3>
                      {walletBalance && (
                        <Button size="sm" variant="outline" onClick={() => setWalletDialogOpen(true)}>
                          <Pencil className="h-3 w-3 mr-1" />
                          Update Balance
                        </Button>
                      )}
                    </div>
                    {walletLoading ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading wallet balance...</span>
                      </div>
                    ) : walletBalance ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span className="font-medium">Balance: </span>
                          <span className="font-semibold text-xl">
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
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No wallet information available</p>
                    )}
                  </div>

                  {user.authMethods && user.authMethods.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Authentication Methods</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.authMethods.map((method, idx) => (
                          <Badge key={idx} variant="outline">{method}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(user.googleId || user.profilePictureUrl || user.lastGoogleLoginAt) && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Google OAuth</h3>
                      <div className="space-y-2 text-sm">
                        {user.googleId && (
                          <div><span className="font-medium">Google ID: </span><span className="font-mono text-xs">{user.googleId}</span></div>
                        )}
                        {user.profilePictureUrl && (
                          <div>
                            <span className="font-medium">Profile Picture: </span>
                            <a href={user.profilePictureUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              View
                            </a>
                          </div>
                        )}
                        {user.lastGoogleLoginAt && (
                          <div><span className="font-medium">Last Google Login: </span><span>{formatDate(user.lastGoogleLoginAt)}</span></div>
                        )}
                      </div>
                    </div>
                  )}

                  {(user.freeEnhancementsUsed !== undefined || user.freeEnhancementsLimit !== undefined) && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">AI Enhancements</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {user.freeEnhancementsUsed !== undefined && (
                          <div>
                            <div className="font-medium">Used</div>
                            <div className="text-2xl font-bold">{user.freeEnhancementsUsed}</div>
                          </div>
                        )}
                        {user.freeEnhancementsLimit !== undefined && (
                          <div>
                            <div className="font-medium">Limit</div>
                            <div className="text-2xl font-bold">{user.freeEnhancementsLimit}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {user.defaultSelfieId && (
                    <div>
                      <h3 className="font-semibold mb-3">Face Recognition</h3>
                      <div className="text-sm">
                        <span className="font-medium">Default Selfie ID: </span>
                        <span className="font-mono text-xs">{user.defaultSelfieId}</span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
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
        </main>
      </div>
    </AuthGuard>
  );
}

