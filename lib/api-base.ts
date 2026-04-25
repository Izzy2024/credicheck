/**
 * Base URL for the API.
 * Falls back to production backend URL when NEXT_PUBLIC_API_URL is not set.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://credicheck.onrender.com";
