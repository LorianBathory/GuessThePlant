export default function VoiceModeResult({ phase, score, onRestart, onGoToMenu }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoiceModeResult.');
  }

  const { createElement } = ReactGlobal;
  const isSuccess = phase === 'endlessComplete';
  const title = isSuccess
    ? 'Поздравляем! Вы прошли бесконечный режим.'
    : 'Слишком много ошибок. Попробуйте ещё раз.';
  const description = isSuccess
    ? 'Вы ответили на все доступные вопросы. Можно сыграть снова, чтобы закрепить знания.'
    : 'Счёт опустился ниже нуля. Начните заново и постарайтесь быть внимательнее.';

  return createElement('div', {
    className: 'min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-emerald-950 text-center text-emerald-50'
  }, [
    createElement('h1', {
      key: 'title',
      className: 'text-3xl md:text-4xl font-extrabold mb-4 max-w-3xl'
    }, title),
    createElement('p', {
      key: 'description',
      className: 'text-lg md:text-xl text-emerald-100 mb-6 max-w-2xl'
    }, description),
    createElement('div', {
      key: 'score',
      className: 'text-2xl md:text-3xl font-semibold mb-8'
    }, `Ваш счёт: ${score}`),
    createElement('div', {
      key: 'actions',
      className: 'flex flex-col sm:flex-row gap-4'
    }, [
      createElement('button', {
        key: 'restart',
        onClick: onRestart,
        className: 'px-6 py-4 rounded-2xl text-lg font-semibold bg-emerald-500 text-emerald-900 hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200'
      }, 'Сыграть снова'),
      createElement('button', {
        key: 'menu',
        onClick: onGoToMenu,
        className: 'px-6 py-4 rounded-2xl text-lg font-semibold bg-emerald-900 text-emerald-100 border border-emerald-400 hover:bg-emerald-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200'
      }, 'К экрану запуска')
    ])
  ]);
}
