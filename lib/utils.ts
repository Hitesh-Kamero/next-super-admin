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
