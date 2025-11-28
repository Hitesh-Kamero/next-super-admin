"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, History, MessageSquare, RefreshCw, XCircle, CheckCircle2 } from "lucide-react";
import {
  getTicketActivities,
  type TicketActivity,
  type TicketActivityType,
} from "@/lib/support-tickets-api";
import { formatDateIST } from "@/lib/utils";

interface TicketActivityLogProps {
  ticketId: string;
}

const getActivityIcon = (type: TicketActivityType) => {
  switch (type) {
    case "REPLY":
      return <MessageSquare className="h-4 w-4" />;
    case "STATUS_CHANGE":
      return <RefreshCw className="h-4 w-4" />;
    case "CLOSED":
      return <XCircle className="h-4 w-4" />;
    case "REOPENED":
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getActivityColor = (type: TicketActivityType) => {
  switch (type) {
    case "REPLY":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "STATUS_CHANGE":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "CLOSED":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "REOPENED":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
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

export function TicketActivityLog({ ticketId }: TicketActivityLogProps) {
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

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-center py-8 text-muted-foreground">
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="h-5 w-5" />
          Activity Log
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          No activity recorded yet
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        Activity Log
        <Badge variant="secondary" className="ml-2">
          {activities.length}
        </Badge>
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex gap-3 pb-4 border-b last:border-0 last:pb-0"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={activity.adminPhotoUrl} alt={activity.adminDisplayName || activity.adminEmail} />
              <AvatarFallback className="text-xs">
                {getInitials(activity.adminDisplayName, activity.adminEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {activity.adminDisplayName || activity.adminEmail}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getActivityColor(activity.activityType)}`}
                  >
                    <span className="mr-1">{getActivityIcon(activity.activityType)}</span>
                    {activity.activityType.replace("_", " ")}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateIST(activity.createdAt)}
                </span>
              </div>
              {activity.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
              )}
              {activity.activityType === "STATUS_CHANGE" && activity.oldValue && activity.newValue && (
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="line-through">{activity.oldValue}</span>
                  {" → "}
                  <span className="font-medium">{activity.newValue}</span>
                </div>
              )}
              {activity.activityType === "REPLY" && activity.newValue && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  "{activity.newValue.substring(0, 100)}{activity.newValue.length > 100 ? "..." : ""}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
