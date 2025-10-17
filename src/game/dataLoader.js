async function loadJsonModule(relativePath) {
  const isNode = typeof globalThis.process !== 'undefined' && globalThis.process?.versions?.node;

  if (isNode) {
    const module = await import(relativePath, { with: { type: 'json' } });
    return module.default;
  }

  try {
    const module = await import(relativePath, { assert: { type: 'json' } });
    return module.default;
  } catch (assertError) {
    try {
      const module = await import(relativePath, { with: { type: 'json' } });
      return module.default;
    } catch {
      if (typeof fetch === 'function') {
        const response = await fetch(new URL(relativePath, import.meta.url));

        if (!response.ok) {
          throw new Error(`Failed to load JSON at ${relativePath}: ${response.status} ${response.statusText}`);
        }

        return response.json();
      }

      throw assertError;
    }
  }
}

const plantNamesJson = await loadJsonModule('../data/json/plantNames.json');
const speciesCatalogJson = await loadJsonModule('../data/json/speciesCatalog.json');
const genusJson = await loadJsonModule('../data/json/genus.json');
const plantImagesJson = await loadJsonModule('../data/json/plantImages.json');
const bouquetQuestionsJson = await loadJsonModule('../data/json/bouquetQuestions.json');
const difficultiesJson = await loadJsonModule('../data/json/difficulties.json');
import { questionTypes } from '../data/questionTypes.js';

const NUMERIC_ID_PATTERN = /^\d+$/;

