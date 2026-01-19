"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, History, MessageSquare, RefreshCw, XCircle, CheckCircle2, UserCheck } from "lucide-react";
import {
  getTicketActivities,
  type TicketActivity,
  type TicketActivityType,
} from "@/lib/support-tickets-api";
import { formatDateIST } from "@/lib/utils";

interface TicketActivityLogProps {
  ticketId: string;
  compact?: boolean; // When true, renders without Card wrapper
}

const getActivityIcon = (type: TicketActivityType) => {
  switch (type) {
    case "REPLY":
      return <MessageSquare className="h-3.5 w-3.5" />;
    case "STATUS_CHANGE":
      return <RefreshCw className="h-3.5 w-3.5" />;
    case "CLOSED":
      return <XCircle className="h-3.5 w-3.5" />;
    case "REOPENED":
      return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "ASSIGNED":
      return <UserCheck className="h-3.5 w-3.5" />;
    default:
      return <History className="h-3.5 w-3.5" />;
  }
};

const getActivityColor = (type: TicketActivityType) => {
  switch (type) {
    case "REPLY":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "STATUS_CHANGE":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "CLOSED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "REOPENED":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "ASSIGNED":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400";
  }
};

const getInitials = (name: string | undefined, email: string) => {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

export function TicketActivityLog({ ticketId, compact = false }: TicketActivityLogProps) {
  const [activities, setActivities] = useState<TicketActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [ticketId]);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTicketActivities(ticketId);
      setActivities(response.activities || []);
    } catch (err: any) {
      setError(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => 
    compact ? <>{children}</> : <Card className="p-4">{children}</Card>;

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </Wrapper>
    );
  }

  if (error) {
    return (
      <Wrapper>
        <div className="text-center py-6 text-muted-foreground text-sm">
          <p>{error}</p>
        </div>
      </Wrapper>
    );
  }

  if (activities.length === 0) {
    return (
      <Wrapper>
        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${compact ? "text-sm" : "text-lg"}`}>
          <History className={compact ? "h-4 w-4" : "h-5 w-5"} />
          Activity Log
        </h3>
        <div className="text-center py-6 text-muted-foreground text-sm">
          No activity recorded yet
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${compact ? "text-sm" : "text-lg"}`}>
        <History className={compact ? "h-4 w-4 text-slate-500" : "h-5 w-5"} />
        Activity Log
        <Badge variant="secondary" className="ml-1 text-xs">
          {activities.length}
        </Badge>
      </h3>
      <div className={`space-y-3 ${compact ? "max-h-[300px] overflow-y-auto pr-1" : ""}`}>
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex gap-2.5 pb-3 border-b last:border-0 last:pb-0"
          >
            <Avatar className={`shrink-0 ${compact ? "h-6 w-6" : "h-8 w-8"}`}>
              <AvatarImage src={activity.adminPhotoUrl} alt={activity.adminDisplayName || activity.adminEmail} />
              <AvatarFallback className={compact ? "text-[10px]" : "text-xs"}>
                {getInitials(activity.adminDisplayName, activity.adminEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                    {activity.adminDisplayName || activity.adminEmail.split("@")[0]}
                  </span>
                  <Badge
                    variant="outline"
                    className={`${compact ? "text-[10px] px-1.5 py-0" : "text-xs"} ${getActivityColor(activity.activityType)}`}
                  >
                    <span className="mr-0.5">{getActivityIcon(activity.activityType)}</span>
                    {activity.activityType.replace("_", " ")}
                  </Badge>
                </div>
                <span className={`text-muted-foreground whitespace-nowrap ${compact ? "text-[10px]" : "text-xs"}`}>
                  {formatDateIST(activity.createdAt)}
                </span>
              </div>
              {activity.description && (
                <p className={`text-muted-foreground mt-0.5 ${compact ? "text-xs" : "text-sm"}`}>
                  {activity.description}
                </p>
              )}
              {activity.activityType === "STATUS_CHANGE" && activity.oldValue && activity.newValue && (
                <div className={`text-muted-foreground mt-0.5 ${compact ? "text-[10px]" : "text-xs"}`}>
                  <span className="line-through opacity-60">{activity.oldValue}</span>
                  {" → "}
                  <span className="font-medium text-foreground">{activity.newValue}</span>
                </div>
              )}
              {activity.activityType === "REPLY" && activity.newValue && (
                <p className={`text-muted-foreground mt-0.5 line-clamp-1 ${compact ? "text-[10px]" : "text-sm"}`}>
                  "{activity.newValue.substring(0, 60)}{activity.newValue.length > 60 ? "..." : ""}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
