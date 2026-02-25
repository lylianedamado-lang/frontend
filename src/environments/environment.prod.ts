const normalizeApiUrl = (url: string): string => url.replace(/\/+$/, '');

const runtimeApiUrl =
  typeof window !== 'undefined' ? window.__env?.apiUrl : undefined;

export const environment = {
  production: true,
  apiUrl: normalizeApiUrl(runtimeApiUrl || 'https://data-clean-api.onrender.com')
};
