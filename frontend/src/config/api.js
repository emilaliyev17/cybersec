// API Configuration
// In development, Vite proxy handles /api requests
// In production, use the VITE_API_URL environment variable

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiUrl = (path) => {
  // If path already starts with /api, use it directly (for dev proxy)
  // If we have a base URL, prepend it
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
};

export default API_BASE_URL;
