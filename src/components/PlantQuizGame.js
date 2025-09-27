const { useState, useEffect, useCallback } = React;

const QUESTIONS_PER_ROUND = 6;

const PLANT_LANGUAGES = ['ru', 'en', 'sci'];
const INTERFACE_LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE_STORAGE_KEY = 'gtp-default-language';
const PLANT_LANGUAGE_STORAGE_KEY = 'gtp-plant-language';

function getStoredInterfaceLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY);
  return stored && INTERFACE_LANGUAGES.includes(stored) ? stored : null;
}

function getStoredPlantLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(PLANT_LANGUAGE_STORAGE_KEY);
  return stored && PLANT_LANGUAGES.includes(stored) ? stored : null;
}

import { plants, choicesById, ALL_CHOICE_IDS } from '../data/catalog.js';
import { shuffleArray } from '../utils/random.js';
import { uiTexts, defaultLang } from '../i18n/uiTexts.js';
import { difficultyLevels } from '../data/difficulties.js';

const ROUNDS = Object.freeze([
  { id: 1, difficulty: difficultyLevels.EASY },
  { id: 2, difficulty: difficultyLevels.MEDIUM },
  { id: 3, difficulty: difficultyLevels.HARD }
]);

const TOTAL_ROUNDS = ROUNDS.length;

function getQuestionsForRound(difficulty) {
  const pool = plants.filter(plant => plant.difficulty === difficulty);
  const roundLength = Math.min(QUESTIONS_PER_ROUND, pool.length);
  if (roundLength === 0) {
    return [];
  }
  return shuffleArray(pool).slice(0, roundLength);
}

