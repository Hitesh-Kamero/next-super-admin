import { authenticatedFetch } from "./api-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://apis.kamero.ai/v1";

export interface AdminPresignedUrlRequest {
  filename: string;
  contentType: string;
  folder?: string;
}

export interface AdminPresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  filename: string;
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
 */
export async function uploadFileToGCS(uploadUrl: string, file: File): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error("Failed to upload file");
  }
}

/**
 * Upload a file to GCS and return the public URL
 */
export async function uploadFile(file: File, folder?: string): Promise<string> {
  // Get presigned URL
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
    filename: file.name,
    contentType: file.type,
    folder,
  });

  // Upload file
  await uploadFileToGCS(uploadUrl, file);

  return publicUrl;
}
