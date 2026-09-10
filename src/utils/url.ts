const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

const UNSAFE_SCHEME = /^\s*(javascript|vbscript|data):/i;

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getApiOrigin(): string | null {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return null;
  }
}

function hasPathTraversal(value: string): boolean {
  return /(^|[\\/])\.\.([\\/]|$)/.test(value);
}

/** Relative API paths or absolute URLs that point at our own API origin. */
export function isInternalApiUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('//') || UNSAFE_SCHEME.test(trimmed) || hasPathTraversal(trimmed)) {
    return false;
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true;
  }

  try {
    const apiOrigin = getApiOrigin();
    if (!apiOrigin) return false;
    const resolved = new URL(trimmed);
    return resolved.origin === apiOrigin && !hasPathTraversal(resolved.pathname);
  } catch {
    return false;
  }
}

/** Convert a same-origin absolute URL to a path so axios keeps using baseURL. */
export function toApiRequestUrl(path: string): string {
  if (!isInternalApiUrl(path)) {
    throw new Error('Blocked request to a non-API origin');
  }

  if (/^https?:\/\//i.test(path)) {
    const parsed = new URL(path);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  return path;
}

export function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeYoutubeUrl(value: string): boolean {
  if (!isSafeHttpUrl(value)) return false;
  try {
    const host = new URL(value).hostname.replace(/^www\./, '');
    return host === 'youtube.com' || host === 'youtu.be' || host === 'youtube-nocookie.com';
  } catch {
    return false;
  }
}

export function getFullUrl(path?: string | null): string {
  if (!path) return '';

  if (path.startsWith('data:image/')) {
    return path;
  }

  if (!isInternalApiUrl(path)) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanPath = path.replace(/^\//, '');
  return `${API_BASE}/${cleanPath}`;
}

export function openBlobInNewTab(blob: Blob, mimeType = 'application/pdf'): void {
  const url = URL.createObjectURL(new Blob([blob], { type: mimeType }));
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
