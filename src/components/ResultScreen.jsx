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

function renderRoundComplete({
  ReactGlobal,
  texts,
  score,
  currentRoundIndex,
  totalRounds,
  onStartNextRound
}) {
  const { createElement } = ReactGlobal;
  const roundNumber = currentRoundIndex + 1;
  const nextRoundNumber = Math.min(currentRoundIndex + 2, totalRounds);
  const roundCompletedText = (texts.roundCompleted || '').replace('{{round}}', roundNumber);
  const startNextRoundText = (texts.startRoundButton || '').replace('{{round}}', nextRoundNumber);

  return createElement('div', {
    key: 'round-result',
    className: 'p-8 shadow-lg text-center max-w-md mx-4 flex flex-col gap-4',
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
    createElement('button', {
      key: 'next-round',
      onClick: onStartNextRound,
      className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
      style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
    }, startNextRoundText || 'Start next round')
  ]);
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

export default function ResultScreen({
  phase,
  texts,
  score,
  currentRoundIndex,
  totalRounds,
  isMobile,
  onStartNextRound,
  onRestart
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering ResultScreen.');
  }

  const { createElement } = ReactGlobal;

  const desktopBackgroundPattern = renderDesktopBackground(ReactGlobal, isMobile);

  const content = phase === 'roundComplete'
    ? renderRoundComplete({ ReactGlobal, texts, score, currentRoundIndex, totalRounds, onStartNextRound })
    : renderGameComplete({ ReactGlobal, texts, score, onRestart });

  return createElement('div', {
    className: 'min-h-screen flex items-center justify-center relative overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
  }, [desktopBackgroundPattern, content]);
}
