"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  getRecentSignups,
  updateRecentSignupOutreach,
  type RecentSignupEntry,
} from "@/lib/recent-signups-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  Loader2,
  FileText,
  Users,
  Calendar,
  ExternalLink,
  Building2,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

type TabType = "business" | "endusers" | "all";

const PAGE_SIZE = 24;

// Format userType for display
const formatUserType = (userType?: string): string => {
  if (!userType) return "Business";
  const typeMap: Record<string, string> = {
    "photographer": "Photographer",
    "corporate": "Corporate",
    "event-planner": "Event Planner",
    "school-university": "School/University",
    "other": "Other",
    "end_user": "End User",
  };
  return typeMap[userType] || userType;
};

// Get badge color based on userType
const getUserTypeBadgeClass = (userType?: string): string => {
  const classMap: Record<string, string> = {
    "photographer": "border-purple-500 text-purple-600 bg-purple-500/10",
    "corporate": "border-blue-500 text-blue-600 bg-blue-500/10",
    "event-planner": "border-green-500 text-green-600 bg-green-500/10",
    "school-university": "border-orange-500 text-orange-600 bg-orange-500/10",
    "other": "border-gray-500 text-gray-600 bg-gray-500/10",
  };
  return classMap[userType || ""] || "border-blue-500 text-blue-600 bg-blue-500/10";
};

