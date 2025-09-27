import PlantQuizGame from './components/PlantQuizGame.js';
import ErrorBoundary from './components/ErrorBoundary.js';
import {
  attachGlobalErrorHandlers,
  clearFatalError,
  renderFatalError,
  DataLoadingError
} from './utils/errorHandling.js';

attachGlobalErrorHandlers();

const mountNode = typeof document !== 'undefined' ? document.getElementById('root') : null;

try {
  if (!mountNode) {
    throw new DataLoadingError('Не найден контейнер для приложения.');
  }

  const ReactGlobal = globalThis.React;
  const ReactDOMGlobal = globalThis.ReactDOM;

  if (!ReactGlobal || !ReactDOMGlobal) {
    throw new DataLoadingError('Не удалось загрузить React или ReactDOM. Проверьте порядок подключения скриптов.');
  }

  clearFatalError();
  const root = ReactDOMGlobal.createRoot(mountNode);
  root.render(
    ReactGlobal.createElement(
      ErrorBoundary,
      null,
      ReactGlobal.createElement(PlantQuizGame)
    )
  );
} catch (error) {
  renderFatalError(error);
  throw error;
}
