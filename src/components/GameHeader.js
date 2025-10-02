import { GAME_MODES } from '../gameConfig.js';

export default function GameHeader({
  texts,
  currentRoundIndex,
  score,
  plantLanguage,
  onPlantLanguageChange,
  showLanguageSelector = true,
  gameMode = GAME_MODES.CLASSIC,
  interfaceLanguage
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameHeader.');
  }

  const { createElement } = ReactGlobal;

  const roundLabel = texts && texts.roundLabel ? texts.roundLabel : 'Round';
  const scoreLabel = texts && texts.score ? texts.score : 'Score';
  const isEndless = gameMode === GAME_MODES.ENDLESS;
  const endlessLabel = texts && texts.endlessModeHeading
    ? texts.endlessModeHeading
    : texts && texts.endlessModeButton
      ? texts.endlessModeButton
      : 'Endless Mode';
  const progressLabelText = isEndless
    ? endlessLabel
    : `${roundLabel} ${currentRoundIndex + 1}`;

  const progressSection = createElement('div', {
    key: 'progress-info',
    className: 'flex items-end gap-3 flex-wrap',
    style: { color: '#C29C27' }
  }, createElement('span', {
    className: 'text-lg font-semibold whitespace-nowrap'
  }, progressLabelText));

  let languageButtons = null;
  if (showLanguageSelector && typeof onPlantLanguageChange === 'function') {
    const availablePlantLanguages = Array.from(new Set([
      interfaceLanguage,
      'sci'
    ].filter(Boolean)));

    languageButtons = createElement('div', {
      key: 'lang-buttons',
      className: 'flex gap-2'
    }, availablePlantLanguages.map(lang => createElement('button', {
      key: lang,
      onClick: () => onPlantLanguageChange(lang),
      className: 'px-2.5 py-1 text-xs font-bold uppercase transition-all tracking-wide',
      style: {
        backgroundColor: plantLanguage === lang ? '#C29C27' : 'transparent',
        color: plantLanguage === lang ? '#163B3A' : '#C29C27',
        border: '2px solid #C29C27',
        lineHeight: 1.1
      }
    }, lang === 'sci' ? 'Sci' : lang.toUpperCase())));
  }

  const scoreCircle = createElement('div', {
    key: 'score-circle',
    className: 'font-bold flex items-center justify-center',
    style: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#C29C27',
      color: '#163B3A',
      fontSize: '20px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
    },
    'aria-label': `${scoreLabel}: ${score}`
  }, String(score));

  const rightSection = languageButtons ? createElement('div', {
    key: 'right-section',
    className: 'flex flex-col items-end gap-2'
  }, [languageButtons]) : null;

  return createElement('div', {
    className: 'relative z-10 w-full max-w-5xl mx-auto mb-6 flex items-center justify-between gap-3'
  }, [
    progressSection,
    scoreCircle,
    rightSection
  ].filter(Boolean));
}
