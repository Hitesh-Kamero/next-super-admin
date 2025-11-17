import { auth } from "./firebase";

/**
 * Get the Firebase ID token for making authenticated API calls to the backend
 * This token should be sent in the X-Firebase-Auth header
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error("Error getting Firebase ID token:", error);
    return null;
  }
}

/**
 * Make an authenticated API call to the backend
 * Automatically includes the Firebase ID token in the X-Firebase-Auth header
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getFirebaseIdToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("X-Firebase-Auth", token);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