function parseCatalogId(rawId) {
  const stringId = String(rawId);
  return NUMERIC_ID_PATTERN.test(stringId) ? Number(stringId) : stringId;
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function freezeObject(object) {
  return Object.freeze({ ...object });
}

function buildGenusData(genusEntries) {
  const frozenEntries = genusEntries.map(entry => {
    const entries = entry.entries && typeof entry.entries === 'object' ? entry.entries : {};

    const normalizedEntries = Object.fromEntries(
      Object.entries(entries).map(([childId, child]) => [
        parseCatalogId(childId),
        Object.freeze({
          ...child,
          ...(child.names ? { names: freezeObject(child.names) } : {}),
          ...(Array.isArray(child.images) ? { images: freezeArray(child.images) } : {}),
          ...(Array.isArray(child.wrongAnswers) ? { wrongAnswers: freezeArray(child.wrongAnswers) } : {})
        })
      ])
    );

    return Object.freeze({
      ...entry,
      id: parseCatalogId(entry.id),
      entries: normalizedEntries,
      ...(Array.isArray(entry.wrongAnswers) ? { wrongAnswers: freezeArray(entry.wrongAnswers) } : {})
    });
  });

  const genusById = Object.freeze(
    Object.fromEntries(frozenEntries.map(genus => [genus.id, genus]))
  );

  const genusBySlug = Object.freeze(
    Object.fromEntries(frozenEntries.map(genus => [genus.slug, genus]))
  );

  return {
    allGenusEntries: Object.freeze(frozenEntries.slice()),
    genusById,
    genusBySlug
  };
}

function buildSpeciesData({ plantNamesById, speciesCatalog, genusById }) {
  const speciesEntries = new Map();

  Object.entries(plantNamesById).forEach(([id, names]) => {
    const parsedId = parseCatalogId(id);
    speciesEntries.set(parsedId, {
      id: parsedId,
      names
    });
  });

  Object.entries(speciesCatalog).forEach(([id, entry]) => {
    const parsedId = parseCatalogId(id);
    const normalizedEntry = entry && typeof entry === 'object' ? entry : {};

    if (normalizedEntry.genusId != null) {
      const genus = genusById[parseCatalogId(normalizedEntry.genusId)];

      if (!genus || typeof genus !== 'object') {
        return;
      }

      const genusEntries = genus.entries && typeof genus.entries === 'object'
        ? genus.entries
        : {};

      const baseWrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
        ? freezeArray(normalizedEntry.wrongAnswers)
        : Array.isArray(genus.wrongAnswers)
          ? freezeArray(genus.wrongAnswers)
          : undefined;

      Object.entries(genusEntries).forEach(([childId, genusEntry]) => {
        if (!genusEntry || typeof genusEntry !== 'object') {
          return;
        }

        const parsedChildId = parseCatalogId(childId);
        const existing = speciesEntries.get(parsedChildId) || {};
        const names = genusEntry.names || existing.names;

        if (!names) {
          return;
        }

        const images = Array.isArray(genusEntry.images)
          ? freezeArray(genusEntry.images)
          : existing.images;
        const wrongAnswers = Array.isArray(genusEntry.wrongAnswers)
          ? freezeArray(genusEntry.wrongAnswers)
          : baseWrongAnswers || existing.wrongAnswers;

        speciesEntries.set(parsedChildId, {
          ...existing,
          id: parsedChildId,
          names,
          ...(images ? { images } : {}),
          ...(wrongAnswers ? { wrongAnswers } : {}),
          genusId: genus.id
        });
      });

      return;
    }

    const existing = speciesEntries.get(parsedId);
    if (!existing) {
      return;
    }

    const images = Array.isArray(normalizedEntry.images)
      ? freezeArray(normalizedEntry.images)
      : existing.images;
    const wrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
      ? freezeArray(normalizedEntry.wrongAnswers)
      : existing.wrongAnswers;

    speciesEntries.set(parsedId, {
      ...existing,
      ...(images ? { images } : {}),
      ...(wrongAnswers ? { wrongAnswers } : {})
    });
  });

  const speciesById = Object.freeze(
    Object.fromEntries(
      Array.from(speciesEntries.entries()).map(([key, value]) => [
        key,
        Object.freeze({
          ...value,
          names: freezeObject(value.names),
          ...(Array.isArray(value.images) ? { images: freezeArray(value.images) } : {}),
          ...(Array.isArray(value.wrongAnswers) ? { wrongAnswers: freezeArray(value.wrongAnswers) } : {})
        })
      ])
    )
  );

  const choicesById = Object.fromEntries(
    Object.values(speciesById).map(entry => [entry.id, entry.names])
  );

  const allChoiceIds = Object.freeze(
    Object.values(speciesById).map(entry => entry.id)
  );

  return { speciesById, choicesById, allChoiceIds };
}

function buildPlantImages(images) {
  const plantImages = Object.freeze(
    images.map(image => Object.freeze({ ...image }))
  );

  const plantImagesById = Object.freeze(
    Object.fromEntries(plantImages.map(image => [image.id, image]))
  );

  return { plantImages, plantImagesById };
}

function buildDifficultyMaps({ difficultyLevels, questionIdsByDifficulty, imageIdsByDifficulty }) {
  const frozenLevels = Object.freeze({ ...difficultyLevels });

  function freezeBuckets(buckets = {}) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(buckets).map(([difficulty, ids]) => [difficulty, freezeArray(ids || [])])
      )
    );
  }

  const questionBuckets = Object.freeze({
    [questionTypes.PLANT]: freezeBuckets(questionIdsByDifficulty?.[questionTypes.PLANT] || questionIdsByDifficulty?.plant),
    [questionTypes.BOUQUET]: freezeBuckets(questionIdsByDifficulty?.[questionTypes.BOUQUET] || questionIdsByDifficulty?.bouquet)
  });

  const imageBuckets = Object.freeze({
    [questionTypes.PLANT]: freezeBuckets(imageIdsByDifficulty?.[questionTypes.PLANT] || imageIdsByDifficulty?.plant),
    [questionTypes.BOUQUET]: freezeBuckets(imageIdsByDifficulty?.[questionTypes.BOUQUET] || imageIdsByDifficulty?.bouquet)
  });

  function buildLookup(source) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(source).flatMap(([questionType, difficultyMap]) =>
          Object.entries(difficultyMap).flatMap(([difficulty, ids]) =>
            ids.map(id => [`${questionType}::${id}`, difficulty])
          )
        )
      )
    );
  }

  const questionDifficultyLookup = buildLookup(questionBuckets);
  const imageDifficultyLookup = buildLookup(imageBuckets);

  const defaultDifficulty = frozenLevels.MEDIUM || 'Medium';

  return {
    difficultyLevels: frozenLevels,
    questionIdsByDifficulty: questionBuckets,
    imageIdsByDifficulty: imageBuckets,
    questionDifficultyLookup,
    imageDifficultyLookup,
    defaultDifficulty,
    getQuestionDifficulty(questionId, questionType = questionTypes.PLANT) {
      if (questionId == null) {
        return null;
      }

      return questionDifficultyLookup[`${questionType}::${questionId}`] || null;
    },
    getImageDifficulty(imageId, questionType = questionTypes.PLANT) {
      if (typeof imageId !== 'string') {
        return null;
      }

      return imageDifficultyLookup[`${questionType}::${imageId}`] || null;
    }
  };
}

