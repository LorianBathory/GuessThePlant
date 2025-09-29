import { INTERFACE_LANGUAGES } from '../gameConfig.js';

function renderDesktopBackground(ReactGlobal, isMobile) {
  if (isMobile) {
    return null;
  }

  const { createElement } = ReactGlobal;

  return createElement('div', {
    key: 'background-pattern',
    className: 'absolute inset-0 pointer-events-none flex justify-between px-10',
    style: { zIndex: 0 }
  }, ['left', 'right'].map(side => createElement('div', {
    key: side,
    className: 'flex flex-col justify-between h-full py-10'
  }, Array.from({ length: 8 }).map((_, index) => createElement('div', {
    key: `${side}-circle-${index}`,
    className: 'rounded-full',
    style: {
      width: '24px',
      height: '24px',
      backgroundColor: '#C29C27'
    }
  })))));
}

export default function GameMenu({
  texts,
  interfaceLanguage,
  onInterfaceLanguageChange,
  onStartGame,
  isPostGame = false,
  score = 0,
  isMobile = false
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameMenu.');
  }

  const { createElement } = ReactGlobal;

  const heading = isPostGame
    ? (texts.gameCompletedTitle || '').replace('{{score}}', score)
    : texts.menuTitle;

  const subtitle = isPostGame
    ? (texts.postGameSubtitle || texts.menuSubtitle || '')
    : texts.menuSubtitle;

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile);

  return createElement('div', {
    className: 'min-h-screen relative flex flex-col overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
  }, [
    desktopBackgroundPattern,
    createElement('div', {
      key: 'content-wrapper',
      className: 'relative z-10 flex-1 w-full flex items-center justify-center'
    }, [
      createElement('div', {
        key: 'menu-card',
        className: 'w-full max-w-xl mx-4 p-8 flex flex-col gap-6 text-center shadow-lg',
        style: { backgroundColor: '#163B3A', border: isMobile ? '4px solid #C29C27' : '6px solid #C29C27' }
      }, [
        createElement('h1', {
          key: 'heading',
          className: 'text-3xl font-bold',
          style: { color: '#C29C27' }
        }, heading || texts.menuTitle),
        subtitle && createElement('p', {
          key: 'subtitle',
          className: 'text-lg',
          style: { color: '#C29C27' }
        }, subtitle),
        createElement('div', {
          key: 'language-section',
          className: 'flex flex-col items-center gap-3'
        }, [
          createElement('div', {
            key: 'buttons',
            className: 'flex gap-2 flex-wrap justify-center'
          }, INTERFACE_LANGUAGES.map(lang => createElement('button', {
            key: `interface-${lang}`,
            onClick: () => onInterfaceLanguageChange(lang),
            className: 'px-3 py-1 text-sm font-bold uppercase transition-all',
            style: {
              backgroundColor: interfaceLanguage === lang ? '#C29C27' : 'transparent',
              color: interfaceLanguage === lang ? '#163B3A' : '#C29C27',
              border: '2px solid #C29C27'
            }
          }, lang.toUpperCase())))
        ]),
        createElement('button', {
          key: 'start-button',
          onClick: onStartGame,
          className: 'px-6 py-3 font-semibold transition-colors hover:opacity-80',
          style: { backgroundColor: '#C29C27', color: '#163B3A', border: '4px solid #C29C27' }
        }, texts.startGame)
      ])
    ])
  ].filter(Boolean));
}
