import { questionTypes } from '../data/questionTypes.js';

const NUMERIC_ID_PATTERN = /^\d+$/;

function parseCatalogId(rawId) {
  const stringId = String(rawId);
  return NUMERIC_ID_PATTERN.test(stringId) ? Number(stringId) : stringId;
}

function cloneDifficultyBuckets(buckets = {}) {
  return Object.fromEntries(
    Object.entries(buckets).map(([difficulty, ids]) => [
      difficulty,
      Array.isArray(ids) ? ids.slice() : []
    ])
  );
}

function createDifficultyCollector(initialBuckets = {}) {
  const buckets = Object.create(null);
  const seenKeys = Object.create(null);

  Object.entries(initialBuckets || {}).forEach(([difficulty, values]) => {
    const normalizedDifficulty = String(difficulty);
    const normalizedValues = Array.isArray(values) ? values : [];
    buckets[normalizedDifficulty] = normalizedValues.slice();
    const seen = new Set();

    normalizedValues.forEach(value => {
      seen.add(String(value));
    });

    seenKeys[normalizedDifficulty] = seen;
  });

  return {
    buckets,
    add(difficulty, value) {
      if (difficulty == null || value == null) {
        return;
      }

      const normalizedDifficulty = String(difficulty);
      let bucket = buckets[normalizedDifficulty];
      let seen = seenKeys[normalizedDifficulty];

      if (!bucket) {
        bucket = [];
        buckets[normalizedDifficulty] = bucket;
      }

      if (!seen) {
        seen = new Set();
        seenKeys[normalizedDifficulty] = seen;
      }

      const key = String(value);

      if (seen.has(key)) {
        return;
      }

      bucket.push(value);
      seen.add(key);
    }
  };
}

function cloneDifficultyTypeMap(source = {}, replacementKey, replacementBuckets) {
  const cloned = Object.fromEntries(
    Object.entries(source || {}).map(([questionType, buckets]) => [
      questionType,
      cloneDifficultyBuckets(buckets)
    ])
  );

  if (replacementKey) {
    cloned[replacementKey] = cloneDifficultyBuckets(replacementBuckets || {});
  }

  return cloned;
}

function mergeDifficultyLevels(primary = {}, fallback = {}) {
  return { ...fallback, ...primary };
}

