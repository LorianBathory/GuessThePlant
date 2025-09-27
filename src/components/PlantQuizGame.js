import React, { useState, useEffect, useCallback, useRef } from 'react';
import { plants, choicesById, ALL_CHOICE_IDS } from '../data/catalog.js';
import { shuffleArray } from '../utils/random.js';
import { uiTexts, defaultLang } from '../i18n/uiTexts.js';
import { difficultyLevels } from '../data/difficulties.js';

const QUESTIONS_PER_ROUND = 6;

const PLANT_LANGUAGES = ['ru', 'en', 'sci'];
const INTERFACE_LANGUAGES = ['ru', 'en'];
const DEFAULT_LANGUAGE_STORAGE_KEY = 'gtp-default-language';
const PLANT_LANGUAGE_STORAGE_KEY = 'gtp-plant-language';

function getStoredInterfaceLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY);
  return stored && INTERFACE_LANGUAGES.includes(stored) ? stored : null;
}

function getStoredPlantLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }
@@ -47,69 +47,75 @@ function getQuestionsForRound(difficulty) {
}

export default function PlantQuizGame() {
  const [interfaceLanguage, setInterfaceLanguage] = useState(() => getStoredInterfaceLanguage() || defaultLang);
  const [plantLanguage, setPlantLanguage] = useState(() => {
    const storedPlantLanguage = getStoredPlantLanguage();
    if (storedPlantLanguage) {
      return storedPlantLanguage;
    }

    const storedInterface = getStoredInterfaceLanguage();
    if (storedInterface && PLANT_LANGUAGES.includes(storedInterface)) {
      return storedInterface;
    }

    return defaultLang;
  });
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundPhase, setRoundPhase] = useState('playing');
  const [sessionPlants, setSessionPlants] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [optionIds, setOptionIds] = useState([]);
  const [correctAnswerId, setCorrectAnswerId] = useState(null);
  const answerTimeoutRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 600;
    }
    return false;
  });

  const texts = uiTexts[interfaceLanguage] || uiTexts[defaultLang];

  // Запуск нового раунда
  const startRound = useCallback((roundIndex, resetScore = false) => {
    const roundConfig = ROUNDS[roundIndex];
    if (!roundConfig) {
      return;
    }

    const questions = getQuestionsForRound(roundConfig.difficulty);
    setCurrentRoundIndex(roundIndex);

    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }

    if (resetScore) {
      setScore(0);
    }

    setSessionPlants(questions);
    setCurrentQuestion(0);
    setGameState('playing');
    setOptionIds([]);
    setCorrectAnswerId(null);

    if (questions.length === 0) {
      setRoundPhase(roundIndex >= TOTAL_ROUNDS - 1 ? 'gameComplete' : 'roundComplete');
    } else {
      setRoundPhase('playing');
    }
  }, []);

  const startGame = useCallback(() => {
    startRound(0, true);
  }, [startRound]);

  // Генерация ID вариантов ответов для растения
  function generateOptionIds(plant) {
    const correctId = plant.id;
    let wrongIds = [];
@@ -163,76 +169,89 @@ export default function PlantQuizGame() {
        const newOptionIds = generateOptionIds(currentPlant);
        setOptionIds(newOptionIds);
        setCorrectAnswerId(currentPlant.id);
      }
    }
  }, [currentQuestion, sessionPlants, gameState, roundPhase]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, interfaceLanguage);
    }
  }, [interfaceLanguage]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PLANT_LANGUAGE_STORAGE_KEY, plantLanguage);
    }
  }, [plantLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = interfaceLanguage;
    }
  }, [interfaceLanguage]);

  useEffect(() => {
    return () => {
      if (answerTimeoutRef.current) {
        clearTimeout(answerTimeoutRef.current);
      }
    };
  }, []);

  // Обработка ответа
  function handleAnswer(selectedId) {
    if (roundPhase !== 'playing' || gameState !== 'playing') {
      return;
    }

    if (selectedId === correctAnswerId) {
      setScore(prev => prev + 1);
      setGameState('correct');
    } else {
      setGameState('incorrect');
    }

    const isLastQuestion = currentQuestion + 1 >= sessionPlants.length;

    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
    }

    answerTimeoutRef.current = setTimeout(() => {
      if (isLastQuestion) {
        const isFinalRound = currentRoundIndex === TOTAL_ROUNDS - 1;
        setRoundPhase(isFinalRound ? 'gameComplete' : 'roundComplete');
        setGameState('playing');
        setOptionIds([]);
        setCorrectAnswerId(null);
      } else {
        setCurrentQuestion(prev => prev + 1);
        setGameState('playing');
      }
      answerTimeoutRef.current = null;
    }, 1500);
  }

  // Изменение языка названий растений
  function changePlantLanguage(newLang) {
    if (!PLANT_LANGUAGES.includes(newLang)) {
      return;
    }

    setPlantLanguage(newLang);
  }

  function changeInterfaceLanguage(newLang) {
    if (!INTERFACE_LANGUAGES.includes(newLang)) {
      return;
    }
    setInterfaceLanguage(newLang);
  }

  function handleStartNextRound() {
    const nextRoundIndex = currentRoundIndex + 1;
    if (nextRoundIndex < TOTAL_ROUNDS) {
      startRound(nextRoundIndex);
    }
  }