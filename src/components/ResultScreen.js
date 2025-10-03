import GameHeader from './GameHeader.js';
import { GAME_MODES } from '../gameConfig.js';
import { defaultLang } from '../i18n/uiTexts.js';

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

function renderRoundMistakes({ ReactGlobal, texts, roundMistakes, plantLanguage }) {
  if (!Array.isArray(roundMistakes) || roundMistakes.length === 0) {
    return null;
  }

  const { createElement } = ReactGlobal;
  const mistakesTitle = texts.roundMistakesTitle || 'Растения, в которых были ошибки';
  const isSingleMistake = roundMistakes.length === 1;

  const listClassName = `flex flex-col gap-4 w-full ${isSingleMistake ? 'items-center' : 'items-stretch'}`;

  return createElement('div', {
    key: 'round-mistakes',
    className: 'w-full flex flex-col gap-4',
    style: { color: '#C29C27' }
  }, [
    createElement('h2', {
      key: 'mistakes-title',
      className: 'text-2xl font-semibold text-center'
    }, mistakesTitle),
    createElement('div', {
      key: 'mistakes-list',
      className: listClassName
    }, roundMistakes.map((mistake, index) => {
      const names = mistake && mistake.names ? mistake.names : {};
      const label = names[plantLanguage]
        || names[defaultLang]
        || Object.values(names)[0]
        || '';

      return createElement('div', {
        key: mistake.questionVariantId || mistake.id || `mistake-${index}`,
        className: 'flex flex-col sm:flex-row items-center justify-center gap-4 w-full p-4 rounded-2xl',
        style: {
          backgroundColor: '#0F2A2A',
          border: '3px solid #C29C27'
        }
      }, [
        createElement('img', {
          key: 'image',
          src: mistake.image,
          alt: label,
          className: 'object-cover',
          style: {
            width: isSingleMistake ? '220px' : '140px',
            height: isSingleMistake ? '220px' : '140px',
            borderRadius: '18px',
            border: '4px solid #C29C27',
            backgroundColor: '#163B3A'
          }
        }),
        createElement('span', {
          key: 'label',
          className: 'text-xl font-semibold text-center sm:text-left',
          style: {
            color: '#C29C27',
            maxWidth: '100%'
          }
        }, label)
      ]);
    }))
  ]);
}

function renderRoundComplete({
  ReactGlobal,
  texts,
  score,
  currentRoundIndex,
  totalRounds,
  onStartNextRound,
  roundMistakes,
  plantLanguage
}) {
  const { createElement } = ReactGlobal;
  const roundNumber = currentRoundIndex + 1;
  const nextRoundNumber = Math.min(currentRoundIndex + 2, totalRounds);
  const roundCompletedText = (texts.roundCompleted || '').replace('{{round}}', roundNumber);
  const startNextRoundText = (texts.startRoundButton || '').replace('{{round}}', nextRoundNumber);
  const mistakesSection = renderRoundMistakes({ ReactGlobal, texts, roundMistakes, plantLanguage });

  return createElement('div', {
    key: 'round-result',
    className: 'p-8 shadow-lg text-center w-full max-w-4xl mx-4 flex flex-col gap-6 items-center',
    style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
  }, [
    createElement('h1', {
      key: 'round-title',
      className: 'text-3xl font-bold',
      style: { color: '#C29C27' }
    }, roundCompletedText || `Round ${roundNumber} completed!`),
    createElement('p', {
      key: 'round-score',
      className: 'text-2xl font-semibold',
      style: { color: '#C29C27' }
    }, `${texts.score}: ${score}`),
    mistakesSection,
    createElement('button', {
      key: 'next-round',
      onClick: onStartNextRound,
      className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
      style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
    }, startNextRoundText || 'Start next round')
  ].filter(Boolean));
}

