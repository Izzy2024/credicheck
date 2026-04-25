/**
 * Base URL for the API. Falls back to the current origin when
 * NEXT_PUBLIC_API_URL is not set (e.g. missing Render env var).
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "https://credicheck.onrender.com");
