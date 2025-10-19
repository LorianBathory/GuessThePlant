import {
  getDifficultyByQuestionId,
  getDifficultyByImageId,
  plantImagesById,
  speciesById
} from '../../game/dataLoader.js';
import { questionTypes } from '../questionTypes.js';

const memorizationPlantConfig = Object.freeze([
  Object.freeze({ id: 3, imageId: 'p3_1' }),
  Object.freeze({ id: 4, imageId: 'p4_1' }),
  Object.freeze({ id: 5, imageId: 'p5_1' }),
  Object.freeze({ id: 6, imageId: 'p6_1' }),
  Object.freeze({ id: 14, imageId: 'p14_1' })
]);

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