function deriveNormalizedPlantData(rawPlantData = {}) {
  if (!rawPlantData || typeof rawPlantData !== 'object') {
    return {
      plantCatalog: {},
      plantNames: {},
      species: {},
      plantImages: [],
      difficulties: {
        difficultyLevels: {},
        questionIdsByDifficulty: {},
        imageIdsByDifficulty: {}
      }
    };
  }

  if (!rawPlantData.plants || typeof rawPlantData.plants !== 'object') {
    const difficulties = rawPlantData.difficulties && typeof rawPlantData.difficulties === 'object'
      ? rawPlantData.difficulties
      : {
          difficultyLevels: rawPlantData.difficultyLevels && typeof rawPlantData.difficultyLevels === 'object'
            ? rawPlantData.difficultyLevels
            : {}
        };

    return {
      plantCatalog: rawPlantData.plants && typeof rawPlantData.plants === 'object'
        ? rawPlantData.plants
        : {},
      plantNames: rawPlantData.plantNames && typeof rawPlantData.plantNames === 'object'
        ? rawPlantData.plantNames
        : {},
      species: rawPlantData.species && typeof rawPlantData.species === 'object'
        ? rawPlantData.species
        : {},
      plantImages: Array.isArray(rawPlantData.plantImages) ? rawPlantData.plantImages : [],
      difficulties: {
        difficultyLevels: difficulties.difficultyLevels || {},
        questionIdsByDifficulty: difficulties.questionIdsByDifficulty || {},
        imageIdsByDifficulty: difficulties.imageIdsByDifficulty || {}
      }
    };
  }

  const fallbackDifficulties = rawPlantData.difficulties && typeof rawPlantData.difficulties === 'object'
    ? rawPlantData.difficulties
    : {};

  const normalizedDifficultyLevels = mergeDifficultyLevels(
    rawPlantData.difficultyLevels && typeof rawPlantData.difficultyLevels === 'object'
      ? rawPlantData.difficultyLevels
      : {},
    fallbackDifficulties.difficultyLevels
  );

  const plantQuestionCollector = createDifficultyCollector(
    fallbackDifficulties.questionIdsByDifficulty?.plant || fallbackDifficulties.questionIdsByDifficulty?.[questionTypes.PLANT]
  );
  const plantImageCollector = createDifficultyCollector(
    fallbackDifficulties.imageIdsByDifficulty?.plant || fallbackDifficulties.imageIdsByDifficulty?.[questionTypes.PLANT]
  );

  const normalizedPlantNames = Object.create(null);
  const normalizedSpecies = Object.create(null);
  const imageMap = new Map();

  Object.entries(rawPlantData.plants).forEach(([idKey, entry]) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    const rawId = entry.id ?? idKey;

    if (rawId == null) {
      return;
    }

    const parsedId = parseCatalogId(rawId);
    const idString = String(rawId);
    const names = entry.names && typeof entry.names === 'object' ? { ...entry.names } : {};
    const wrongAnswers = Array.isArray(entry.wrongAnswers)
      ? entry.wrongAnswers.map(answerId => parseCatalogId(answerId))
      : [];
    const genusId = entry.genusId != null ? parseCatalogId(entry.genusId) : undefined;

    normalizedPlantNames[idString] = names;

    const imageEntries = Array.isArray(entry.images) ? entry.images : [];
    const imageIds = [];

    imageEntries.forEach(imageEntry => {
      if (!imageEntry) {
        return;
      }

      if (typeof imageEntry === 'string') {
        const normalizedId = String(imageEntry);
        imageIds.push(normalizedId);
        return;
      }

      const imageId = imageEntry.id != null ? String(imageEntry.id) : null;
      const src = typeof imageEntry.src === 'string' ? imageEntry.src : null;

      if (!imageId || !src) {
        return;
      }

      const existing = imageMap.get(imageId);
      const normalized = existing || { id: imageId, src };

      if (!normalized.src) {
        normalized.src = src;
      }

      if (typeof imageEntry.difficulty === 'string' && imageEntry.difficulty.length > 0) {
        normalized.difficulty = imageEntry.difficulty;
        plantImageCollector.add(imageEntry.difficulty, imageId);
      }

      imageMap.set(imageId, normalized);
      imageIds.push(imageId);
    });

    if (typeof entry.difficulty === 'string' && entry.difficulty.length > 0) {
      plantQuestionCollector.add(entry.difficulty, parsedId);
    }

    normalizedSpecies[idString] = {
      id: parsedId,
      names,
      ...(imageIds.length > 0 ? { images: imageIds } : {}),
      ...(wrongAnswers.length > 0 ? { wrongAnswers } : {}),
      ...(genusId != null ? { genusId } : {})
    };
  });

  const normalizedPlantImages = Array.from(imageMap.values());

  const questionIdsByDifficulty = cloneDifficultyTypeMap(
    fallbackDifficulties.questionIdsByDifficulty,
    'plant',
    plantQuestionCollector.buckets
  );

  const imageIdsByDifficulty = cloneDifficultyTypeMap(
    fallbackDifficulties.imageIdsByDifficulty,
    'plant',
    plantImageCollector.buckets
  );

  return {
    plantCatalog: rawPlantData.plants,
    plantNames: normalizedPlantNames,
    species: normalizedSpecies,
    plantImages: normalizedPlantImages,
    difficulties: {
      difficultyLevels: normalizedDifficultyLevels,
      questionIdsByDifficulty,
      imageIdsByDifficulty
    }
  };
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

function deriveMemorizationPlantEntries({ memorizationJson, plantParameters }) {
  if (plantParameters && typeof plantParameters === 'object') {
    const parameterIds = Object.keys(plantParameters);

    if (parameterIds.length > 0) {
      return parameterIds.map(id => ({ id }));
    }
  }

  if (memorizationJson && typeof memorizationJson === 'object' && Array.isArray(memorizationJson.plants)) {
    return memorizationJson.plants.slice();
  }

  return [];
}

function extractJsonModuleData(module, fallbackKey) {
  if (module && typeof module === 'object') {
    if ('default' in module) {
      return module.default;
    }

    if (fallbackKey && (fallbackKey in module)) {
      return module[fallbackKey];
    }
  }

  return module;
}

