(function applyPolyfills() {
  if (typeof globalThis === 'undefined') {
    const getGlobal = function() {
      if (typeof self !== 'undefined') {
        return self;
      }
      if (typeof window !== 'undefined') {
        return window;
      }
      return {};
    };
    const globalObject = getGlobal();
    Object.defineProperty(globalObject, 'globalThis', {
      value: globalObject,
      writable: true,
      configurable: true
    });
  }

  if (typeof Object.fromEntries !== 'function') {
    Object.fromEntries = function fromEntries(entries) {
      if (entries == null) {
        throw new TypeError('Object.fromEntries requires an iterable.');
      }

      const result = {};
      const isIterable = typeof Symbol !== 'undefined' && Symbol.iterator && typeof entries[Symbol.iterator] === 'function';

      if (isIterable) {
        const iterator = entries[Symbol.iterator]();
        let step = iterator.next();
        while (!step.done) {
          const pair = step.value;
          if (pair && pair.length > 0) {
            result[pair[0]] = pair.length > 1 ? pair[1] : undefined;
          }
          step = iterator.next();
        }
        return result;
      }

      if (typeof entries.forEach === 'function') {
        entries.forEach(pair => {
          if (pair && pair.length > 0) {
            result[pair[0]] = pair.length > 1 ? pair[1] : undefined;
          }
        });
        return result;
      }

      if (typeof entries.length === 'number') {
        for (let i = 0; i < entries.length; i += 1) {
          const pair = entries[i];
          if (pair && pair.length > 0) {
            result[pair[0]] = pair.length > 1 ? pair[1] : undefined;
          }
        }
        return result;
      }

      throw new TypeError('Object.fromEntries requires an iterable, array-like object, or forEach method.');
    };
  }

  if (typeof Array.prototype.flatMap !== 'function') {
    Object.defineProperty(Array.prototype, 'flatMap', {
      value: function flatMap(callback, thisArg) {
        if (this == null) {
          throw new TypeError('Array.prototype.flatMap called on null or undefined.');
        }
        if (typeof callback !== 'function') {
          throw new TypeError('Callback provided to flatMap must be a function.');
        }

        const O = Object(this);
        const len = Math.max(Math.min(Number(O.length) || 0, Number.MAX_SAFE_INTEGER), 0);
        const result = [];

        for (let k = 0; k < len; k += 1) {
          if (Object.prototype.hasOwnProperty.call(O, k)) {
            const part = callback.call(thisArg, O[k], k, O);
            if (Array.isArray(part)) {
              for (let j = 0; j < part.length; j += 1) {
                result.push(part[j]);
              }
            } else {
              result.push(part);
            }
          }
        }

        return result;
      },
      configurable: true,
      writable: true
    });
  }
})();
