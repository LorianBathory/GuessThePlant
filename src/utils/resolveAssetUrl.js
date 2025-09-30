const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function isAbsoluteUrl(path) {
  return ABSOLUTE_URL_PATTERN.test(path) || path.startsWith('data:') || path.startsWith('blob:');
}

function normaliseBasePath(pathname, segment) {
  const segmentIndex = pathname.indexOf(segment);
  if (segmentIndex !== -1) {
    const base = pathname.slice(0, segmentIndex) || '/';
    return base.endsWith('/') ? base : `${base}/`;
  }

  if (pathname === '/') {
    return '/';
  }

  if (pathname.endsWith('/')) {
    return pathname;
  }

  const lastSlashIndex = pathname.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return '/';
  }

  return pathname.slice(0, lastSlashIndex + 1);
}

export function resolveAssetUrl(path) {
  if (typeof path !== 'string') {
    return path;
  }

  const trimmed = path.trim();
  if (trimmed.length === 0 || isAbsoluteUrl(trimmed)) {
    return trimmed;
  }

  const normalisedPath = trimmed.replace(/^\/+/, '');

  const browserLocation = typeof globalThis !== 'undefined' ? globalThis.location : undefined;
  if (!browserLocation || typeof browserLocation.pathname !== 'string' || typeof browserLocation.origin !== 'string') {
    return `/${normalisedPath}`;
  }

  const basePath = normaliseBasePath(browserLocation.pathname, '/voice-mode/');
  return new URL(normalisedPath, `${browserLocation.origin}${basePath}`).toString();
}

export default resolveAssetUrl;