function renderGameComplete({ ReactGlobal, texts, score, onRestart }) {
  const { createElement } = ReactGlobal;
  const completedText = (texts.gameCompletedTitle || '').replace('{{score}}', score);

  return createElement('div', {
    key: 'result',
    className: 'p-8 shadow-lg text-center max-w-md mx-4 flex flex-col gap-4',
    style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
  }, [
    createElement('h1', {
      key: 'title',
      className: 'text-3xl font-bold',
      style: { color: '#C29C27' }
    }, completedText || `${texts.result} ${score} ${texts.resultPoints}!`),
    createElement('button', {
      key: 'restart',
      onClick: onRestart,
      className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
      style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
    }, texts.restart || texts.playAgain || 'Restart')
  ]);
}

function renderEndlessOutcome({ ReactGlobal, texts, score, isFailure, onRestart, onReturnToMenu }) {
  const { createElement } = ReactGlobal;
  const title = isFailure
    ? texts.endlessFailureTitle || 'Too many mistakes! Try again'
    : texts.endlessSuccessTitle || 'Congratulations! You completed endless mode!';
  const retryLabel = texts.endlessRetry || texts.restart || texts.playAgain || 'Retry';
  const backLabel = texts.backToMenu || 'Back to menu';
  const scoreLabel = `${texts.score || 'Score'}: ${score}`;

  return createElement('div', {
    key: 'endless-result',
    className: 'p-8 shadow-lg text-center max-w-md mx-4 flex flex-col gap-4',
    style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
  }, [
    createElement('h1', {
      key: 'title',
      className: 'text-3xl font-bold',
      style: { color: '#C29C27' }
    }, title),
    createElement('p', {
      key: 'score',
      className: 'text-2xl font-semibold',
      style: { color: '#C29C27' }
    }, scoreLabel),
    createElement('div', {
      key: 'buttons',
      className: 'flex flex-col gap-3'
    }, [
      createElement('button', {
        key: 'retry',
        onClick: onRestart,
        className: 'px-6 py-3 font-semibold transition-colors hover:opacity-80',
        style: { backgroundColor: '#C29C27', color: '#163B3A', border: '4px solid #C29C27' }
      }, retryLabel),
      createElement('button', {
        key: 'back',
        onClick: onReturnToMenu,
        className: 'px-6 py-3 font-semibold transition-colors hover:opacity-80',
        style: { backgroundColor: '#163B3A', color: '#C29C27', border: '4px solid #C29C27' }
      }, backLabel)
    ])
  ]);
}

export default function ResultScreen({
  phase,
  texts,
  score,
  currentRoundIndex,
  totalRounds,
  isMobile,
  plantLanguage,
  onPlantLanguageChange,
  onStartNextRound,
  onRestart,
  gameMode = GAME_MODES.CLASSIC,
  onReturnToMenu,
  interfaceLanguage,
  roundMistakes = []
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering ResultScreen.');
  }

  const { createElement } = ReactGlobal;

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile);

  let content;
  if (phase === 'endlessComplete' || phase === 'endlessFailed') {
    const isFailure = phase === 'endlessFailed';
    content = renderEndlessOutcome({
      ReactGlobal,
      texts,
      score,
      isFailure,
      onRestart,
      onReturnToMenu
    });
  } else if (phase === 'roundComplete') {
    content = renderRoundComplete({
      ReactGlobal,
      texts,
      score,
      currentRoundIndex,
      totalRounds,
      onStartNextRound,
      roundMistakes,
      plantLanguage
    });
  } else {
    content = renderGameComplete({ ReactGlobal, texts, score, onRestart });
  }

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
      plantLanguage,
      onPlantLanguageChange,
      gameMode,
      showQuestionProgress: false,
      interfaceLanguage
    }),
    createElement('div', {
      key: 'main',
      className: 'relative z-10 flex-1 w-full flex items-center justify-center'
    }, [
      createElement('div', {
        key: 'content-wrapper',
        className: 'w-full max-w-5xl mx-auto flex justify-center'
      }, [content])
    ])
  ].filter(Boolean));
}
