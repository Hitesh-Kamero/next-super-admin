"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OwnerGuard } from "@/components/owner-guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFaceAnalyticsReport,
  downloadPhotoIndexingCSV,
  downloadSelfieSearchCSV,
  type FaceAnalyticsReport,
} from "@/lib/reports-api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Download,
  Search,
  ImageIcon,
  Camera,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function FaceAnalyticsReportPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [downloadingPhoto, setDownloadingPhoto] = useState(false);
  const [downloadingSelfie, setDownloadingSelfie] = useState(false);
  const [report, setReport] = useState<FaceAnalyticsReport | null>(null);

  const handleFetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const result = await getFaceAnalyticsReport(startDate, endDate);
      setReport(result);
      toast.success("Report fetched successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPhotoIndexingCSV = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setDownloadingPhoto(true);
    try {
      const blob = await downloadPhotoIndexingCSV(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photo-indexing-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Photo indexing CSV downloaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to download CSV");
    } finally {
      setDownloadingPhoto(false);
    }
  };

  const handleDownloadSelfieSearchCSV = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    setDownloadingSelfie(true);
    try {
      const blob = await downloadSelfieSearchCSV(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `selfie-search-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Selfie search CSV downloaded");
    } catch (error: any) {
      toast.error(error.message || "Failed to download CSV");
    } finally {
      setDownloadingSelfie(false);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString();
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/reports")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Face Analytics Report</h1>
          </div>

          {/* Date Range Selector - Compact */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <Label htmlFor="startDate" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 mt-1"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <Label htmlFor="endDate" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 mt-1"
                />
              </div>
              <Button onClick={handleFetchReport} disabled={loading} size="sm">
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Fetch</span>
              </Button>
            </div>
          </Card>

          {report && (
            <div className="space-y-4">
              {/* AWS Cost Summary - Highlighted */}
              <Card className="p-4 border-l-4 border-l-red-500">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-red-500" />
                  <h2 className="text-sm font-medium">AWS Rekognition Cost</h2>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-500">
                      {formatNumber(report.awsCost?.totalImagesProcessed)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Processed</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-xl font-semibold">
                      {formatNumber(report.awsCost?.photoIndexingImages)}
                    </div>
                    <div className="text-xs text-muted-foreground">Photo Indexing</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-xl font-semibold">
                      {formatNumber(report.awsCost?.selfieSearchImages)}
                    </div>
                    <div className="text-xs text-muted-foreground">Selfie Search</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <div className="text-xl font-semibold text-green-500">
                      {formatNumber(report.awsCost?.freeOperations)}
                    </div>
                    <div className="text-xs text-muted-foreground">Free Ops</div>
                  </div>
                </div>
              </Card>

              {/* Two Column Layout for Stats */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Photo Indexing Stats */}
                <Card className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-blue-500" />
                      <h2 className="text-sm font-medium">Photo Indexing</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadPhotoIndexingCSV}
                      disabled={downloadingPhoto}
                      className="h-7 px-2"
                    >
                      {downloadingPhoto ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {formatNumber(report.photoIndexing?.totalPhotosIndexed)}
                      </div>
                      <div className="text-xs text-muted-foreground">Photos</div>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <div className="text-2xl font-bold text-blue-500">
                        {formatNumber(report.photoIndexing?.totalFacesDetected)}
                      </div>
                      <div className="text-xs text-muted-foreground">Faces</div>
                    </div>
                  </div>
                </Card>

                {/* Selfie Search Stats */}
                <Card className="p-4 border-l-4 border-l-purple-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      <h2 className="text-sm font-medium">Selfie Search</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadSelfieSearchCSV}
                      disabled={downloadingSelfie}
                      className="h-7 px-2"
                    >
                      {downloadingSelfie ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center p-2 bg-purple-500/10 rounded-lg">
                      <div className="text-lg font-bold text-purple-500">
                        {formatNumber(report.selfieSearch?.totalSearches)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-lg font-bold text-green-500">
                          {formatNumber(report.selfieSearch?.successfulSearches)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Success</div>
                    </div>
                    <div className="text-center p-2 bg-red-500/10 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-lg font-bold text-red-500">
                          {formatNumber(report.selfieSearch?.failedSearches)}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">Failed</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <div className="text-lg font-bold">
                        {formatNumber(report.selfieSearch?.totalPhotosFound)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Found</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Search Type Breakdown - Compact */}
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-3">Search Type Breakdown</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                    <div className="text-xl font-bold text-orange-500">
                      {formatNumber(report.selfieSearch?.searchByImage)}
                    </div>
                    <div className="text-xs text-muted-foreground">By Image (Paid)</div>
                  </div>
                  <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                    <div className="text-xl font-bold text-orange-500">
                      {formatNumber(report.selfieSearch?.searchByURL)}
                    </div>
                    <div className="text-xs text-muted-foreground">By URL (Paid)</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/10 rounded-lg">
                    <div className="text-xl font-bold text-green-500">
                      {formatNumber(report.selfieSearch?.searchByFaceId)}
                    </div>
                    <div className="text-xs text-muted-foreground">By FaceId (Free)</div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </OwnerGuard>
  );
}
