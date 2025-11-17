import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface Host {
  name?: string;
  email?: string;
  mobileNumber?: string;
}

export interface VolumeDiscount {
  minQuantity: number;
  discountPercentage: number;
}

export interface ForSaleInfo {
  pricePerPhotoINR: number;
  pricePerPhotoUSD: number;
  allowBulkMyPhotos: boolean;
  bulkMyPhotosINR?: number;
  bulkMyPhotosUSD?: number;
  allowBulkAllPhotos: boolean;
  bulkAllPhotosINR?: number;
  bulkAllPhotosUSD?: number;
  volumeDiscounts?: VolumeDiscount[];
}

export interface AdminEventDetails {
  id: string;
  name: string;
  channel: string;
  hashId?: string;
  userId: string;
  whitelabelId: string;
  state: string;
  createdAt: string;
  expiresAt?: string;
  eventDate?: string;
  eventType?: number; // 0: normal, 1: subscription
  subscriptionId?: string;
  maxPhotos?: string;
  purchase?: string;
  isOpen: boolean;
  isArchived?: boolean;
  isEventExpired?: boolean;
  isEventDisabled?: boolean;
  hosts?: Host[];
  isGuestUploadEnabled?: boolean;
  guestMaxPhotos?: number;
  guestPhotosCount?: number;
  guestPhotosUploadedCount?: number;
  guestPhotosDeletedCount?: number;
  isFacesSupported: boolean;
  isPrivateFaces: boolean;
  facesEnabledAt?: string;
  facesExpiresAt?: string;
  facesLastIndexedAt?: string;
  isFacesExpired?: boolean;
  isFaceRecognitionTurnedOff?: boolean;
  faceProductId?: string;
  matchThreshold?: number;
  anonymousFaces?: boolean;
  uploadedPhotosCount?: number;
  deletedPhotosCount?: number;
  currentPhotosCount?: number;
  uploadsLeft?: number;
  views?: number;
  androidDevices?: number;
  iosDevices?: number;
  totalDevices?: number;
  isWatermarkAllowed: boolean;
  isKameroWatermarkOn: boolean;
  watermark?: string;
  watermarkVersion?: number;
  watermarkConfig?: string;
  dynamicWatermarkOff?: boolean;
  coverPhotoS3Key?: string;
  coverPhotoGCSProcessedKey?: string;
  coverPhotoId?: string;
  isCoverPhotoCustomUpload?: boolean;
  coverPhotoWidth?: number;
  coverPhotoHeight?: number;
  coverPhotoAspectRatio?: number;
  coverPhotoDominantColor?: string;
  isRegistrationRequired: boolean;
  isHighlightsEnabled?: boolean;
  pin?: string;
  allowEnquiry?: boolean;
  category?: string;
  profileId?: string;
  createdBy?: string;
  isPhotographerDeleted: boolean;
  owners?: string[];
  forSaleEvent?: boolean;
  forSaleInfo?: ForSaleInfo;
  isDownloadOff?: boolean;
  isDownloadMyPhotosOff?: boolean;
  allowAnonymousDownload?: boolean;
  preventDownloadOriginal?: boolean;
  skipappdownload?: boolean;
  lastAccessedAt?: string;
}

/**
 * Get an event by document ID, channel, or hash ID
 */
export async function getEvent(query: string): Promise<AdminEventDetails> {
  const params = new URLSearchParams({
    query: query.trim(),
  });

  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/events/get?${params.toString()}`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get event" }));
    throw new Error(error.message || "Failed to get event");
  }

  return response.json();
}

