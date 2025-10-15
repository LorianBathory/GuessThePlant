import GameHeader from './GameHeader.js';
import { questionTypes } from '../data/questionTypes.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

const DESKTOP_IMAGE_HEIGHT = 510;
const DESKTOP_IMAGE_ASPECT_RATIO = 3 / 2;
const DESKTOP_IMAGE_WIDTH = DESKTOP_IMAGE_HEIGHT * DESKTOP_IMAGE_ASPECT_RATIO;
const DESKTOP_FEEDBACK_WIDTH = 675;
const DESKTOP_FEEDBACK_HEIGHT = 510;

function SecurePlantImage({ src, alt, className, style, accentColor = '#C29C27' }) {
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
        color: accentColor,
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

function renderDesktopBackground(ReactGlobal, isMobile, accentColor) {
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
      backgroundColor: accentColor
    }
  })))));
}

function renderPlantImage(ReactGlobal, plant, isMobile, accentColor) {
  if (!plant || !plant.image || !plant.image.startsWith('images/')) {
    return null;
  }

  return ReactGlobal.createElement(SecurePlantImage, {
    key: 'plant-image',
    src: plant.image,
    alt: `Растение ${plant.id}`,
    className: 'w-full h-full object-cover block',
    style: {
      border: isMobile ? 'none' : `6px solid ${accentColor}`,
      boxSizing: isMobile ? undefined : 'border-box',
      aspectRatio: isMobile ? undefined : `${DESKTOP_IMAGE_ASPECT_RATIO}`,
      display: 'block',
      margin: isMobile ? undefined : '0 auto'
    },
    accentColor
  });
}

