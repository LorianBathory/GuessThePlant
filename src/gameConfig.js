import { plants } from './data/catalog.js';
import { shuffleArray } from './utils/random.js';
import { difficultyLevels } from './data/difficulties.js';
import { DataLoadingError, StorageError } from './utils/errorHandling.js';

export const QUESTIONS_PER_ROUND = 6;

export const PLANT_LANGUAGES = ['ru', 'en', 'sci'];
export const INTERFACE_LANGUAGES = ['ru', 'en'];

export const DEFAULT_LANGUAGE_STORAGE_KEY = 'gtp-default-language';
export const PLANT_LANGUAGE_STORAGE_KEY = 'gtp-plant-language';
export const SEEN_IMAGE_IDS_STORAGE_KEY = 'gtp-seen-image-ids';

export const ROUNDS = Object.freeze([
  { id: 1, difficulty: difficultyLevels.EASY },
  { id: 2, difficulty: difficultyLevels.MEDIUM },
  { id: 3, difficulty: difficultyLevels.HARD }
]);

export const TOTAL_ROUNDS = ROUNDS.length;

const usedPlantIdsAcrossGame = new Set();
const seenImageIdsAcrossSessions = new Set();
let seenImageIdsLoaded = false;

function ensureSeenImageIdsLoaded() {
  if (seenImageIdsLoaded) {
    return;
  }

  seenImageIdsLoaded = true;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = window.localStorage.getItem(SEEN_IMAGE_IDS_STORAGE_KEY);
    if (!stored) {
      return;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach(id => {
      if (typeof id === 'string') {
        seenImageIdsAcrossSessions.add(id);
      }
    });
  } catch (error) {
    throw new StorageError('Не удалось прочитать историю просмотренных изображений из localStorage.', {
      cause: error
    });
  }
}

function persistSeenImageIds() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (seenImageIdsAcrossSessions.size === 0) {
      window.localStorage.removeItem(SEEN_IMAGE_IDS_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      SEEN_IMAGE_IDS_STORAGE_KEY,
      JSON.stringify(Array.from(seenImageIdsAcrossSessions))
    );
  } catch (error) {
    throw new StorageError('Не удалось сохранить историю просмотренных изображений. Проверьте доступ к localStorage.', {
      cause: error
    });
  }
}

function markImagesAsSeen(imageIds) {
  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    return;
  }

  ensureSeenImageIdsLoaded();

  let hasChanges = false;
  imageIds.forEach(id => {
    if (typeof id === 'string' && !seenImageIdsAcrossSessions.has(id)) {
      seenImageIdsAcrossSessions.add(id);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    persistSeenImageIds();
  }
}

function isImageSeen(imageId) {
  if (typeof imageId !== 'string') {
    return false;
  }

  ensureSeenImageIdsLoaded();
  return seenImageIdsAcrossSessions.has(imageId);
}

export function clearSeenImagesTracking() {
  ensureSeenImageIdsLoaded();
  if (seenImageIdsAcrossSessions.size > 0) {
    seenImageIdsAcrossSessions.clear();
  }

  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(SEEN_IMAGE_IDS_STORAGE_KEY);
  } catch (error) {
    throw new StorageError('Не удалось очистить историю просмотренных изображений. Проверьте доступ к localStorage.', {
      cause: error
    });
  }
}

export function hasUnseenImagesForDifficulty(difficulty) {
  ensureSeenImageIdsLoaded();

  return plants
    .filter(plant => plant.difficulty === difficulty)
    .some(plant => !isImageSeen(plant.imageId));
}

export function prepareSeenImagesForRound(roundIndex) {
  const thirdRoundIndex = 2;

  if (roundIndex !== thirdRoundIndex) {
    return;
  }

  const firstRound = ROUNDS[0];
  if (!firstRound) {
    return;
  }

  if (!hasUnseenImagesForDifficulty(firstRound.difficulty)) {
    clearSeenImagesTracking();
  }
}

export function getQuestionsForRound(difficulty) {
  if (!Array.isArray(plants)) {
    throw new DataLoadingError('Данные с растениями повреждены или не загружены.');
  }

  const pool = plants.filter(plant => plant.difficulty === difficulty);
  const uniqueAvailableIds = new Set(
    pool.filter(plant => !usedPlantIdsAcrossGame.has(plant.id)).map(plant => plant.id)
  );

  const roundLength = Math.min(QUESTIONS_PER_ROUND, uniqueAvailableIds.size);
  if (roundLength === 0) {
    return [];
  }

  const shuffledPool = shuffleArray(pool);
  const seenInRound = new Set();
  const unseenCandidates = [];
  const seenCandidates = [];

  shuffledPool.forEach(plant => {
    if (usedPlantIdsAcrossGame.has(plant.id) || seenInRound.has(plant.id)) {
      return;
    }

    if (isImageSeen(plant.imageId)) {
      seenCandidates.push(plant);
    } else {
      unseenCandidates.push(plant);
    }

    seenInRound.add(plant.id);
  });

  const prioritized = unseenCandidates.concat(seenCandidates).slice(0, roundLength);

  prioritized.forEach(plant => usedPlantIdsAcrossGame.add(plant.id));
  markImagesAsSeen(prioritized.map(plant => plant.imageId));

  return prioritized;
}

export function resetUsedPlantTracking() {
  usedPlantIdsAcrossGame.clear();
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
