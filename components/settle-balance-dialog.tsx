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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, X, FileImage } from "lucide-react";
import {
  settleSellerWallet,
  type AdminSellerWalletItem,
  type AdminSettleSellerWalletRequest,
} from "@/lib/seller-wallets-api";
import { uploadFile } from "@/lib/upload-api";

interface SettleBalanceDialogProps {
  wallet: AdminSellerWalletItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SettleBalanceDialog({
  wallet,
  open,
  onOpenChange,
  onSuccess,
}: SettleBalanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [settlementAmount, setSettlementAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form
      setCurrency("INR");
      setSettlementAmount("");
      setNotes("");
      clearProofFile();
    }
    onOpenChange(newOpen);
  };

  const getMaxSettlementAmount = () => {
    if (currency === "INR") {
      return wallet.inrBalance;
    }
    return wallet.usdBalance;
  };

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

    const amount = parseFloat(settlementAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid settlement amount");
      return;
    }

    const maxAmount = getMaxSettlementAmount();
    if (amount > maxAmount) {
      toast.error(
        `Settlement amount cannot exceed current balance: ${currency === "INR" ? "₹" : "$"}${maxAmount.toFixed(2)}`
      );
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
        proofFileUrl = await uploadFile(proofFile, "payment_proof");
      } catch (error: any) {
        toast.error(error.message || "Failed to upload payment proof");
        setLoading(false);
        setUploading(false);
        return;
      }
      setUploading(false);

      // Prepare request data
      const requestData: AdminSettleSellerWalletRequest = {
        sellerId: wallet.sellerId,
        currency,
        settlementAmount: amount,
        paymentProofUrl: proofFileUrl,
        notes: notes.trim() || undefined,
      };

      // Call API
      const result = await settleSellerWallet(requestData);

      toast.success(result.message || "Settlement processed successfully");
      onSuccess();
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to process settlement");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, curr: "INR" | "USD") => {
    return new Intl.NumberFormat(curr === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const currentBalance = currency === "INR" ? wallet.inrBalance : wallet.usdBalance;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settle Balance</DialogTitle>
          <DialogDescription>
            Process a payment settlement for this seller. The amount will be deducted from the seller's wallet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Seller Info */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Seller Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Name: </span>
                  {wallet.sellerName || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Email: </span>
                  {wallet.sellerEmail || "N/A"}
                </div>
                <div>
                  <span className="font-medium">Seller ID: </span>
                  <span className="font-mono text-xs">{wallet.sellerId}</span>
                </div>
                <div>
                  <span className="font-medium">Wallet Type: </span>
                  {wallet.walletType}
                </div>
              </div>
            </div>

            {/* Current Balances */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Current Balances</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">INR: </span>
                  <span className="font-bold">{formatCurrency(wallet.inrBalance, "INR")}</span>
                </div>
                <div>
                  <span className="font-medium">USD: </span>
                  <span className="font-bold">{formatCurrency(wallet.usdBalance, "USD")}</span>
                </div>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Currency <span className="text-red-500">*</span></Label>
              <Select value={currency} onValueChange={(value) => {
                setCurrency(value as "INR" | "USD");
                setSettlementAmount(""); // Reset amount when currency changes
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Available balance: {formatCurrency(currentBalance, currency)}
              </p>
            </div>

            {/* Settlement Amount */}
            <div className="space-y-2">
              <Label>
                Settlement Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance}
                placeholder={`Enter amount (max: ${formatCurrency(currentBalance, currency)})`}
                value={settlementAmount}
                onChange={(e) => setSettlementAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(currentBalance, currency)}
              </p>
            </div>

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

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this settlement..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !settlementAmount || !proofFile}
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
              ) : (
                "Settle Balance"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}













