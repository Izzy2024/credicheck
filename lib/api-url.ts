const INVALID_PUBLIC_API_URL_VALUES = new Set(["", "undefined", "null"]);

const normalizeBaseUrl = (rawValue?: string): string | null => {
  const value = rawValue?.trim();
  if (!value) return null;

  const normalized = value.toLowerCase();
  if (INVALID_PUBLIC_API_URL_VALUES.has(normalized)) return null;

  return value.replace(/\/+$/, "");
};

export const getPublicApiBaseUrl = (): string => {
  const baseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);

  if (baseUrl) return baseUrl;

  return "http://localhost:3002";
};

export const buildPublicApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
};
