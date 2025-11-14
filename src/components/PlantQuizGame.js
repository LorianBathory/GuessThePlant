import useGameLogic from '../hooks/useGameLogic.js';
import GameScreen from './GameScreen.js';
import ResultScreen from './ResultScreen.js';
import GameMenu from './GameMenu.js';
import MemorizationScreen from './MemorizationScreen.js';
import { allQuestions } from '../data/questions.js';
import { DataLoadingError } from '../utils/errorHandling.js';

export default function PlantQuizGame() {
  const game = useGameLogic();
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new DataLoadingError('React не найден. Проверьте загрузку React перед запуском игры.');
  }

  if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
    throw new DataLoadingError(
      'Каталог растений не загружен. Убедитесь, что data/*.js подключены как ESM-модули.'
    );
  }

  const { createElement } = ReactGlobal;

  if (game.roundPhase === 'menu' || game.roundPhase === 'gameComplete') {
    return createElement(GameMenu, {
      texts: game.texts,
      interfaceLanguage: game.interfaceLanguage,
      onInterfaceLanguageChange: game.changeInterfaceLanguage,
      onStartClassicGame: game.startClassicGame,
      onStartEndlessGame: game.startEndlessGame,
      onStartMemorizationMode: game.startMemorizationMode,
      isPostGame: game.roundPhase === 'gameComplete',
      score: game.score,
      isMobile: game.isMobile,
      isClassicModeUnavailable: game.isClassicModeUnavailable
    });
  }

  if (game.roundPhase === 'memorization') {
    const isInCollection = game.memorizationPlant
      ? game.isPlantInMemorizationCollection(game.memorizationPlant.id)
      : false;

    return createElement(MemorizationScreen, {
      texts: game.texts,
      plantLanguage: game.plantLanguage,
      interfaceLanguage: game.interfaceLanguage,
      onPlantLanguageChange: game.changePlantLanguage,
      onNextPlant: game.showNextMemorizationPlant,
      onSelectPlant: game.showMemorizationPlantById,
      onReturnToMenu: game.returnToMenu,
      plant: game.memorizationPlant,
      isMobile: game.isMobile,
      onAddToCollection: game.addPlantToMemorizationCollection,
      onRemoveFromCollection: game.removePlantFromMemorizationCollection,
      isInCollection,
      collectionFilter: game.memorizationCollectionFilter,
      onCollectionFilterChange: game.changeMemorizationCollectionFilter,
      collectionSize: game.memorizationCollectionSize,
      filterOptions: game.memorizationFilterOptions
    });
  }

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
      onAnswer: game.handleAnswer,
      onPlantLanguageChange: game.changePlantLanguage,
      gameMode: game.gameMode,
      interfaceLanguage: game.interfaceLanguage
    });
  }

  const isEndlessPhase = game.roundPhase === 'endlessComplete' || game.roundPhase === 'endlessFailed';

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
    onRestart: isEndlessPhase ? game.startEndlessGame : game.startGame,
    onReturnToMenu: game.returnToMenu,
    gameMode: game.gameMode,
    interfaceLanguage: game.interfaceLanguage,
    roundMistakes: game.roundMistakes
  });
}
