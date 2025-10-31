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
  difficultyLevels,
  plantParametersById,
  plantFamilies,
  allGenusEntries,
  buildGameDataForTesting,
  deriveNormalizedPlantData
} from '../src/game/dataLoader.js';
import { questionTypes } from '../src/data/questionTypes.js';

function assertHasKeys(object, message) {
  assert.ok(object && Object.keys(object).length > 0, message);
}

function unwrapJsonModule(module) {
  return module && typeof module === 'object' && 'default' in module
    ? module.default
    : module;
}

async function loadJson(relativePath) {
  let lastError;

  try {
    const module = await import(relativePath, { assert: { type: 'json' } });
    return unwrapJsonModule(module) || {};
  } catch (assertError) {
    lastError = assertError;

    try {
      const module = await import(relativePath, { with: { type: 'json' } });
      return unwrapJsonModule(module) || {};
    } catch (withError) {
      lastError = withError;
    }
  }

  throw lastError;
}

const plantDataJson = await loadJson('../src/data/json/plantData.json');
const memorizationJson = await loadJson('../src/data/json/memorization.json');

const NUMERIC_ID_PATTERN = /^\d+$/;

function parseCatalogId(rawId) {
  const stringId = String(rawId);
  return NUMERIC_ID_PATTERN.test(stringId) ? Number(stringId) : rawId;
}

function cloneStructured(value) {
  if (Array.isArray(value)) {
    return value.map(item => cloneStructured(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, cloneStructured(nestedValue)])
    );
  }

  return value;
}

function deepFreeze(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(item => deepFreeze(item)));
  }

  if (value && typeof value === 'object') {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [key, deepFreeze(nestedValue)])
      )
    );
  }

  return value;
}

function buildPlantFamilyDataFromJson(rawFamilies) {
  const source = rawFamilies && typeof rawFamilies === 'object' ? rawFamilies : {};

  const normalizedFamilies = Object.create(null);

  Object.entries(source).forEach(([family, ids]) => {
    const normalizedIds = Array.isArray(ids)
      ? ids.map(entryId => parseCatalogId(entryId))
      : [];

    normalizedFamilies[family] = normalizedIds;
  });

  const plantFamilyById = {};

  Object.entries(normalizedFamilies).forEach(([family, ids]) => {
    ids.forEach(id => {
      plantFamilyById[id] = family;
      plantFamilyById[String(id)] = family;
    });
  });

  return { plantFamilies: deepFreeze(normalizedFamilies), plantFamilyById };
}

function buildPlantParametersFromJson({ plantParameters, plantFamilies }) {
  const { plantFamilyById } = buildPlantFamilyDataFromJson(plantFamilies);
  const source = plantParameters && typeof plantParameters === 'object' ? plantParameters : {};

  const normalizedParameters = Object.create(null);

  Object.entries(source).forEach(([id, params]) => {
    const parsedId = parseCatalogId(id);
    const clone = params && typeof params === 'object' ? cloneStructured(params) : {};

    const fallbackFamily = clone.family ?? plantFamilyById[parsedId] ?? plantFamilyById[id] ?? null;

    if (fallbackFamily != null) {
      clone.family = fallbackFamily;
    } else if ('family' in clone && clone.family == null) {
      clone.family = null;
    }

    normalizedParameters[parsedId] = clone;
  });

  return deepFreeze(normalizedParameters);
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

function assertCatalogConsistency() {
  const normalizedGenus = Array.isArray(memorizationJson.genus) && memorizationJson.genus.length > 0
    ? memorizationJson.genus
    : Array.isArray(plantDataJson.genus)
      ? plantDataJson.genus
      : [];

  const normalizedPlantData = deriveNormalizedPlantData(plantDataJson);
  const canonicalPlantNames = normalizedPlantData.plantNames || {};
  const canonicalSpecies = normalizedPlantData.species || {};
  const canonicalPlantImages = normalizedPlantData.plantImages || [];
  const canonicalDifficulties = normalizedPlantData.difficulties || {};

  const combinedGameData = buildGameDataForTesting({
    plantNames: canonicalPlantNames,
    genusEntries: normalizedGenus,
    plantImages: canonicalPlantImages,
    speciesEntries: canonicalSpecies,
    difficulties: canonicalDifficulties
  });

  const familyDataFromJson = buildPlantFamilyDataFromJson(memorizationJson.plantFamilies);
  const plantParametersFromJson = buildPlantParametersFromJson({
    plantParameters: memorizationJson.plantParameters,
    plantFamilies: memorizationJson.plantFamilies
  });

  assert.deepStrictEqual(
    combinedGameData.plants,
    plants,
    'Plants derived from catalog JSON must match runtime export'
  );

  assert.deepStrictEqual(
    combinedGameData.allGenusEntries,
    allGenusEntries,
    'Genus entries from memorization.json must match runtime export'
  );

  assert.deepStrictEqual(
    familyDataFromJson.plantFamilies,
    plantFamilies,
    'Plant family mapping derived from memorization.json must match runtime export'
  );

  assert.deepStrictEqual(
    plantParametersFromJson,
    plantParametersById,
    'Plant parameters from memorization.json must match runtime export'
  );

  assert.deepStrictEqual(
    combinedGameData.speciesById,
    speciesById,
    'Species catalog derived from plantData.json must match runtime export'
  );
}

assertPlantIntegrity();
assertBouquetIntegrity();
assertDifficultyLookups();
assertCatalogConsistency();

console.log('Game data verification passed');
