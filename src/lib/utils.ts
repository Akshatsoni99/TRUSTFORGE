import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates Indian mobile numbers (10 digits starting with 6, 7, 8, or 9, optional +91 or 0 prefix)
 */
export function validateIndianMobile(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const pattern = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  return pattern.test(cleaned);
}

/**
 * Normalizes Indian mobile number to standard +91XXXXXXXXXX format
 */
export function normalizeIndianMobile(phone?: string | null): string {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 11) return `+91${cleaned.slice(1)}`;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return phone;
}

/**
 * Validates Indian vehicle registration numbers
 * Examples: DL01AB1234, MH 12 CD 5678, KA-05-MN-9999, HR26DQ5555, 22BH1234AA
 */
export function validateIndianVehicleNumber(reg: string): boolean {
  const cleaned = reg.replace(/[\s\-]/g, '').toUpperCase();
  // Standard format: 2 letters state + 2 digits district + 1-3 letters series + 4 digits number
  // Or BH series: 2 digits year + BH + 4 digits + 2 letters
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  return standardPattern.test(cleaned) || bhPattern.test(cleaned);
}

/**
 * Formats vehicle registration number with readable spacing
 */
export function formatVehicleNumber(reg: string): string {
  const cleaned = reg.replace(/[\s\-]/g, '').toUpperCase();
  if (cleaned.length >= 8) {
    const state = cleaned.slice(0, 2);
    const district = cleaned.slice(2, 4);
    const rest = cleaned.slice(4);
    const letters = rest.replace(/[0-9]/g, '');
    const numbers = rest.replace(/[^0-9]/g, '');
    return `${state} ${district} ${letters} ${numbers}`.trim();
  }
  return cleaned;
}

/**
 * Masks registration number for privacy if owner opts in
 * e.g. "DL 01 AB 1234" -> "DL 01 •• 1234"
 */
export function maskVehicleNumber(reg: string): string {
  const formatted = formatVehicleNumber(reg);
  const parts = formatted.split(' ');
  if (parts.length >= 4) {
    return `${parts[0]} ${parts[1]} •• ${parts[3]}`;
  }
  if (reg.length > 6) {
    return `${reg.slice(0, 2)} •••• ${reg.slice(-4)}`;
  }
  return `${reg.slice(0, 2)} ••••`;
}

/**
 * Masks phone number
 * e.g. "+919876543210" -> "+91 98••• ••210"
 */
export function maskPhoneNumber(phone: string): string {
  const norm = normalizeIndianMobile(phone);
  if (norm.length >= 13) {
    return `${norm.slice(0, 5)} •••• •${norm.slice(-2)}`;
  }
  return '••• ••• ••••';
}

/**
 * Generates an RFC 4122 version 4 compliant UUID
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates cryptographically secure random token for QR code
 */
export function generateSecureToken(byteLength: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(byteLength);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Formats ISO date/time for SaaS interfaces
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return isoString;
  }
}

/**
 * Relative time helper (e.g. "5 minutes ago", "Just now")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 30) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return formatDateTime(isoString);
  } catch {
    return isoString;
  }
}

/**
 * Rate Limiting Anti-Abuse Helper
 * Prevents rapid repeated requests from same browser within a short cooldown window
 */
export function checkRateLimit(actionKey: string, cooldownSeconds: number = 30): { allowed: boolean; remainingSeconds: number } {
  try {
    const key = `tf_ratelimit_${actionKey}`;
    const lastAttempt = sessionStorage.getItem(key);
    const now = Date.now();

    if (lastAttempt) {
      const elapsedSeconds = Math.floor((now - parseInt(lastAttempt, 10)) / 1000);
      if (elapsedSeconds < cooldownSeconds) {
        return {
          allowed: false,
          remainingSeconds: cooldownSeconds - elapsedSeconds,
        };
      }
    }

    sessionStorage.setItem(key, now.toString());
    return { allowed: true, remainingSeconds: 0 };
  } catch {
    return { allowed: true, remainingSeconds: 0 };
  }
}

/**
 * Resolves the absolute application base URL for generating production QR codes.
 * Always guarantees the canonical production domain (https://trustfordge.vercel.app)
 * and strictly prevents localhost or development URLs from being encoded in QR passes.
 */
export function getAppBaseUrl(): string {
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('https://') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (origin.startsWith('https://') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin.replace(/\/$/, '');
    }
  }

  // Canonical production deployment URL
  return 'https://trustfordge.vercel.app';
}

/**
 * Returns the absolute QR code URL for a public vehicle token.
 * Canonical destination: https://trustfordge.vercel.app/v/{publicToken}
 */
export function getPublicQrUrl(token: string): string {
  const cleanToken = (token || '').trim();
  return `${getAppBaseUrl()}/v/${cleanToken}`;
}

