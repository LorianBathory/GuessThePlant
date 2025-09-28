import useGameLogic from '../hooks/useGameLogic.js';
import GameScreen from './GameScreen.js';
import ResultScreen from './ResultScreen.js';
import { plants } from '../data/catalog.js';
import { DataLoadingError } from '../utils/errorHandling.js';

export default function PlantQuizGame() {
  const game = useGameLogic();
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new DataLoadingError('React не найден. Проверьте загрузку React перед запуском игры.');
  }

  if (!Array.isArray(plants) || plants.length === 0) {
    throw new DataLoadingError(
      'Каталог растений не загружен. Убедитесь, что data/*.js подключены как ESM-модули.'
    );
  }

  const { createElement } = ReactGlobal;

  if (game.roundPhase === 'playing') {
    return createElement(GameScreen, {
      texts: game.texts,
      isMobile: game.isMobile,
      currentRoundIndex: game.currentRoundIndex,
      totalRounds: game.totalRounds,
      currentQuestionIndex: game.currentQuestionIndex,
      totalQuestionsInRound: game.totalQuestionsInRound,
      questionsPerRound: game.questionsPerRound,
      score: game.score,
      gameState: game.gameState,
      currentPlant: game.currentPlant,
      options: game.options,
      plantLanguage: game.plantLanguage,
      interfaceLanguage: game.interfaceLanguage,
      onAnswer: game.handleAnswer,
      onPlantLanguageChange: game.changePlantLanguage,
      onInterfaceLanguageChange: game.changeInterfaceLanguage
    });
  }

  return createElement(ResultScreen, {
    phase: game.roundPhase,
    texts: game.texts,
    score: game.score,
    currentRoundIndex: game.currentRoundIndex,
    totalRounds: game.totalRounds,
    isMobile: game.isMobile,
    plantLanguage: game.plantLanguage,
    onPlantLanguageChange: game.changePlantLanguage,
    onStartNextRound: game.handleStartNextRound,
    onRestart: game.handleRestart
  });
}
