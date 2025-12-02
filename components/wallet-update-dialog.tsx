"use client";

import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowUp, ArrowDown, Upload, X, FileImage } from "lucide-react";
import { updateWallet, type AdminWalletUpdateRequest } from "@/lib/users-api";
import { uploadFile } from "@/lib/upload-api";

interface WalletUpdateDialogProps {
  targetId: string;
  targetType: "user" | "whitelabel";
  currentBalance: number; // in paise
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WalletUpdateDialog({
  targetId,
  targetType,
  currentBalance,
  open,
  onOpenChange,
  onSuccess,
}: WalletUpdateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    newBalanceRupees: (currentBalance / 100).toFixed(2),
    reason: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const newBalancePaise = Math.round(parseFloat(formData.newBalanceRupees || "0") * 100);
  const difference = newBalancePaise - currentBalance;
  const differenceRupees = difference / 100;
  const isAddingBalance = difference > 0;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Please select an image or PDF file");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setProofFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setProofPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const clearProofFile = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim()) {
      toast.error("Reason is required for wallet updates");
      return;
    }

    if (difference === 0) {
      toast.error("New balance is same as current balance");
      return;
    }

    // Require payment proof when adding balance
    if (isAddingBalance && !proofFile) {
      toast.error("Payment proof is required when adding balance");
      return;
    }

    setLoading(true);

    try {
      let proofFileUrl: string | undefined;

      // Upload proof file if provided
      if (proofFile) {
        setUploading(true);
        try {
          proofFileUrl = await uploadFile(proofFile, "wallet-proofs");
        } catch (error: any) {
          toast.error(error.message || "Failed to upload payment proof");
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const updateData: AdminWalletUpdateRequest = {
        targetId,
        targetType,
        newBalance: newBalancePaise,
        reason: formData.reason,
        proofFileUrl,
      };

      const result = await updateWallet(updateData);
      toast.success(result.message || "Wallet updated successfully");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        newBalanceRupees: (currentBalance / 100).toFixed(2),
        reason: "",
      });
      clearProofFile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setFormData({
        newBalanceRupees: (currentBalance / 100).toFixed(2),
        reason: "",
      });
      clearProofFile();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Wallet Balance</DialogTitle>
          <DialogDescription>
            Adjust the wallet balance for this {targetType}. All changes are audit logged.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Balance</Label>
              <div className="text-2xl font-bold">
                {(currentBalance / 100).toFixed(2)} INR
              </div>
              <div className="text-sm text-muted-foreground">
                ({currentBalance} paise)
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newBalance">New Balance (in Rupees)</Label>
              <Input
                id="newBalance"
                type="number"
                step="0.01"
                value={formData.newBalanceRupees}
                onChange={(e) => setFormData({ ...formData, newBalanceRupees: e.target.value })}
                placeholder="Enter new balance in rupees"
              />
            </div>

            {difference !== 0 && (
              <div className={`p-3 rounded-lg ${difference > 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2">
                  {difference > 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {difference > 0 ? '+' : ''}{differenceRupees.toFixed(2)} INR
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {difference > 0 ? 'Adding to' : 'Deducting from'} wallet
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Update (required)</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Provide a reason for this wallet update (for audit logs)"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Payment Proof {isAddingBalance && <span className="text-red-500">*</span>}
              </Label>
              <div className="text-xs text-muted-foreground mb-2">
                {isAddingBalance
                  ? "Required when adding balance. Upload payment screenshot or receipt."
                  : "Optional. Upload supporting documentation if available."
                }
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!proofFile ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              ) : (
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">{proofFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(proofFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearProofFile}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {proofPreview && (
                    <div className="mt-2">
                      <img
                        src={proofPreview}
                        alt="Payment proof preview"
                        className="max-h-32 rounded border object-contain"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || difference === 0 || !formData.reason.trim() || (isAddingBalance && !proofFile)}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Balance"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
