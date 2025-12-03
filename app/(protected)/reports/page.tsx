"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth-guard";
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
  Image,
  Camera,
  DollarSign,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ReportsPage() {
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    // Default to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
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

  const formatNumber = (num: number) => {
    return num.toLocaleString();
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

          <h1 className="text-2xl font-semibold mb-6">Face Analytics Reports</h1>

          {/* Date Range Selector */}
          <Card className="p-6 mb-6">
            <h2 className="text-lg font-medium mb-4">Select Date Range</h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleFetchReport} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Fetch Report
              </Button>
            </div>
          </Card>

          {report && (
            <>
              {/* AWS Cost Summary */}
              <Card className="p-6 mb-6 border-l-4 border-l-red-500">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-medium">AWS Rekognition Cost Summary</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">
                      {formatNumber(report.awsCost.totalImagesProcessed)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Images Processed
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatNumber(report.awsCost.photoIndexingImages)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Photo Indexing
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatNumber(report.awsCost.selfieSearchImages)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Selfie Search (Paid)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(report.awsCost.freeOperations)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Free Operations
                    </div>
                  </div>
                </div>
              </Card>

              {/* Photo Indexing Stats */}
              <Card className="p-6 mb-6 border-l-4 border-l-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-blue-500" />
                    <h2 className="text-lg font-medium">Photo Indexing Statistics</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadPhotoIndexingCSV}
                    disabled={downloadingPhoto}
                  >
                    {downloadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download CSV
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(report.photoIndexing.totalPhotosIndexed)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Photos Indexed
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(report.photoIndexing.totalFacesDetected)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Faces Detected
                    </div>
                  </div>
                </div>
              </Card>

              {/* Selfie Search Stats */}
              <Card className="p-6 mb-6 border-l-4 border-l-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-500" />
                    <h2 className="text-lg font-medium">Selfie Search Statistics</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSelfieSearchCSV}
                    disabled={downloadingSelfie}
                  >
                    {downloadingSelfie ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download CSV
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(report.selfieSearch.totalSearches)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Searches
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {formatNumber(report.selfieSearch.successfulSearches)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Successful
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">
                        {formatNumber(report.selfieSearch.failedSearches)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Failed
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold">
                      {formatNumber(report.selfieSearch.totalPhotosFound)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Photos Found
                    </div>
                  </div>
                </div>

                {/* Search Type Breakdown */}
                <h3 className="text-md font-medium mb-3 mt-6">Search Type Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {formatNumber(report.selfieSearch.searchByImage)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      By Image (Paid)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <div className="text-xl font-bold text-orange-600">
                      {formatNumber(report.selfieSearch.searchByURL)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      By URL (Paid)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-xl font-bold text-green-600">
                      {formatNumber(report.selfieSearch.searchByFaceId)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      By FaceId (Free)
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
