import { getDifficultyByQuestionId, getDifficultyByImageId } from '../difficulties.js';
import { questionTypes } from '../questionTypes.js';
import { plantImagesById } from '../images.js';
import { speciesById } from '../catalog.js';

const memorizationPlantConfig = Object.freeze([
  Object.freeze({ id: 3, imageId: 'p003' }),
  Object.freeze({ id: 4, imageId: 'p004' }),
  Object.freeze({ id: 5, imageId: 'p005' }),
  Object.freeze({ id: 6, imageId: 'p006' }),
  Object.freeze({ id: 14, imageId: 'p057' })
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
