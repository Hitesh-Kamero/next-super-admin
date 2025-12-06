"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getWebLeads, type WebLead } from "@/lib/web-leads-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  User,
  Building,
  Briefcase,
} from "lucide-react";

type RoleFilter = "all" | "photographer" | "corporate" | "user" | "other";

export default function WebLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<WebLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedLead, setSelectedLead] = useState<WebLead | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadLeads(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const loadLeads = async (reset: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const currentSkip = reset ? 0 : skip;
      const result = await getWebLeads(
        currentSkip,
        pageSize,
        roleFilter === "all" ? undefined : roleFilter
      );
      
      if (reset) {
        setLeads(result.registrations);
        setSkip(result.registrations.length);
      } else {
        setLeads((prev) => [...prev, ...result.registrations]);
        setSkip((prev) => prev + result.registrations.length);
      }
      
      setHasMore(result.registrations.length === pageSize);
    } catch (error: any) {
      toast.error(error.message || "Failed to load web leads");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    loadLeads(false);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setSkip(0);
    setHasMore(true);
  };

  const openDetailDialog = (lead: WebLead) => {
    setSelectedLead(lead);
    setDetailDialogOpen(true);
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

  const getRoleIcon = (role?: string) => {
    if (!role) return <User className="h-4 w-4" />;
    const roleLower = role.toLowerCase();
    if (roleLower.includes("photographer")) return <Briefcase className="h-4 w-4" />;
    if (roleLower.includes("corporate")) return <Building className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getRoleBadgeColor = (role?: string) => {
    if (!role) return "secondary";
    const roleLower = role.toLowerCase();
    if (roleLower.includes("photographer")) return "default";
    if (roleLower.includes("corporate")) return "default";
    return "secondary";
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background font-sans">
        <main className="container mx-auto flex-1 px-4 py-8">
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

          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-semibold">Web Leads</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLeads(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Role Filter */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "photographer", "corporate", "user", "other"] as RoleFilter[]).map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleRoleFilterChange(role)}
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
              ))}
            </div>
          </Card>

          {/* Leads List */}
          {leads.length === 0 && !loading ? (
            <Card className="p-6">
              <div className="text-center text-muted-foreground py-12">
                No web leads found
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <Card key={lead.id} className="p-4 cursor-pointer hover:bg-muted/50" onClick={() => openDetailDialog(lead)}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        {lead.role && (
                          <Badge variant={getRoleBadgeColor(lead.role)}>
                            {getRoleIcon(lead.role)}
                            <span className="ml-1">{lead.role}</span>
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyEmail(lead.email);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                          >
                            {lead.email}
                          </button>
                        </div>
                        {lead.mobile && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`tel:${lead.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                            >
                              {lead.mobile}
                            </a>
                          </div>
                        )}
                        {lead.company && (
                          <div className="text-muted-foreground">Company: {lead.company}</div>
                        )}
                        <div className="text-muted-foreground">
                          Created: {formatDate(lead.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}

          {/* Detail Dialog */}
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Lead Details</DialogTitle>
                <DialogDescription>
                  Full information about this web lead
                </DialogDescription>
              </DialogHeader>
              {selectedLead && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Name</h3>
                    <p>{selectedLead.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Email</h3>
                    <button
                      onClick={() => copyEmail(selectedLead.email)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                    >
                      {selectedLead.email}
                    </button>
                  </div>
                  {selectedLead.mobile && (
                    <div>
                      <h3 className="font-semibold mb-2">Mobile</h3>
                      <a
                        href={`tel:${selectedLead.mobile}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                      >
                        {selectedLead.mobile}
                      </a>
                    </div>
                  )}
                  {selectedLead.company && (
                    <div>
                      <h3 className="font-semibold mb-2">Company</h3>
                      <p>{selectedLead.company}</p>
                    </div>
                  )}
                  {selectedLead.city && (
                    <div>
                      <h3 className="font-semibold mb-2">City</h3>
                      <p>{selectedLead.city}</p>
                    </div>
                  )}
                  {selectedLead.role && (
                    <div>
                      <h3 className="font-semibold mb-2">Role</h3>
                      <p>{selectedLead.role}</p>
                    </div>
                  )}
                  {selectedLead.message && (
                    <div>
                      <h3 className="font-semibold mb-2">Message</h3>
                      <p className="whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold mb-2">Created At</h3>
                    <p>{formatDate(selectedLead.createdAt)}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}