async function loadJsonModule(relativePath, {
  fallbackKey = null,
  fallbackValue,
  fileSystemHint
} = {}) {
  let lastError;

  try {
    const module = await import(relativePath, { assert: { type: 'json' } });
    return extractJsonModuleData(module, fallbackKey);
  } catch (assertError) {
    lastError = assertError;

    try {
      const module = await import(relativePath, { with: { type: 'json' } });
      return extractJsonModuleData(module, fallbackKey);
    } catch (withError) {
      lastError = withError;

      if (typeof fetch === 'function') {
        try {
          const response = await fetch(new URL(relativePath.replace(/^\.\//, ''), import.meta.url));

          if (!response.ok) {
            throw new Error(`Failed to load JSON at ${relativePath}: ${response.status} ${response.statusText}`);
          }

          const json = await response.json();
          return json;
        } catch (fetchError) {
          lastError = fetchError;
        }
      }

      if (fallbackValue !== undefined) {
        return fallbackValue;
      }

      const normalizedError = lastError instanceof Error ? lastError : new Error(String(lastError));

      if (fileSystemHint && import.meta.url.startsWith('file:')) {
        throw new Error(fileSystemHint, { cause: normalizedError });
      }

      throw normalizedError;
    }
  }
}

const memorizationJson = Object.freeze(await loadJsonModule('../data/json/memorization.json', {
  fileSystemHint: (
    'Не удалось загрузить memorization.json напрямую из файловой системы. '
    + 'Современные браузеры блокируют JSON-модули при открытии index.html через file://. '
    + 'Запустите локальный статический сервер (npm run serve) и откройте игру по адресу http://localhost:4173.'
  )
}));

const plantDataJson = Object.freeze(await loadJsonModule('../data/json/plantData.json', {
  fallbackKey: 'plantData',
  fileSystemHint: (
    'Не удалось загрузить plantData.json напрямую из файловой системы. '
    + 'Современные браузеры блокируют JSON-модули при открытии index.html через file://. '
    + 'Запустите локальный статический сервер (npm run serve) и откройте игру по адресу http://localhost:4173.'
  )
}));

const plantParameterConfigJson = Object.freeze(await loadJsonModule('../data/json/plantParameters.json', {
  fallbackValue: {},
  fallbackKey: 'plantParameterConfig'
}));

const normalizedPlantData = deriveNormalizedPlantData(plantDataJson);

const bouquetQuestionDefinitions = Object.freeze(await loadJsonModule('../data/json/bouquetQuestions.json', {
  fallbackValue: [],
  fallbackKey: 'bouquetQuestions'
}));

const plantParameterSource = (
  memorizationJson && typeof memorizationJson.plantParameters === 'object'
    ? memorizationJson.plantParameters
    : plantDataJson && typeof plantDataJson.plantParameters === 'object'
      ? plantDataJson.plantParameters
      : {}
);

const plantFamilySource = (
  memorizationJson && typeof memorizationJson.plantFamilies === 'object'
    ? memorizationJson.plantFamilies
    : plantDataJson && typeof plantDataJson.plantFamilies === 'object'
      ? plantDataJson.plantFamilies
      : derivePlantFamiliesFromParameters(plantParameterSource)
);

const memorizationPlantEntries = deriveMemorizationPlantEntries({
  memorizationJson,
  plantParameters: plantParameterSource
});

const plantTagDefinitionsData = buildPlantTagDefinitions(plantParameterConfigJson);

function freezeQuestionDefinitions(definitions) {
  if (!Array.isArray(definitions)) {
    return Object.freeze([]);
  }

  return Object.freeze(definitions.map(entry => (
    entry && typeof entry === 'object'
      ? Object.freeze({ ...entry })
      : entry
  )));
}

export const dataBundle = Object.freeze({
  plantCatalog: normalizedPlantData.plantCatalog,
  plantNames: normalizedPlantData.plantNames,
  species: normalizedPlantData.species,
  genus: Array.isArray(memorizationJson.genus) ? memorizationJson.genus : Array.isArray(plantDataJson.genus) ? plantDataJson.genus : [],
  plantImages: normalizedPlantData.plantImages,
  plantParameters: plantParameterSource,
  plantTagDefinitions: plantTagDefinitionsData.tags,
  plantFamilies: plantFamilySource,
  memorization: (
    memorizationPlantEntries.length > 0
      ? { plants: Object.freeze(memorizationPlantEntries.slice()) }
      : {}
  ),
  difficulties: normalizedPlantData.difficulties,
  questionDefinitionsByType: Object.freeze({
    [questionTypes.BOUQUET]: freezeQuestionDefinitions(bouquetQuestionDefinitions)
  })
});

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

function buildPlantFamilyData(rawFamilies) {
  const source = rawFamilies && typeof rawFamilies === 'object' ? rawFamilies : {};

  const normalizedFamilies = Object.fromEntries(
    Object.entries(source).map(([family, ids]) => {
      const normalizedIds = Array.isArray(ids)
        ? ids.map(entryId => parseCatalogId(entryId))
        : [];

      return [family, Object.freeze(normalizedIds)];
    })
  );

  const familyByIdEntries = Object.entries(normalizedFamilies).flatMap(([family, ids]) =>
    ids.map(id => [id, family])
  );

  return {
    plantFamilies: Object.freeze(normalizedFamilies),
    plantFamilyById: Object.freeze(Object.fromEntries(familyByIdEntries))
  };
}

function buildPlantTagDefinitions(config) {
  const source = config && typeof config === 'object' ? config : {};
  const tagEntries = Array.isArray(source.tags) ? source.tags : [];

  const normalizedTags = tagEntries
    .map(entry => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const rawId = entry.id ?? entry.tag ?? null;
      const id = typeof rawId === 'string' ? rawId.trim() : null;

      if (!id) {
        return null;
      }

      const labelSource = entry.label ?? entry.text ?? entry.name ?? null;
      let normalizedLabel = null;

      if (labelSource && typeof labelSource === 'object' && !Array.isArray(labelSource)) {
        const filteredEntries = Object.entries(labelSource)
          .filter(([, value]) => typeof value === 'string' && value.trim());

        if (filteredEntries.length) {
          normalizedLabel = freezeObject(Object.fromEntries(
            filteredEntries.map(([language, value]) => [language, value.trim()])
          ));
        }
      } else if (typeof labelSource === 'string') {
        const trimmed = labelSource.trim();
        normalizedLabel = trimmed ? trimmed : null;
      }

      const icon = typeof entry.icon === 'string' && entry.icon.trim() ? entry.icon.trim() : null;
      const circleColor = typeof entry.circleColor === 'string' && entry.circleColor.trim() ? entry.circleColor.trim() : null;
      const circleContent = Object.prototype.hasOwnProperty.call(entry, 'circleContent') ? entry.circleContent : undefined;

      const normalizedEntry = {
        id,
        ...(normalizedLabel !== null ? { label: normalizedLabel } : {}),
        ...(icon ? { icon } : {}),
        ...(circleColor ? { circleColor } : {}),
        ...(circleContent !== undefined ? { circleContent } : {})
      };

      return Object.freeze(normalizedEntry);
    })
    .filter(Boolean);

  return {
    tags: Object.freeze(normalizedTags),
    tagsById: Object.freeze(Object.fromEntries(normalizedTags.map(tag => [tag.id, tag])))
  };
}

function buildPlantParameters({ plantParameters, plantFamilyById }) {
  const source = plantParameters && typeof plantParameters === 'object' ? plantParameters : {};

  const normalizedEntries = Object.entries(source).map(([id, params]) => {
    const parsedId = parseCatalogId(id);
    const clone = params && typeof params === 'object' ? cloneStructured(params) : {};

    const fallbackFamily = clone.family ?? plantFamilyById?.[parsedId] ?? plantFamilyById?.[id] ?? null;

    if (fallbackFamily != null) {
      clone.family = fallbackFamily;
    } else if ('family' in clone && clone.family == null) {
      clone.family = null;
    }

    return [parsedId, deepFreeze(clone)];
  });

  return Object.freeze(Object.fromEntries(normalizedEntries));
}

function freezeArray(array) {
  return Object.freeze(array.slice());
}

function freezeObject(object) {
  return Object.freeze({ ...object });
}

const plantFamilyData = buildPlantFamilyData(dataBundle.plantFamilies);

export const plantFamilies = plantFamilyData.plantFamilies;
export const plantFamilyById = plantFamilyData.plantFamilyById;

export const plantTagDefinitions = plantTagDefinitionsData.tags;
export const plantTagDefinitionsById = plantTagDefinitionsData.tagsById;

export const plantParametersById = buildPlantParameters({
  plantParameters: dataBundle.plantParameters,
  plantFamilyById: plantFamilyData.plantFamilyById
});

export function getPlantTagDefinition(id) {
  if (typeof id !== 'string') {
    return null;
  }

  const normalizedId = id.trim();

  if (!normalizedId) {
    return null;
  }

  return plantTagDefinitionsById[normalizedId] || null;
}

export function getPlantParameters(id) {
  const parsedId = parseCatalogId(id);
  return plantParametersById[parsedId] || plantParametersById[id] || null;
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

function buildSpeciesData({ plantNamesById, speciesCatalog, genusById, speciesEntries }) {
  if (speciesEntries && typeof speciesEntries === 'object') {
    const normalizedEntries = Object.entries(speciesEntries).map(([id, entry]) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const parsedId = parseCatalogId(entry.id ?? id);
      const baseNames = plantNamesById[parsedId] || freezeObject(entry.names || {});
      const images = Array.isArray(entry.images) ? freezeArray(entry.images) : undefined;
      const wrongAnswers = Array.isArray(entry.wrongAnswers) ? freezeArray(entry.wrongAnswers) : undefined;
      const genusId = entry.genusId != null ? parseCatalogId(entry.genusId) : undefined;

      return [
        parsedId,
        Object.freeze({
          id: parsedId,
          names: baseNames,
          ...(images ? { images } : {}),
          ...(wrongAnswers ? { wrongAnswers } : {}),
          ...(genusId != null ? { genusId } : {})
        })
      ];
    }).filter(Boolean);

    const speciesById = Object.freeze(Object.fromEntries(normalizedEntries));
    const choicesById = Object.fromEntries(
      Object.values(speciesById).map(entry => [entry.id, entry.names])
    );

    const allChoiceIds = Object.freeze(Object.values(speciesById).map(entry => entry.id));

    if (Object.keys(speciesById).length > 0) {
      return { speciesById, choicesById, allChoiceIds };
    }
  }

  const speciesEntriesMap = new Map();
  const catalogEntries = speciesCatalog && typeof speciesCatalog === 'object' ? speciesCatalog : {};

  Object.entries(plantNamesById).forEach(([id, names]) => {
    const parsedId = parseCatalogId(id);
    speciesEntriesMap.set(parsedId, {
      id: parsedId,
      names
    });
  });

  Object.entries(catalogEntries).forEach(([id, entry]) => {
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
        const existing = speciesEntriesMap.get(parsedChildId) || {};
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

        speciesEntriesMap.set(parsedChildId, {
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

    const existing = speciesEntriesMap.get(parsedId);
    if (!existing) {
      return;
    }

    const images = Array.isArray(normalizedEntry.images)
      ? freezeArray(normalizedEntry.images)
      : existing.images;
    const wrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
      ? freezeArray(normalizedEntry.wrongAnswers)
      : existing.wrongAnswers;

    speciesEntriesMap.set(parsedId, {
      ...existing,
      ...(images ? { images } : {}),
      ...(wrongAnswers ? { wrongAnswers } : {})
    });
  });

  const speciesById = Object.freeze(
    Object.fromEntries(
      Array.from(speciesEntriesMap.entries()).map(([key, value]) => [
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
            ...(species.genusId != null ? { genusId: species.genusId } : {}),
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

function normalizeMemorizationEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const rawId = entry.id ?? entry.plantId ?? entry.correctAnswerId;
  if (rawId == null) {
    return null;
  }

  const normalized = {
    id: parseCatalogId(rawId)
  };

  const imageId = entry.imageId != null ? String(entry.imageId) : null;
  if (imageId) {
    normalized.imageId = imageId;
  }

  const explicitImage = typeof entry.image === 'string' ? entry.image.trim() : '';
  if (explicitImage) {
    normalized.image = explicitImage;
  }

  return normalized;
}

function buildMemorizationPlants({ memorizationEntries, speciesById, plantImagesById, difficultyLookups }) {
  if (!Array.isArray(memorizationEntries) || memorizationEntries.length === 0) {
    return Object.freeze([]);
  }

  const normalizedEntries = memorizationEntries
    .map(normalizeMemorizationEntry)
    .filter(Boolean);

  return Object.freeze(
    normalizedEntries
      .map(({ id, imageId, image: explicitImage }) => {
        const species = speciesById[id];
        if (!species || !species.names) {
          return null;
        }

        const galleryMap = new Map();

        const pushImage = (imageEntry, fallbackId = null) => {
          if (!imageEntry || typeof imageEntry !== 'object') {
            return;
          }

          const src = typeof imageEntry.src === 'string' ? imageEntry.src : null;
          if (!src) {
            return;
          }

          const normalizedId = typeof imageEntry.id === 'string' && imageEntry.id ? imageEntry.id : fallbackId;
          const key = normalizedId || src;

          if (!galleryMap.has(key)) {
            galleryMap.set(key, { id: normalizedId || null, src });
          }
        };

        if (Array.isArray(species.images)) {
          species.images
            .map(imageKey => plantImagesById[imageKey])
            .forEach(imageEntry => pushImage(imageEntry));
        }

        if (imageId && plantImagesById[imageId]) {
          pushImage(plantImagesById[imageId]);
        }

        if (explicitImage) {
          pushImage({ id: imageId || null, src: explicitImage }, imageId || null);
        }

        const gallery = Array.from(galleryMap.values());

        if (gallery.length === 0) {
          return null;
        }

        const preferredImage = imageId ? gallery.find(imageEntry => imageEntry.id === imageId) : null;
        const primaryImageEntry = preferredImage || gallery[0];

        const overrideDifficulty = typeof primaryImageEntry.id === 'string'
          ? difficultyLookups.getImageDifficulty(primaryImageEntry.id, questionTypes.PLANT)
          : null;
        const difficulty = overrideDifficulty
          || difficultyLookups.getQuestionDifficulty(id, questionTypes.PLANT)
          || difficultyLookups.defaultDifficulty;

        const frozenGallery = freezeArray(
          gallery
            .map(imageEntry => (imageEntry && typeof imageEntry.src === 'string'
              ? Object.freeze({
                id: typeof imageEntry.id === 'string' ? imageEntry.id : null,
                src: imageEntry.src
              })
              : null))
            .filter(Boolean)
        );

        return Object.freeze({
          id,
          correctAnswerId: id,
          imageId: typeof primaryImageEntry.id === 'string' ? primaryImageEntry.id : null,
          image: primaryImageEntry.src,
          images: frozenGallery,
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
}

function buildBouquetQuestions({ bouquetDefinitions, plantNamesById, difficultyLookups }) {
  return Object.freeze(
    bouquetDefinitions.map(entry => {
      const normalizedEntry = entry && typeof entry === 'object' ? entry : {};
      const hasPreNormalizedFields = 'correctAnswerId' in normalizedEntry || 'names' in normalizedEntry;

      const baseCorrectPlantId = hasPreNormalizedFields
        ? normalizedEntry.correctAnswerId ?? normalizedEntry.correctPlantId ?? normalizedEntry.id
        : normalizedEntry.correctPlantId;
      const correctPlantId = baseCorrectPlantId != null ? parseCatalogId(baseCorrectPlantId) : undefined;

      const imageId = normalizedEntry.imageId;
      const wrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
        ? freezeArray(normalizedEntry.wrongAnswers.slice(0, 3))
        : Array.isArray(normalizedEntry.wrongAnswerIds)
          ? freezeArray(normalizedEntry.wrongAnswerIds.slice(0, 3))
          : Object.freeze([]);

      const difficultyOverride = imageId != null
        ? difficultyLookups.getImageDifficulty(imageId, questionTypes.BOUQUET)
        : null;
      const fallbackDifficulty = correctPlantId != null
        ? difficultyLookups.getQuestionDifficulty(correctPlantId, questionTypes.BOUQUET)
        : null;

      const names = hasPreNormalizedFields && normalizedEntry.names
        ? freezeObject(normalizedEntry.names)
        : correctPlantId != null
          ? plantNamesById[correctPlantId]
          : undefined;

      const questionVariantId = normalizedEntry.questionVariantId ?? normalizedEntry.id ?? correctPlantId;
      const selectionGroupId = normalizedEntry.selectionGroupId ?? (questionVariantId != null
        ? `bouquet-${questionVariantId}`
        : undefined);

      return Object.freeze({
        id: normalizedEntry.id ?? correctPlantId,
        correctAnswerId: correctPlantId,
        imageId,
        image: normalizedEntry.image,
        names,
        wrongAnswers,
        difficulty: normalizedEntry.difficulty
          ?? difficultyOverride
          ?? fallbackDifficulty
          ?? difficultyLookups.defaultDifficulty
          ?? null,
        questionVariantId,
        questionType: normalizedEntry.questionType ?? questionTypes.BOUQUET,
        selectionGroupId,
        questionPromptKey: normalizedEntry.questionPromptKey ?? 'bouquetQuestion'
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
  plantNames = dataBundle.plantNames,
  speciesCatalog = undefined,
  genusEntries = dataBundle.genus,
  plantImages = dataBundle.plantImages,
  difficulties = dataBundle.difficulties,
  speciesEntries = dataBundle.species,
  questionDefinitionsByType = dataBundle.questionDefinitionsByType
} = {}) {
  const plantNamesById = buildPlantNames(plantNames);
  const genusData = buildGenusData(genusEntries);
  const speciesData = buildSpeciesData({
    plantNamesById,
    speciesCatalog,
    genusById: genusData.genusById,
    speciesEntries
  });
  const difficultyData = buildDifficultyMaps(difficulties);
  const imagesData = buildPlantImages(plantImages);
  const plants = buildPlants({
    speciesById: speciesData.speciesById,
    plantImagesById: imagesData.plantImagesById,
    difficultyLookups: difficultyData
  });
  const memorizationPlants = buildMemorizationPlants({
    memorizationEntries: dataBundle.memorization?.plants,
    speciesById: speciesData.speciesById,
    plantImagesById: imagesData.plantImagesById,
    difficultyLookups: difficultyData
  });
  const normalizedQuestionDefinitions = (
    questionDefinitionsByType && typeof questionDefinitionsByType === 'object'
      ? questionDefinitionsByType
      : {}
  );
  const bouquetSet = buildBouquetQuestions({
    bouquetDefinitions: normalizedQuestionDefinitions[questionTypes.BOUQUET],
    plantNamesById,
    difficultyLookups: difficultyData
  });
  const questionSetsByType = Object.freeze({
    [questionTypes.PLANT]: plants,
    [questionTypes.BOUQUET]: bouquetSet
  });

  return Object.freeze({
    plantNamesById,
    plantImages: imagesData.plantImages,
    plantImagesById: imagesData.plantImagesById,
    ...genusData,
    ...speciesData,
    plants,
    memorizationPlants,
    bouquetQuestions: bouquetSet,
    questionSetsByType,
    questionDefinitionsByType: Object.freeze({ ...normalizedQuestionDefinitions }),
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

export { deriveNormalizedPlantData };

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
  questionSetsByType,
  questionDefinitionsByType,
  difficultyLevels,
  questionIdsByDifficulty,
  imageIdsByDifficulty,
  questionDifficultyLookup,
  imageDifficultyLookup,
  getQuestionDifficulty,
  getImageDifficulty,
  defaultDifficulty
} = gameData;

export const memorizationPlants = gameData.memorizationPlants;

export const ALL_CHOICE_IDS = allChoiceIds;
export const imageDifficultyOverrides = imageDifficultyLookup;

export function getDifficultyByQuestionId(questionId, questionType = questionTypes.PLANT) {
  return getQuestionDifficulty(questionId, questionType);
}

export function getDifficultyByImageId(imageId, questionType = questionTypes.PLANT) {
  return getImageDifficulty(imageId, questionType);
}

export function buildGameDataForTesting(overrides = {}) {
  const {
    bouquetQuestions: legacyBouquetOverride,
    questionDefinitionsByType: questionDefinitionsOverride,
    ...remainingOverrides
  } = overrides || {};

  let questionDefinitionsByTypeOverride = questionDefinitionsOverride;

  if (!questionDefinitionsByTypeOverride && legacyBouquetOverride !== undefined) {
    questionDefinitionsByTypeOverride = {
      ...dataBundle.questionDefinitionsByType,
      [questionTypes.BOUQUET]: legacyBouquetOverride
    };
  }

  return buildGameData({
    plantNames: dataBundle.plantNames,
    genusEntries: dataBundle.genus,
    plantImages: dataBundle.plantImages,
    difficulties: dataBundle.difficulties,
    speciesEntries: dataBundle.species,
    questionDefinitionsByType: questionDefinitionsByTypeOverride,
    ...remainingOverrides
  });
}
