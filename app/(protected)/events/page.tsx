"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getEvent, type AdminEventDetails } from "@/lib/events-api";
import { EventEditDialog } from "@/components/event-edit-dialog";
import { FTPCredentialsCard } from "@/components/ftp-credentials-card";
import { toast } from "sonner";
import { Search, Loader2, Calendar, User, Hash, Tag, ArrowLeft, Lock, Pencil } from "lucide-react";

export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getEventTypeLabel = (eventType?: number) => {
    if (eventType === 1) return "Subscription-based";
    if (eventType === 0) return "Normal (Pack-based)";
    return "Unknown";
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
            <h1 className="text-2xl font-semibold mb-6">Event Search</h1>
            <div className="space-y-4">
              <div>
                <Label htmlFor="search-mobile">Search Event</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="search-mobile"
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
            </div>
          </div>

          {/* Desktop: With card wrapper */}
          <div className="hidden md:block">
            <Card className="p-6 mb-6">
              <h1 className="text-2xl font-semibold mb-6">Event Search</h1>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-desktop">Search Event</Label>
                  <div className="flex gap-2 mt-2">
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
              </div>
            </Card>
          </div>

          {event && (
            <div className="space-y-6">
              {/* Mobile: Direct content cards */}
              <div className="md:hidden space-y-4">
                <Card className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{event.name}</h2>
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
                        <span className="font-mono text-xs">{event.subscriptionId}</span>
                      </div>
                    )}
                    {event.eventType === 0 && (
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold">{event.name}</h2>
                    <Button onClick={() => setEditDialogOpen(true)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Event
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-semibold mb-3">Basic Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Document ID: </span><span className="font-mono text-xs">{event.id}</span></div>
                        <div><span className="font-medium">Channel: </span><span>{event.channel}</span></div>
                        {event.hashId && <div><span className="font-medium">Hash ID: </span><span>{event.hashId}</span></div>}
                        {event.pin && <div><span className="font-medium">Pin: </span><span className="font-mono">{event.pin}</span></div>}
                        <div>
                          <span className="font-medium">User ID: </span>
                          <button
                            onClick={() => router.push(`/users?userId=${encodeURIComponent(event.userId)}`)}
                            className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer"
                          >
                            {event.userId}
                          </button>
                        </div>
                        <div><span className="font-medium">State: </span><Badge variant="outline">{event.state}</Badge></div>
                        <div><span className="font-medium">Created: </span><span>{formatDate(event.createdAt)}</span></div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Event Type</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Type: </span>
                          <Badge variant="outline">{getEventTypeLabel(event.eventType)}</Badge>
                        </div>
                        {event.eventType === 1 && event.subscriptionId && (
                          <div>
                            <span className="font-medium">Subscription ID: </span>
                            <span className="font-mono text-xs">{event.subscriptionId}</span>
                          </div>
                        )}
                        {event.eventType === 0 && (
                          <>
                            {event.maxPhotos && (
                              <div><span className="font-medium">Max Photos: </span><span>{event.maxPhotos}</span></div>
                            )}
                            {event.expiresAt && (
                              <div><span className="font-medium">Expires At: </span><span>{formatDate(event.expiresAt)}</span></div>
                            )}
                            {event.purchase && (
                              <div><span className="font-medium">Purchase ID: </span><span className="font-mono text-xs">{event.purchase}</span></div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {event.hosts && event.hosts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Hosts</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {event.hosts.map((host, idx) => (
                          <Card key={idx} className="p-3">
                            {host.name && <div><span className="font-medium">Name: </span>{host.name}</div>}
                            {host.email && <div><span className="font-medium">Email: </span>{host.email}</div>}
                            {host.mobileNumber && <div><span className="font-medium">Mobile: </span>{host.mobileNumber}</div>}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Face Recognition</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Supported: </span>
                          <Badge variant={event.isFacesSupported ? "default" : "secondary"}>
                            {event.isFacesSupported ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {event.facesEnabledAt && (
                          <div><span className="font-medium">Enabled At: </span><span>{formatDate(event.facesEnabledAt)}</span></div>
                        )}
                        {event.facesExpiresAt && (
                          <div><span className="font-medium">Expires At: </span><span>{formatDate(event.facesExpiresAt)}</span></div>
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
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Guest Upload</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Enabled: </span>
                          <Badge variant={event.isGuestUploadEnabled ? "default" : "secondary"}>
                            {event.isGuestUploadEnabled ? "Yes" : "No"}
                          </Badge>
                        </div>
                        {event.guestMaxPhotos && (
                          <div><span className="font-medium">Max Photos: </span><span>{event.guestMaxPhotos}</span></div>
                        )}
                        {event.guestPhotosCount !== undefined && (
                          <div><span className="font-medium">Current Count: </span><span>{event.guestPhotosCount}</span></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Photo Statistics</h3>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {event.currentPhotosCount !== undefined && (
                        <div>
                          <div className="font-medium">Current</div>
                          <div className="text-2xl font-bold">{event.currentPhotosCount}</div>
                        </div>
                      )}
                      {event.uploadedPhotosCount !== undefined && (
                        <div>
                          <div className="font-medium">Uploaded</div>
                          <div className="text-2xl font-bold">{event.uploadedPhotosCount}</div>
                        </div>
                      )}
                      {event.deletedPhotosCount !== undefined && (
                        <div>
                          <div className="font-medium">Deleted</div>
                          <div className="text-2xl font-bold">{event.deletedPhotosCount}</div>
                        </div>
                      )}
                      {event.uploadsLeft !== undefined && (
                        <div>
                          <div className="font-medium">Uploads Left</div>
                          <div className="text-2xl font-bold">{event.uploadsLeft}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* FTP Credentials */}
          {event && (
            <div className="mb-6">
              <FTPCredentialsCard eventDocId={event.id} eventName={event.name} />
            </div>
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
        </main>
      </div>
    </AuthGuard>
  );
}

