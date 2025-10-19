import { allQuestions } from './data/questions.js';
import { questionTypes } from './data/questionTypes.js';
import { shuffleArray } from './utils/random.js';
import { difficultyLevels } from './game/dataLoader.js';
import { DataLoadingError, StorageError } from './utils/errorHandling.js';

export const PLANT_LANGUAGES = ['ru', 'en', 'nl', 'sci'];
export const INTERFACE_LANGUAGES = ['ru', 'en', 'nl'];

export const GAME_MODES = Object.freeze({
  CLASSIC: 'classic',
  ENDLESS: 'endless',
  MEMORIZATION: 'memorization'
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

export const BOUQUET_QUESTIONS_TARGET = 2;
export const BOUQUET_PER_ROUND_LIMIT = 1;

const usedQuestionGroupIdsAcrossGame = new Set();
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

function getSelectionGroupId(question) {
  const hasQuestion = Boolean(question);
  const hasVariantId = hasQuestion && question.questionVariantId !== undefined && question.questionVariantId !== null;
  const fallbackVariantId = hasVariantId
    ? question.questionVariantId
    : hasQuestion
      ? question.id
      : null;

  if (hasQuestion && typeof question.selectionGroupId === 'string') {
    return question.selectionGroupId;
  }

  return fallbackVariantId != null ? String(fallbackVariantId) : '';
}

function collectAvailableQuestionGroupsByDifficulty() {
  ensureSeenImageIdsLoaded();

  const groups = new Map();

  allQuestions.forEach(question => {
    if (!question) {
      return;
    }

    const difficulty = question.difficulty;
    if (!difficulty) {
      return;
    }

    const imageId = question.imageId;
    if (typeof imageId !== 'string' || isImageSeen(imageId)) {
      return;
    }

    const groupId = getSelectionGroupId(question);
    if (!groupId) {
      return;
    }

    const normalizedType = question.questionType || questionTypes.PLANT;

    if (!groups.has(difficulty)) {
      groups.set(difficulty, {
        plant: new Set(),
        bouquet: new Set()
      });
    }

    const entry = groups.get(difficulty);
    if (normalizedType === questionTypes.BOUQUET) {
      entry.bouquet.add(groupId);
    } else {
      entry.plant.add(groupId);
    }
  });

  return groups;
}

function canAssembleClassicGameFrom(groupsByDifficulty) {
  if (!(groupsByDifficulty instanceof Map)) {
    return false;
  }

  const usedGroupIds = new Set();
  let bouquetRemaining = BOUQUET_QUESTIONS_TARGET;

  for (const roundConfig of ROUNDS) {
    if (!roundConfig) {
      return false;
    }

    const desiredQuestions = Number.isFinite(roundConfig.questions) && roundConfig.questions > 0
      ? roundConfig.questions
      : 0;

    if (desiredQuestions === 0) {
      continue;
    }

    const difficulty = roundConfig.difficulty;
    const difficultyEntry = difficulty ? groupsByDifficulty.get(difficulty) : null;

    const availablePlantGroups = difficultyEntry
      ? Array.from(difficultyEntry.plant).filter(groupId => !usedGroupIds.has(groupId))
      : [];
    const availableBouquetGroups = difficultyEntry
      ? Array.from(difficultyEntry.bouquet).filter(groupId => !usedGroupIds.has(groupId))
      : [];

    const allowedBouquetQuestions = Math.min(
      BOUQUET_PER_ROUND_LIMIT,
      bouquetRemaining,
      availableBouquetGroups.length,
      desiredQuestions
    );

    if ((availablePlantGroups.length + allowedBouquetQuestions) < desiredQuestions) {
      return false;
    }

    for (let i = 0; i < allowedBouquetQuestions; i += 1) {
      usedGroupIds.add(availableBouquetGroups[i]);
    }
    bouquetRemaining -= allowedBouquetQuestions;

    const remainingNeeded = desiredQuestions - allowedBouquetQuestions;
    for (let i = 0; i < remainingNeeded; i += 1) {
      usedGroupIds.add(availablePlantGroups[i]);
    }
  }

  return true;
}

function hasEnoughUnseenQuestionsForClassicGame() {
  const groupsByDifficulty = collectAvailableQuestionGroupsByDifficulty();
  if (groupsByDifficulty.size === 0) {
    return false;
  }

  return canAssembleClassicGameFrom(groupsByDifficulty);
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

  return allQuestions
    .filter(question => question.difficulty === difficulty)
    .some(question => !isImageSeen(question.imageId));
}

export function prepareSeenImagesForRound() {
  // История просмотренных изображений больше не сбрасывается между раундами.
  // Функция сохранена для совместимости, но не выполняет действий.
}

export function isClassicModeDisabled() {
  ensureClassicModeDisabledLoaded();

  if (classicModeDisabled) {
    const canAssembleGame = hasEnoughUnseenQuestionsForClassicGame();
    if (canAssembleGame) {
      classicModeDisabled = false;
      persistClassicModeDisabled();
    }
  }

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

export function getQuestionsForRound(roundConfig, selectionOptions = {}) {
  if (!Array.isArray(allQuestions)) {
    throw new DataLoadingError('Данные с вопросами повреждены или не загружены.');
  }

  const normalizedRoundConfig = roundConfig || {};
  const difficulty = normalizedRoundConfig.difficulty;
  const questions = normalizedRoundConfig.questions;
  const {
    bouquetRemaining = Number.POSITIVE_INFINITY,
    bouquetPerRoundLimit = Number.POSITIVE_INFINITY,
    afterSelection
  } = selectionOptions;

  const pool = allQuestions.filter(question => question.difficulty === difficulty);
  const availableQuestions = pool.filter(question => {
    const fallbackVariantId = (question.questionVariantId !== undefined && question.questionVariantId !== null)
      ? question.questionVariantId
      : question.id;
    const groupId = typeof question.selectionGroupId === 'string'
      ? question.selectionGroupId
      : String(fallbackVariantId);
    return !usedQuestionGroupIdsAcrossGame.has(groupId) && !isImageSeen(question.imageId);
  });

  const variantsByGroupId = availableQuestions.reduce((acc, question) => {
    const fallbackVariantId = (question.questionVariantId !== undefined && question.questionVariantId !== null)
      ? question.questionVariantId
      : question.id;
    const groupId = typeof question.selectionGroupId === 'string'
      ? question.selectionGroupId
      : String(fallbackVariantId);

    if (!acc.has(groupId)) {
      acc.set(groupId, {
        type: question.questionType || questionTypes.PLANT,
        variants: []
      });
    }

    acc.get(groupId).variants.push(question);
    return acc;
  }, new Map());

  const desiredQuestions = Number.isFinite(questions) && questions > 0
    ? questions
    : variantsByGroupId.size;

  if (variantsByGroupId.size < desiredQuestions) {
    markClassicModeDisabled();
    return [];
  }

  const bouquetGroups = [];
  const plantGroups = [];

  for (const [groupId, groupEntry] of variantsByGroupId.entries()) {
    const normalizedType = groupEntry && groupEntry.type
      ? groupEntry.type
      : questionTypes.PLANT;
    if (normalizedType === questionTypes.BOUQUET) {
      bouquetGroups.push([groupId, groupEntry.variants]);
    } else {
      plantGroups.push([groupId, groupEntry.variants]);
    }
  }

  const allowedBouquetQuestions = Math.min(
    bouquetPerRoundLimit,
    bouquetRemaining,
    bouquetGroups.length,
    desiredQuestions
  );

  if ((plantGroups.length + allowedBouquetQuestions) < desiredQuestions) {
    markClassicModeDisabled();
    return [];
  }

  const selectedQuestions = [];
  let selectedBouquetCount = 0;

  if (allowedBouquetQuestions > 0) {
    const selectedBouquetGroups = shuffleArray(bouquetGroups.slice()).slice(0, allowedBouquetQuestions);

    for (const [groupId, variants] of selectedBouquetGroups) {
      if (!Array.isArray(variants) || variants.length === 0) {
        continue;
      }

      const chosenVariant = shuffleArray(variants.slice())[0];
      if (!chosenVariant) {
        continue;
      }

      selectedQuestions.push(chosenVariant);
      usedQuestionGroupIdsAcrossGame.add(groupId);
      selectedBouquetCount += 1;
    }
  }

  const remainingQuestionsNeeded = desiredQuestions - selectedQuestions.length;

  if (remainingQuestionsNeeded > 0) {
    const prioritizedPlantGroups = shuffleArray(plantGroups.slice());

    for (const [groupId, variants] of prioritizedPlantGroups) {
      if (selectedQuestions.length >= desiredQuestions) {
        break;
      }

      if (!Array.isArray(variants) || variants.length === 0) {
        continue;
      }

      const chosenVariant = shuffleArray(variants.slice())[0];
      if (!chosenVariant) {
        continue;
      }

      selectedQuestions.push(chosenVariant);
      usedQuestionGroupIdsAcrossGame.add(groupId);
    }
  }

  if (selectedQuestions.length < desiredQuestions) {
    markClassicModeDisabled();
    return [];
  }

  markImagesAsSeen(selectedQuestions.map(question => question.imageId));

  if (typeof afterSelection === 'function') {
    afterSelection({ bouquetCount: selectedBouquetCount });
  }

  return shuffleArray(selectedQuestions.slice());
}

export function resetUsedPlantTracking() {
  usedQuestionGroupIdsAcrossGame.clear();
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
