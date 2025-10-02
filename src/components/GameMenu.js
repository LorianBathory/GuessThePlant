import { INTERFACE_LANGUAGES } from '../gameConfig.js';

function renderDesktopBackground(ReactGlobal, isMobile) {
  if (isMobile) {
    return null;
  }

  const { createElement } = ReactGlobal;
  const circles = Array.from({ length: 12 });

  return createElement('div', {
    key: 'background-pattern',
    className: 'absolute inset-0 pointer-events-none',
    style: { zIndex: 0 }
  }, [
    createElement('div', {
      key: 'top-row',
      className: 'absolute top-8 left-0 right-0 flex justify-center items-center gap-6'
    }, circles.map((_, index) => createElement('div', {
      key: `top-${index}`,
      className: 'rounded-full',
      style: {
        width: '20px',
        height: '20px',
        backgroundColor: '#C29C27'
      }
    }))),
    createElement('div', {
      key: 'bottom-row',
      className: 'absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6'
    }, circles.map((_, index) => createElement('div', {
      key: `bottom-${index}`,
      className: 'rounded-full',
      style: {
        width: '20px',
        height: '20px',
        backgroundColor: '#C29C27'
      }
    })))
  ]);
}

export default function GameMenu({
  texts,
  interfaceLanguage,
  onInterfaceLanguageChange,
  onStartClassicGame = () => {},
  onStartEndlessGame = () => {},
  isPostGame = false,
  score = 0,
  isMobile = false,
  isClassicModeUnavailable = false
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameMenu.');
  }

  const { createElement, useState } = ReactGlobal;

  const isOutOfQuestions = isPostGame && isClassicModeUnavailable;

  const heading = isOutOfQuestions
    ? (texts.classicModeUnavailableTitle || texts.gameCompletedTitle || texts.menuTitle || '').replace('{{score}}', score)
    : isPostGame
      ? (texts.gameCompletedTitle || '').replace('{{score}}', score)
      : texts.menuTitle;
  const subtitle = isOutOfQuestions
    ? (texts.classicModeUnavailableSubtitle || texts.postGameSubtitle || texts.menuSubtitle || '')
    : isPostGame
      ? (texts.postGameSubtitle || texts.menuSubtitle || '')
      : (texts.menuSubtitle || '');

  const subtitle = isOutOfQuestions
    ? (texts.classicModeUnavailableSubtitle ?? texts.menuSubtitle ?? '')
    : (texts.menuSubtitle ?? '');

  const classicLabel = texts.classicModeButton || texts.startGame || 'Start Game';
  const endlessLabel = texts.endlessModeButton || 'Endless Mode';
  const classicDescription = texts.classicModeDescription;
  const endlessDescription = texts.endlessModeDescription;
  const unavailableLabel = texts.classicModeUnavailableButton || 'Unavailable';

  const [hoveredMode, setHoveredMode] = useState(null);

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile);

  if (isMobile) {
    return createElement('div', {
      className: 'min-h-screen relative flex flex-col overflow-hidden',
      style: { backgroundColor: '#163B3A', padding: '3px' }
    }, [
      createElement('div', {
        key: 'content-wrapper',
        className: 'relative z-10 flex-1 w-full flex items-center justify-center'
      }, [
        createElement('div', {
          key: 'menu-card',
          className: 'w-full max-w-xl mx-4 p-8 flex flex-col gap-6 text-center shadow-lg',
          style: { backgroundColor: '#163B3A', border: '4px solid #C29C27' }
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
          createElement('div', {
            key: 'mode-buttons',
            className: 'flex flex-col gap-3'
          }, [
            createElement('button', {
              key: 'classic-button',
              onClick: isClassicModeUnavailable ? undefined : onStartClassicGame,
              disabled: isClassicModeUnavailable,
              className: 'px-6 py-3 font-semibold transition-colors hover:opacity-80',
              style: {
                backgroundColor: '#C29C27',
                color: '#163B3A',
                border: '4px solid #C29C27',
                opacity: isClassicModeUnavailable ? 0.6 : 1
              }
            }, isClassicModeUnavailable ? unavailableLabel : classicLabel),
            createElement('button', {
              key: 'endless-button',
              onClick: onStartEndlessGame,
              className: 'px-6 py-3 font-semibold transition-colors hover:opacity-80',
              style: { backgroundColor: '#163B3A', color: '#C29C27', border: '4px solid #C29C27' }
            }, endlessLabel)
          ])
        ])
      ])
    ]);
  }

  return createElement('div', {
    className: 'min-h-screen relative flex flex-col overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: '24px' }
  }, [
    desktopBackgroundPattern,
    createElement('div', {
      key: 'language-buttons-desktop',
      className: 'absolute top-8 right-12 z-20 flex gap-2'
    }, INTERFACE_LANGUAGES.map(lang => createElement('button', {
      key: `interface-${lang}`,
      onClick: () => onInterfaceLanguageChange(lang),
      className: 'px-4 py-2 text-sm font-bold uppercase transition-all',
      style: {
        backgroundColor: interfaceLanguage === lang ? '#C29C27' : '#163B3A',
        color: interfaceLanguage === lang ? '#163B3A' : '#C29C27',
        border: '2px solid #C29C27'
      }
    }, lang.toUpperCase()))),
    createElement('div', {
      key: 'content-wrapper',
      className: 'relative z-10 flex-1 w-full flex flex-col items-center justify-center gap-10',
      style: { maxWidth: '1400px', margin: '0 auto' }
    }, [
      createElement('div', {
        key: 'header',
        className: 'text-center flex flex-col gap-4',
        style: { maxWidth: '960px' }
      }, [
        createElement('h1', {
          key: 'heading',
          className: 'text-6xl font-normal',
          style: { color: '#C29C27' }
        }, heading || texts.menuTitle),
        subtitle && createElement('p', {
          key: 'subtitle',
          className: 'text-xl',
          style: { color: '#C29C27', opacity: 0.85 }
        }, subtitle)
      ].filter(Boolean)),
      createElement('div', {
        key: 'mode-cards',
        className: 'w-full flex flex-wrap gap-8 justify-center',
        style: { maxWidth: '1200px' }
      }, [
        createElement('div', {
          key: 'classic-card',
          className: 'flex-1 relative transition-all cursor-pointer',
          style: {
            maxWidth: '520px',
            transform: hoveredMode === 'classic' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'transform 0.3s ease'
          },
          onMouseEnter: () => setHoveredMode('classic'),
          onMouseLeave: () => setHoveredMode(null),
          onClick: isClassicModeUnavailable ? undefined : onStartClassicGame
        }, [
          createElement('div', {
            key: 'classic-border-outer',
            className: 'absolute inset-0',
            style: {
              border: '6px solid #C29C27',
              opacity: isClassicModeUnavailable ? 0.5 : 1
            }
          }),
          createElement('div', {
            key: 'classic-border-inner',
            className: 'absolute',
            style: {
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              border: '2px solid #C29C27',
              opacity: isClassicModeUnavailable ? 0.5 : 0.6
            }
          }),
          createElement('div', {
            key: 'classic-content',
            className: 'relative p-8 flex flex-col gap-4 items-center text-center',
            style: {
              minHeight: '240px',
              opacity: isClassicModeUnavailable ? 0.6 : 1
            }
          }, [
            createElement('h2', {
              key: 'classic-title',
              className: 'text-2xl font-bold',
              style: { color: '#C29C27' }
            }, classicLabel),
            classicDescription && createElement('p', {
              key: 'classic-description',
              className: 'text-base leading-relaxed',
              style: { color: '#C29C27', opacity: 0.85 }
            }, classicDescription),
            createElement('button', {
              key: 'classic-action',
              onClick: event => {
                event.stopPropagation();
                if (!isClassicModeUnavailable) {
                  onStartClassicGame();
                }
              },
              disabled: isClassicModeUnavailable,
              className: 'mt-auto w-full px-8 py-3 font-semibold transition-all',
              style: {
                backgroundColor: isClassicModeUnavailable ? '#666' : '#C29C27',
                color: '#163B3A',
                border: '3px solid #C29C27',
                cursor: isClassicModeUnavailable ? 'not-allowed' : 'pointer',
                opacity: hoveredMode === 'classic' && !isClassicModeUnavailable ? 0.9 : 1
              }
            }, isClassicModeUnavailable ? unavailableLabel : (texts.startGame || classicLabel))
          ].filter(Boolean))
        ]),
        createElement('div', {
          key: 'endless-card',
          className: 'flex-1 relative transition-all cursor-pointer',
          style: {
            maxWidth: '520px',
            transform: hoveredMode === 'endless' ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'transform 0.3s ease'
          },
          onMouseEnter: () => setHoveredMode('endless'),
          onMouseLeave: () => setHoveredMode(null),
          onClick: onStartEndlessGame
        }, [
          createElement('div', {
            key: 'endless-border-outer',
            className: 'absolute inset-0',
            style: { border: '6px solid #C29C27' }
          }),
          createElement('div', {
            key: 'endless-border-inner',
            className: 'absolute',
            style: {
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              border: '2px solid #C29C27',
              opacity: 0.6
            }
          }),
          createElement('div', {
            key: 'endless-content',
            className: 'relative p-8 flex flex-col text-center gap-4',
            style: { minHeight: '240px' }
          }, [
            createElement('h2', {
              key: 'endless-title',
              className: 'text-2xl font-bold',
              style: { color: '#C29C27' }
            }, endlessLabel),
            endlessDescription && createElement('p', {
              key: 'endless-description',
              className: 'text-base leading-relaxed',
              style: { color: '#C29C27', opacity: 0.85 }
            }, endlessDescription),
            createElement('div', {
              key: 'endless-button-wrapper',
              className: 'mt-auto'
            }, createElement('button', {
              key: 'endless-action',
              onClick: event => {
                event.stopPropagation();
                onStartEndlessGame();
              },
              className: 'w-full px-8 py-3 font-semibold transition-all',
              style: {
                backgroundColor: '#C29C27',
                color: '#163B3A',
                border: '3px solid #C29C27',
                opacity: hoveredMode === 'endless' ? 0.9 : 1
              }
            }, texts.startGame || 'Start'))
          ].filter(Boolean))
        ])
      ])
    ])
  ].filter(Boolean));
}
