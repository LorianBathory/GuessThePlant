const ERROR_OVERLAY_ID = 'gtp-error-overlay';

export const ERROR_TYPES = Object.freeze({
  DATA_LOADING: 'data-loading',
  SYNTAX: 'syntax',
  GAME_LOGIC: 'game-logic',
  STORAGE: 'storage'
});

export class PlantQuizError extends Error {
  constructor(message, type, options = {}) {
    super(message);
    this.name = options.name || 'PlantQuizError';
    this.type = type || ERROR_TYPES.GAME_LOGIC;
    if (options.details) {
      this.details = options.details;
    }
    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

export class DataLoadingError extends PlantQuizError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.DATA_LOADING, { ...options, name: 'DataLoadingError' });
  }
}

export class SyntaxRuntimeError extends PlantQuizError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.SYNTAX, { ...options, name: 'SyntaxRuntimeError' });
  }
}

export class GameLogicError extends PlantQuizError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.GAME_LOGIC, { ...options, name: 'GameLogicError' });
  }
}

export class StorageError extends PlantQuizError {
  constructor(message, options = {}) {
    super(message, ERROR_TYPES.STORAGE, { ...options, name: 'StorageError' });
  }
}

export function normalizeError(error) {
  if (!error) {
    return new PlantQuizError('Неопознанная ошибка.', ERROR_TYPES.GAME_LOGIC);
  }

  if (error instanceof PlantQuizError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new SyntaxRuntimeError(error.message, { cause: error });
  }

  if (error.name === 'QuotaExceededError' || error.name === 'SecurityError') {
    return new StorageError(error.message, { cause: error });
  }

  if (typeof error.message === 'string' && error.message.toLowerCase().includes('localstorage')) {
    return new StorageError(error.message, { cause: error });
  }

  if (typeof error.message === 'string' && error.message.toLowerCase().includes('syntax')) {
    return new SyntaxRuntimeError(error.message, { cause: error });
  }

  if (typeof error.message === 'string' && error.message.toLowerCase().includes('fetch')) {
    return new DataLoadingError(error.message, { cause: error });
  }

  return new GameLogicError(error.message || 'Неизвестная ошибка игровой логики.', { cause: error });
}

const typeMeta = {
  [ERROR_TYPES.DATA_LOADING]: {
    title: 'Ошибка загрузки данных',
    description: 'Не удалось получить данные, необходимые для запуска игры. Попробуйте обновить страницу или свяжитесь с разработчиками.'
  },
  [ERROR_TYPES.SYNTAX]: {
    title: 'Ошибка синтаксиса',
    description: 'Обнаружены проблемы с кодом приложения. Пожалуйста, перезагрузите страницу. Если ошибка повторяется — сообщите о проблеме.'
  },
  [ERROR_TYPES.GAME_LOGIC]: {
    title: 'Ошибка игровой логики',
    description: 'Игре не удалось продолжить работу из-за внутренней ошибки. Попробуйте перезапустить или обратитесь к разработчикам.'
  },
  [ERROR_TYPES.STORAGE]: {
    title: 'Ошибка доступа к памяти браузера',
    description: 'Возникли проблемы с чтением или записью в localStorage. Очистите данные сайта или отключите приватный режим браузера.'
  }
};

export function getErrorPresentation(error) {
  const normalized = normalizeError(error);
  const meta = typeMeta[normalized.type] || typeMeta[ERROR_TYPES.GAME_LOGIC];
  const details = normalized.details || (normalized.cause && normalized.cause.message);
  return {
    error: normalized,
    ...meta,
    technicalDetails: details || normalized.message
  };
}

export function renderFatalError(error) {
  if (typeof document === 'undefined') {
    return;
  }

  const presentation = getErrorPresentation(error);

  let container = document.getElementById(ERROR_OVERLAY_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = ERROR_OVERLAY_ID;
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.backgroundColor = 'rgba(15, 23, 42, 0.92)';
    container.style.color = '#f8fafc';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.padding = '24px';
    container.style.boxSizing = 'border-box';
    container.style.fontFamily = "'Segoe UI', system-ui, -apple-system, sans-serif";
    document.body.appendChild(container);
  }

  container.innerHTML = '';

  const panel = document.createElement('div');
  panel.style.maxWidth = '560px';
  panel.style.width = '100%';
  panel.style.backgroundColor = 'rgba(30, 41, 59, 0.95)';
  panel.style.borderRadius = '16px';
  panel.style.padding = '32px';
  panel.style.boxShadow = '0 25px 50px -12px rgba(15, 23, 42, 0.45)';

  const title = document.createElement('h1');
  title.textContent = presentation.title;
  title.style.margin = '0 0 16px';
  title.style.fontSize = '28px';
  title.style.lineHeight = '1.2';

  const description = document.createElement('p');
  description.textContent = presentation.description;
  description.style.margin = '0 0 20px';
  description.style.fontSize = '18px';

  const technical = document.createElement('p');
  technical.textContent = `Техническая информация: ${presentation.technicalDetails}`;
  technical.style.margin = '0';
  technical.style.fontSize = '14px';
  technical.style.opacity = '0.8';

  panel.appendChild(title);
  panel.appendChild(description);
  panel.appendChild(technical);

  container.appendChild(panel);
}

export function clearFatalError() {
  if (typeof document === 'undefined') {
    return;
  }

  const overlay = document.getElementById(ERROR_OVERLAY_ID);
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

let globalHandlersAttached = false;

export function attachGlobalErrorHandlers() {
  if (globalHandlersAttached || typeof window === 'undefined') {
    return;
  }

  const handleError = error => {
    renderFatalError(error instanceof Error ? error : new Error(String(error)));
  };

  window.addEventListener('error', event => {
    if (event?.error) {
      handleError(event.error);
    } else if (event?.message) {
      handleError(new Error(event.message));
    }
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event?.reason;
    if (reason instanceof Error) {
      handleError(reason);
    } else {
      handleError(new Error(typeof reason === 'string' ? reason : 'Неизвестная ошибка промиса.'));
    }
  });

  window.addEventListener('gtp:app-error', event => {
    if (event?.detail) {
      handleError(event.detail);
    }
  });

  globalHandlersAttached = true;
}
