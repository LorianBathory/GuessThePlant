import { GAME_MODES, ROUNDS, TOTAL_ROUNDS, getQuestionsForRound, prepareSeenImagesForRound, resetUsedPlantTracking } from '../gameConfig.js';
import { GameLogicError } from '../utils/errorHandling.js';

export function useClassicMode({
  setGameMode,
  setSessionPlants,
  setCurrentQuestionIndex,
  setCurrentRoundIndex,
  setRoundPhase,
  setScore,
  setGameState,
  setOptionIds,
  setCorrectAnswerId,
  sessionPlants,
  currentQuestionIndex,
  currentRoundIndex,
  timeoutRef,
  preloadPlantImages
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new GameLogicError('React не найден. Проверьте загрузку React перед запуском приложения.');
  }

  const { useCallback } = ReactGlobal;

  const startRound = useCallback((roundIndex, resetScore = false) => {
    const roundConfig = ROUNDS[roundIndex];
    if (!roundConfig) {
      throw new GameLogicError(`Конфигурация раунда №${roundIndex + 1} отсутствует.`);
    }

    prepareSeenImagesForRound(roundIndex);

    const questions = getQuestionsForRound(roundConfig);
    setCurrentRoundIndex(roundIndex);

    if (resetScore) {
      setScore(0);
    }

    setSessionPlants(questions);
    setCurrentQuestionIndex(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);

    if (questions.length === 0) {
      setRoundPhase(roundIndex >= TOTAL_ROUNDS - 1 ? 'gameComplete' : 'roundComplete');
    } else {
      setRoundPhase('playing');
    }
  }, [setCurrentRoundIndex, setScore, setSessionPlants, setCurrentQuestionIndex, setGameState, setOptionIds, setCorrectAnswerId, setRoundPhase]);

  const startClassicGame = useCallback(() => {
    resetUsedPlantTracking();
    setGameMode(GAME_MODES.CLASSIC);
    startRound(0, true);
  }, [setGameMode, startRound]);

  const handleClassicAnswer = useCallback((selectedId, correctAnswerId) => {
    const currentPlant = sessionPlants[currentQuestionIndex];
    if (!currentPlant) {
      return;
    }

    const isCorrect = selectedId === correctAnswerId;

    if (isCorrect) {
      const roundConfig = ROUNDS[currentRoundIndex] || {};
      const pointsPerQuestion = Number.isFinite(roundConfig.pointsPerQuestion) && roundConfig.pointsPerQuestion > 0
        ? roundConfig.pointsPerQuestion
        : 1;
      setScore(prev => prev + pointsPerQuestion);
      setGameState('correct');
    } else {
      setGameState('incorrect');
    }

    const isLastQuestion = currentQuestionIndex + 1 >= sessionPlants.length;
    preloadPlantImages([sessionPlants[currentQuestionIndex + 1]].filter(Boolean));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isLastQuestion) {
        const isFinalRound = currentRoundIndex === TOTAL_ROUNDS - 1;
        setRoundPhase(isFinalRound ? 'gameComplete' : 'roundComplete');
        setGameState('playing');
        setOptionIds([]);
        setCorrectAnswerId(null);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('playing');
      }
    }, 1500);
  }, [sessionPlants, currentQuestionIndex, currentRoundIndex, preloadPlantImages, timeoutRef, setScore, setGameState, setRoundPhase, setOptionIds, setCorrectAnswerId, setCurrentQuestionIndex]);

  const handleStartNextRound = useCallback(() => {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex < TOTAL_ROUNDS) {
      startRound(nextRoundIndex);
    }
  }, [currentRoundIndex, startRound]);

  return {
    startClassicGame,
    startRound,
    handleClassicAnswer,
    handleStartNextRound
  };
}