export default function PlantQuizGame() {
  const [interfaceLanguage, setInterfaceLanguage] = useState(() => getStoredInterfaceLanguage() || defaultLang);
  const [plantLanguage, setPlantLanguage] = useState(() => {
    const storedPlantLanguage = getStoredPlantLanguage();
    if (storedPlantLanguage) {
      return storedPlantLanguage;
    }

    const storedInterface = getStoredInterfaceLanguage();
    if (storedInterface && PLANT_LANGUAGES.includes(storedInterface)) {
      return storedInterface;
    }

    return defaultLang;
  });
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundPhase, setRoundPhase] = useState('playing');
  const [sessionPlants, setSessionPlants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [optionIds, setOptionIds] = useState([]);
  const [correctAnswerId, setCorrectAnswerId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 600;
    }
    return false;
  });

  const texts = uiTexts[interfaceLanguage] || uiTexts[defaultLang];

  // Запуск нового раунда
  const startRound = useCallback((roundIndex, resetScore = false) => {
    const roundConfig = ROUNDS[roundIndex];
    if (!roundConfig) {
      return;
    }

    const questions = getQuestionsForRound(roundConfig.difficulty);
    setCurrentRoundIndex(roundIndex);

    if (resetScore) {
      setScore(0);
    }

    setSessionPlants(questions);
    setCurrentQuestion(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);

    if (questions.length === 0) {
      setRoundPhase(roundIndex >= TOTAL_ROUNDS - 1 ? 'gameComplete' : 'roundComplete');
    } else {
      setRoundPhase('playing');
    }
  }, []);

  const startGame = useCallback(() => {
    startRound(0, true);
  }, [startRound]);

  // Генерация ID вариантов ответов для растения
  function generateOptionIds(plant) {
    const correctId = plant.id;
    let wrongIds = [];

    if (plant.wrongAnswers && plant.wrongAnswers.length > 0) {
      wrongIds = plant.wrongAnswers.length > 3
        ? shuffleArray(plant.wrongAnswers).slice(0, 3)
        : plant.wrongAnswers.slice();

      if (wrongIds.length < 3) {
        const available = ALL_CHOICE_IDS.filter(id => id !== correctId && !wrongIds.includes(id));
        const shuffled = shuffleArray(available);
        while (wrongIds.length < 3 && shuffled.length > 0) wrongIds.push(shuffled.shift());
      }
    } else {
      const available = ALL_CHOICE_IDS.filter(id => id !== correctId);
      wrongIds = shuffleArray(available).slice(0, 3);
    }

    return shuffleArray([correctId, ...wrongIds]);
  }

  // Инициализация игры
  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    function updateIsMobile() {
      setIsMobile(window.innerWidth < 600);
    }

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  // Генерация вариантов при смене вопроса
  useEffect(() => {
    if (roundPhase !== 'playing') {
      return;
    }

    if (sessionPlants.length > 0 && currentQuestion < sessionPlants.length) {
      const currentPlant = sessionPlants[currentQuestion];
      if (gameState === 'playing' || currentQuestion === 0) {
        const newOptionIds = generateOptionIds(currentPlant);
        setOptionIds(newOptionIds);
        setCorrectAnswerId(currentPlant.id);
      }
    }
  }, [currentQuestion, sessionPlants, gameState, roundPhase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, interfaceLanguage);
    }
  }, [interfaceLanguage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLANT_LANGUAGE_STORAGE_KEY, plantLanguage);
    }
  }, [plantLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = interfaceLanguage;
    }
  }, [interfaceLanguage]);

  // Обработка ответа
  function handleAnswer(selectedId) {
    if (roundPhase !== 'playing' || gameState !== 'playing') {
      return;
    }

    if (selectedId === correctAnswerId) {
      setScore(prev => prev + 1);
      setGameState('correct');
    } else {
      setGameState('incorrect');
    }

    const isLastQuestion = currentQuestion + 1 >= sessionPlants.length;

    setTimeout(() => {
      if (isLastQuestion) {
        const isFinalRound = currentRoundIndex === TOTAL_ROUNDS - 1;
        setRoundPhase(isFinalRound ? 'gameComplete' : 'roundComplete');
        setGameState('playing');
        setOptionIds([]);
        setCorrectAnswerId(null);
      } else {
        setCurrentQuestion(prev => prev + 1);
        setGameState('playing');
      }
    }, 1500);
  }

  // Изменение языка названий растений
  function changePlantLanguage(newLang) {
    if (!PLANT_LANGUAGES.includes(newLang)) {
      return;
    }

    setPlantLanguage(newLang);
  }

  function changeInterfaceLanguage(newLang) {
    if (!INTERFACE_LANGUAGES.includes(newLang)) {
      return;
    }
    setInterfaceLanguage(newLang);
  }

  function handleStartNextRound() {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex < TOTAL_ROUNDS) {
      startRound(nextRoundIndex);
    }
  }

  function handleRestart() {
    startGame();
  }

  // Получение изображения растения
  function getPlantImage(plantData) {
    if (plantData.image && plantData.image.startsWith('images/')) {
      return React.createElement('img', {
        key: 'plant-image',
        src: plantData.image,
        alt: `Растение ${plantData.id}`,
        className: 'w-full h-full object-cover',
        style: { border: isMobile ? 'none' : '6px solid #C29C27' }
      });
    }
    return null;
  }

  // Экран завершения раунда
  const desktopBackgroundPattern = !isMobile
    ? React.createElement('div', {
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
    })))))
    : null;

  if (roundPhase === 'roundComplete') {
    const roundNumber = currentRoundIndex + 1;
    const nextRoundNumber = currentRoundIndex + 2;
    const roundCompletedText = (texts.roundCompleted || '').replace('{{round}}', roundNumber);
    const startNextRoundText = (texts.startRoundButton || '').replace('{{round}}', nextRoundNumber);

    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center relative overflow-hidden',
      style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
    }, [
      desktopBackgroundPattern,
      React.createElement('div', {
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
          onClick: handleStartNextRound,
          className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
          style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
        }, startNextRoundText || 'Start next round')
      ])
    ]);
  }

  // Экран завершения игры
  if (roundPhase === 'gameComplete') {
    const completedText = (texts.gameCompletedTitle || '').replace('{{score}}', score);

    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center relative overflow-hidden',
      style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
    }, [
      desktopBackgroundPattern,
      React.createElement('div', {
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
          onClick: handleRestart,
          className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
          style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
        }, texts.restart || texts.playAgain || 'Restart')
      ])
    ]);
  }

  // Основной экран
  return React.createElement('div', {
    className: 'min-h-screen relative flex items-center justify-center overflow-hidden',
    style: { backgroundColor: '#163B3A', padding: isMobile ? '3px' : '16px' }
  }, [
    desktopBackgroundPattern,

    React.createElement('div', { key: 'container', className: 'w-full max-w-5xl mx-auto relative z-10' }, [
      React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6 flex-wrap gap-4' }, [
        React.createElement('div', {
          key: 'progress-info',
          className: 'flex flex-col',
          style: { color: '#C29C27' }
        }, [
          React.createElement('span', {
            key: 'round-info',
            className: 'text-lg font-semibold'
          }, `${texts.roundLabel || 'Round'} ${currentRoundIndex + 1}/${TOTAL_ROUNDS}`),
          React.createElement('span', {
            key: 'progress',
            className: 'text-2xl font-bold'
          }, sessionPlants.length > 0
            ? `${currentQuestion + 1}/${sessionPlants.length}`
            : `0/${QUESTIONS_PER_ROUND}`)
        ]),

        React.createElement('div', { key: 'right-section', className: 'flex items-center gap-4' }, [
          React.createElement('div', {
            key: 'score',
            className: 'text-2xl font-bold',
            style: { color: '#C29C27' }
          }, `${texts.score}: ${score}`),

          React.createElement('div', { key: 'lang-buttons', className: 'flex gap-2' },
            PLANT_LANGUAGES.map(lang =>
              React.createElement('button', {
                key: lang,
                onClick: () => changePlantLanguage(lang),
                className: 'px-3 py-1 text-sm font-bold uppercase transition-all',
                style: {
                  backgroundColor: plantLanguage === lang ? '#C29C27' : 'transparent',
                  color: plantLanguage === lang ? '#163B3A' : '#C29C27',
                  border: '2px solid #C29C27'
                }
              }, lang === 'sci' ? 'Sci' : lang.toUpperCase())
            )
          )
        ])
      ]),

      React.createElement('div', {
        key: 'game-area',
        className: 'shadow-lg',
        style: {
          backgroundColor: '#163B3A',
          border: isMobile ? 'none' : '6px solid #C29C27',
          padding: isMobile ? '3px' : '32px'
        }
      }, [
        React.createElement('h2', {
          key: 'question',
          className: 'text-3xl font-bold text-center',
          style: {
            color: '#C29C27',
            marginBottom: isMobile ? '12px' : '32px'
          }
        }, texts.question),

        React.createElement('div', {
          key: 'image-area',
          className: 'flex justify-center',
          style: {
            height: isMobile ? 'auto' : '450px',
            marginBottom: isMobile ? '12px' : '32px',
            width: '100%'
          }
        }, [
          gameState === 'playing' && sessionPlants.length > 0 && currentQuestion < sessionPlants.length &&
            React.createElement('div', {
              className: 'h-full',
              style: {
                width: isMobile ? '100%' : '675px',
                height: '100%'
              }
            },
              getPlantImage(sessionPlants[currentQuestion])
            ),

          gameState === 'correct' && React.createElement('div', {
            className: 'h-full flex items-center justify-center text-6xl font-bold',
            style: {
              width: isMobile ? '100%' : '675px',
              color: '#C29C27',
              backgroundColor: '#163B3A',
              border: isMobile ? 'none' : '6px solid #C29C27',
              padding: isMobile ? '24px 12px' : '0'
            }
          }, texts.correct),

          gameState === 'incorrect' && React.createElement('div', {
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

        gameState === 'playing' && optionIds.length > 0 && React.createElement('div', {
          key: 'options',
          className: isMobile ? 'grid grid-cols-1 w-full' : 'grid grid-cols-2 gap-4 max-w-3xl mx-auto',
          style: {
            gap: isMobile ? '6px' : undefined,
            width: '100%'
          }
        }, optionIds.map((optionId, index) => {
          const cell = choicesById[optionId];
          const optionName = cell ? (cell[plantLanguage] || cell[defaultLang]) : '';
          return React.createElement('button', {
            key: `option-${index}`,
            onClick: () => handleAnswer(optionId),
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
          }, optionName);
        }))
      ]),

      React.createElement('div', {
        key: 'instruction',
        className: 'text-center mt-6 opacity-75',
        style: { color: '#C29C27' }
      }, texts.instruction),

      React.createElement('div', {
        key: 'default-lang-selector',
        className: 'text-center mt-6 flex flex-col items-center gap-3'
      }, [
        React.createElement('span', {
          key: 'label',
          className: 'text-lg font-semibold',
          style: { color: '#C29C27' }
        }, texts.interfaceLanguageLabel),
        React.createElement('div', {
          key: 'buttons',
          className: 'flex gap-2'
        }, INTERFACE_LANGUAGES.map(lang => React.createElement('button', {
          key: `interface-${lang}`,
          onClick: () => changeInterfaceLanguage(lang),
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
}