function buildPlants({ speciesById, plantImagesById, difficultyLookups }) {
  return Object.freeze(
    Object.values(speciesById)
      .flatMap(species => {
        const imageEntries = (species.images || [])
          .map(imageId => plantImagesById[imageId])
          .filter(imageEntry => imageEntry && typeof imageEntry.src === 'string');

        return imageEntries.map((imageEntry, index) => {
          const overrideDifficulty = difficultyLookups.getImageDifficulty(imageEntry.id, questionTypes.PLANT);
          const baseDifficulty = difficultyLookups.getQuestionDifficulty(species.id, questionTypes.PLANT);
          const genusDifficulty = species.genusId != null && species.genusId !== species.id
            ? difficultyLookups.getQuestionDifficulty(species.genusId, questionTypes.PLANT)
            : null;

          const difficulty = overrideDifficulty || baseDifficulty || genusDifficulty || difficultyLookups.defaultDifficulty;

          return Object.freeze({
            id: species.id,
            correctAnswerId: species.id,
            imageId: imageEntry.id,
            image: imageEntry.src,
            names: species.names,
            wrongAnswers: species.wrongAnswers,
            difficulty,
            questionVariantId: `${species.id}-${index}`,
            questionType: questionTypes.PLANT,
            selectionGroupId: `plant-${species.id}`,
            questionPromptKey: 'question'
          });
        });
      })
  );
}

function buildBouquetQuestions({ bouquetDefinitions, plantNamesById, difficultyLookups }) {
  return Object.freeze(
    bouquetDefinitions.map(entry => {
      const wrongAnswers = Array.isArray(entry.wrongAnswerIds)
        ? freezeArray(entry.wrongAnswerIds.slice(0, 3))
        : Object.freeze([]);

      const difficultyOverride = difficultyLookups.getImageDifficulty(entry.imageId, questionTypes.BOUQUET);
      const fallbackDifficulty = difficultyLookups.getQuestionDifficulty(entry.id, questionTypes.BOUQUET);

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
}

function buildPlantNames(data) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(data).map(([id, names]) => [
        parseCatalogId(id),
        freezeObject(names || {})
      ])
    )
  );
}

function buildGameData({
  plantNames = plantNamesJson,
  speciesCatalog = speciesCatalogJson,
  genusEntries = genusJson,
  plantImages = plantImagesJson,
  bouquetQuestions = bouquetQuestionsJson,
  difficulties = difficultiesJson
} = {}) {
  const plantNamesById = buildPlantNames(plantNames);
  const genusData = buildGenusData(genusEntries);
  const speciesData = buildSpeciesData({
    plantNamesById,
    speciesCatalog,
    genusById: genusData.genusById
  });
  const difficultyData = buildDifficultyMaps(difficulties);
  const imagesData = buildPlantImages(plantImages);
  const plants = buildPlants({
    speciesById: speciesData.speciesById,
    plantImagesById: imagesData.plantImagesById,
    difficultyLookups: difficultyData
  });
  const bouquetSet = buildBouquetQuestions({
    bouquetDefinitions: bouquetQuestions,
    plantNamesById,
    difficultyLookups: difficultyData
  });

  return Object.freeze({
    plantNamesById,
    plantImages: imagesData.plantImages,
    plantImagesById: imagesData.plantImagesById,
    ...genusData,
    ...speciesData,
    plants,
    bouquetQuestions: bouquetSet,
    difficultyLevels: difficultyData.difficultyLevels,
    questionIdsByDifficulty: difficultyData.questionIdsByDifficulty,
    imageIdsByDifficulty: difficultyData.imageIdsByDifficulty,
    questionDifficultyLookup: difficultyData.questionDifficultyLookup,
    imageDifficultyLookup: difficultyData.imageDifficultyLookup,
    defaultDifficulty: difficultyData.defaultDifficulty,
    getQuestionDifficulty: difficultyData.getQuestionDifficulty,
    getImageDifficulty: difficultyData.getImageDifficulty
  });
}

export const gameData = buildGameData();

export const {
  plantNamesById,
  plantImages,
  plantImagesById,
  allGenusEntries,
  genusById,
  genusBySlug,
  speciesById,
  choicesById,
  allChoiceIds,
  plants,
  bouquetQuestions,
  difficultyLevels,
  questionIdsByDifficulty,
  imageIdsByDifficulty,
  questionDifficultyLookup,
  imageDifficultyLookup,
  getQuestionDifficulty,
  getImageDifficulty,
  defaultDifficulty
} = gameData;

export const ALL_CHOICE_IDS = allChoiceIds;
export const imageDifficultyOverrides = imageDifficultyLookup;

export function getDifficultyByQuestionId(questionId, questionType = questionTypes.PLANT) {
  return getQuestionDifficulty(questionId, questionType);
}

export function getDifficultyByImageId(imageId, questionType = questionTypes.PLANT) {
  return getImageDifficulty(imageId, questionType);
}

export function buildGameDataForTesting(overrides = {}) {
  return buildGameData({
    plantNames: plantNamesJson,
    speciesCatalog: speciesCatalogJson,
    genusEntries: genusJson,
    plantImages: plantImagesJson,
    bouquetQuestions: bouquetQuestionsJson,
    difficulties: difficultiesJson,
    ...overrides
  });
}
