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

/**
 * Breakdown of how uploadsLeft is calculated
 * Useful for debugging and admin display
 */
export interface UploadsLeftCalculation {
  /** Event type: "pack" or "subscription" */
  eventType: string;
  /** Maximum photos allowed */
  maxPhotos: number;
  /** Photos reserved for guests */
  guestMaxPhotos: number;
  /** Current photos in event */
  currentPhotosCount: number;
  /** Total photos ever uploaded */
  uploadedPhotosCount: number;
  /** Current original files */
  currentOriginalFilesCount: number;
  /** Discounted originals (before Dec 8, 2025) */
  discountedOriginals: number;
  /** Effective originals that count as 2x */
  effectiveOriginalFilesCount: number;
  /** Safety limit (maxPhotos × 2.5) */
  safetyLimit: number;
  /** Safety capacity remaining */
  safetyCapacity: number;
  /** Normal capacity remaining */
  normalCapacity: number;
  /** Final uploads left */
  uploadsLeft: number;
  /** Formula explanation */
  formula: string;
  /** Data source (valkey/couchbase) */
  counterSource: string;
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
  /** Detailed breakdown of uploadsLeft calculation */
  uploadsLeftCalculation?: UploadsLeftCalculation;
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

export interface AdminEventUpdateRequest {
  eventId: string;
  name?: string;
  hashId?: string;
  maxPhotos?: number;
  expiresAt?: string;
  eventDate?: string;
  isArchived?: boolean;
  isEventDisabled?: boolean;
  isGuestUploadEnabled?: boolean;
  guestMaxPhotos?: number;
  isRegistrationRequired?: boolean;
  isPrivateFaces?: boolean;
  allowEnquiry?: boolean;
  reason?: string;
  proofFileUrl?: string;
}

export interface AdminEventUpdateResponse {
  success: boolean;
  eventId: string;
  message?: string;
  updatedFields?: string[];
}

/**
 * Update an event by super admin
 */
export async function updateEvent(data: AdminEventUpdateRequest): Promise<AdminEventUpdateResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/events/update`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to update event" }));
    throw new Error(error.message || "Failed to update event");
  }

  return response.json();
}

export interface AdminEventRecoverRequest {
  eventId: string;
}

export interface AdminEventRecoverResponse {
  success: boolean;
  eventId: string;
  message?: string;
}

/**
 * Recover an archived event by super admin
 */
export async function recoverEvent(data: AdminEventRecoverRequest): Promise<AdminEventRecoverResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/events/recover`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to recover event" }));
    throw new Error(error.message || "Failed to recover event");
  }

  return response.json();
}



export interface ConvertEventToSubscriptionRequest {
  eventId: string;
  subscriptionId?: string;
}

export interface ConvertEventToSubscriptionResponse {
  success: boolean;
  eventId: string;
  subscriptionId?: string;
  message?: string;
}

/**
 * Convert a pack-based event to subscription-based
 */
export async function convertEventToSubscription(
  data: ConvertEventToSubscriptionRequest
): Promise<ConvertEventToSubscriptionResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/events/convert-to-subscription`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to convert event" }));
    throw new Error(error.message || "Failed to convert event to subscription");
  }

  return response.json();
}
