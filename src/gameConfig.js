import { plants } from './data/catalog.js';
import { shuffleArray } from './utils/random.js';
import { difficultyLevels } from './data/difficulties.js';
import { DataLoadingError, StorageError } from './utils/errorHandling.js';

export const QUESTIONS_PER_ROUND = 6;

export const PLANT_LANGUAGES = ['ru', 'en', 'sci'];
export const INTERFACE_LANGUAGES = ['ru', 'en'];

export const DEFAULT_LANGUAGE_STORAGE_KEY = 'gtp-default-language';
export const PLANT_LANGUAGE_STORAGE_KEY = 'gtp-plant-language';

export const ROUNDS = Object.freeze([
  { id: 1, difficulty: difficultyLevels.EASY },
  { id: 2, difficulty: difficultyLevels.MEDIUM },
  { id: 3, difficulty: difficultyLevels.HARD }
]);

export const TOTAL_ROUNDS = ROUNDS.length;

export function getQuestionsForRound(difficulty) {
  if (!Array.isArray(plants)) {
    throw new DataLoadingError('Данные с растениями повреждены или не загружены.');
  }

  const pool = plants.filter(plant => plant.difficulty === difficulty);
  const roundLength = Math.min(QUESTIONS_PER_ROUND, pool.length);
  if (roundLength === 0) {
    return [];
  }
  return shuffleArray(pool).slice(0, roundLength);
}

export function getStoredInterfaceLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(DEFAULT_LANGUAGE_STORAGE_KEY);
    return stored && INTERFACE_LANGUAGES.includes(stored) ? stored : null;
  } catch (error) {
    throw new StorageError('Не удалось прочитать язык интерфейса из localStorage.', { cause: error });
  }
}

export function getStoredPlantLanguage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(PLANT_LANGUAGE_STORAGE_KEY);
    return stored && PLANT_LANGUAGES.includes(stored) ? stored : null;
  } catch (error) {
    throw new StorageError('Не удалось прочитать язык названий растений из localStorage.', { cause: error });
  }
}

export function storeInterfaceLanguage(language) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(DEFAULT_LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    throw new StorageError('Не удалось сохранить язык интерфейса. Проверьте доступ к localStorage.', { cause: error });
  }
}

export function storePlantLanguage(language) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(PLANT_LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    throw new StorageError('Не удалось сохранить язык названий растений. Проверьте доступ к localStorage.', { cause: error });
  }
}

const MOBILE_BREAKPOINT = 600;

export function isMobileViewport(width) {
  if (typeof width === 'number') {
    return width < MOBILE_BREAKPOINT;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function getInitialIsMobile() {
  return isMobileViewport();
}

export function subscribeToViewportChange(callback) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => {
    callback(isMobileViewport(window.innerWidth));
  };

  handler();
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}
