import {
  dataBundle,
  getDifficultyByQuestionId,
  getDifficultyByImageId,
  plantImagesById,
  speciesById
} from '../../game/dataLoader.js';
import { questionTypes } from '../questionTypes.js';

const NUMERIC_ID_PATTERN = /^\d+$/;

function normalizePlantId(rawId) {
  if (rawId == null) {
    return null;
  }

  if (typeof rawId === 'number') {
    return rawId;
  }

  if (typeof rawId === 'string' && NUMERIC_ID_PATTERN.test(rawId)) {
    return Number(rawId);
  }

  return rawId;
}

function normalizeImageId(rawImageId) {
  if (rawImageId == null) {
    return null;
  }

  if (typeof rawImageId === 'string') {
    return rawImageId;
  }

  return String(rawImageId);
}

const rawMemorizationEntries = dataBundle.memorization && Array.isArray(dataBundle.memorization.plants)
  ? dataBundle.memorization.plants
  : [];

const memorizationPlantConfig = Object.freeze(
  rawMemorizationEntries
    .map(entry => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const id = normalizePlantId(entry.id ?? entry.plantId ?? entry.correctAnswerId);
      const imageId = normalizeImageId(entry.imageId);

      if (id == null || !imageId) {
        return null;
      }

      return Object.freeze({ id, imageId });
    })
    .filter(Boolean)
);

export const memorizationPlants = Object.freeze(
  memorizationPlantConfig
    .map(({ id, imageId }) => {
      const species = speciesById[id];
      const imageEntry = plantImagesById[imageId];

      if (!species || !imageEntry) {
        return null;
      }

      const overrideDifficulty = getDifficultyByImageId(imageEntry.id, questionTypes.PLANT);
      const difficulty = overrideDifficulty || getDifficultyByQuestionId(id, questionTypes.PLANT);

      return Object.freeze({
        id,
        correctAnswerId: id,
        imageId: imageEntry.id,
        image: imageEntry.src,
        names: species.names,
        wrongAnswers: species.wrongAnswers,
        difficulty,
        questionVariantId: `memorization-${id}`,
        questionType: questionTypes.PLANT,
        selectionGroupId: `memorization-${id}`,
        questionPromptKey: 'question'
      });
    })
    .filter(Boolean)
);
