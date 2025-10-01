import GameHeader from './GameHeader.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

function SecurePlantImage({ src, alt, className, style }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering SecurePlantImage.');
  }

  const { createElement, useMemo } = ReactGlobal;
  const { secureSrc, status } = useSecureImageSource(src);

  const mergedStyle = useMemo(() => ({
    ...(style || {}),
    userSelect: 'none',
    pointerEvents: 'none'
  }), [style]);

  if (status === 'error') {
    return createElement('div', {
      className: 'w-full h-full flex items-center justify-center text-center text-sm',
      style: {
        ...mergedStyle,
        color: '#C29C27',
        backgroundColor: '#163B3A'
      }
    }, 'Изображение недоступно');
  }

  if (status !== 'ready' || !secureSrc) {
    return createElement('div', {
      className: 'w-full h-full flex items-center justify-center',
      style: {
        ...mergedStyle,
        backgroundColor: '#163B3A'
      }
    }, createElement('span', { className: 'sr-only' }, 'Загрузка изображения'));
  }

  return createElement('img', {
    src: secureSrc,
    alt,
    className,
    style: mergedStyle,
    draggable: false,
    onContextMenu: event => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    },
    onDragStart: event => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
    }
  });
}

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

function renderPlantImage(ReactGlobal, plant, isMobile) {
  if (!plant || !plant.image || !plant.image.startsWith('images/')) {
    return null;
  }

  return ReactGlobal.createElement(SecurePlantImage, {
    key: 'plant-image',
    src: plant.image,
    alt: `Растение ${plant.id}`,
    className: 'w-full h-full object-cover',
    style: { border: isMobile ? 'none' : '6px solid #C29C27' }
  });
}

function renderFeedbackPanel(ReactGlobal, type, texts, isMobile) {
  const { createElement } = ReactGlobal;
  const isCorrect = type === 'correct';
  const accentColor = isCorrect ? '#4CAF50' : '#E53935';
  const srText = isCorrect ? texts.correct : texts.incorrect;
  const iconSize = isMobile ? 200 : 240;

  const icon = isCorrect
    ? createElement('svg', {
      key: 'icon',
      width: iconSize,
      height: iconSize,
      viewBox: '0 0 200 200',
      fill: 'none',
      'aria-hidden': 'true'
    }, [
      createElement('path', {
        key: 'outline',
        d: 'M52 108L86 142L148 68',
        stroke: '#C29C27',
        strokeWidth: 18,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      }),
      createElement('path', {
        key: 'check',
        d: 'M52 108L86 142L148 68',
        stroke: accentColor,
        strokeWidth: 14,
        strokeLinecap: 'round',
        strokeLinejoin: 'round'
      })
    ])
    : createElement('svg', {
      key: 'icon',
      width: iconSize,
      height: iconSize,
      viewBox: '0 0 200 200',
      fill: 'none',
      'aria-hidden': 'true'
    }, [
      createElement('path', {
        key: 'line-1',
        d: 'M60 60L140 140',
        stroke: accentColor,
        strokeWidth: 16,
        strokeLinecap: 'round'
      }),
      createElement('path', {
        key: 'line-2',
        d: 'M140 60L60 140',
        stroke: accentColor,
        strokeWidth: 16,
        strokeLinecap: 'round'
      })
    ]);

  const reducedBorderWidth = Math.max(1, (isMobile ? 4 : 8) / 7);
  const outerPadding = isCorrect ? '7px' : (isMobile ? '24px 12px' : '48px');
  const frameBorder = isCorrect
    ? `${reducedBorderWidth}px solid ${accentColor}`
    : (isMobile ? `4px solid ${accentColor}` : `8px solid ${accentColor}`);
  const frameRadius = isCorrect ? '0px' : (isMobile ? '18px' : '24px');
  const framePadding = isCorrect ? (isMobile ? '18px' : '32px') : (isMobile ? '18px' : '28px');

  return createElement('div', {
    className: 'h-full flex items-center justify-center',
    style: {
      width: isMobile ? '100%' : '675px',
      backgroundColor: '#163B3A',
      border: isMobile ? 'none' : '6px solid #C29C27',
      padding: outerPadding
    }
  }, createElement('div', {
    className: 'flex items-center justify-center',
    style: {
      width: '100%',
      maxWidth: isCorrect ? '100%' : (isMobile ? '320px' : '420px'),
      height: isCorrect ? '100%' : 'auto',
      minHeight: isMobile ? '220px' : '260px',
      border: frameBorder,
      borderRadius: frameRadius,
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: framePadding
    }
  }, [
    icon,
    createElement('span', { key: 'label', className: 'sr-only' }, srText)
  ]));
}

