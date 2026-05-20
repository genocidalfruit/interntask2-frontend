export function getApiUrl() {
  // In production (Netlify), use relative paths so Netlify's redirects can proxy to the backend
  // In development, use the configured API URL if provided
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "";
}
