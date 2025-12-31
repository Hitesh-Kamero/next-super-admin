import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface FaceAnalyticsReportAwsCost {
  totalImagesProcessed: number;
  photoIndexingImages: number;
  selfieSearchImages: number;
  freeOperations: number;
  // MTCNN cost savings
  photosSkippedByMTCNN: number;
  mtcnnCostSaved: number;
  estimatedCostSavedUSD: number;
  mtcnnSuccessful: number;
  mtcnnFailed: number;
}

export interface FaceAnalyticsReportPhotoIndexing {
  totalPhotosIndexed: number;
  totalFacesDetected: number;
  // MTCNN stats
  photosSkippedByMTCNN: number;
  mtcnnSuccessful: number;
  mtcnnFailed: number;
}

export interface FaceAnalyticsReportSelfieSearch {
  totalSearches: number;
  successfulSearches: number;
  failedSearches: number;
  searchByImage: number;
  searchByFaceId: number;
  searchByURL: number;
  totalPhotosFound: number;
}

export interface FaceAnalyticsReport {
  startDate: string;
  endDate: string;
  awsCost: FaceAnalyticsReportAwsCost;
  photoIndexing: FaceAnalyticsReportPhotoIndexing;
  selfieSearch: FaceAnalyticsReportSelfieSearch;
}

/**
 * Get face analytics report for a date range
 */
export async function getFaceAnalyticsReport(
  startDate: string,
  endDate: string
): Promise<FaceAnalyticsReport> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/reports/face-analytics?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get face analytics report" }));
    throw new Error(error.message || "Failed to get face analytics report");
  }

  return response.json();
}

/**
 * Download photo indexing CSV
 */
export async function downloadPhotoIndexingCSV(
  startDate: string,
  endDate: string
): Promise<Blob> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/reports/face-analytics/photo-indexing-csv?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to download photo indexing CSV" }));
    throw new Error(error.message || "Failed to download photo indexing CSV");
  }

  return response.blob();
}

/**
 * Download selfie search CSV (event-wise aggregated)
 */
export async function downloadSelfieSearchCSV(
  startDate: string,
  endDate: string
): Promise<Blob> {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/reports/face-analytics/selfie-search-csv?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to download selfie search CSV" }));
    throw new Error(error.message || "Failed to download selfie search CSV");
  }

  return response.blob();
}