export default function GameScreen({
  texts,
  isMobile,
  currentRoundIndex,
  totalRounds,
  currentQuestionIndex,
  totalQuestionsInRound,
  questionsPerRound,
  score,
  gameState,
  currentPlant,
  options,
  plantLanguage,
  onAnswer,
  onPlantLanguageChange,
  gameMode
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameScreen.');
  }

  const { createElement } = ReactGlobal;

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile);
  const normalizedQuestionIndex = Number.isFinite(currentQuestionIndex) && currentQuestionIndex >= 0
    ? currentQuestionIndex
    : 0;
  const availableQuestions = Number.isFinite(totalQuestionsInRound) && totalQuestionsInRound > 0
    ? totalQuestionsInRound
    : (Number.isFinite(questionsPerRound) && questionsPerRound > 0 ? questionsPerRound : 0);
  const totalQuestions = availableQuestions;
  const tentativeQuestionNumber = normalizedQuestionIndex + 1;
  const questionNumber = availableQuestions > 0
    ? Math.min(tentativeQuestionNumber, availableQuestions)
    : tentativeQuestionNumber;
  const displayQuestionNumber = questionNumber > 0 ? questionNumber : tentativeQuestionNumber;
  const questionHeading = texts && texts.question ? texts.question : '';

  const content = createElement('div', {
    key: 'main',
    className: 'relative z-10 flex-1 w-full flex flex-col items-center'
  }, [
    createElement('div', {
      key: 'inner',
      className: 'w-full max-w-5xl mx-auto flex flex-col items-center'
    }, [
      createElement('div', {
        key: 'game-area',
        className: 'w-full shadow-lg',
        style: {
          backgroundColor: '#163B3A',
          border: isMobile ? 'none' : '6px solid #C29C27',
          padding: isMobile ? '3px' : '32px'
        }
      }, [
        createElement('h2', {
          key: 'question',
          className: 'text-3xl font-bold text-center',
          style: {
            color: '#C29C27',
            marginBottom: isMobile ? '12px' : '32px'
          }
        }, questionHeading ? `${displayQuestionNumber}. ${questionHeading}` : `${displayQuestionNumber}.`),

        createElement('div', {
          key: 'progress-bar',
          className: 'flex',
          style: {
            gap: '4px',
            marginBottom: isMobile ? '8px' : '16px',
            width: '100%'
          }
        }, Array.from({ length: totalQuestions }).map((_, index) => 
  createElement('div', {
    key: `progress-${index}`,
    style: {
      height: isMobile ? '6px' : '8px',
      flex: '1',
      backgroundColor: index < normalizedQuestionIndex 
        ? '#C29C27' 
        : 'transparent',
      border: index < normalizedQuestionIndex 
        ? 'none' 
        : '1px solid rgba(194, 156, 39, 0.4)',
      borderRadius: '2px'
    }
  })
))
        createElement('div', {
          key: 'image-area',
          className: 'flex justify-center',
          style: {
            height: isMobile ? 'auto' : '450px',
            marginBottom: isMobile ? '12px' : '32px',
            width: '100%'
          }
        }, [
          gameState === 'playing' && currentPlant && createElement('div', {
            className: 'h-full',
            style: {
              width: isMobile ? '100%' : '675px',
              height: '100%'
            }
          }, renderPlantImage(ReactGlobal, currentPlant, isMobile)),
          gameState === 'correct' && renderFeedbackPanel(ReactGlobal, 'correct', texts, isMobile),
          gameState === 'incorrect' && renderFeedbackPanel(ReactGlobal, 'incorrect', texts, isMobile)
        ]),
        gameState === 'playing' && options.length > 0 && createElement('div', {
          key: 'options',
          className: isMobile ? 'grid grid-cols-1 w-full' : 'grid grid-cols-2 gap-4 max-w-3xl mx-auto',
          style: {
            gap: isMobile ? '6px' : undefined,
            width: '100%'
          }
        }, options.map(option => createElement('button', {
          key: option.id,
          onClick: () => onAnswer(option.id),
          className: 'font-semibold transition-all duration-200 hover:opacity-80 hover:scale-105',
          style: {
            backgroundColor: '#163B3A',
            border: '4px solid #C29C27',
            color: '#C29C27',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            fontSize: isMobile ? '20.8px' : '20px',
            padding: isMobile ? '12px 14px' : '16px 24px',
            width: '100%'
          }
        }, option.label)))
      ]),
      createElement('div', {
        key: 'instruction',
        className: 'text-center mt-6 opacity-75',
        style: { color: '#C29C27' }
      }, texts.instruction),
    ])
  ]);

  return createElement('div', {
    className: 'min-h-screen relative flex flex-col overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
  }, [
    desktopBackgroundPattern,
    createElement(GameHeader, {
      key: 'header',
      texts,
      currentRoundIndex,
      totalRounds,
      score,
      questionNumber,
      totalQuestions,
      plantLanguage,
      onPlantLanguageChange,
      gameMode
    }),
    content
  ].filter(Boolean));
}
