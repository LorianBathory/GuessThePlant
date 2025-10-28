import '../polyfills.js';
import ProgressApp from './ProgressApp.js';
import ErrorBoundary from '../components/ErrorBoundary.js';
import {
  attachGlobalErrorHandlers,
  clearFatalError,
  renderFatalError,
  DataLoadingError
} from '../utils/errorHandling.js';

attachGlobalErrorHandlers();

const mountNode = typeof document !== 'undefined' ? document.getElementById('progress-root') : null;

try {
  if (!mountNode) {
    throw new DataLoadingError('Не найден контейнер для страницы прогресса.');
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
      ReactGlobal.createElement(ProgressApp)
    )
  );
} catch (error) {
  renderFatalError(error);
  throw error;
}
