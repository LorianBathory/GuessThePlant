import assert from 'node:assert/strict';

import {
  plants,
  bouquetQuestions,
  speciesById,
  plantImagesById,
  questionIdsByDifficulty,
  imageIdsByDifficulty,
  getDifficultyByQuestionId,
  getDifficultyByImageId,
  difficultyLevels
} from '../src/game/dataLoader.js';
import { questionTypes } from '../src/data/questionTypes.js';

function assertHasKeys(object, message) {
  assert.ok(object && Object.keys(object).length > 0, message);
}

function assertPlantIntegrity() {
  assert.ok(Array.isArray(plants) && plants.length > 0, 'plants should contain entries');

  plants.forEach(plant => {
    const species = speciesById[plant.correctAnswerId];
    assert.ok(species && species.names, `Plant ${plant.id} must resolve localized names`);
    assert.ok(plantImagesById[plant.imageId], `Plant ${plant.id} must have a known image`);
    assert.ok(typeof plant.difficulty === 'string' && plant.difficulty.length > 0, 'Plant difficulty should be resolved');
    assert.ok(Array.isArray(plant.wrongAnswers) || plant.wrongAnswers == null, 'Plant wrongAnswers must be an array or undefined');
  });
}

function assertBouquetIntegrity() {
  assert.ok(Array.isArray(bouquetQuestions) && bouquetQuestions.length > 0, 'bouquetQuestions should contain entries');

  bouquetQuestions.forEach(question => {
    const species = speciesById[question.correctAnswerId];
    assert.ok(species && species.names, `Bouquet ${question.questionVariantId} must resolve plant names`);
    assert.ok(question.wrongAnswers.length <= 3, 'Bouquet wrong answers limited to three options');
  });
}

function assertDifficultyLookups() {
  assertHasKeys(questionIdsByDifficulty, 'questionIdsByDifficulty must be populated');
  assertHasKeys(imageIdsByDifficulty, 'imageIdsByDifficulty must be populated');

  const knownDifficulties = new Set(Object.values(difficultyLevels));

  const plantBuckets = questionIdsByDifficulty[questionTypes.PLANT] || {};
  Object.values(plantBuckets).forEach(ids => {
    ids.forEach(id => {
      const resolved = getDifficultyByQuestionId(id, questionTypes.PLANT);
      assert.ok(resolved == null || knownDifficulties.has(resolved), `Unknown difficulty for plant ${id}`);
    });
  });

  const bouquetBuckets = questionIdsByDifficulty[questionTypes.BOUQUET] || {};
  Object.values(bouquetBuckets).forEach(ids => {
    ids.forEach(id => {
      const resolved = getDifficultyByQuestionId(id, questionTypes.BOUQUET);
      assert.ok(resolved == null || knownDifficulties.has(resolved), `Unknown difficulty for bouquet ${id}`);
    });
  });

  Object.entries(imageIdsByDifficulty).forEach(([questionType, buckets]) => {
    Object.values(buckets).forEach(ids => {
      ids.forEach(id => {
        const resolved = getDifficultyByImageId(id, questionType);
        assert.ok(resolved == null || knownDifficulties.has(resolved), `Unknown difficulty for image ${id}`);
      });
    });
  });

  assert.ok(difficultyLevels.MEDIUM, 'Default difficulty level must be available');
}

assertPlantIntegrity();
assertBouquetIntegrity();
assertDifficultyLookups();

console.log('Game data verification passed');
