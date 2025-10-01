import { GAME_MODES, resetUsedPlantTracking } from '../gameConfig.js';
import { allQuestions } from '../data/questions.js';
import { shuffleArray } from '../utils/random.js';
import { GameLogicError } from '../utils/errorHandling.js';

export function useEndlessMode({
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
  timeoutRef,
  preloadPlantImages,
  score
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new GameLogicError('React не найден. Проверьте загрузку React перед запуском приложения.');
  }

  const { useCallback } = ReactGlobal;

  const startEndlessGame = useCallback(() => {
    resetUsedPlantTracking();
    setGameMode(GAME_MODES.ENDLESS);

    const aggregatedQuestions = shuffleArray(allQuestions);

    setCurrentRoundIndex(0);
    setSessionPlants(aggregatedQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);

    if (aggregatedQuestions.length === 0) {
      setRoundPhase('endlessComplete');
    } else {
      setRoundPhase('playing');
    }
  }, [setGameMode, setCurrentRoundIndex, setSessionPlants, setCurrentQuestionIndex, setScore, setGameState, setOptionIds, setCorrectAnswerId, setRoundPhase]);

  const handleEndlessAnswer = useCallback((selectedId, correctAnswerId) => {
    const currentPlant = sessionPlants[currentQuestionIndex];
    if (!currentPlant) {
      return;
    }

    const isCorrect = selectedId === correctAnswerId;
    const pointsChange = isCorrect ? 1 : -2;
    const updatedScore = score + pointsChange;

    setScore(prev => prev + pointsChange);
    setGameState(isCorrect ? 'correct' : 'incorrect');

    const isLastQuestion = currentQuestionIndex + 1 >= sessionPlants.length;
    preloadPlantImages([sessionPlants[currentQuestionIndex + 1]].filter(Boolean));

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (updatedScore < 0) {
        setRoundPhase('endlessFailed');
        setGameState('playing');
        setOptionIds([]);
        setCorrectAnswerId(null);
        return;
      }

      if (isLastQuestion) {
        setRoundPhase('endlessComplete');
        setGameState('playing');
        setOptionIds([]);
        setCorrectAnswerId(null);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
        setGameState('playing');
      }
    }, 1500);
  }, [sessionPlants, currentQuestionIndex, score, preloadPlantImages, timeoutRef, setScore, setGameState, setRoundPhase, setOptionIds, setCorrectAnswerId, setCurrentQuestionIndex]);

  return {
    startEndlessGame,
    handleEndlessAnswer
  };
}
