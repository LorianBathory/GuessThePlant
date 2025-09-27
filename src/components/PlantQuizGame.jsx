import useGameLogic from '../hooks/useGameLogic.js';
import GameScreen from './GameScreen.jsx';
import ResultScreen from './ResultScreen.jsx';

export default function PlantQuizGame() {
  const game = useGameLogic();

  if (game.roundPhase === 'playing') {
    return React.createElement(GameScreen, {
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

  return React.createElement(ResultScreen, {
    phase: game.roundPhase,
    texts: game.texts,
    score: game.score,
    currentRoundIndex: game.currentRoundIndex,
    totalRounds: game.totalRounds,
    isMobile: game.isMobile,
    onStartNextRound: game.handleStartNextRound,
    onRestart: game.handleRestart
  });
}
