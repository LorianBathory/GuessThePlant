import {
  GAME_MODES,
  ROUNDS,
  TOTAL_ROUNDS,
  getQuestionsForRound,
  prepareSeenImagesForRound,
  resetUsedPlantTracking
} from '../gameConfig.js';
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
  preloadPlantImages,
  isClassicModeUnavailable,
  setClassicModeUnavailable,
  setRoundMistakes
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new GameLogicError('React не найден. Проверьте загрузку React перед запуском приложения.');
  }

  const { useCallback, useRef } = ReactGlobal;

  const BOUQUET_QUESTIONS_TARGET = 2;
  const BOUQUET_PER_ROUND_LIMIT = 1;
  const bouquetQuestionsRemainingRef = useRef(BOUQUET_QUESTIONS_TARGET);

  const startRound = useCallback((roundIndex, resetScore = false) => {
    const roundConfig = ROUNDS[roundIndex];
    if (!roundConfig) {
      throw new GameLogicError(`Конфигурация раунда №${roundIndex + 1} отсутствует.`);
    }

    prepareSeenImagesForRound(roundIndex);

    if (resetScore) {
      bouquetQuestionsRemainingRef.current = BOUQUET_QUESTIONS_TARGET;
    }

    const questions = getQuestionsForRound(roundConfig, {
      bouquetRemaining: bouquetQuestionsRemainingRef.current,
      bouquetPerRoundLimit: BOUQUET_PER_ROUND_LIMIT,
      afterSelection: ({ bouquetCount = 0 } = {}) => {
        if (bouquetCount > 0) {
          bouquetQuestionsRemainingRef.current = Math.max(
            0,
            bouquetQuestionsRemainingRef.current - bouquetCount
          );
        }
      }
    });
    setCurrentRoundIndex(roundIndex);

    if (resetScore) {
      setScore(0);
    }

    setSessionPlants(questions);
    setCurrentQuestionIndex(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);
    setRoundMistakes([]);

    if (questions.length === 0) {
      setClassicModeUnavailable(true);
      setRoundPhase('gameComplete');
    } else {
      setClassicModeUnavailable(false);
      setRoundPhase('playing');
    }
  }, [
    setCurrentRoundIndex,
    setScore,
    setSessionPlants,
    setCurrentQuestionIndex,
    setGameState,
    setOptionIds,
    setCorrectAnswerId,
    setRoundMistakes,
    setRoundPhase,
    setClassicModeUnavailable
  ]);

  const startClassicGame = useCallback(() => {
    setGameMode(GAME_MODES.CLASSIC);

    if (isClassicModeUnavailable) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setSessionPlants([]);
      setCurrentQuestionIndex(0);
      setCurrentRoundIndex(0);
      setGameState('playing');
      setOptionIds([]);
      setCorrectAnswerId(null);
      setScore(0);
      setRoundPhase('gameComplete');
      setRoundMistakes([]);
      return;
    }

    resetUsedPlantTracking();
    startRound(0, true);
  }, [
    isClassicModeUnavailable,
    setGameMode,
    setSessionPlants,
    setCurrentQuestionIndex,
    setCurrentRoundIndex,
    setGameState,
    setOptionIds,
    setCorrectAnswerId,
    setScore,
    setRoundPhase,
    startRound,
    timeoutRef,
    setRoundMistakes
  ]);

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
      setRoundMistakes(prev => [
        ...prev,
        {
          id: currentPlant.id,
          image: currentPlant.image,
          names: currentPlant.names,
          questionVariantId: currentPlant.questionVariantId
        }
      ]);
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
  }, [
    sessionPlants,
    currentQuestionIndex,
    currentRoundIndex,
    preloadPlantImages,
    timeoutRef,
    setScore,
    setGameState,
    setRoundPhase,
    setOptionIds,
    setCorrectAnswerId,
    setCurrentQuestionIndex,
    setRoundMistakes
  ]);

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
