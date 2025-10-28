const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

function isAbsoluteUrl(path) {
  return ABSOLUTE_URL_PATTERN.test(path) || path.startsWith('data:') || path.startsWith('blob:');
}

function normaliseBasePath(pathname, segments) {
  const lookupSegments = Array.isArray(segments) ? segments : [segments];

  for (let index = 0; index < lookupSegments.length; index += 1) {
    const segment = lookupSegments[index];
    if (!segment || typeof segment !== 'string') {
      continue;
    }

    const segmentIndex = pathname.indexOf(segment);
    if (segmentIndex !== -1) {
      const base = pathname.slice(0, segmentIndex) || '/';
      return base.endsWith('/') ? base : `${base}/`;
    }
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
  if (!browserLocation || typeof browserLocation.pathname !== 'string') {
    return `/${normalisedPath}`;
  }

  const basePath = normaliseBasePath(browserLocation.pathname, ['/voice-mode/', '/progress/']);
  const origin = typeof browserLocation.origin === 'string' ? browserLocation.origin : '';

  if (origin && origin !== 'null') {
    try {
      return new URL(normalisedPath, `${origin}${basePath}`).toString();
    } catch {
      // Если сформировать абсолютный URL не удалось (например, из-за неподдерживаемого протокола),
      // переходим к относительному пути ниже.
    }
  }

  const prefix = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return `${prefix}${normalisedPath}`;
}

export default resolveAssetUrl;
