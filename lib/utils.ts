import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a UTC date string to IST (Indian Standard Time, UTC+5:30)
 * @param dateInput - The UTC date string (ISO 8601 format) or Date object
 * @returns The formatted date string in IST or 'N/A' if invalid
 */
export function formatDateIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDateIST:', dateInput);
      return 'N/A';
    }
    // Convert to IST (UTC+5:30)
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.warn('Error formatting date to IST:', error);
    return String(dateInput);
  }
}

/**
 * Formats a UTC date string to IST date only (without time)
 * @param dateInput - The UTC date string (ISO 8601 format) or Date object
 * @returns The formatted date string in IST or 'N/A' if invalid
 */
export function formatDateOnlyIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return 'N/A';
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date provided to formatDateOnlyIST:', dateInput);
      return 'N/A';
    }
    // Convert to IST (UTC+5:30) - date only
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date to IST:', error);
    return String(dateInput);
  }
}

/**
 * Generates a login URL for the web app with encoded credentials
 * Uses the user's email and a universal password (LRGN2TmWlhSoEt2) that works for all users
 * @param email - User's email address
 * @param returnUrl - Optional return URL after login
 * @returns The login URL with encoded credentials
 */
export function generateLoginAsUserUrl(email: string, returnUrl?: string): string {
  if (!email) {
    throw new Error('Email is required to generate login URL');
  }

  // Helper function to base64 encode (works in both browser and Node.js)
  const base64Encode = (str: string): string => {
    if (typeof window !== 'undefined') {
      return btoa(str);
    }
    return Buffer.from(str).toString('base64');
  };

  // Universal password (base64 encoded) that works for all users (like an API key)
  // Stored as base64 to avoid storing plain text password in code
  const UNIVERSAL_PASSWORD_BASE64 = 'TFJHTjJUbVdsaFNvRXQy';
  
  // Encode email for URL parameter
  const encodedEmail = base64Encode(email);
  
  // Password is already base64 encoded, use directly
  const encodedPassword = UNIVERSAL_PASSWORD_BASE64;

  // Base URL for the web app login
  const baseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || 'https://login.kamero.ai';
  const loginUrl = new URL('/login', baseUrl);
  
  // Add encoded credentials using codewords (id = email, code = password)
  loginUrl.searchParams.set('id', encodedEmail);
  loginUrl.searchParams.set('code', encodedPassword);
  
  // Add return URL if provided
  if (returnUrl) {
    loginUrl.searchParams.set('returnUrl', returnUrl);
  }

  return loginUrl.toString();
}
