const normalizeBaseUrl = (url) => {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const defaultDevApiUrl = "http://localhost:5000";
const configuredApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
const isDev = import.meta.env.DEV;

export const API_BASE_URL = configuredApiUrl || (isDev ? defaultDevApiUrl : "");
