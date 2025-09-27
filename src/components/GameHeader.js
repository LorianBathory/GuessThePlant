import { PLANT_LANGUAGES } from '../gameConfig.js';

export default function GameHeader({
  texts,
  currentRoundIndex,
  totalRounds,
  score,
  questionNumber,
  totalQuestions,
  plantLanguage,
  onPlantLanguageChange,
  showQuestionProgress = true,
  showLanguageSelector = true
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering GameHeader.');
  }

  const { createElement } = ReactGlobal;

  const roundLabel = texts && texts.roundLabel ? texts.roundLabel : 'Round';
  const scoreLabel = texts && texts.score ? texts.score : 'Score';
  const hasQuestionProgress = showQuestionProgress
    && Number.isFinite(questionNumber)
    && Number.isFinite(totalQuestions);

  const progressChildren = [
    createElement('span', {
      key: 'round-info',
      className: 'text-base font-semibold whitespace-nowrap'
    }, `${roundLabel} ${currentRoundIndex + 1}/${totalRounds}`)
  ];

  if (hasQuestionProgress) {
    progressChildren.push(createElement('span', {
      key: 'progress',
      className: 'text-xl font-bold tracking-wider'
    }, `${questionNumber}/${totalQuestions}`));
  }

  let languageButtons = null;
  if (showLanguageSelector && typeof onPlantLanguageChange === 'function') {
    languageButtons = createElement('div', {
      key: 'lang-buttons',
      className: 'flex gap-2'
    }, PLANT_LANGUAGES.map(lang => createElement('button', {
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

  const rightSectionChildren = [];

  if (languageButtons) {
    rightSectionChildren.push(languageButtons);
  }

  rightSectionChildren.push(createElement('div', {
    key: 'score',
    className: 'text-xl font-bold',
    style: { color: '#C29C27' }
  }, `${scoreLabel}: ${score}`));

  return createElement('div', {
    className: 'relative z-10 w-full max-w-5xl mx-auto mb-6 flex items-start justify-between gap-3'
  }, [
    createElement('div', {
      key: 'progress-info',
      className: 'flex items-end gap-3 flex-wrap',
      style: { color: '#C29C27' }
    }, progressChildren),
    createElement('div', {
      key: 'right-section',
      className: 'flex flex-col items-end gap-2'
    }, rightSectionChildren)
  ]);
}
