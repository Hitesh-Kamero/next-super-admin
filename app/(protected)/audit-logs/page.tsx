"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuditLogs, type AuditLogEntry } from "@/lib/audit-logs-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const observerTarget = useRef<HTMLDivElement>(null);
  const pageSize = 50;

  const toggleLog = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  useEffect(() => {
    loadLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadLogs(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading]);

  const loadLogs = async (reset: boolean = false) => {
    if (loading || loadingMore) return;

    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const currentOffset = reset ? 0 : offset;
      const result = await getAuditLogs(currentOffset, pageSize);
      
      if (reset) {
        setLogs(result.logs);
        setOffset(result.logs.length);
      } else {
        setLogs((prev) => [...prev, ...result.logs]);
        setOffset((prev) => prev + result.logs.length);
      }
      
      setHasMore(result.logs.length === pageSize && result.logs.length > 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  // Infer status from operationType (CREATE/UPDATE are success, DELETE might be attempted)
  const getStatusFromOperation = (operationType: string): "success" | "attempted" | "failed" => {
    switch (operationType?.toUpperCase()) {
      case "CREATE":
      case "UPDATE":
        return "success";
      case "DELETE":
        return "attempted";
      default:
        return "attempted";
    }
  };

  const getStatusIcon = (operationType: string) => {
    const status = getStatusFromOperation(operationType);
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "attempted":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (operationType: string) => {
    const status = getStatusFromOperation(operationType);
    switch (status) {
      case "success":
        return "default";
      case "attempted":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get navigation URL based on resource type
  const getResourceUrl = (resourceType: string, resourceId?: string) => {
    if (!resourceId) return null;
    
    switch (resourceType?.toLowerCase()) {
      case "user":
        return `/users?query=${resourceId}`;
      case "whitelabel":
        return `/whitelabels?id=${resourceId}`;
      case "subscription":
        return `/subscriptions?id=${resourceId}`;
      case "event":
        return `/events?id=${resourceId}`;
      default:
        return null;
    }
  };

  // Extract linked entities from oldData and newData
  const extractLinkedEntities = (log: AuditLogEntry) => {
    const entities: Array<{ type: string; id: string; url: string }> = [];
    
    // Check resourceId first
    if (log.resourceId) {
      const url = getResourceUrl(log.resourceType, log.resourceId);
      if (url) {
        entities.push({
          type: log.resourceType,
          id: log.resourceId,
          url,
        });
      }
    }

    // Extract from oldData and newData
    const extractFromData = (data: any) => {
      if (!data || typeof data !== "object") return;
      
      // Check common field names
      if (data.userId || data.user_id) {
        const userId = data.userId || data.user_id;
        const url = getResourceUrl("User", userId);
        if (url && !entities.find(e => e.type === "User" && e.id === userId)) {
          entities.push({ type: "User", id: userId, url });
        }
      }
      if (data.whitelabelId || data.whitelabel_id) {
        const whitelabelId = data.whitelabelId || data.whitelabel_id;
        const url = getResourceUrl("Whitelabel", whitelabelId);
        if (url && !entities.find(e => e.type === "Whitelabel" && e.id === whitelabelId)) {
          entities.push({ type: "Whitelabel", id: whitelabelId, url });
        }
      }
      if (data.subscriptionId || data.subscription_id) {
        const subscriptionId = data.subscriptionId || data.subscription_id;
        const url = getResourceUrl("Subscription", subscriptionId);
        if (url && !entities.find(e => e.type === "Subscription" && e.id === subscriptionId)) {
          entities.push({ type: "Subscription", id: subscriptionId, url });
        }
      }
      if (data.eventDocId || data.event_doc_id || data.eventId || data.event_id) {
        const eventId = data.eventDocId || data.event_doc_id || data.eventId || data.event_id;
        const url = getResourceUrl("Event", eventId);
        if (url && !entities.find(e => e.type === "Event" && e.id === eventId)) {
          entities.push({ type: "Event", id: eventId, url });
        }
      }
    };

    if (log.oldData) extractFromData(log.oldData);
    if (log.newData) extractFromData(log.newData);

    return entities;
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold">Audit Logs</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs(true)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Logs List */}
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <Card className="p-6">
              <div className="text-center text-muted-foreground py-12">
                No audit logs found
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => {
                const logId = String(log.id || `log-${index}`);
                const isExpanded = expandedLogs.has(logId);
                const status = getStatusFromOperation(log.operationType);
                const linkedEntities = extractLinkedEntities(log);
                
                return (
                  <Card key={logId} className="overflow-hidden">
                    <button
                      onClick={() => toggleLog(logId)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.operationType)}
                        <div className="text-left">
                          <div className="font-semibold">{log.operationType}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.resourceType} {log.resourceId ? `(${log.resourceId})` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(log.operationType)}>
                          {status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t">
                        <div className="space-y-3">
                          <div>
                            <span className="font-medium">Operation:</span> {log.operationType}
                          </div>
                          <div>
                            <span className="font-medium">Resource Type:</span> {log.resourceType}
                          </div>
                          {log.resourceId && (
                            <div>
                              <span className="font-medium">Resource ID:</span>{" "}
                              {getResourceUrl(log.resourceType, log.resourceId) ? (
                                <Link
                                  href={getResourceUrl(log.resourceType, log.resourceId)!}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                                >
                                  {log.resourceId}
                                </Link>
                              ) : (
                                log.resourceId
                              )}
                            </div>
                          )}
                          {linkedEntities.length > 0 && (
                            <div>
                              <span className="font-medium mb-2 block">Linked Entities:</span>
                              <div className="space-y-1">
                                {linkedEntities.map((entity, idx) => (
                                  <div key={idx}>
                                    <span className="font-medium">{entity.type}:</span>{" "}
                                    <Link
                                      href={entity.url}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
                                    >
                                      {entity.id}
                                    </Link>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {log.adminEmail && (
                            <div>
                              <span className="font-medium">Admin:</span> {log.adminEmail}
                              {log.adminDisplayName && ` (${log.adminDisplayName})`}
                            </div>
                          )}
                          {log.description && (
                            <div>
                              <span className="font-medium">Description:</span> {log.description}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Created At:</span> {formatDate(log.createdAt)}
                          </div>
                          {(log.oldData || log.newData) && (
                            <div>
                              <span className="font-medium mb-2 block">Data Payload:</span>
                              <Card className="p-3 bg-muted">
                                <div className="space-y-2 text-sm">
                                  {log.oldData && (
                                    <div>
                                      <span className="font-medium">Old Data:</span>
                                      <pre className="mt-1 text-xs overflow-auto max-h-32 bg-background p-2 rounded">
                                        {JSON.stringify(log.oldData, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.newData && (
                                    <div>
                                      <span className="font-medium">New Data:</span>
                                      <pre className="mt-1 text-xs overflow-auto max-h-32 bg-background p-2 rounded">
                                        {JSON.stringify(log.newData, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Infinite scroll trigger */}
          <div ref={observerTarget} className="h-10 flex items-center justify-center">
            {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}




