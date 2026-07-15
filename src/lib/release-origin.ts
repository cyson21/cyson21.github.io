export interface ReleaseEnvironment {
  PUBLIC_RELEASE?: string;
  PUBLIC_SITE_URL?: string;
}

const PRIVATE_IPV4 = /^(?:10\.|127\.|169\.254\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/;

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === 'localhost'
    || normalized.endsWith('.localhost')
    || normalized === '[::1]'
    || PRIVATE_IPV4.test(normalized);
}

export function getReleaseOrigin(environment: ReleaseEnvironment): string | null {
  if (environment.PUBLIC_RELEASE !== 'true') return null;

  const configured = environment.PUBLIC_SITE_URL?.trim();
  if (!configured) {
    throw new Error('[release-origin] PUBLIC_SITE_URL is required when PUBLIC_RELEASE=true');
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('[release-origin] PUBLIC_SITE_URL must be an absolute HTTPS URL');
  }

  if (url.protocol !== 'https:') {
    throw new Error('[release-origin] PUBLIC_SITE_URL must use HTTPS');
  }
  if (url.username || url.password) {
    throw new Error('[release-origin] PUBLIC_SITE_URL must not include credentials');
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error('[release-origin] PUBLIC_SITE_URL must contain only an origin');
  }
  if (isLocalHostname(url.hostname)) {
    throw new Error('[release-origin] PUBLIC_SITE_URL must not target a local address');
  }

  return url.origin;
}
