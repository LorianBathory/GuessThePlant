import { DataLoadingError, getErrorPresentation } from '../utils/errorHandling.js';

const ReactGlobal = globalThis.React;

if (!ReactGlobal) {
  throw new DataLoadingError('React не найден при инициализации ErrorBoundary.');
}

const { Component, createElement, Fragment } = ReactGlobal;

function ErrorContent({ error }) {
  const presentation = getErrorPresentation(error);

  return createElement(
    'div',
    {
      style: {
        padding: '32px',
        maxWidth: '720px',
        margin: '40px auto',
        backgroundColor: 'rgba(30, 41, 59, 0.92)',
        color: '#f8fafc',
        borderRadius: '16px',
        boxShadow: '0 20px 45px -12px rgba(15, 23, 42, 0.5)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif"
      }
    },
    createElement('h1', {
      style: {
        margin: '0 0 16px',
        fontSize: '28px'
      }
    }, presentation.title),
    createElement('p', {
      style: {
        margin: '0 0 20px',
        fontSize: '18px',
        lineHeight: 1.5
      }
    }, presentation.description),
    createElement('p', {
      style: {
        margin: 0,
        fontSize: '14px',
        opacity: 0.85,
        lineHeight: 1.4
      }
    }, `Техническая информация: ${presentation.technicalDetails}`)
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gtp:app-error', { detail: error }));
    }
  }

  render() {
    if (this.state.error) {
      return createElement(ErrorContent, { error: this.state.error });
    }

    return createElement(Fragment, null, this.props.children);
  }
}
