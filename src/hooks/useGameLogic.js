import { choicesById, ALL_CHOICE_IDS } from '../data/catalog.js';
import { uiTexts, defaultLang } from '../i18n/uiTexts.js';
import { shuffleArray } from '../utils/random.js';
import {
  INTERFACE_LANGUAGES,
  GAME_MODES,
  ROUNDS,
  TOTAL_ROUNDS,
  getStoredInterfaceLanguage,
  getStoredPlantLanguage,
  storeInterfaceLanguage,
  storePlantLanguage,
  getInitialIsMobile,
  subscribeToViewportChange,
  isClassicModeDisabled
} from '../gameConfig.js';
import { DataLoadingError, GameLogicError } from '../utils/errorHandling.js';
import { useClassicMode } from './useClassicMode.js';
import { useEndlessMode } from './useEndlessMode.js';

function getAllowedPlantLanguageSet(interfaceLang) {
  return new Set([interfaceLang, 'sci'].filter(Boolean));
}

export default function useGameLogic() {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new DataLoadingError('React не найден. Проверьте загрузку React перед запуском приложения.');
  }

  const { useState, useEffect, useCallback, useMemo, useRef } = ReactGlobal;
  const timeoutRef = useRef(null);
  const preloadedImagesRef = useRef(new Set());

  const preloadPlantImages = useCallback(plantsToPreload => {
    if (typeof Image === 'undefined' || !Array.isArray(plantsToPreload)) {
      return;
    }

    plantsToPreload.forEach(plant => {
      if (!plant || typeof plant.image !== 'string') {
        return;
      }

      const src = plant.image;
      if (!src || preloadedImagesRef.current.has(src)) {
        return;
      }

      const img = new Image();
      img.src = src;
      preloadedImagesRef.current.add(src);
    });
  }, []);

  const storedInterfaceLanguage = getStoredInterfaceLanguage();
  const initialInterfaceLanguage = storedInterfaceLanguage || defaultLang;

  const [interfaceLanguage, setInterfaceLanguage] = useState(initialInterfaceLanguage);
  const [plantLanguage, setPlantLanguage] = useState(() => {
    const storedPlantLanguage = getStoredPlantLanguage();
    const allowedLanguages = getAllowedPlantLanguageSet(initialInterfaceLanguage);

    if (storedPlantLanguage && allowedLanguages.has(storedPlantLanguage)) {
      return storedPlantLanguage;
    }

    if (allowedLanguages.has(initialInterfaceLanguage)) {
      return initialInterfaceLanguage;
    }

    return defaultLang;
  });
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundPhase, setRoundPhase] = useState('menu');
  const [gameMode, setGameMode] = useState(GAME_MODES.CLASSIC);
  const [sessionPlants, setSessionPlants] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [optionIds, setOptionIds] = useState([]);
  const [correctAnswerId, setCorrectAnswerId] = useState(null);
  const [isMobile, setIsMobile] = useState(() => getInitialIsMobile());
  const [isClassicModeUnavailable, setClassicModeUnavailable] = useState(() => isClassicModeDisabled());
  const [roundMistakes, setRoundMistakes] = useState([]);

  const texts = uiTexts[interfaceLanguage] || uiTexts[defaultLang];

  const {
    startClassicGame,
    startRound,
    handleClassicAnswer,
    handleStartNextRound
  } = useClassicMode({
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
  });

  const { startEndlessGame, handleEndlessAnswer } = useEndlessMode({
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
  });

  const startGame = useCallback(() => {
    startClassicGame();
  }, [startClassicGame]);

  const generateOptionIds = useCallback(plant => {
    if (!plant) {
      return [];
    }

    const correctId = plant.id;
    let wrongIds = [];

    if (plant.wrongAnswers && plant.wrongAnswers.length > 0) {
      wrongIds = plant.wrongAnswers.length > 3
        ? shuffleArray(plant.wrongAnswers).slice(0, 3)
        : plant.wrongAnswers.slice();

      if (wrongIds.length < 3) {
        const available = ALL_CHOICE_IDS.filter(id => id !== correctId && !wrongIds.includes(id));
        const shuffled = shuffleArray(available);
        while (wrongIds.length < 3 && shuffled.length > 0) {
          wrongIds.push(shuffled.shift());
        }
      }
    } else {
      const available = ALL_CHOICE_IDS.filter(id => id !== correctId);
      wrongIds = shuffleArray(available).slice(0, 3);
    }

    return shuffleArray([correctId, ...wrongIds]);
  }, []);

  const returnToMenu = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setRoundPhase('menu');
    setSessionPlants([]);
    setCurrentQuestionIndex(0);
    setCurrentRoundIndex(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);
    setScore(0);
    setRoundMistakes([]);
  }, []);

  useEffect(() => {
    if (sessionPlants.length === 0) {
      return;
    }

    preloadPlantImages(sessionPlants);
  }, [sessionPlants, preloadPlantImages]);

  useEffect(() => {
    const unsubscribe = subscribeToViewportChange(value => setIsMobile(value));
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (roundPhase !== 'playing') {
      return;
    }

    if (sessionPlants.length > 0 && currentQuestionIndex < sessionPlants.length) {
      const currentPlant = sessionPlants[currentQuestionIndex];
      preloadPlantImages([currentPlant, sessionPlants[currentQuestionIndex + 1]].filter(Boolean));
      if (gameState === 'playing' || currentQuestionIndex === 0) {
        const newOptionIds = generateOptionIds(currentPlant);
        setOptionIds(newOptionIds);
        setCorrectAnswerId(currentPlant.id);
      }
    }
  }, [currentQuestionIndex, sessionPlants, gameState, roundPhase, generateOptionIds, preloadPlantImages]);

  useEffect(() => {
    storeInterfaceLanguage(interfaceLanguage);
  }, [interfaceLanguage]);

  useEffect(() => {
    storePlantLanguage(plantLanguage);
  }, [plantLanguage]);

  useEffect(() => {
    const allowedLanguages = getAllowedPlantLanguageSet(interfaceLanguage);
    if (!allowedLanguages.has(plantLanguage)) {
      setPlantLanguage(interfaceLanguage);
    }
  }, [interfaceLanguage, plantLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = interfaceLanguage;
    }
  }, [interfaceLanguage]);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const logAnswerSelectedEvent = useCallback((selectedId, correctId) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    const getChoiceLabel = id => {
      const cell = choicesById[id];
      if (!cell) {
        return '';
      }
      return cell[plantLanguage] || cell[defaultLang] || '';
    };

    window.gtag('event', 'answer_selected', {
      correct_answer: getChoiceLabel(correctId),
      selected_answer: getChoiceLabel(selectedId),
      is_correct: selectedId === correctId
    });
  }, [plantLanguage]);

  const handleAnswer = useCallback(selectedId => {
    if (roundPhase !== 'playing' || gameState !== 'playing') {
      return;
    }

    const currentPlant = sessionPlants[currentQuestionIndex];
    if (!currentPlant) {
      return;
    }

    if (correctAnswerId) {
      logAnswerSelectedEvent(selectedId, correctAnswerId);
    }

    if (gameMode === GAME_MODES.ENDLESS) {
      handleEndlessAnswer(selectedId, correctAnswerId);
      return;
    }

    handleClassicAnswer(selectedId, correctAnswerId);
  }, [roundPhase, gameState, gameMode, correctAnswerId, currentQuestionIndex, sessionPlants, handleEndlessAnswer, handleClassicAnswer, logAnswerSelectedEvent]);

  const changePlantLanguage = useCallback(newLang => {
    const allowedLanguages = getAllowedPlantLanguageSet(interfaceLanguage);
    if (!allowedLanguages.has(newLang)) {
      throw new GameLogicError(`Язык растений "${newLang}" не поддерживается для текущего языка интерфейса.`);
    }
    setPlantLanguage(newLang);
  }, [interfaceLanguage]);

  const changeInterfaceLanguage = useCallback(newLang => {
    if (!INTERFACE_LANGUAGES.includes(newLang)) {
      throw new GameLogicError(`Язык интерфейса "${newLang}" не поддерживается.`);
    }
    const allowedPhases = ['menu', 'gameComplete', 'endlessComplete', 'endlessFailed'];
    if (!allowedPhases.includes(roundPhase)) {
      return;
    }
    setInterfaceLanguage(newLang);
  }, [roundPhase]);

  const currentPlant = currentQuestionIndex < sessionPlants.length ? sessionPlants[currentQuestionIndex] : null;
  const currentRoundConfig = currentRoundIndex >= 0 && currentRoundIndex < ROUNDS.length
    ? ROUNDS[currentRoundIndex]
    : null;

  const options = useMemo(() => {
    if (optionIds.length === 0) {
      return [];
    }

    return optionIds.map(optionId => {
      const cell = choicesById[optionId];
      if (!cell) {
        throw new DataLoadingError(`Данные для растения с идентификатором ${optionId} не найдены.`);
      }
      return {
        id: optionId,
        label: cell[plantLanguage] || cell[defaultLang] || ''
      };
    });
  }, [optionIds, plantLanguage]);

  return {
    interfaceLanguage,
    plantLanguage,
    changeInterfaceLanguage,
    changePlantLanguage,
    roundPhase,
    gameMode,
    startGame,
    startClassicGame,
    startEndlessGame,
    returnToMenu,
    startRound,
    handleAnswer,
    generateOptionIds,
    handleStartNextRound,
    texts,
    isMobile,
    isClassicModeUnavailable,
    totalRounds: TOTAL_ROUNDS,
    currentRoundIndex,
    currentQuestionIndex,
    totalQuestionsInRound: sessionPlants.length,
    questionsPerRound: currentRoundConfig && Number.isFinite(currentRoundConfig.questions)
      ? currentRoundConfig.questions
      : null,
    pointsPerQuestion: currentRoundConfig && Number.isFinite(currentRoundConfig.pointsPerQuestion)
      ? currentRoundConfig.pointsPerQuestion
      : 1,
    score,
    gameState,
    currentPlant,
    options,
    roundMistakes
  };
}
