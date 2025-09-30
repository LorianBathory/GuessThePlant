import { plants } from './data/catalog.js';
import { shuffleArray } from './utils/random.js';
import { difficultyLevels } from './data/difficulties.js';
import { DataLoadingError, StorageError } from './utils/errorHandling.js';

export const PLANT_LANGUAGES = ['ru', 'en', 'nl', 'sci'];
export const INTERFACE_LANGUAGES = ['ru', 'en', 'nl'];

export const GAME_MODES = Object.freeze({
  CLASSIC: 'classic',
  ENDLESS: 'endless'
});

export const DEFAULT_LANGUAGE_STORAGE_KEY = 'gtp-default-language';
export const PLANT_LANGUAGE_STORAGE_KEY = 'gtp-plant-language';
export const SEEN_IMAGE_IDS_STORAGE_KEY = 'gtp-seen-image-ids';
export const CLASSIC_MODE_DISABLED_STORAGE_KEY = 'gtp-classic-disabled';

export const ROUNDS = Object.freeze([
  {
    id: 1,
    difficulty: difficultyLevels.EASY,
    questions: 6,
    pointsPerQuestion: 1
  },
  {
    id: 2,
    difficulty: difficultyLevels.MEDIUM,
    questions: 7,
    pointsPerQuestion: 2
  },
  {
    id: 3,
    difficulty: difficultyLevels.HARD,
    questions: 5,
    pointsPerQuestion: 3
  }
]);

export const TOTAL_ROUNDS = ROUNDS.length;

const usedPlantIdsAcrossGame = new Set();
const seenImageIdsAcrossSessions = new Set();
let seenImageIdsLoaded = false;
let classicModeDisabledLoaded = false;
let classicModeDisabled = false;

function ensureClassicModeDisabledLoaded() {
  if (classicModeDisabledLoaded) {
    return;
  }

  classicModeDisabledLoaded = true;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const stored = window.localStorage.getItem(CLASSIC_MODE_DISABLED_STORAGE_KEY);
    classicModeDisabled = stored === '1';
  } catch (error) {
    throw new StorageError('Не удалось определить доступность обычного режима в localStorage.', {
      cause: error
    });
  }
}

function persistClassicModeDisabled() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (classicModeDisabled) {
      window.localStorage.setItem(CLASSIC_MODE_DISABLED_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(CLASSIC_MODE_DISABLED_STORAGE_KEY);
    }
  } catch (error) {
    throw new StorageError('Не удалось сохранить статус обычного режима в localStorage.', {
      cause: error
    });
  }
}

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

  clearClassicModeDisabledFlag();

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

export function prepareSeenImagesForRound() {
  // История просмотренных изображений больше не сбрасывается между раундами.
  // Функция сохранена для совместимости, но не выполняет действий.
}

export function isClassicModeDisabled() {
  ensureClassicModeDisabledLoaded();
  return classicModeDisabled;
}

export function markClassicModeDisabled() {
  ensureClassicModeDisabledLoaded();
  if (classicModeDisabled) {
    return;
  }

  classicModeDisabled = true;
  persistClassicModeDisabled();
}

export function clearClassicModeDisabledFlag() {
  ensureClassicModeDisabledLoaded();
  if (!classicModeDisabled) {
    return;
  }

  classicModeDisabled = false;
  persistClassicModeDisabled();
}

export function getQuestionsForRound(roundConfig) {
  if (!Array.isArray(plants)) {
    throw new DataLoadingError('Данные с растениями повреждены или не загружены.');
  }

  const { difficulty, questions } = roundConfig ?? {};
  const pool = plants.filter(plant => plant.difficulty === difficulty);
  const availablePlants = pool.filter(plant => {
    return !usedPlantIdsAcrossGame.has(plant.id) && !isImageSeen(plant.imageId);
  });

  const variantsByPlantId = availablePlants.reduce((acc, plant) => {
    if (!acc.has(plant.id)) {
      acc.set(plant.id, []);
    }

    acc.get(plant.id).push(plant);
    return acc;
  }, new Map());

  const desiredQuestions = Number.isFinite(questions) && questions > 0
    ? questions
    : variantsByPlantId.size;

  if (variantsByPlantId.size < desiredQuestions) {
    markClassicModeDisabled();
    return [];
  }

  const prioritizedGroups = shuffleArray(Array.from(variantsByPlantId.entries()));
  const selectedPlants = [];

  for (const [plantId, variants] of prioritizedGroups) {
    if (selectedPlants.length >= desiredQuestions) {
      break;
    }

    const chosenVariant = shuffleArray(variants.slice())[0];

    if (!chosenVariant) {
      continue;
    }

    selectedPlants.push(chosenVariant);
    usedPlantIdsAcrossGame.add(plantId);
  }

  if (selectedPlants.length < desiredQuestions) {
    markClassicModeDisabled();
    return [];
  }

  markImagesAsSeen(selectedPlants.map(plant => plant.imageId));

  return selectedPlants;
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
