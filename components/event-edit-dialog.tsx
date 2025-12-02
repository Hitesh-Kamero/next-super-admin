"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  updateEvent,
  type AdminEventDetails,
  type AdminEventUpdateRequest,
} from "@/lib/events-api";

interface EventEditDialogProps {
  event: AdminEventDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EventEditDialog({
  event,
  open,
  onOpenChange,
  onSuccess,
}: EventEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: event.name || "",
    hashId: event.hashId || "",
    maxPhotos: event.maxPhotos || "",
    expiresAt: event.expiresAt ? new Date(event.expiresAt).toISOString().slice(0, 16) : "",
    eventDate: event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "",
    isArchived: event.isArchived || false,
    isEventDisabled: event.isEventDisabled || false,
    isGuestUploadEnabled: event.isGuestUploadEnabled || false,
    guestMaxPhotos: event.guestMaxPhotos?.toString() || "",
    isRegistrationRequired: event.isRegistrationRequired || false,
    isPrivateFaces: event.isPrivateFaces || false,
    allowEnquiry: event.allowEnquiry || false,
    reason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: AdminEventUpdateRequest = {
        eventId: event.id,
      };

      // Only include changed fields
      if (formData.name !== event.name) {
        updateData.name = formData.name;
      }
      if (formData.hashId !== (event.hashId || "")) {
        updateData.hashId = formData.hashId;
      }
      if (formData.maxPhotos !== (event.maxPhotos || "")) {
        updateData.maxPhotos = parseInt(formData.maxPhotos, 10);
      }
      if (formData.expiresAt && formData.expiresAt !== (event.expiresAt ? new Date(event.expiresAt).toISOString().slice(0, 16) : "")) {
        updateData.expiresAt = new Date(formData.expiresAt).toISOString();
      }
      if (formData.eventDate && formData.eventDate !== (event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : "")) {
        updateData.eventDate = new Date(formData.eventDate).toISOString();
      }
      if (formData.isArchived !== (event.isArchived || false)) {
        updateData.isArchived = formData.isArchived;
      }
      if (formData.isEventDisabled !== (event.isEventDisabled || false)) {
        updateData.isEventDisabled = formData.isEventDisabled;
      }
      if (formData.isGuestUploadEnabled !== (event.isGuestUploadEnabled || false)) {
        updateData.isGuestUploadEnabled = formData.isGuestUploadEnabled;
      }
      if (formData.guestMaxPhotos !== (event.guestMaxPhotos?.toString() || "")) {
        updateData.guestMaxPhotos = parseInt(formData.guestMaxPhotos, 10);
      }
      if (formData.isRegistrationRequired !== (event.isRegistrationRequired || false)) {
        updateData.isRegistrationRequired = formData.isRegistrationRequired;
      }
      if (formData.isPrivateFaces !== (event.isPrivateFaces || false)) {
        updateData.isPrivateFaces = formData.isPrivateFaces;
      }
      if (formData.allowEnquiry !== (event.allowEnquiry || false)) {
        updateData.allowEnquiry = formData.allowEnquiry;
      }
      if (formData.reason) {
        updateData.reason = formData.reason;
      }

      // Check if there are any changes
      const changedFields = Object.keys(updateData).filter(key => key !== "eventId" && key !== "reason");
      if (changedFields.length === 0) {
        toast.error("No changes to save");
        setLoading(false);
        return;
      }

      const result = await updateEvent(updateData);
      toast.success(result.message || "Event updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update event properties. All changes are audit logged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashId">Hash ID</Label>
                <Input
                  id="hashId"
                  value={formData.hashId}
                  onChange={(e) => setFormData({ ...formData, hashId: e.target.value })}
                  placeholder="6-digit code"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxPhotos">Max Photos</Label>
                <Input
                  id="maxPhotos"
                  type="number"
                  value={formData.maxPhotos}
                  onChange={(e) => setFormData({ ...formData, maxPhotos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestMaxPhotos">Guest Max Photos</Label>
                <Input
                  id="guestMaxPhotos"
                  type="number"
                  value={formData.guestMaxPhotos}
                  onChange={(e) => setFormData({ ...formData, guestMaxPhotos: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expires At</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium">Event Settings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isArchived">Archived (Deleted)</Label>
                  <Switch
                    id="isArchived"
                    checked={formData.isArchived}
                    onCheckedChange={(checked) => setFormData({ ...formData, isArchived: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isEventDisabled">Disabled</Label>
                  <Switch
                    id="isEventDisabled"
                    checked={formData.isEventDisabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEventDisabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isGuestUploadEnabled">Guest Upload</Label>
                  <Switch
                    id="isGuestUploadEnabled"
                    checked={formData.isGuestUploadEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isGuestUploadEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isRegistrationRequired">Require Registration</Label>
                  <Switch
                    id="isRegistrationRequired"
                    checked={formData.isRegistrationRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRegistrationRequired: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPrivateFaces">Private Faces</Label>
                  <Switch
                    id="isPrivateFaces"
                    checked={formData.isPrivateFaces}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPrivateFaces: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowEnquiry">Allow Enquiry</Label>
                  <Switch
                    id="allowEnquiry"
                    checked={formData.allowEnquiry}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowEnquiry: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update (optional)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Provide a reason for this update (for audit logs)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
