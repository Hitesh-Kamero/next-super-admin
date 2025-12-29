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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import {
  restoreUserAccount,
  type AdminUserDetails,
} from "@/lib/users-api";

interface UserRestoreDialogProps {
  user: AdminUserDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UserRestoreDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserRestoreDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    if (!user.userId) {
      toast.error("User ID is required");
      return;
    }

    setLoading(true);
    try {
      await restoreUserAccount({
        userId: user.userId,
        reason: reason.trim() || undefined,
      });
      toast.success("Account restored successfully");
      onSuccess();
      onOpenChange(false);
      setReason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to restore account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restore Deleted Account
          </DialogTitle>
          <DialogDescription>
            This will restore the account for{" "}
            <span className="font-semibold">
              {user.email || user.userId}
            </span>
            . The user will be able to log in again after restoration.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Restoration (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for restoring this account..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          {user.accountSelfDeletedAt && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Account deleted at: </span>
              <span>{new Date(user.accountSelfDeletedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleRestore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



