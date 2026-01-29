"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, X, FileImage, Calendar } from "lucide-react";
import {
  addOnSubscription,
  upgradeSubscription,
  getPlans,
  type AdminSubscriptionDetails,
  type SubscriptionPlan,
} from "@/lib/subscriptions-api";
import { uploadFile } from "@/lib/upload-api";

interface SubscriptionUpdateDialogProps {
  subscription: AdminSubscriptionDetails;
  updateType: "addon" | "upgrade";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SubscriptionUpdateDialog({
  subscription,
  updateType,
  open,
  onOpenChange,
  onSuccess,
}: SubscriptionUpdateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available plans from API when dialog opens
  useEffect(() => {
    if (open) {
      setLoadingPlans(true);
      getPlans()
        .then((plans) => {
          if (updateType === "upgrade") {
            // For upgrades, show only plans with higher photo limit
            const filteredPlans = plans.filter(
              (plan) => (plan.maxPhotosLimit ?? 0) > (subscription.maxPhotosLimit || 0)
            );
            setAvailablePlans(filteredPlans);
          } else {
            // For addons, show all plans (they add to existing limit)
            setAvailablePlans(plans);
          }
        })
        .catch((error) => {
          console.error("Failed to load plans:", error);
          toast.error("Failed to load subscription plans");
          setAvailablePlans([]);
        })
        .finally(() => {
          setLoadingPlans(false);
        });
      setSelectedPlanId("");
      clearProofFile();
    }
  }, [open, subscription.maxPhotosLimit, updateType]);

  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId);

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

    if (!selectedPlanId) {
      toast.error("Please select a subscription pack");
      return;
    }

    if (!proofFile) {
      toast.error("Payment proof is required");
      return;
    }

    setLoading(true);

    try {
      // Upload proof file
      setUploading(true);
      let proofFileUrl: string;
      try {
        // Store payment proof under the admin subscription proofs upload type
        proofFileUrl = await uploadFile(proofFile, "subscription_proof");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload payment proof");
        setLoading(false);
        setUploading(false);
        return;
      }
      setUploading(false);

      // Prepare request data
      const requestData = {
        subscriptionId: subscription.id,
        packageId: selectedPlanId,
        startDate: subscription.createdAt || new Date().toISOString(),
        proofFileUrl,
      };

      // Call appropriate API
      let result;
      if (updateType === "addon") {
        result = await addOnSubscription(requestData);
      } else {
        result = await upgradeSubscription(requestData);
      }

      toast.success(result.message || `Subscription ${updateType} successful`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || `Failed to ${updateType} subscription`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNewLimit = () => {
    if (!selectedPlan) return 0;
    if (updateType === "addon") {
      return (
        (subscription.maxPhotosLimit || 0) + (selectedPlan.maxPhotosLimit ?? 0)
      );
    }
    return selectedPlan.maxPhotosLimit ?? subscription.maxPhotosLimit ?? 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {updateType === "addon" ? "Add On Pack" : "Upgrade Plan"}
          </DialogTitle>
          <DialogDescription>
            {updateType === "addon"
              ? "Add additional photo quota to the existing subscription."
              : "Upgrade to a higher tier subscription plan."}
            {" "}Payment proof is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Current Pack Info */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Pack Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Name: </span>
                  {subscription.name || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Max Photos: </span>
                  {subscription.maxPhotosLimit?.toLocaleString() || "N/A"}
                </div>
                <div>
                  <span className="font-medium">User/Whitelabel: </span>
                  <span className="font-mono text-xs">
                    {subscription.whitelabelId === "whitelabel-0"
                      ? subscription.userId
                      : subscription.whitelabelId}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Expires: </span>
                  {subscription.expiresAt
                    ? new Date(subscription.expiresAt).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label>Select Subscription Pack</Label>
              {loadingPlans ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading plans...
                </div>
              ) : (
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a pack..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{plan.name}</span>
                          <span className="text-muted-foreground ml-4">
                            {(plan.maxPhotosLimit ?? 0).toLocaleString()} photos
                            {plan.amountINR && ` - ${formatCurrency(plan.amountINR)}`}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!loadingPlans && availablePlans.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {updateType === "upgrade"
                    ? "No higher plans available for upgrade."
                    : "No plans available."}
                </p>
              )}
            </div>

            {/* New Limit Preview */}
            {selectedPlan && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                  After {updateType === "addon" ? "Add-On" : "Upgrade"}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">New Max Photos: </span>
                    <span className="font-bold">{getNewLimit().toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {updateType === "addon" ? "Added: " : "New Plan: "}
                    </span>
                    {updateType === "addon"
                      ? `+${(selectedPlan.maxPhotosLimit ?? 0).toLocaleString()}`
                      : selectedPlan.name}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Proof Upload */}
            <div className="space-y-2">
              <Label>
                Payment Proof <span className="text-red-500">*</span>
              </Label>
              <div className="text-xs text-muted-foreground mb-2">
                Upload payment screenshot or receipt (required)
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
                      <span className="text-sm truncate max-w-[200px]">
                        {proofFile.name}
                      </span>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedPlanId || !proofFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : updateType === "addon" ? (
                "Apply Add-On"
              ) : (
                "Upgrade Plan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
