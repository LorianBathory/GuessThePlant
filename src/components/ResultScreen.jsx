function renderDesktopBackground(isMobile) {
  if (isMobile) {
    return null;
  }

  return React.createElement('div', {
    key: 'background-pattern',
    className: 'absolute inset-0 pointer-events-none flex justify-between px-10',
    style: { zIndex: 0 }
  }, ['left', 'right'].map(side => React.createElement('div', {
    key: side,
    className: 'flex flex-col justify-between h-full py-10'
  }, Array.from({ length: 8 }).map((_, index) => React.createElement('div', {
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
  texts,
  score,
  currentRoundIndex,
  totalRounds,
  onStartNextRound
}) {
  const roundNumber = currentRoundIndex + 1;
  const nextRoundNumber = Math.min(currentRoundIndex + 2, totalRounds);
  const roundCompletedText = (texts.roundCompleted || '').replace('{{round}}', roundNumber);
  const startNextRoundText = (texts.startRoundButton || '').replace('{{round}}', nextRoundNumber);

  return React.createElement('div', {
    key: 'round-result',
    className: 'p-8 shadow-lg text-center max-w-md mx-4 flex flex-col gap-4',
    style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
  }, [
    React.createElement('h1', {
      key: 'round-title',
      className: 'text-3xl font-bold',
      style: { color: '#C29C27' }
    }, roundCompletedText || `Round ${roundNumber} completed!`),
    React.createElement('p', {
      key: 'round-score',
      className: 'text-2xl font-semibold',
      style: { color: '#C29C27' }
    }, `${texts.score}: ${score}`),
    React.createElement('button', {
      key: 'next-round',
      onClick: onStartNextRound,
      className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
      style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
    }, startNextRoundText || 'Start next round')
  ]);
}

function renderGameComplete({ texts, score, onRestart }) {
  const completedText = (texts.gameCompletedTitle || '').replace('{{score}}', score);

  return React.createElement('div', {
    key: 'result',
    className: 'p-8 shadow-lg text-center max-w-md mx-4 flex flex-col gap-4',
    style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
  }, [
    React.createElement('h1', {
      key: 'title',
      className: 'text-3xl font-bold',
      style: { color: '#C29C27' }
    }, completedText || `${texts.result} ${score} ${texts.resultPoints}!`),
    React.createElement('button', {
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
  const desktopBackgroundPattern = renderDesktopBackground(isMobile);

  const content = phase === 'roundComplete'
    ? renderRoundComplete({ texts, score, currentRoundIndex, totalRounds, onStartNextRound })
    : renderGameComplete({ texts, score, onRestart });

  return React.createElement('div', {
    className: 'min-h-screen flex items-center justify-center relative overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
  }, [desktopBackgroundPattern, content]);
}
