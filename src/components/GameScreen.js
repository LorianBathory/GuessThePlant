import { INTERFACE_LANGUAGES } from '../gameConfig.js';
import GameHeader from './GameHeader.js';

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

return ReactGlobal.createElement('img', {
    key: 'plant-image',
    src: plant.image,
    alt: `Растение ${plant.id}`,
    className: 'w-full h-full object-cover',
    style: { border: isMobile ? 'none' : '6px solid #C29C27' }
  });
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
  interfaceLanguage,
  onAnswer,
  onPlantLanguageChange,
  onInterfaceLanguageChange
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
          gameState === 'correct' && createElement('div', {
            className: 'h-full flex items-center justify-center text-6xl font-bold',
            style: {
              width: isMobile ? '100%' : '675px',
              color: '#C29C27',
              backgroundColor: '#163B3A',
              border: isMobile ? 'none' : '6px solid #C29C27',
              padding: isMobile ? '24px 12px' : '0'
            }
          }, texts.correct),
          gameState === 'incorrect' && createElement('div', {
            className: 'h-full flex items-center justify-center text-6xl font-bold',
            style: {
              width: isMobile ? '100%' : '675px',
              color: '#C29C27',
              backgroundColor: '#163B3A',
              border: isMobile ? 'none' : '6px solid #C29C27',
              padding: isMobile ? '24px 12px' : '0'
            }
          }, texts.incorrect)
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
            fontSize: isMobile ? '16px' : '20px',
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
      createElement('div', {
        key: 'default-lang-selector',
        className: 'text-center mt-6 flex flex-col items-center gap-3'
      }, [
        createElement('span', {
          key: 'label',
          className: 'text-lg font-semibold',
          style: { color: '#C29C27' }
        }, texts.interfaceLanguageLabel),
        createElement('div', {
          key: 'buttons',
          className: 'flex gap-2'
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
      ])
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
      onPlantLanguageChange
    }),
    content
  ].filter(Boolean));
}
