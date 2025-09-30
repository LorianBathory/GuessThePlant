import resolveAssetUrl from '../utils/resolveAssetUrl.js';

const objectUrlCache = new Map();

function retainObjectUrl(imageUrl) {
  if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
    return Promise.reject(new Error('Неверный путь к изображению.'));
  }

  if (objectUrlCache.has(imageUrl)) {
    const cached = objectUrlCache.get(imageUrl);
    cached.refCount += 1;
    if (cached.url) {
      return Promise.resolve(cached.url);
    }
    return cached.promise;
  }

  const supportsAbort = typeof AbortController === 'function';
  const controller = supportsAbort ? new AbortController() : null;

  const entry = {
    refCount: 1,
    url: null,
    controller,
    promise: null
  };

  const fetchPromise = fetch(imageUrl, controller ? { signal: controller.signal } : undefined)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Не удалось загрузить изображение: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      entry.url = objectUrl;
      return objectUrl;
    })
    .catch(error => {
      if (entry.url) {
        URL.revokeObjectURL(entry.url);
      }
      objectUrlCache.delete(imageUrl);
      throw error;
    });

  entry.promise = fetchPromise;
  objectUrlCache.set(imageUrl, entry);

  return fetchPromise;
}

function releaseObjectUrl(imageUrl) {
  const entry = objectUrlCache.get(imageUrl);
  if (!entry) {
    return;
  }

  entry.refCount -= 1;
  if (entry.refCount <= 0) {
    if (!entry.url && entry.controller) {
      try {
        entry.controller.abort();
      } catch {
        // Игнорируем ошибки отмены: они не критичны.
      }
    }

    if (entry.url) {
      URL.revokeObjectURL(entry.url);
    }
    objectUrlCache.delete(imageUrl);
  }
}

export default function useSecureImageSource(imageUrl) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Ensure React is loaded before calling useSecureImageSource.');
  }

  const { useEffect, useState } = ReactGlobal;
  const [secureSrc, setSecureSrc] = useState(null);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
      setSecureSrc(null);
      setStatus('idle');
      return undefined;
    }

    let isSubscribed = true;
    setSecureSrc(null);
    setStatus('loading');

    const resolvedUrl = resolveAssetUrl(imageUrl);

    retainObjectUrl(resolvedUrl)
      .then(objectUrl => {
        if (!isSubscribed) {
          releaseObjectUrl(resolvedUrl);
          return;
        }
        setSecureSrc(objectUrl);
        setStatus('ready');
      })
      .catch(() => {
        if (!isSubscribed) {
          return;
        }
        setSecureSrc(null);
        setStatus('error');
      });

    return () => {
      isSubscribed = false;
      releaseObjectUrl(resolvedUrl);
    };
  }, [imageUrl]);

  return {
    secureSrc,
    status,
    isLoading: status === 'loading',
    hasError: status === 'error'
  };
}
