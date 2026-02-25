const normalizeApiUrl = (url: string): string => url.replace(/\/+$/, '');

const runtimeApiUrl =
  typeof window !== 'undefined' ? window.__env?.apiUrl : undefined;

export const environment = {
  production: false,
  apiUrl: normalizeApiUrl(runtimeApiUrl || 'http://localhost:5000')
};