function renderFeedbackPanel(ReactGlobal, type, texts, isMobile, themeAccentColor) {
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
        stroke: themeAccentColor,
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

  if (!isMobile) {
    return createElement('div', {
      className: 'h-full flex items-center justify-center',
      style: {
        width: `${DESKTOP_FEEDBACK_WIDTH}px`,
        height: `${DESKTOP_FEEDBACK_HEIGHT}px`,
        margin: '0 auto',
        backgroundColor: '#163B3A',
        border: `6px solid ${themeAccentColor}`,
        boxSizing: 'border-box',
        padding: '15px'
      }
    }, createElement('div', {
      className: 'flex items-center justify-center',
      style: {
        width: '100%',
        height: '100%',
        border: `2px solid ${accentColor}`,
        borderRadius: '0px',
        boxSizing: 'border-box',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, [
      icon,
      createElement('span', { key: 'label', className: 'sr-only' }, srText)
    ]));
  }

  const reducedBorderWidth = Math.max(1, 4 / 7);
  const outerPadding = isCorrect ? '7px' : '24px 12px';
  const frameBorder = isCorrect
    ? `${reducedBorderWidth}px solid ${accentColor}`
    : `4px solid ${accentColor}`;
  const frameRadius = isCorrect ? '0px' : '18px';
  const framePadding = '18px';
  const containerMaxWidth = isCorrect ? '100%' : '320px';
  const containerHeight = isCorrect ? '100%' : 'auto';

  return createElement('div', {
    className: 'h-full flex items-center justify-center',
    style: {
      width: '100%',
      backgroundColor: '#163B3A',
      border: 'none',
      padding: outerPadding
    }
  }, createElement('div', {
    className: 'flex items-center justify-center',
    style: {
      width: '100%',
      maxWidth: containerMaxWidth,
      height: containerHeight,
      minHeight: '220px',
      border: frameBorder,
      borderRadius: frameRadius,
      boxSizing: 'border-box',
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
  gameMode,
  interfaceLanguage
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameScreen.');
  }

  const { createElement, useEffect, useRef } = ReactGlobal;
  const isBouquetQuestion = currentPlant && currentPlant.questionType === questionTypes.BOUQUET;
  const interfaceAccentColor = isBouquetQuestion ? '#C9A9A6' : '#C29C27';
  const interfaceAccentColorTransparent = isBouquetQuestion
    ? 'rgba(201, 169, 166, 0.4)'
    : 'rgba(194, 156, 39, 0.4)';

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile, interfaceAccentColor);
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
  const plantQuestionKey = currentPlant && currentPlant.questionPromptKey
    ? currentPlant.questionPromptKey
    : null;
  const hasCustomPrompt = plantQuestionKey && texts && Object.prototype.hasOwnProperty.call(texts, plantQuestionKey);
  const questionPromptKey = hasCustomPrompt
    ? plantQuestionKey
    : 'question';
  const questionHeading = texts && texts[questionPromptKey]
    ? texts[questionPromptKey]
    : (texts && texts.question ? texts.question : '');

  const completedSegments = Math.min(
    totalQuestions,
    normalizedQuestionIndex + (gameState !== 'playing' ? 1 : 0)
  );

  const lastKnownOptionsCountRef = useRef(options.length > 0 ? options.length : 0);

  useEffect(() => {
    if (options.length > 0) {
      lastKnownOptionsCountRef.current = options.length;
    }
  }, [options.length]);

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
          border: isMobile ? 'none' : `6px solid ${interfaceAccentColor}`,
          padding: isMobile ? '3px' : '32px'
        }
      }, [
        createElement('h2', {
          key: 'question',
          className: 'text-3xl font-bold text-center',
          style: {
            color: interfaceAccentColor,
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
      backgroundColor: index < completedSegments
        ? interfaceAccentColor
        : 'transparent',
      border: index < completedSegments
        ? 'none'
        : `1px solid ${interfaceAccentColorTransparent}`,
      borderRadius: '2px'
    }
  })
)),
        createElement('div', {
          key: 'image-area',
          className: 'flex justify-center items-center',
          style: {
            height: isMobile ? 'auto' : `${DESKTOP_IMAGE_HEIGHT}px`,
            marginBottom: isMobile ? '12px' : '32px',
            width: '100%'
          }
        }, [
          gameState === 'playing' && currentPlant && createElement('div', {
            className: 'h-full flex justify-center items-center',
            style: {
              width: isMobile ? '100%' : `${DESKTOP_IMAGE_WIDTH}px`,
              height: '100%',
              margin: isMobile ? undefined : '0 auto'
            }
          }, renderPlantImage(ReactGlobal, currentPlant, isMobile, interfaceAccentColor)),
          gameState === 'correct' && renderFeedbackPanel(ReactGlobal, 'correct', texts, isMobile, interfaceAccentColor),
          gameState === 'incorrect' && renderFeedbackPanel(ReactGlobal, 'incorrect', texts, isMobile, interfaceAccentColor)
        ]),
        (() => {
          const hasOptions = options.length > 0;
          const baseContainerClass = isMobile
            ? 'grid grid-cols-1 w-full'
            : 'grid grid-cols-2 gap-4 max-w-3xl mx-auto';
          const baseContainerStyle = {
            width: '100%',
            ...(isMobile ? { gap: '6px' } : {})
          };
          const optionButtonStyle = {
            backgroundColor: '#163B3A',
            border: `4px solid ${interfaceAccentColor}`,
            color: interfaceAccentColor,
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            fontSize: isMobile ? '20.8px' : '20px',
            padding: isMobile ? '12px 14px' : '16px 24px',
            width: '100%'
          };

          if (gameState === 'playing' && hasOptions) {
            return createElement('div', {
              key: 'options',
              className: baseContainerClass,
              style: baseContainerStyle
            }, options.map(option => createElement('button', {
              key: option.id,
              onClick: () => onAnswer(option.id),
              className: 'font-semibold transition-all duration-200 hover:opacity-80 hover:scale-105',
              style: optionButtonStyle
            }, option.label)));
          }

          if (!isMobile) {
            const lastKnownCount = lastKnownOptionsCountRef.current;
            const placeholderCount = lastKnownCount > 0 ? lastKnownCount : 4;

            if (placeholderCount > 0) {
              return createElement('div', {
                key: 'options-placeholder',
                className: baseContainerClass,
                style: {
                  ...baseContainerStyle,
                  visibility: 'hidden',
                  pointerEvents: 'none'
                },
                'aria-hidden': 'true'
              }, Array.from({ length: placeholderCount }).map((_, index) => createElement('div', {
                key: `placeholder-${index}`,
                style: optionButtonStyle
              })));
            }
          }

          return null;
        })()
      ]),
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
      gameMode,
      interfaceLanguage,
      accentColor: interfaceAccentColor
    }),
    content
  ].filter(Boolean));
}
