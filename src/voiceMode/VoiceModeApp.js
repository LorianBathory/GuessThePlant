import useGameLogic from '../hooks/useGameLogic.js';
import VoiceModeIntro from './VoiceModeIntro.js';
import VoiceModeScreen from './VoiceModeScreen.js';
import VoiceModeResult from './VoiceModeResult.js';
import { GAME_MODES } from '../gameConfig.js';

export default function VoiceModeApp() {
  const game = useGameLogic();
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoiceModeApp.');
  }

  const { createElement, useEffect, useCallback } = ReactGlobal;

  const {
    interfaceLanguage,
    changeInterfaceLanguage,
    plantLanguage,
    changePlantLanguage,
    gameMode,
    roundPhase,
    startEndlessGame,
    returnToMenu,
    currentQuestionIndex,
    score,
    options,
    handleAnswer,
    gameState,
    currentPlant
  } = game;

  useEffect(() => {
    if (interfaceLanguage !== 'ru') {
      changeInterfaceLanguage('ru');
    }
  }, [interfaceLanguage, changeInterfaceLanguage]);

  useEffect(() => {
    if (plantLanguage !== 'ru') {
      try {
        changePlantLanguage('ru');
      } catch (error) {
        console.error('Не удалось переключить язык растений на русский в голосовом режиме.', error);
      }
    }
  }, [plantLanguage, changePlantLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Версия для слабовидящих — Угадай растение';
    }
  }, []);

  useEffect(() => {
    if (gameMode !== GAME_MODES.ENDLESS && roundPhase === 'playing') {
      startEndlessGame();
    }
  }, [gameMode, roundPhase, startEndlessGame]);

  const handleStart = useCallback(() => {
    startEndlessGame();
  }, [startEndlessGame]);

  const handleRestart = useCallback(() => {
    startEndlessGame();
  }, [startEndlessGame]);

  const handleGoToMenu = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const questionNumber = currentQuestionIndex + 1;
  if (roundPhase === 'menu' || roundPhase === 'gameComplete') {
    return createElement(VoiceModeIntro, {
      onStart: handleStart
    });
  }

  if (roundPhase === 'playing') {
    return createElement('div', {
      className: 'min-h-screen bg-emerald-950 text-emerald-50 px-4 py-6 md:py-10'
    }, createElement(VoiceModeScreen, {
      questionNumber,
      options,
      onAnswer: handleAnswer,
      gameState,
      currentPlant
    }));
  }

  if (roundPhase === 'endlessComplete' || roundPhase === 'endlessFailed') {
    return createElement(VoiceModeResult, {
      phase: roundPhase,
      score,
      onRestart: handleRestart,
      onGoToMenu: handleGoToMenu
    });
  }

  return createElement('div', {
    className: 'min-h-screen flex items-center justify-center bg-emerald-950 text-emerald-50'
  }, 'Загрузка...');
}