export default function RecentSignupsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("business");
  
  // Separate state for each tab
  const [allSignups, setAllSignups] = useState<RecentSignupEntry[]>([]);
  const [businessSignups, setBusinessSignups] = useState<RecentSignupEntry[]>([]);
  const [endUserSignups, setEndUserSignups] = useState<RecentSignupEntry[]>([]);
  
  // Totals for each tab
  const [allTotal, setAllTotal] = useState(0);
  const [businessTotal, setBusinessTotal] = useState(0);
  const [endUserTotal, setEndUserTotal] = useState(0);
  
  // Current page for each tab
  const [allPage, setAllPage] = useState(0);
  const [businessPage, setBusinessPage] = useState(0);
  const [endUserPage, setEndUserPage] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // Date range state - default to last 7 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  // Notes dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<RecentSignupEntry | null>(null);
  const [notesText, setNotesText] = useState("");

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    signup: RecentSignupEntry;
    isContacted: boolean;
  } | null>(null);

  // Load signups when date range or page changes
  useEffect(() => {
    loadCurrentTabSignups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activeTab, allPage, businessPage, endUserPage]);

  const getCurrentPage = () => {
    switch (activeTab) {
      case "business": return businessPage;
      case "endusers": return endUserPage;
      case "all": return allPage;
    }
  };

  const setCurrentPage = (page: number) => {
    switch (activeTab) {
      case "business": setBusinessPage(page); break;
      case "endusers": setEndUserPage(page); break;
      case "all": setAllPage(page); break;
    }
  };

  const loadCurrentTabSignups = async () => {
    if (!startDate || !endDate) return;
    
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const page = getCurrentPage();
      const skip = page * PAGE_SIZE;
      
      let isEndUserFilter: boolean | undefined;
      if (activeTab === "business") isEndUserFilter = false;
      else if (activeTab === "endusers") isEndUserFilter = true;
      
      const result = await getRecentSignups(startDate, endDate, skip, PAGE_SIZE, isEndUserFilter);
      
      switch (activeTab) {
        case "business":
          setBusinessSignups(result.signups);
          setBusinessTotal(result.total);
          break;
        case "endusers":
          setEndUserSignups(result.signups);
          setEndUserTotal(result.total);
          break;
        case "all":
          setAllSignups(result.signups);
          setAllTotal(result.total);
          break;
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load recent signups");
    } finally {
      setLoading(false);
    }
  };

  // Load counts for all tabs on initial load
  useEffect(() => {
    loadAllTabCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const loadAllTabCounts = async () => {
    if (!startDate || !endDate) return;
    
    try {
      // Fetch just first page to get counts for all tabs
      const [allResult, businessResult, endUserResult] = await Promise.all([
        getRecentSignups(startDate, endDate, 0, 1, undefined),
        getRecentSignups(startDate, endDate, 0, 1, false),
        getRecentSignups(startDate, endDate, 0, 1, true),
      ]);
      
      setAllTotal(allResult.total);
      setBusinessTotal(businessResult.total);
      setEndUserTotal(endUserResult.total);
    } catch (error: any) {
      console.error("Failed to load tab counts", error);
    }
  };

  const getCurrentSignups = (): RecentSignupEntry[] => {
    switch (activeTab) {
      case "business": return businessSignups;
      case "endusers": return endUserSignups;
      case "all": return allSignups;
    }
  };

  const getCurrentTotal = (): number => {
    switch (activeTab) {
      case "business": return businessTotal;
      case "endusers": return endUserTotal;
      case "all": return allTotal;
    }
  };

  const getTotalPages = () => Math.ceil(getCurrentTotal() / PAGE_SIZE);

  const openConfirmDialog = (signup: RecentSignupEntry, isContacted: boolean) => {
    setConfirmAction({ signup, isContacted });
    setConfirmDialogOpen(true);
  };

  const handleConfirmContactedChange = async () => {
    if (!confirmAction) return;

    const { signup, isContacted } = confirmAction;
    setUpdating(signup.email);
    setConfirmDialogOpen(false);

    try {
      await updateRecentSignupOutreach({
        email: signup.email,
        isContacted,
        note: signup.note,
      });
      toast.success(isContacted ? "Marked as contacted" : "Marked as not contacted");
      await loadCurrentTabSignups();
      await loadAllTabCounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact status");
    } finally {
      setUpdating(null);
      setConfirmAction(null);
    }
  };

  const openNotesDialog = (signup: RecentSignupEntry) => {
    setSelectedSignup(signup);
    setNotesText(signup.note || "");
    setNotesDialogOpen(true);
  };

  const saveNotes = async () => {
    if (!selectedSignup) return;

    setUpdating(selectedSignup.email);
    try {
      await updateRecentSignupOutreach({
        email: selectedSignup.email,
        note: notesText.trim() || undefined,
        isContacted: selectedSignup.isContacted,
      });
      toast.success("Notes saved successfully");
      setNotesDialogOpen(false);
      await loadCurrentTabSignups();
    } catch (error: any) {
      toast.error(error.message || "Failed to save notes");
    } finally {
      setUpdating(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const openUserDetails = (signup: RecentSignupEntry) => {
    router.push(`/users?userId=${encodeURIComponent(signup.userId)}&from=recent-signups`);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Reset page when changing tabs
    switch (tab) {
      case "business": if (businessPage !== 0 && businessSignups.length === 0) setBusinessPage(0); break;
      case "endusers": if (endUserPage !== 0 && endUserSignups.length === 0) setEndUserPage(0); break;
      case "all": if (allPage !== 0 && allSignups.length === 0) setAllPage(0); break;
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-6">
          {/* Back button */}
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Header with date range selector */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold">Recent Signups</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadCurrentTabSignups();
                  loadAllTabCounts();
                }}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Refresh</span>
              </Button>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setAllPage(0);
                    setBusinessPage(0);
                    setEndUserPage(0);
                  }}
                  className="h-9 mt-1"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setAllPage(0);
                    setBusinessPage(0);
                    setEndUserPage(0);
                  }}
                  className="h-9 mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Tabs for different user types */}
          <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabType)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="business" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Business</span> ({businessTotal})
              </TabsTrigger>
              <TabsTrigger value="endusers" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">End Users</span> ({endUserTotal})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">All</span> ({allTotal})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {/* Pagination Info */}
              {getCurrentTotal() > 0 && (
                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                  <span>
                    Showing {getCurrentPage() * PAGE_SIZE + 1}-{Math.min((getCurrentPage() + 1) * PAGE_SIZE, getCurrentTotal())} of {getCurrentTotal()}
                  </span>
                  {getTotalPages() > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(getCurrentPage() - 1)}
                        disabled={getCurrentPage() === 0 || loading}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-2">
                        Page {getCurrentPage() + 1} of {getTotalPages()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(getCurrentPage() + 1)}
                        disabled={getCurrentPage() >= getTotalPages() - 1 || loading}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Signups Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : getCurrentSignups().length === 0 ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground py-12">
                    No {activeTab === "business" ? "business " : activeTab === "endusers" ? "end user " : ""}signups found for this date range
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {getCurrentSignups().map((signup) => (
                    <Card 
                      key={signup.email} 
                      className="group relative overflow-hidden border-l-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      style={{
                        borderLeftColor: signup.isEndUser 
                          ? 'hsl(var(--muted-foreground))' 
                          : signup.isContacted 
                            ? 'hsl(142.1 76.2% 36.3%)' 
                            : 'hsl(221.2 83.2% 53.3%)'
                      }}
                      onClick={() => openUserDetails(signup)}
                    >
                      <div className="p-4">
                        {/* Header with name and badges */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">
                              {signup.name || "No Name"}
                            </h3>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {signup.isEndUser ? (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  End User
                                </Badge>
                              ) : (
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] px-1.5 py-0 ${getUserTypeBadgeClass(signup.userType)}`}
                                >
                                  {formatUserType(signup.userType)}
                                </Badge>
                              )}
                              {!signup.isEndUser && signup.isContacted && (
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-green-600">
                                  Contacted
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Checkbox for business users only */}
                          {!signup.isEndUser && (
                            <div 
                              className="ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {updating === signup.email ? (
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : (
                                <Checkbox
                                  checked={signup.isContacted}
                                  onCheckedChange={(checked) =>
                                    openConfirmDialog(signup, checked === true)
                                  }
                                  disabled={updating !== null}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Contact info */}
                        <div className="space-y-1.5 text-sm">
                          <div 
                            className="flex items-center gap-2 group/email"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(signup.email, "Email");
                            }}
                          >
                            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-xs truncate cursor-pointer">
                              {signup.email}
                            </span>
                          </div>

                          {signup.phone && (
                            <div 
                              className="flex items-center gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <a
                                href={`tel:${signup.phone}`}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                              >
                                {signup.phone}
                              </a>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-xs truncate">{formatDate(signup.createdAt)}</span>
                          </div>
                        </div>

                        {/* Notes section for business users */}
                        {!signup.isEndUser && signup.note && (
                          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                            <div className="font-medium text-muted-foreground mb-0.5">Note:</div>
                            <div className="line-clamp-2">{signup.note}</div>
                          </div>
                        )}

                        {/* Contacted by info */}
                        {!signup.isEndUser && signup.contactedBy && signup.contactedAt && (
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            Contacted by {signup.contactedBy.split("@")[0]} on {formatDate(signup.contactedAt).split(",")[0]}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              openUserDetails(signup);
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          
                          {!signup.isEndUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openNotesDialog(signup);
                              }}
                              disabled={updating !== null}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {signup.note ? "Edit" : "Add"} Notes
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Bottom Pagination */}
              {getTotalPages() > 1 && getCurrentSignups().length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(getCurrentPage() - 1)}
                    disabled={getCurrentPage() === 0 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="px-4 text-sm text-muted-foreground">
                    Page {getCurrentPage() + 1} of {getTotalPages()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(getCurrentPage() + 1)}
                    disabled={getCurrentPage() >= getTotalPages() - 1 || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Confirmation Dialog */}
          <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Confirm Contact Status
                </DialogTitle>
                <DialogDescription>
                  {confirmAction?.isContacted 
                    ? "Are you sure you want to mark this user as contacted?"
                    : "Are you sure you want to mark this user as not contacted?"
                  }
                </DialogDescription>
              </DialogHeader>
              
              {confirmAction && (
                <div className="py-4">
                  <div className="p-3 bg-muted rounded-lg space-y-2">
                    <div className="font-medium">{confirmAction.signup.name || "No Name"}</div>
                    <div className="text-sm text-muted-foreground font-mono">{confirmAction.signup.email}</div>
                    {confirmAction.signup.phone && (
                      <div className="text-sm text-muted-foreground">{confirmAction.signup.phone}</div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setConfirmAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmContactedChange}
                  className={confirmAction?.isContacted ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {confirmAction?.isContacted ? "Mark as Contacted" : "Mark as Not Contacted"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Notes Dialog */}
          <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {selectedSignup?.note ? "Edit Notes" : "Add Notes"}
                </DialogTitle>
                <DialogDescription>
                  {selectedSignup && `Email: ${selectedSignup.email}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Enter notes about this signup..."
                    rows={6}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotesDialogOpen(false);
                      setNotesText("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveNotes}
                    disabled={updating !== null}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}
