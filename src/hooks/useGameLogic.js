import { choicesById, ALL_CHOICE_IDS, memorizationPlants, speciesById } from '../game/dataLoader.js';
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

const MEMORIZATION_COLLECTION_STORAGE_KEY = 'gtp/memorizationCollection';
const MEMORIZATION_FILTER_STORAGE_KEY = 'gtp/memorizationFilter';

const MEMORIZATION_FILTERS = Object.freeze({
  ALL: 'all',
  COLLECTION: 'collection'
});

function normalizeCollectionIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set();
  const result = [];

  value.forEach(item => {
    if (item == null) {
      return;
    }

    const normalized = String(item);
    if (!normalized) {
      return;
    }

    if (!unique.has(normalized)) {
      unique.add(normalized);
      result.push(normalized);
    }
  });

  return result;
}

function getStoredMemorizationCollection() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(MEMORIZATION_COLLECTION_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);
    return normalizeCollectionIds(parsed);
  } catch {
    return [];
  }
}

function storeMemorizationCollection(ids) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const normalized = normalizeCollectionIds(ids);
    if (normalized.length === 0) {
      window.localStorage.removeItem(MEMORIZATION_COLLECTION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(MEMORIZATION_COLLECTION_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Ignore storage write errors — the mode remains functional without persistence.
  }
}

function getStoredMemorizationFilter() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return MEMORIZATION_FILTERS.ALL;
  }

  try {
    const stored = window.localStorage.getItem(MEMORIZATION_FILTER_STORAGE_KEY);
    return stored === MEMORIZATION_FILTERS.COLLECTION ? MEMORIZATION_FILTERS.COLLECTION : MEMORIZATION_FILTERS.ALL;
  } catch {
    return MEMORIZATION_FILTERS.ALL;
  }
}

function storeMemorizationFilter(filter) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    if (filter === MEMORIZATION_FILTERS.COLLECTION) {
      window.localStorage.setItem(MEMORIZATION_FILTER_STORAGE_KEY, MEMORIZATION_FILTERS.COLLECTION);
    } else {
      window.localStorage.removeItem(MEMORIZATION_FILTER_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write errors — the mode remains functional without persistence.
  }
}

function getChoiceGenusGroupKey(choiceId) {
  if (choiceId == null) {
    return null;
  }

  const species = speciesById[choiceId];

  if (species && species.genusId != null) {
    return String(species.genusId);
  }

  if (species && species.id != null) {
    return String(species.id);
  }

  return String(choiceId);
}

