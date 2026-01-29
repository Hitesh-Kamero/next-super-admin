"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getEvent, recoverEvent, convertEventToSubscription, type AdminEventDetails } from "@/lib/events-api";
import { getSubscriptionForUser, type AdminSubscriptionDetails } from "@/lib/subscriptions-api";
import { EventEditDialog } from "@/components/event-edit-dialog";
import { RawJsonViewer } from "@/components/raw-json-viewer";
import { UploadsLeftCalculationCard } from "@/components/uploads-left-calculation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Hash, Tag, ArrowLeft, Lock, Pencil, RotateCcw, RefreshCw } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recoverDialogOpen, setRecoverDialogOpen] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [userSubscription, setUserSubscription] = useState<AdminSubscriptionDetails | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  // Auto-search if eventId is provided in query params
  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (eventId && !event && !loading && query === "") {
      setQuery(eventId);
      // Perform search
      const performSearch = async () => {
        setLoading(true);
        setEvent(null);
        try {
          const result = await getEvent(eventId);
          setEvent(result);
          toast.success("Event found successfully");
        } catch (error: any) {
          toast.error(error.message || "Failed to get event");
          setEvent(null);
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
      toast.error("Please enter an event document ID, channel, or hash ID");
      return;
    }

    setLoading(true);
    setEvent(null);
    try {
      const result = await getEvent(searchValue);
      setEvent(result);
      toast.success("Event found successfully");
      // Update URL without reloading
      router.replace(`/events?eventId=${encodeURIComponent(searchValue)}`, { scroll: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to get event");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleEditSuccess = async () => {
    // Refresh the event data after successful edit
    if (event) {
      try {
        const result = await getEvent(event.id);
        setEvent(result);
        toast.success("Event data refreshed");
      } catch (error: any) {
        toast.error("Failed to refresh event data");
      }
    }
  };

  const handleRecoverEvent = async () => {
    if (!event) return;

    setRecovering(true);
    try {
      await recoverEvent({ eventId: event.id });
      toast.success("Event recovered successfully");
      setRecoverDialogOpen(false);
      // Refresh the event data
      const result = await getEvent(event.id);
      setEvent(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to recover event");
    } finally {
      setRecovering(false);
    }
  };

  const handleConvertToSubscription = async () => {
    if (!event || !userSubscription) return;

    setConverting(true);
    try {
      await convertEventToSubscription({
        eventId: event.id,
        subscriptionId: userSubscription.id,
      });
      toast.success("Event converted to subscription successfully");
      setConvertDialogOpen(false);
      setUserSubscription(null);
      // Refresh the event data
      const result = await getEvent(event.id);
      setEvent(result);
    } catch (error: any) {
      toast.error(error.message || "Failed to convert event to subscription");
    } finally {
      setConverting(false);
    }
  };

  const openConvertDialog = async () => {
    if (!event) return;
    
    setConvertDialogOpen(true);
    setLoadingSubscription(true);
    setUserSubscription(null);
    
    try {
      const subscription = await getSubscriptionForUser(event.userId);
      setUserSubscription(subscription);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoadingSubscription(false);
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

  const getEventTypeLabel = (eventType?: number) => {
    if (eventType === 1) return "Subscription";
    if (eventType === 0) return "Pack";
    return "Unknown";
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
              <h1 className="text-lg font-semibold whitespace-nowrap">Events</h1>
              <div className="flex gap-2 flex-1">
                <Input
                  id="search-mobile"
                  placeholder="Event ID, channel, or hash"
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
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-xl font-semibold whitespace-nowrap">Event Search</h1>
                <div className="flex gap-2 flex-1">
                  <Input
                    id="search-desktop"
                    placeholder="Enter event doc ID, channel, or hash ID"
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

          {event && (
            <div className="space-y-6">
              {/* Mobile: Direct content cards */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 flex-1">
                      <h2 className="text-xl font-semibold">{event.name}</h2>
                      {event.isArchived && (
                        <>
                          <Badge variant="destructive">deleted</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRecoverDialogOpen(true)}
                            className="h-7 text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Recover Event
                          </Button>
                        </>
                      )}
                    </div>
                    <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-medium">Document ID:</span>
                      <span className="font-mono text-xs">{event.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      <span className="font-medium">Channel:</span>
                      <span>{event.channel}</span>
                    </div>
                    {event.hashId && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span className="font-medium">Hash ID:</span>
                        <span>{event.hashId}</span>
                      </div>
                    )}
                    {event.pin && (
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span className="font-medium">Pin:</span>
                        <span className="font-mono">{event.pin}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">User ID:</span>
                      <button
                        onClick={() => router.push(`/users?userId=${encodeURIComponent(event.userId)}`)}
                        className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                      >
                        {event.userId}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(event.createdAt)}</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Event Type</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type: </span>
                      <Badge variant="outline">{getEventTypeLabel(event.eventType)}</Badge>
                    </div>
                    {event.eventType === 1 && event.subscriptionId && (
                      <div>
                        <span className="font-medium">Subscription ID: </span>
                        <button
                          onClick={() => router.push(`/subscriptions?subscriptionId=${encodeURIComponent(event.subscriptionId!)}`)}
                          className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                        >
                          {event.subscriptionId}
                        </button>
                      </div>
                    )}
                    {(event.eventType === 0 || event.eventType === undefined || event.eventType === null) && (
                      <>
                        {event.maxPhotos && (
                          <div>
                            <span className="font-medium">Max Photos: </span>
                            <span>{event.maxPhotos}</span>
                          </div>
                        )}
                        {event.expiresAt && (
                          <div>
                            <span className="font-medium">Expires At: </span>
                            <span>{formatDate(event.expiresAt)}</span>
                          </div>
                        )}
                        {event.purchase && (
                          <div>
                            <span className="font-medium">Purchase ID: </span>
                            <span className="font-mono text-xs">{event.purchase}</span>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConvertDialog()}
                            className="w-full"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Convert to Subscription
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Hosts</h3>
                  {event.hosts && event.hosts.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      {event.hosts.map((host, idx) => (
                        <div key={idx} className="border-b pb-2 last:border-0">
                          {host.name && <div><span className="font-medium">Name: </span>{host.name}</div>}
                          {host.email && <div><span className="font-medium">Email: </span>{host.email}</div>}
                          {host.mobileNumber && <div><span className="font-medium">Mobile: </span>{host.mobileNumber}</div>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No hosts</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Face Recognition</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Supported: </span>
                      <Badge variant={event.isFacesSupported ? "default" : "secondary"}>
                        {event.isFacesSupported ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {event.facesEnabledAt && (
                      <div>
                        <span className="font-medium">Enabled At: </span>
                        <span>{formatDate(event.facesEnabledAt)}</span>
                      </div>
                    )}
                    {event.facesExpiresAt && (
                      <div>
                        <span className="font-medium">Expires At: </span>
                        <span>{formatDate(event.facesExpiresAt)}</span>
                      </div>
                    )}
                    {event.isFacesExpired !== undefined && (
                      <div>
                        <span className="font-medium">Expired: </span>
                        <Badge variant={event.isFacesExpired ? "destructive" : "default"}>
                          {event.isFacesExpired ? "Yes" : "No"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Guest Upload</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Enabled: </span>
                      <Badge variant={event.isGuestUploadEnabled ? "default" : "secondary"}>
                        {event.isGuestUploadEnabled ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {event.guestMaxPhotos && (
                      <div>
                        <span className="font-medium">Max Photos: </span>
                        <span>{event.guestMaxPhotos}</span>
                      </div>
                    )}
                    {event.guestPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Current Count: </span>
                        <span>{event.guestPhotosCount}</span>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Photo Statistics</h3>
                  <div className="space-y-2 text-sm">
                    {event.currentPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Current Photos: </span>
                        <span>{event.currentPhotosCount}</span>
                      </div>
                    )}
                    {event.uploadedPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Uploaded: </span>
                        <span>{event.uploadedPhotosCount}</span>
                      </div>
                    )}
                    {event.deletedPhotosCount !== undefined && (
                      <div>
                        <span className="font-medium">Deleted: </span>
                        <span>{event.deletedPhotosCount}</span>
                      </div>
                    )}
                    {event.uploadsLeft !== undefined && (
                      <div>
                        <span className="font-medium">Uploads Left: </span>
                        <span>{event.uploadsLeft}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Desktop: With card wrapper */}
              <div className="hidden md:block">
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">{event.name}</h2>
                      {event.isArchived && <Badge variant="destructive">deleted</Badge>}
                      <Badge variant={event.eventType === 1 ? "default" : "secondary"}>
                        {getEventTypeLabel(event.eventType)}
                      </Badge>
                      {event.state && <Badge variant="outline">{event.state}</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {event.isArchived && (
                        <Button variant="outline" size="sm" onClick={() => setRecoverDialogOpen(true)}>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Recover
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-5 gap-4 mb-5 p-4 bg-muted/30 rounded-lg">
                    {event.currentPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Current</div>
                        <div className="text-xl font-bold text-primary">{event.currentPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {event.uploadedPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Uploaded</div>
                        <div className="text-xl font-bold text-green-600">{event.uploadedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {event.deletedPhotosCount !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Deleted</div>
                        <div className="text-xl font-bold text-red-500">{event.deletedPhotosCount.toLocaleString()}</div>
                      </div>
                    )}
                    {event.uploadsLeft !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Left</div>
                        <div className="text-xl font-bold text-blue-600">{event.uploadsLeft.toLocaleString()}</div>
                      </div>
                    )}
                    {event.views !== undefined && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground">Views</div>
                        <div className="text-xl font-bold text-purple-600">{event.views.toLocaleString()}</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    {/* Column 1: IDs */}
                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Doc ID</span>
                        <span className="font-mono text-xs">{event.id}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Channel</span>
                        <span className="font-medium">{event.channel}</span>
                      </div>
                      {event.hashId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Hash ID</span>
                          <span className="font-medium">{event.hashId}</span>
                        </div>
                      )}
                      {event.pin && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Pin</span>
                          <span className="font-mono font-bold">{event.pin}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-muted-foreground">User ID</span>
                        <button
                          onClick={() => router.push(`/users?userId=${encodeURIComponent(event.userId)}`)}
                          className="font-mono text-xs text-blue-500 hover:underline"
                        >
                          {event.userId}
                        </button>
                      </div>
                      {event.eventType === 1 && event.subscriptionId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Subscription</span>
                          <button
                            onClick={() => router.push(`/subscriptions?subscriptionId=${encodeURIComponent(event.subscriptionId!)}`)}
                            className="font-mono text-xs text-blue-500 hover:underline"
                          >
                            {event.subscriptionId.slice(0, 8)}...
                          </button>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Created</span>
                        <span>{formatDate(event.createdAt)}</span>
                      </div>
                    </div>

                    {/* Column 2: Face Recognition & Guest */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Face Recognition</span>
                        <Badge variant={event.isFacesSupported ? "default" : "secondary"} className="text-xs">
                          {event.isFacesSupported ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {event.facesEnabledAt && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Faces Enabled</span>
                          <span>{formatDate(event.facesEnabledAt)}</span>
                        </div>
                      )}
                      {event.facesExpiresAt && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Faces Expires</span>
                          <span>{formatDate(event.facesExpiresAt)}</span>
                        </div>
                      )}
                      {event.isFacesExpired !== undefined && (
                        <div className="flex justify-between items-center py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Faces Expired</span>
                          <Badge variant={event.isFacesExpired ? "destructive" : "default"} className="text-xs">
                            {event.isFacesExpired ? "Yes" : "No"}
                          </Badge>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1 border-b border-border/40">
                        <span className="text-muted-foreground">Guest Upload</span>
                        <Badge variant={event.isGuestUploadEnabled ? "default" : "secondary"} className="text-xs">
                          {event.isGuestUploadEnabled ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {event.guestMaxPhotos !== undefined && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Guest Max</span>
                          <span>{event.guestMaxPhotos}</span>
                        </div>
                      )}
                      {event.guestPhotosCount !== undefined && (
                        <div className="flex justify-between py-1">
                          <span className="text-muted-foreground">Guest Count</span>
                          <span>{event.guestPhotosCount}</span>
                        </div>
                      )}
                    </div>

                    {/* Column 3: Pack Info & Actions */}
                    <div className="space-y-2">
                      {(event.eventType === 0 || event.eventType === undefined || event.eventType === null) && (
                        <>
                          {event.maxPhotos && (
                            <div className="flex justify-between py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Max Photos</span>
                              <span className="font-semibold">{event.maxPhotos}</span>
                            </div>
                          )}
                          {event.expiresAt && (
                            <div className="flex justify-between py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Expires</span>
                              <span>{formatDate(event.expiresAt)}</span>
                            </div>
                          )}
                          {event.purchase && (
                            <div className="flex justify-between py-1 border-b border-border/40">
                              <span className="text-muted-foreground">Purchase</span>
                              <span className="font-mono text-xs">{event.purchase.slice(0, 8)}...</span>
                            </div>
                          )}
                          <div className="pt-2">
                            <Button size="sm" variant="outline" onClick={() => openConvertDialog()} className="w-full">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Convert to Subscription
                            </Button>
                          </div>
                        </>
                      )}
                      {event.totalDevices !== undefined && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Devices</span>
                          <span>{event.totalDevices}</span>
                        </div>
                      )}
                      {event.whitelabelId && (
                        <div className="flex justify-between py-1 border-b border-border/40">
                          <span className="text-muted-foreground">Whitelabel</span>
                          <span className="font-mono text-xs">{event.whitelabelId}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hosts */}
                  {event.hosts && event.hosts.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-border/40">
                      <div className="text-sm text-muted-foreground mb-2">Hosts</div>
                      <div className="flex flex-wrap gap-3">
                        {event.hosts.map((host, idx) => (
                          <div key={idx} className="text-sm bg-muted/30 px-3 py-2 rounded">
                            {host.name && <span className="font-medium">{host.name}</span>}
                            {host.email && <span className="text-muted-foreground ml-2">{host.email}</span>}
                            {host.mobileNumber && <span className="text-muted-foreground ml-2">{host.mobileNumber}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* Uploads Left Calculation Breakdown */}
          {event?.uploadsLeftCalculation && (
            <UploadsLeftCalculationCard calculation={event.uploadsLeftCalculation} />
          )}

          {/* Raw JSON Document */}
          {event && (
            <RawJsonViewer data={event} title="Raw Event JSON" />
          )}

          {/* Edit Dialog */}
          {event && (
            <EventEditDialog
              event={event}
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSuccess={handleEditSuccess}
            />
          )}

          {/* Recover Event Dialog */}
          <Dialog open={recoverDialogOpen} onOpenChange={setRecoverDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Recover Archived Event</DialogTitle>
                <DialogDescription>
                  Are you sure you want to recover this archived event?
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Important:</strong> Only the event will be restored. Albums and photos that were deleted will <strong>NOT</strong> be restored.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRecoverDialogOpen(false)}
                  disabled={recovering}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecoverEvent}
                  disabled={recovering}
                  variant="default"
                >
                  {recovering ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Recovering...
                    </>
                  ) : (
                    "Recover Event"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Convert to Subscription Dialog */}
          <Dialog open={convertDialogOpen} onOpenChange={(open) => {
            setConvertDialogOpen(open);
            if (!open) {
              setUserSubscription(null);
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convert Event to Subscription</DialogTitle>
                <DialogDescription>
                  Convert this pack-based event to a subscription-based event.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                {loadingSubscription ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading subscription info...</span>
                  </div>
                ) : userSubscription ? (
                  <>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <div className="text-sm text-green-800 dark:text-green-200">
                        <strong>Active Subscription Found</strong>
                        <div className="mt-2 space-y-1">
                          <p><span className="font-medium">Subscription ID:</span> <span className="font-mono text-xs">{userSubscription.id}</span></p>
                          <p><span className="font-medium">Max Photos:</span> {userSubscription.maxPhotosLimit?.toLocaleString() ?? 'N/A'}</p>
                          <p><span className="font-medium">Current Photos:</span> {userSubscription.currentPhotosCount?.toLocaleString() ?? 0}</p>
                          <p><span className="font-medium">Events:</span> {userSubscription.currentEvents ?? 0} / {userSubscription.maxPhotosLimit ? 'unlimited' : 'N/A'}</p>
                          {userSubscription.expiresAt && (
                            <p><span className="font-medium">Expires:</span> {new Date(userSubscription.expiresAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {event && (
                      <div className="text-sm border rounded-lg p-3 bg-muted/50">
                        <p className="font-medium mb-1">Event to Convert:</p>
                        <p>Name: {event.name}</p>
                        <p>Current Photos: {event.currentPhotosCount ?? 0}</p>
                        <p>User ID: {event.userId}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="text-sm text-red-800 dark:text-red-200">
                      <strong>No Active Subscription Found</strong>
                      <p className="mt-1">This user does not have an active subscription. The event cannot be converted.</p>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConvertDialogOpen(false);
                    setUserSubscription(null);
                  }}
                  disabled={converting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConvertToSubscription}
                  disabled={converting || !userSubscription || loadingSubscription}
                  variant="default"
                >
                  {converting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert Event"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}

