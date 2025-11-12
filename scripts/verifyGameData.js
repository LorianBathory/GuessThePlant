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
  plantTagDefinitionsById,
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
const plantParameterConfigJson = await loadJson('../src/data/json/plantParameters.json');

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

function derivePlantFamiliesFromParameters(plantParameters) {
  if (!plantParameters || typeof plantParameters !== 'object') {
    return {};
  }

  const buckets = Object.create(null);

  Object.entries(plantParameters).forEach(([id, params]) => {
    if (!params || typeof params !== 'object') {
      return;
    }

    const family = params.family;

    if (family == null || family === '') {
      return;
    }

    const normalizedFamily = String(family);
    const entries = buckets[normalizedFamily] || (buckets[normalizedFamily] = []);
    entries.push(parseCatalogId(id));
  });

  return buckets;
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

function assertMemorizationTags() {
  const tagDefinitions = plantParameterConfigJson && typeof plantParameterConfigJson === 'object'
    ? plantParameterConfigJson.tags
    : null;

  const tagIdsFromConfig = new Set(
    Array.isArray(tagDefinitions)
      ? tagDefinitions
        .map(entry => (entry && typeof entry === 'object' && typeof entry.id === 'string') ? entry.id.trim() : null)
        .filter(Boolean)
      : []
  );

  const normalizedDefinitionKeys = Object.keys(plantTagDefinitionsById || {});
  assert.ok(normalizedDefinitionKeys.length > 0, 'Memorization tag definitions must be populated');

  const unknownTags = new Set();

  Object.values(plantParametersById).forEach(params => {
    if (!params || typeof params !== 'object') {
      return;
    }

    const rawTags = params.tags ?? params.tagIds ?? params.newTags;

    if (!rawTags) {
      return;
    }

    const entries = Array.isArray(rawTags) ? rawTags : [rawTags];

    entries.forEach(entry => {
      let tagId = null;

      if (typeof entry === 'string') {
        tagId = entry.trim();
      } else if (entry && typeof entry === 'object') {
        const candidate = typeof entry.id === 'string' ? entry.id : typeof entry.tag === 'string' ? entry.tag : null;
        tagId = candidate ? candidate.trim() : null;
      }

      if (!tagId) {
        return;
      }

      if (!plantTagDefinitionsById[tagId]) {
        unknownTags.add(tagId);
      }
    });
  });

  assert.strictEqual(unknownTags.size, 0, `Unknown memorization tags referenced: ${Array.from(unknownTags).join(', ')}`);

  normalizedDefinitionKeys.forEach(tagId => {
    if (!tagIdsFromConfig.has(tagId)) {
      throw new Error(`Tag "${tagId}" is exported by dataLoader but missing from plantParameters.json`);
    }
  });
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

  const plantFamiliesFromJson = (
    memorizationJson && typeof memorizationJson.plantFamilies === 'object'
      ? memorizationJson.plantFamilies
      : derivePlantFamiliesFromParameters(memorizationJson.plantParameters)
  );

  const familyDataFromJson = buildPlantFamilyDataFromJson(plantFamiliesFromJson);
  const plantParametersFromJson = buildPlantParametersFromJson({
    plantParameters: memorizationJson.plantParameters,
    plantFamilies: plantFamiliesFromJson
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
assertMemorizationTags();
assertCatalogConsistency();

console.log('Game data verification passed');
