const { useState, useEffect, useRef, useCallback } = React;

const QUESTIONS_PER_SESSION = 6;

import { plants, choicesById, ALL_CHOICE_IDS } from '../data/catalog.js';
import { shuffleArray } from '../utils/random.js';
import { uiTexts, defaultLang } from '../i18n/uiTexts.js';

export default function PlantQuizGame() {
  const [language, setLanguage] = useState(defaultLang);
  const [sessionPlants, setSessionPlants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [optionIds, setOptionIds] = useState([]);
  const [correctAnswerId, setCorrectAnswerId] = useState(null);
  const remainingDeckRef = useRef([]);

  const texts = uiTexts[language] || uiTexts[defaultLang];

  // Запуск новой игровой сессии
  const startNewSession = useCallback((resetDeck = false) => {
    const currentDeck = Array.isArray(remainingDeckRef.current)
      ? remainingDeckRef.current
      : [];
    let workingDeck = currentDeck.slice();

    if (resetDeck || workingDeck.length < QUESTIONS_PER_SESSION) {
      const existingIds = new Set(workingDeck.map(plant => plant.id));
      const replenished = shuffleArray(plants).filter(plant => !existingIds.has(plant.id));
      workingDeck = [...workingDeck, ...replenished];

      if (workingDeck.length < QUESTIONS_PER_SESSION) {
        workingDeck = [...workingDeck, ...shuffleArray(plants)];
      }
    }

    if (workingDeck.length === 0) {
      setSessionPlants([]);
      setCurrentQuestion(0);
      setScore(0);
      setGameState('playing');
      setOptionIds([]);
      setCorrectAnswerId(null);
      return;
    }

    const shuffledDeck = shuffleArray(workingDeck);
    const sessionSelection = shuffledDeck.slice(0, QUESTIONS_PER_SESSION);
    remainingDeckRef.current = shuffledDeck.slice(QUESTIONS_PER_SESSION);

    setSessionPlants(sessionSelection);
    setCurrentQuestion(0);
    setScore(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);
  }, [plants, shuffleArray]);

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

  // Инициализация первой игровой сессии
  useEffect(() => {
    startNewSession(true);
  }, [startNewSession]);

  // Генерация вариантов при смене вопроса
  useEffect(() => {
    if (sessionPlants.length > 0 && currentQuestion < sessionPlants.length) {
      const currentPlant = sessionPlants[currentQuestion];
      if (gameState === 'playing' || currentQuestion === 0) {
        const newOptionIds = generateOptionIds(currentPlant);
        setOptionIds(newOptionIds);
        setCorrectAnswerId(currentPlant.id);
      }
    }
  }, [currentQuestion, sessionPlants]);

  // Обработка ответа
  function handleAnswer(selectedId) {
    if (selectedId === correctAnswerId) {
      setScore(prev => prev + 1);
      setGameState('correct');
    } else {
      setGameState('incorrect');
    }

    setTimeout(() => {
      if (currentQuestion + 1 < sessionPlants.length) {
        setCurrentQuestion(prev => prev + 1);
        setGameState('playing');
      } else {
        setGameState('finished');
      }
    }, 1500);
  }

  // Изменение языка
  function changeLanguage(newLang) {
    setLanguage(newLang);
  }

  // Получение изображения растения
  function getPlantImage(plantData) {
    if (plantData.image && plantData.image.startsWith('images/')) {
      return React.createElement('img', {
        key: 'plant-image',
        src: plantData.image,
        alt: `Растение ${plantData.id}`,
        className: 'w-full h-full object-cover',
        style: { border: '6px solid #C29C27' }
      });
    }
    return null;
  }

  // Экран завершения
  if (gameState === 'finished') {
    return React.createElement('div', {
      className: 'min-h-screen flex items-center justify-center relative',
      style: { backgroundColor: '#163B3A' }
    }, [
      React.createElement('div', { key: 'decor1', className: 'absolute top-4 left-4 w-20 h-1', style: { backgroundColor: '#C29C27' } }),
      React.createElement('div', { key: 'decor2', className: 'absolute top-8 left-8 w-32 h-1', style: { backgroundColor: '#C29C27' } }),
      React.createElement('div', { key: 'decor3', className: 'absolute bottom-4 right-4 w-20 h-1', style: { backgroundColor: '#C29C27' } }),
      React.createElement('div', { key: 'decor4', className: 'absolute bottom-8 right-8 w-32 h-1', style: { backgroundColor: '#C29C27' } }),
      React.createElement('div', {
        key: 'result',
        className: 'p-8 shadow-lg text-center max-w-md mx-4',
        style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
      }, [
        React.createElement('h1', {
          key: 'title',
          className: 'text-4xl font-bold mb-6',
          style: { color: '#C29C27' }
        }, `${texts.result} ${score} ${texts.resultPoints}!`),
        React.createElement('button', {
          key: 'restart',
          onClick: () => startNewSession(),
          className: 'px-6 py-3 font-semibold text-white transition-colors hover:opacity-80',
          style: { backgroundColor: '#163B3A', border: '4px solid #C29C27', color: '#C29C27' }
        }, texts.playAgain)
      ])
    ]);
  }

  // Основной экран
  return React.createElement('div', {
    className: 'min-h-screen p-4 relative flex items-center justify-center',
    style: { backgroundColor: '#163B3A' }
  }, [
    React.createElement('div', { key: 'decor1', className: 'absolute top-4 left-4 w-24 h-1', style: { backgroundColor: '#C29C27' } }),
    React.createElement('div', { key: 'decor2', className: 'absolute top-8 left-8 w-40 h-1', style: { backgroundColor: '#C29C27' } }),
    React.createElement('div', { key: 'decor3', className: 'absolute top-12 left-12 w-16 h-1', style: { backgroundColor: '#C29C27' } }),
    React.createElement('div', { key: 'decor4', className: 'absolute bottom-4 right-4 w-24 h-1', style: { backgroundColor: '#C29C27' } }),
    React.createElement('div', { key: 'decor5', className: 'absolute bottom-8 right-8 w-40 h-1', style: { backgroundColor: '#C29C27' } }),
    React.createElement('div', { key: 'decor6', className: 'absolute bottom-12 right-12 w-16 h-1', style: { backgroundColor: '#C29C27' } }),

    React.createElement('div', { key: 'container', className: 'w-full max-w-5xl mx-auto relative z-10' }, [
      React.createElement('div', { key: 'header', className: 'flex justify-between items-center mb-6' }, [
        React.createElement('div', {
          key: 'progress',
          className: 'text-2xl font-bold',
          style: { color: '#C29C27' }
        }, sessionPlants.length > 0
          ? `${currentQuestion + 1}/${sessionPlants.length}`
          : `0/${QUESTIONS_PER_SESSION}`),

        React.createElement('div', { key: 'right-section', className: 'flex items-center gap-4' }, [
          React.createElement('div', {
            key: 'score',
            className: 'text-2xl font-bold',
            style: { color: '#C29C27' }
          }, `${texts.score}: ${score}`),

          React.createElement('div', { key: 'lang-buttons', className: 'flex gap-2' },
            ['ru', 'en', 'sci'].map(lang =>
              React.createElement('button', {
                key: lang,
                onClick: () => changeLanguage(lang),
                className: 'px-3 py-1 text-sm font-bold uppercase transition-all',
                style: {
                  backgroundColor: language === lang ? '#C29C27' : 'transparent',
                  color: language === lang ? '#163B3A' : '#C29C27',
                  border: '2px solid #C29C27'
                }
              }, lang === 'sci' ? 'Sci' : lang.toUpperCase())
            )
          )
        ])
      ]),

      React.createElement('div', {
        key: 'game-area',
        className: 'p-8 shadow-lg',
        style: { backgroundColor: '#163B3A', border: '6px solid #C29C27' }
      }, [
        React.createElement('h2', {
          key: 'question',
          className: 'text-3xl font-bold text-center mb-8',
          style: { color: '#C29C27' }
        }, texts.question),

        React.createElement('div', {
          key: 'image-area',
          className: 'mb-8 flex justify-center',
          style: { height: '450px' }
        }, [
          gameState === 'playing' && sessionPlants.length > 0 && currentQuestion < sessionPlants.length &&
            React.createElement('div', { className: 'h-full', style: { width: '675px' } },
              getPlantImage(sessionPlants[currentQuestion])
            ),

          gameState === 'correct' && React.createElement('div', {
            className: 'h-full flex items-center justify-center text-6xl font-bold',
            style: { width: '675px', color: '#C29C27', backgroundColor: '#163B3A', border: '6px solid #C29C27' }
          }, texts.correct),

          gameState === 'incorrect' && React.createElement('div', {
            className: 'h-full flex items-center justify-center text-6xl font-bold',
            style: { width: '675px', color: '#C29C27', backgroundColor: '#163B3A', border: '6px solid #C29C27' }
          }, texts.incorrect)
        ]),

        gameState === 'playing' && optionIds.length > 0 && React.createElement('div', {
          key: 'options',
          className: 'grid grid-cols-2 gap-4 max-w-3xl mx-auto'
        }, optionIds.map((optionId, index) => {
          const cell = choicesById[optionId];
          const optionName = cell ? (cell[language] || cell[defaultLang]) : '';
          return React.createElement('button', {
            key: `option-${index}`,
            onClick: () => handleAnswer(optionId),
            className: 'py-4 px-6 font-semibold text-xl transition-all duration-200 hover:opacity-80 hover:scale-105',
            style: { 
              backgroundColor: '#163B3A', 
              border: '4px solid #C29C27',
              color: '#C29C27',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }
          }, optionName);
        }))
      ]),

      React.createElement('div', {
        key: 'instruction',
        className: 'text-center mt-6 opacity-75',
        style: { color: '#C29C27' }
      }, texts.instruction)
    ])
  ]);
}
