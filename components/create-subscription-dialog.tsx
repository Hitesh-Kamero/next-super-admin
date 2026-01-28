"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, Calendar } from "lucide-react";
import { getPlans, createSubscription, type SubscriptionPlan } from "@/lib/subscriptions-api";
import { uploadFile } from "@/lib/upload-api";

interface CreateSubscriptionDialogProps {
  targetId: string;
  targetType: "user" | "whitelabel";
  targetName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSubscriptionDialog({
  targetId,
  targetType,
  targetName,
  open,
  onOpenChange,
  onSuccess,
}: CreateSubscriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  // Load plans when dialog opens
  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open]);

  const loadPlans = async () => {
    setPlansLoading(true);
    try {
      const fetchedPlans = await getPlans();
      // Filter plans based on currency
      setPlans(fetchedPlans);
    } catch (error: any) {
      toast.error(error.message || "Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    if (currency === "INR") {
      return !plan.disableINR;
    }
    return true;
  });

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const formatCurrency = (amount: number | undefined, curr: string) => {
    if (amount === undefined) return "N/A";
    if (curr === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
      }).format(amount / 100); // Convert paise to rupees
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlanId) {
      toast.error("Please select a subscription plan");
      return;
    }
    if (!proofFile) {
      toast.error("Please upload payment proof");
      return;
    }
    if (!acknowledged) {
      toast.error("Please acknowledge the payment confirmation");
      return;
    }

    setLoading(true);
    try {
      // Upload proof file first
      toast.info("Uploading payment proof...");
      const proofFileUrl = await uploadFile(proofFile, "subscription_proof");

      // Create subscription
      toast.info("Creating subscription...");
      const result = await createSubscription({
        targetId,
        targetType,
        packageId: selectedPlanId,
        startDate: new Date(startDate).toISOString(),
        proofFileUrl,
        currency,
      });

      toast.success(result.message || "Subscription created successfully");
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setSelectedPlanId("");
      setProofFile(null);
      setAcknowledged(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Subscription</DialogTitle>
          <DialogDescription>
            Create a new subscription for {targetType === "user" ? "user" : "whitelabel"}: {targetName || targetId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Currency Selection */}
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as "INR" | "USD")}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR (Indian Rupee)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Plan Selection */}
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            {plansLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading plans...
              </div>
            ) : (
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.uploadLimit?.toLocaleString()} photos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Plan Details */}
          {selectedPlan && (
            <div className="rounded-lg border p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Photo Limit:</span>
                <span>{selectedPlan.uploadLimit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span>{selectedPlan.interval === 3 ? "Quarterly (3 months)" : "Yearly (12 months)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">
                  {currency === "INR" 
                    ? formatCurrency(selectedPlan.totalAmountINR, "INR")
                    : formatCurrency(selectedPlan.amountUSD, "USD")
                  }
                </span>
              </div>
              {currency === "INR" && selectedPlan.gstAmountINR && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>GST (18%):</span>
                  <span>{formatCurrency(selectedPlan.gstAmountINR, "INR")}</span>
                </div>
              )}
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Proof Upload */}
          <div className="space-y-2">
            <Label htmlFor="proofFile">Payment Proof</Label>
            <div className="flex items-center gap-2">
              <Input
                id="proofFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            {proofFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {proofFile.name}
              </p>
            )}
          </div>

          {/* Acknowledgment */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="acknowledge"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            <label
              htmlFor="acknowledge"
              className="text-sm text-red-600 font-medium leading-tight cursor-pointer"
            >
              I acknowledge that payment for this subscription has been received in Kamero&apos;s account and I have collected the screenshot from the client.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedPlanId || !proofFile || !acknowledged}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Subscription"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
