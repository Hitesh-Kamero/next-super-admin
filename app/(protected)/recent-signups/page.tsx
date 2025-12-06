"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getRecentSignups,
  updateRecentSignupOutreach,
  type RecentSignupEntry,
} from "@/lib/recent-signups-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Loader2,
  FileText,
  Users,
  UserCheck,
} from "lucide-react";

type TabType = "all" | "business" | "endusers";

export default function RecentSignupsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [allSignups, setAllSignups] = useState<RecentSignupEntry[]>([]);
  const [businessSignups, setBusinessSignups] = useState<RecentSignupEntry[]>([]);
  const [endUserSignups, setEndUserSignups] = useState<RecentSignupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null); // email being updated

  // Date range state - default to last 7 days
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  // Dialog state
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedSignup, setSelectedSignup] = useState<RecentSignupEntry | null>(null);
  const [notesText, setNotesText] = useState("");

  // Load signups when date range changes
  useEffect(() => {
    loadAllSignups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadAllSignups = async () => {
    setLoading(true);
    try {
      const startDateStr = dateRange.start.toISOString().split("T")[0];
      const endDateStr = dateRange.end.toISOString().split("T")[0];
      
      // Load all three lists in parallel
      const [allResult, businessResult, endUserResult] = await Promise.all([
        getRecentSignups(startDateStr, endDateStr, 0, 500, undefined),
        getRecentSignups(startDateStr, endDateStr, 0, 500, false),
        getRecentSignups(startDateStr, endDateStr, 0, 500, true),
      ]);

      setAllSignups(allResult.signups);
      setBusinessSignups(businessResult.signups);
      setEndUserSignups(endUserResult.signups);
    } catch (error: any) {
      toast.error(error.message || "Failed to load recent signups");
      setAllSignups([]);
      setBusinessSignups([]);
      setEndUserSignups([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSignups = (): RecentSignupEntry[] => {
    switch (activeTab) {
      case "business":
        return businessSignups;
      case "endusers":
        return endUserSignups;
      case "all":
      default:
        return allSignups;
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const days = direction === "prev" ? -8 : 8;
    const newStart = new Date(dateRange.start);
    newStart.setDate(newStart.getDate() + days);
    newStart.setHours(0, 0, 0, 0);

    const newEnd = new Date(newStart);
    newEnd.setDate(newEnd.getDate() + 7);
    newEnd.setHours(23, 59, 59, 999);

    setDateRange({ start: newStart, end: newEnd });
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);
    return dateRange.end >= weekEnd;
  };

  const handleContactedChange = async (signup: RecentSignupEntry, isContacted: boolean) => {
    if (isContacted) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to mark ${signup.email} as contacted?`
      );
      if (!confirmed) {
        return;
      }
    }

    setUpdating(signup.email);
    try {
      await updateRecentSignupOutreach({
        email: signup.email,
        isContacted,
        note: signup.note, // Preserve existing note
      });
      toast.success(isContacted ? "Marked as contacted" : "Marked as not contacted");
      await loadAllSignups(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact status");
    } finally {
      setUpdating(null);
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
        isContacted: selectedSignup.isContacted, // Preserve existing contacted status
      });
      toast.success("Notes saved successfully");
      setNotesDialogOpen(false);
      await loadAllSignups(); // Refresh the list
    } catch (error: any) {
      toast.error(error.message || "Failed to save notes");
    } finally {
      setUpdating(null);
    }
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copied to clipboard");
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatDateRange = () => {
    const startStr = dateRange.start.toLocaleDateString();
    const endStr = dateRange.end.toLocaleDateString();
    const isCurrent = isCurrentWeek();
    return `${startStr} - ${endStr}${isCurrent ? " (this Week)" : ""}`;
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

          {/* Header with date range navigation */}
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Recent Signups</h1>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[200px] text-center">
                  {formatDateRange()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek("next")}
                  disabled={isCurrentWeek()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAllSignups}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
              </Button>
            </div>
          </Card>

          {/* Tabs for different user types */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                <Users className="h-4 w-4 mr-2" />
                All Users ({allSignups.length})
              </TabsTrigger>
              <TabsTrigger value="business">
                <UserCheck className="h-4 w-4 mr-2" />
                Business Users ({businessSignups.length})
              </TabsTrigger>
              <TabsTrigger value="endusers">
                <Users className="h-4 w-4 mr-2" />
                End Users ({endUserSignups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {/* Signups List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : getCurrentSignups().length === 0 ? (
                <Card className="p-6">
                  <div className="text-center text-muted-foreground py-12">
                    No {activeTab === "business" ? "business " : activeTab === "endusers" ? "end " : ""}signups found for this date range
                  </div>
                </Card>
              ) : (
                <div className="space-y-2">
                  {getCurrentSignups().map((signup) => (
                <Card key={signup.email} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Contacted Checkbox - Only show for business users */}
                    {!signup.isEndUser && (
                      <div className="pt-1">
                        {updating === signup.email ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={signup.isContacted}
                            onCheckedChange={(checked) =>
                              handleContactedChange(signup, checked === true)
                            }
                            disabled={updating !== null}
                          />
                        )}
                      </div>
                    )}
                    {signup.isEndUser && <div className="w-5" />} {/* Spacer for alignment */}

                    {/* Signup Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{signup.name || "No Name"}</h3>
                        {signup.isEndUser && (
                          <Badge variant="secondary" className="text-xs">
                            End User
                          </Badge>
                        )}
                        {!signup.isEndUser && signup.isContacted && (
                          <Badge variant="default" className="text-xs">
                            Contacted
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={() => copyEmail(signup.email)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer font-mono text-xs"
                          >
                            {signup.email}
                          </button>
                        </div>

                        {signup.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${signup.phone}`}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                            >
                              {signup.phone}
                            </a>
                          </div>
                        )}

                        <div className="text-muted-foreground">
                          Signed up: {formatDate(signup.createdAt)}
                        </div>

                        {!signup.isEndUser && signup.note && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <div className="font-medium mb-1">Note:</div>
                            <div className="whitespace-pre-wrap">{signup.note}</div>
                          </div>
                        )}

                        {!signup.isEndUser && signup.contactedBy && signup.contactedAt && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Contacted by {signup.contactedBy} on {formatDate(signup.contactedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Only show for business users */}
                    {!signup.isEndUser && (
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openNotesDialog(signup)}
                          disabled={updating !== null}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {signup.note ? "Edit Notes" : "Add Notes"}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

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