function getPlantGenusGroupKey(plant) {
  if (!plant) {
    return null;
  }

  if (plant.genusId != null) {
    return String(plant.genusId);
  }

  if (plant.id != null) {
    return String(plant.id);
  }

  return null;
}

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
  const [memorizationPlant, setMemorizationPlant] = useState(null);
  const [isMobile, setIsMobile] = useState(() => getInitialIsMobile());
  const [isClassicModeUnavailable, setClassicModeUnavailable] = useState(() => isClassicModeDisabled());
  const [roundMistakes, setRoundMistakes] = useState([]);
  const [memorizationCollectionIds, setMemorizationCollectionIds] = useState(() => getStoredMemorizationCollection());
  const [memorizationCollectionFilter, setMemorizationCollectionFilter] = useState(() => getStoredMemorizationFilter());

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

  const pickRandomMemorizationPlant = useCallback(() => {
    const restrictToCollection = memorizationCollectionFilter === MEMORIZATION_FILTERS.COLLECTION
      ? new Set(memorizationCollectionIds)
      : null;

    const candidates = Array.isArray(memorizationPlants)
      ? memorizationPlants.filter(plant => {
        if (!plant || typeof plant.image !== 'string') {
          return false;
        }

        if (!restrictToCollection) {
          return true;
        }

        if (plant.id == null) {
          return false;
        }

        return restrictToCollection.has(String(plant.id));
      })
      : [];

    if (candidates.length === 0) {
      return null;
    }

    const shuffled = shuffleArray(candidates);
    if (!memorizationPlant) {
      return shuffled[0];
    }

    const currentId = memorizationPlant.id == null ? null : String(memorizationPlant.id);
    const nextCandidate = shuffled.find(candidate => {
      if (!candidate) {
        return false;
      }

      if (candidate.questionVariantId === memorizationPlant.questionVariantId) {
        return false;
      }

      if (currentId == null) {
        return true;
      }

      const candidateId = candidate.id == null ? null : String(candidate.id);
      return candidateId !== currentId;
    });

    return nextCandidate || shuffled[0];
  }, [memorizationPlant, memorizationCollectionIds, memorizationCollectionFilter]);

  const startMemorizationMode = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const nextPlant = pickRandomMemorizationPlant();

    setGameMode(GAME_MODES.MEMORIZATION);
    setRoundPhase('memorization');
    setSessionPlants([]);
    setCurrentQuestionIndex(0);
    setCurrentRoundIndex(0);
    setScore(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);
    setRoundMistakes([]);
    setMemorizationPlant(nextPlant || null);

    if (nextPlant) {
      preloadPlantImages([nextPlant]);
    }
  }, [pickRandomMemorizationPlant, preloadPlantImages]);

  const showNextMemorizationPlant = useCallback(() => {
    const nextPlant = pickRandomMemorizationPlant();
    setMemorizationPlant(nextPlant || null);

    if (nextPlant) {
      preloadPlantImages([nextPlant]);
    }
  }, [pickRandomMemorizationPlant, preloadPlantImages]);

  const addPlantToMemorizationCollection = useCallback(plantId => {
    if (plantId == null) {
      return;
    }

    const normalized = String(plantId);
    if (!normalized) {
      return;
    }

    setMemorizationCollectionIds(prev => {
      if (prev.includes(normalized)) {
        return prev;
      }
      return [...prev, normalized];
    });
  }, []);

  const removePlantFromMemorizationCollection = useCallback(plantId => {
    if (plantId == null) {
      return;
    }

    const normalized = String(plantId);
    if (!normalized) {
      return;
    }

    setMemorizationCollectionIds(prev => {
      if (!prev.includes(normalized)) {
        return prev;
      }
      return prev.filter(id => id !== normalized);
    });
  }, []);

  const changeMemorizationCollectionFilter = useCallback(nextFilter => {
    setMemorizationCollectionFilter(
      nextFilter === MEMORIZATION_FILTERS.COLLECTION
        ? MEMORIZATION_FILTERS.COLLECTION
        : MEMORIZATION_FILTERS.ALL
    );
  }, []);

  const isPlantInMemorizationCollection = useCallback(plantId => {
    if (plantId == null) {
      return false;
    }

    const normalized = String(plantId);
    if (!normalized) {
      return false;
    }

    return memorizationCollectionIds.includes(normalized);
  }, [memorizationCollectionIds]);

  const generateOptionIds = useCallback(plant => {
    if (!plant) {
      return [];
    }

    const correctId = plant.id;
    const correctGenusKey = getPlantGenusGroupKey(plant);
    const isChoiceAllowed = id => (
      id !== correctId
      && (correctGenusKey == null || getChoiceGenusGroupKey(id) !== correctGenusKey)
    );
    let wrongIds = [];

    if (plant.wrongAnswers && plant.wrongAnswers.length > 0) {
      const filteredWrongAnswers = correctGenusKey == null
        ? plant.wrongAnswers
        : plant.wrongAnswers.filter(id => getChoiceGenusGroupKey(id) !== correctGenusKey);

      wrongIds = filteredWrongAnswers.length > 3
        ? shuffleArray(filteredWrongAnswers).slice(0, 3)
        : filteredWrongAnswers.slice();

      if (wrongIds.length < 3) {
        const available = ALL_CHOICE_IDS.filter(id => isChoiceAllowed(id) && !wrongIds.includes(id));
        const shuffled = shuffleArray(available);
        while (wrongIds.length < 3 && shuffled.length > 0) {
          wrongIds.push(shuffled.shift());
        }
      }
    } else {
      const available = ALL_CHOICE_IDS.filter(isChoiceAllowed);
      wrongIds = shuffleArray(available).slice(0, 3);
    }

    return shuffleArray([correctId, ...wrongIds]);
  }, []);

  const returnToMenu = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setRoundPhase('menu');
    setGameMode(GAME_MODES.CLASSIC);
    setSessionPlants([]);
    setCurrentQuestionIndex(0);
    setCurrentRoundIndex(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);
    setScore(0);
    setRoundMistakes([]);
    setMemorizationPlant(null);
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
    if (roundPhase !== 'menu') {
      return;
    }

    setClassicModeUnavailable(isClassicModeDisabled());
  }, [roundPhase, setClassicModeUnavailable]);

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
    storeMemorizationCollection(memorizationCollectionIds);
  }, [memorizationCollectionIds]);

  useEffect(() => {
    storeMemorizationFilter(memorizationCollectionFilter);
  }, [memorizationCollectionFilter]);

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

  useEffect(() => {
    if (roundPhase !== 'memorization') {
      return;
    }

    if (memorizationCollectionFilter === MEMORIZATION_FILTERS.COLLECTION) {
      if (memorizationCollectionIds.length === 0) {
        if (memorizationPlant) {
          setMemorizationPlant(null);
        }
        return;
      }

      const currentId = memorizationPlant && memorizationPlant.id != null
        ? String(memorizationPlant.id)
        : null;

      if (!currentId || !memorizationCollectionIds.includes(currentId)) {
        const nextPlant = pickRandomMemorizationPlant();
        setMemorizationPlant(nextPlant || null);
        if (nextPlant) {
          preloadPlantImages([nextPlant]);
        }
      }
      return;
    }

    if (!memorizationPlant) {
      const nextPlant = pickRandomMemorizationPlant();
      if (nextPlant) {
        setMemorizationPlant(nextPlant);
        preloadPlantImages([nextPlant]);
      }
    }
  }, [
    roundPhase,
    memorizationCollectionFilter,
    memorizationCollectionIds,
    memorizationPlant,
    pickRandomMemorizationPlant,
    preloadPlantImages
  ]);

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
    const allowedPhases = ['menu', 'gameComplete', 'endlessComplete', 'endlessFailed', 'memorization'];
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

  const memorizationCollectionSize = memorizationCollectionIds.length;

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
    startMemorizationMode,
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
    roundMistakes,
    memorizationPlant,
    showNextMemorizationPlant,
    addPlantToMemorizationCollection,
    removePlantFromMemorizationCollection,
    isPlantInMemorizationCollection,
    memorizationCollectionSize,
    memorizationCollectionFilter,
    changeMemorizationCollectionFilter
  };
}
