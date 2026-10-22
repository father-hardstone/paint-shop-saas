/**
 * Retrieves the configured backend API URL from the environment.
 * Throws a fatal Error immediately (fast fail) if VITE_API_URL is missing or empty.
 */
export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'Missing required environment variable VITE_API_URL. Configure VITE_API_URL in your environment (.env or Vercel settings).'
    );
  }
  return url.trim().replace(/\/$/, '');
}

/**
 * Retrieves the backend origin (without /api) for asset and proxy URLs.
 */
export function getBackendOrigin(): string {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/\/api$/, '');
}
