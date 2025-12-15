import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export type AdminUploadType =
  | "payment_proof"
  | "subscription_proof"
  | "event_proof"
  | "other";

export interface AdminPresignedUrlRequest {
  fileName: string;
  contentType?: string;
  uploadType: AdminUploadType;
}

export interface AdminPresignedUrlResponse {
  success: boolean;
  uploadUrl: string;
  fileUrl: string;
  expiresAt?: string;
  requiredHeaders?: Record<string, string>;
}

/**
 * Get a presigned URL for uploading a file to GCS
 */
export async function getPresignedUploadUrl(data: AdminPresignedUrlRequest): Promise<AdminPresignedUrlResponse> {
  const response = await authenticatedFetch(
    `${API_BASE_URL}/admin/upload/presigned-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Failed to get upload URL" }));
    throw new Error(error.message || "Failed to get upload URL");
  }

  return response.json();
}


/**
 * Upload a file using a presigned URL
 * Note: GCS presigned URLs with metadata require all signed headers to be included
 * Headers must be ISO-8859-1 compatible for browser fetch API
 */
export async function uploadFileToGCS(
  uploadUrl: string, 
  file: File, 
  requiredHeaders?: Record<string, string>,
  fileName?: string,
  contentType?: string,
  uploadType?: AdminUploadType
): Promise<void> {
  // Use Headers object to properly handle encoding
  const headers = new Headers();
  
  // Set Content-Type which is always required
  headers.set("Content-Type", contentType || file.type);

  // Add all required headers from the backend response
  // These headers were signed by GCS and must match exactly
  // Backend now sanitizes values to be ISO-8859-1 compatible before signing
  if (requiredHeaders && Object.keys(requiredHeaders).length > 0) {
    // Use headers from backend response (preferred method)
    // Backend ensures all values are ISO-8859-1 compatible
    Object.entries(requiredHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  } else {
    // Fallback: Try to extract signed headers from URL and construct what we can
    // This is a temporary workaround until backend is regenerated
    try {
      const url = new URL(uploadUrl);
      const signedHeadersParam = url.searchParams.get("X-Goog-SignedHeaders");
      
      if (signedHeadersParam) {
        const headerList = signedHeadersParam.split("%3B").map(h => decodeURIComponent(h));
        
        // Add headers we can construct
        headerList.forEach(headerName => {
          const lowerHeaderName = headerName.toLowerCase();
          
          if (lowerHeaderName.startsWith("x-goog-meta-")) {
            const metaKey = lowerHeaderName.replace("x-goog-meta-", "");
            
            switch (metaKey) {
              case "original-name":
                if (fileName) {
                  headers.set(headerName, fileName);
                }
                break;
              case "content-type":
                if (contentType) headers.set(headerName, contentType);
                break;
              case "upload-type":
                if (uploadType) headers.set(headerName, uploadType);
                break;
              // Note: admin-email, admin-user-id, and uploaded-at cannot be constructed
              // These MUST come from the backend response
            }
          }
        });
      }
    } catch (e) {
      console.warn("Failed to parse presigned URL for headers", e);
    }
  }

  // Log headers being sent for debugging
  const headersObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headersObj[key] = value;
  });
  console.log("Uploading to GCS with headers:", headersObj);

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    console.error("GCS upload failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      headersSent: headersObj,
    });
    throw new Error(`Failed to upload file: ${response.status} ${errorText}`);
  }
}

/**
 * Upload a file to GCS and return the public URL
 */
export async function uploadFile(file: File, uploadType: AdminUploadType): Promise<string> {
  // Get presigned URL with required headers
  const response = await getPresignedUploadUrl({
    fileName: file.name,
    contentType: file.type,
    uploadType,
  });

  const { uploadUrl, fileUrl, requiredHeaders } = response;

  // Log response for debugging
  console.log("Presigned URL response:", {
    hasRequiredHeaders: !!requiredHeaders,
    requiredHeadersKeys: requiredHeaders ? Object.keys(requiredHeaders) : [],
    uploadUrl: uploadUrl.substring(0, 100) + "...",
  });

  // Upload file with required headers from backend
  // Pass file info as fallback in case requiredHeaders is not available
  await uploadFileToGCS(
    uploadUrl, 
    file, 
    requiredHeaders,
    file.name,
    file.type,
    uploadType
  );

  return fileUrl;
}
