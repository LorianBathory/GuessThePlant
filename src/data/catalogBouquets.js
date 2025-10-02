import { getDifficultyByImageId, getDifficultyByQuestionId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { questionTypes } from './questionTypes.js';

const rawBouquetQuestions = Object.freeze([
  {
    id: 'b1',
    imageId: 'bq001',
    image: 'images/bouquets/bq001.jpg',
    correctPlantId: 112,
    wrongAnswerIds: [29, 22, 126]
  },
  {
    id: 'b2',
    imageId: 'bq002',
    image: 'images/bouquets/bq002.jpg',
    correctPlantId: 32,
    wrongAnswerIds: [6, 69, 31]
  }
]);

export const bouquetQuestions = Object.freeze(
  rawBouquetQuestions.map(entry => {
    const difficultyOverride = getDifficultyByImageId(entry.imageId, questionTypes.BOUQUET);
    const fallbackDifficulty = getDifficultyByQuestionId(entry.id, questionTypes.BOUQUET);
    const wrongAnswers = Array.isArray(entry.wrongAnswerIds)
      ? Object.freeze(entry.wrongAnswerIds.slice(0, 3))
      : Object.freeze([]);

    return Object.freeze({
      id: entry.correctPlantId,
      correctAnswerId: entry.correctPlantId,
      imageId: entry.imageId,
      image: entry.image,
      names: plantNamesById[entry.correctPlantId],
      wrongAnswers,
      difficulty: difficultyOverride || fallbackDifficulty || null,
      questionVariantId: entry.id,
      questionType: questionTypes.BOUQUET,
      selectionGroupId: `bouquet-${entry.id}`,
      questionPromptKey: 'bouquetQuestion'
    });
  })
);
