#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_RAW_PATH = resolve(REPO_ROOT, 'src', 'data', 'json', 'rawPlantData.json');
const DEFAULT_PLANT_PATH = resolve(REPO_ROOT, 'src', 'data', 'json', 'plantData.json');

function isObjectLike(value) {
  return value !== null && typeof value === 'object';
}

function parseArgs(argv) {
  const options = {
    rawPath: DEFAULT_RAW_PATH,
    plantPath: DEFAULT_PLANT_PATH,
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--raw' || token === '--raw-path') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Expected a value after --raw');
      }
      options.rawPath = resolve(REPO_ROOT, value);
      index += 1;
      continue;
    }

    if (token === '--plant' || token === '--plant-path') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Expected a value after --plant');
      }
      options.plantPath = resolve(REPO_ROOT, value);
      index += 1;
      continue;
    }

    if (token === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (token === '--help' || token === '-h') {
      printUsage();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function printUsage() {
  console.log(`Usage: node ${relative(REPO_ROOT, __filename)} [options]\n\n` +
    'Options:\n' +
    '  --raw <path>     Path to rawPlantData.json (defaults to src/data/json/rawPlantData.json)\n' +
    '  --plant <path>   Path to plantData.json (defaults to src/data/json/plantData.json)\n' +
    '  --dry-run        Validate and report differences without writing files\n' +
    '  -h, --help       Show this help message');
}

async function loadJson(path, label) {
  let contents;
  try {
    contents = await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Cannot find ${label} at ${path}`);
    }
    throw new Error(`Unable to read ${label} at ${path}: ${error.message}`);
  }

  try {
    return { data: JSON.parse(contents), text: contents };
  } catch (error) {
    throw new Error(`Unable to parse ${label} at ${path}: ${error.message}`);
  }
}

function isNumericId(value) {
  return typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()));
}

function normalizePlantIdValue(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (isNumericId(value)) {
    return Number(String(value).trim());
  }
  return String(value).trim();
}

function sanitizeString(value) {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function sanitizeNames(names) {
  if (!names || typeof names !== 'object') {
    return undefined;
  }
  const sanitized = {};
  Object.entries(names).forEach(([language, rawValue]) => {
    const normalized = sanitizeString(rawValue);
    if (normalized) {
      sanitized[language] = normalized;
    }
  });
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function splitLegacyList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeString(item))
      .filter((item) => Boolean(item));
  }

  const normalized = sanitizeString(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(',')
    .map((token) => sanitizeString(token))
    .filter((token) => Boolean(token));
}

const RAW_LEGACY_NON_NAME_FIELDS = new Set([
  'id',
  'plantId',
  'plant_id',
  'plantID',
  'names',
  'images',
  'image_id',
  'number_of_images',
  'wrong_answers',
  'wrongAnswers',
  'difficulty',
  'difficulty_modificator',
  'difficultyModifier',
  'extra'
]);

function normalizeLegacyNameKey(key) {
  if (!key) {
    return undefined;
  }
  const trimmed = String(key).trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function extractNamesFromRawEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return undefined;
  }

  const collected = {};
  const fromNamesBlock = sanitizeNames(rawEntry.names);
  if (fromNamesBlock) {
    Object.assign(collected, fromNamesBlock);
  }

  Object.entries(rawEntry).forEach(([rawKey, rawValue]) => {
    if (RAW_LEGACY_NON_NAME_FIELDS.has(rawKey)) {
      return;
    }
    const normalizedKey = normalizeLegacyNameKey(rawKey);
    if (!normalizedKey) {
      return;
    }
    const normalizedValue = sanitizeString(rawValue);
    if (!normalizedValue) {
      return;
    }
    collected[normalizedKey] = normalizedValue;
  });

  return Object.keys(collected).length > 0 ? collected : undefined;
}

function extractWrongAnswersFromRawEntry(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return [];
  }

  const source = rawEntry.wrongAnswers ?? rawEntry.wrong_answers;
  if (Array.isArray(source)) {
    return sanitizeWrongAnswers(source);
  }

  if (source === null || source === undefined) {
    return [];
  }

  if (typeof source === 'string') {
    return sanitizeWrongAnswers(splitLegacyList(source));
  }

  return sanitizeWrongAnswers([source]);
}

function parseDifficultyModifiers(rawValue) {
  const map = new Map();
  splitLegacyList(rawValue).forEach((entry) => {
    const [rawId, rawDifficulty] = entry.split(':');
    const id = sanitizeString(rawId);
    const difficulty = sanitizeString(rawDifficulty);
    if (id && difficulty) {
      map.set(id, difficulty);
    }
  });
  return map;
}

function normalizeLegacyImages(rawEntry) {
  if (!rawEntry || typeof rawEntry !== 'object') {
    return [];
  }

  if (Array.isArray(rawEntry.images)) {
    return rawEntry.images;
  }

  const imageNames = splitLegacyList(rawEntry.images);
  const imageIds = splitLegacyList(rawEntry.image_id);
  const difficultyOverrides = parseDifficultyModifiers(rawEntry.difficulty_modificator);

  const normalized = [];
  imageNames.forEach((imageName, index) => {
    if (!imageName) {
      return;
    }
    const normalizedSrc = imageName.startsWith('images/') ? imageName : `images/${imageName}`;
    const imageId = imageIds[index];
    const image = { src: normalizedSrc };
    if (imageId) {
      image.id = imageId;
      image.image_id = imageId;
    }
    const modifierKey = imageId ?? undefined;
    if (modifierKey && difficultyOverrides.has(modifierKey)) {
      image.difficulty = difficultyOverrides.get(modifierKey);
    }
    normalized.push(image);
  });

  return normalized;
}

function normalizeWrongAnswerId(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return undefined;
  }
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
    return rawValue;
  }
  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^-?\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    return trimmed;
  }
  return undefined;
}

function sanitizeWrongAnswers(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const sanitized = [];
  list.forEach((item) => {
    const normalized = normalizeWrongAnswerId(item);
    if (normalized !== undefined) {
      sanitized.push(normalized);
    }
  });
  return sanitized;
}

const RAW_PLANT_ID_FIELDS = ['id', 'plantId', 'plant_id', 'plantID'];

function extractPlantIdentifier(entry) {
  if (!entry || typeof entry !== 'object') {
    return undefined;
  }
  for (const fieldName of RAW_PLANT_ID_FIELDS) {
    if (fieldName in entry) {
      const normalized = sanitizeString(entry[fieldName]);
      if (normalized) {
        return normalized;
      }
    }
  }
  return undefined;
}

function buildRawPlantEntries(rawPlantContainer, { arrayEntryLineLookup } = {}) {
  const seenIds = new Set();
  const entries = [];

  if (Array.isArray(rawPlantContainer)) {
    rawPlantContainer.forEach((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        const lineNumber = typeof arrayEntryLineLookup === 'function'
          ? arrayEntryLineLookup(index)
          : undefined;
        const location = lineNumber
          ? `starting at line ${lineNumber} (index ${index})`
          : `at index ${index}`;
        throw new Error(`Plant entry ${location} in rawPlantData.json must be an object`);
      }
      const identifier = extractPlantIdentifier(entry);
      if (!identifier) {
        const lineNumber = typeof arrayEntryLineLookup === 'function'
          ? arrayEntryLineLookup(index)
          : undefined;
        const location = lineNumber
          ? `starting at line ${lineNumber} (index ${index})`
          : `at index ${index}`;
        throw new Error(`Plant entry ${location} in rawPlantData.json must include an id`);
      }
      const canonicalKey = String(normalizePlantIdValue(identifier));
      if (seenIds.has(canonicalKey)) {
        throw new Error(`Duplicate plant id ${canonicalKey} found in rawPlantData.json`);
      }
      seenIds.add(canonicalKey);
      entries.push([canonicalKey, entry]);
    });
    return { entries, sourceType: 'array' };
  }

  if (rawPlantContainer && typeof rawPlantContainer === 'object') {
    Object.entries(rawPlantContainer).forEach(([rawKey, entry]) => {
      if (!entry || typeof entry !== 'object') {
        throw new Error(`Plant ${rawKey} entry in rawPlantData.json must be an object`);
      }
      const identifier = extractPlantIdentifier(entry) || sanitizeString(rawKey);
      if (!identifier) {
        throw new Error(`Plant entry under key ${rawKey} in rawPlantData.json must include an id`);
      }
      const canonicalKey = String(normalizePlantIdValue(identifier));
      if (seenIds.has(canonicalKey)) {
        throw new Error(`Duplicate plant id ${canonicalKey} found in rawPlantData.json`);
      }
      seenIds.add(canonicalKey);
      entries.push([canonicalKey, entry]);
    });
    return { entries, sourceType: 'object' };
  }

  throw new Error('rawPlantData.json must contain a "plants" object or array');
}

function getNestedValue(container, path) {
  let current = container;
  for (const segment of path) {
    if (!isObjectLike(current) && !Array.isArray(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function cloneWithReplacedPath(root, path, replacement) {
  if (!path || path.length === 0) {
    return replacement;
  }

  const clone = Array.isArray(root) ? root.slice() : { ...root };
  let sourceCursor = root;
  let targetCursor = clone;

  for (let index = 0; index < path.length; index += 1) {
    const key = path[index];
    const isLeaf = index === path.length - 1;

    if (isLeaf) {
      targetCursor[key] = replacement;
      break;
    }

    const nextSource = isObjectLike(sourceCursor) || Array.isArray(sourceCursor)
      ? sourceCursor[key]
      : undefined;

    let nextTarget;
    if (Array.isArray(nextSource)) {
      nextTarget = nextSource.slice();
    } else if (isObjectLike(nextSource)) {
      nextTarget = { ...nextSource };
    } else {
      nextTarget = {};
    }

    targetCursor[key] = nextTarget;
    sourceCursor = nextSource;
    targetCursor = nextTarget;
  }

  return clone;
}

function createLineLookup(sourceText) {
  const newlineIndices = [];
  for (let index = 0; index < sourceText.length; index += 1) {
    if (sourceText[index] === '\n') {
      newlineIndices.push(index);
    }
  }

  return function lineFromOffset(offset) {
    if (typeof offset !== 'number' || Number.isNaN(offset)) {
      return undefined;
    }

    let low = 0;
    let high = newlineIndices.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (newlineIndices[mid] < offset) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    return low + 1;
  };
}

const NUMBER_PATTERN = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/;

function createArrayEntryPositions(sourceText, pathSegments) {
  if (typeof sourceText !== 'string') {
    return undefined;
  }

  const targetPath = Array.isArray(pathSegments) ? pathSegments.slice() : [];
  const positions = [];
  let targetFound = false;
  let index = 0;

  const length = sourceText.length;

  const isWhitespace = (charCode) => (
    charCode === 32 ||
    charCode === 9 ||
    charCode === 10 ||
    charCode === 13
  );

  const pathEquals = (path) => {
    if (path.length !== targetPath.length) {
      return false;
    }
    for (let position = 0; position < path.length; position += 1) {
      if (path[position] !== targetPath[position]) {
        return false;
      }
    }
    return true;
  };

  const skipWhitespace = () => {
    while (index < length && isWhitespace(sourceText.charCodeAt(index))) {
      index += 1;
    }
  };

  const parseString = () => {
    if (sourceText[index] !== '"') {
      throw new Error('Expected string while scanning rawPlantData.json');
    }
    const start = index;
    index += 1;
    let escaping = false;
    while (index < length) {
      const char = sourceText[index];
      if (escaping) {
        escaping = false;
      } else if (char === '\\') {
        escaping = true;
      } else if (char === '"') {
        break;
      }
      index += 1;
    }
    if (sourceText[index] !== '"') {
      throw new Error('Unterminated string while scanning rawPlantData.json');
    }
    index += 1;
    return JSON.parse(sourceText.slice(start, index));
  };

  const parseLiteral = (expected) => {
    if (sourceText.slice(index, index + expected.length) !== expected) {
      throw new Error(`Expected ${expected} while scanning rawPlantData.json`);
    }
    index += expected.length;
  };

  const parseNumber = () => {
    const match = NUMBER_PATTERN.exec(sourceText.slice(index));
    if (!match) {
      throw new Error('Invalid number in rawPlantData.json');
    }
    index += match[0].length;
  };

  const parseValue = (path) => {
    skipWhitespace();
    if (index >= length) {
      throw new Error('Unexpected end of file while scanning rawPlantData.json');
    }
    const char = sourceText[index];

    if (char === '{') {
      index += 1;
      skipWhitespace();
      if (sourceText[index] === '}') {
        index += 1;
        return;
      }
      while (index < length) {
        skipWhitespace();
        const key = parseString();
        skipWhitespace();
        if (sourceText[index] !== ':') {
          throw new Error('Expected colon in object while scanning rawPlantData.json');
        }
        index += 1;
        const nextPath = path.concat(key);
        parseValue(nextPath);
        skipWhitespace();
        const delimiter = sourceText[index];
        if (delimiter === ',') {
          index += 1;
          continue;
        }
        if (delimiter === '}') {
          index += 1;
          break;
        }
        throw new Error('Expected comma or closing brace while scanning rawPlantData.json');
      }
      return;
    }

    if (char === '[') {
      const isTarget = pathEquals(path);
      index += 1;
      skipWhitespace();
      if (sourceText[index] === ']') {
        index += 1;
        if (isTarget) {
          targetFound = true;
        }
        return;
      }
      let elementIndex = 0;
      while (index < length) {
        skipWhitespace();
        if (isTarget) {
          targetFound = true;
          positions[elementIndex] = index;
        }
        const nextPath = path.concat(elementIndex);
        parseValue(nextPath);
        elementIndex += 1;
        skipWhitespace();
        const delimiter = sourceText[index];
        if (delimiter === ',') {
          index += 1;
          continue;
        }
        if (delimiter === ']') {
          index += 1;
          break;
        }
        throw new Error('Expected comma or closing bracket while scanning rawPlantData.json');
      }
      return;
    }

    if (char === '"') {
      parseString();
      return;
    }

    if (char === 't') {
      parseLiteral('true');
      return;
    }
    if (char === 'f') {
      parseLiteral('false');
      return;
    }
    if (char === 'n') {
      parseLiteral('null');
      return;
    }

    parseNumber();
  };

  try {
    parseValue([]);
  } catch (error) {
    return undefined;
  }

  if (!targetFound) {
    return undefined;
  }

  return positions;
}

function createArrayEntryLineLookup(sourceText, pathSegments) {
  const positions = createArrayEntryPositions(sourceText, pathSegments);
  if (!positions) {
    return undefined;
  }
  const lineLookup = createLineLookup(sourceText);
  return (index) => {
    const offset = positions[index];
    if (offset === undefined) {
      return undefined;
    }
    return lineLookup(offset);
  };
}

function resolveRawPlantSource(rawData, rawText) {
  if (Array.isArray(rawData)) {
    const arrayEntryLineLookup = createArrayEntryLineLookup(rawText, []);
    const { entries, sourceType } = buildRawPlantEntries(rawData, { arrayEntryLineLookup });
    return {
      entries,
      sourceType,
      serialize(sortedPlants) {
        return JSON.stringify(sortedPlants, null, 2) + '\n';
      },
      baseline: JSON.stringify(rawData, null, 2) + '\n'
    };
  }

  if (!isObjectLike(rawData)) {
    throw new Error('rawPlantData.json must contain a "plants" object or array');
  }

  const candidatePaths = [
    ['plants'],
    ['plantData', 'plants'],
    ['plant_data', 'plants'],
    ['data', 'plants'],
    ['plantCatalog']
  ];

  for (const path of candidatePaths) {
    const container = getNestedValue(rawData, path);
    if (!container || (!Array.isArray(container) && !isObjectLike(container))) {
      continue;
    }
    const arrayEntryLineLookup = Array.isArray(container)
      ? createArrayEntryLineLookup(rawText, path)
      : undefined;
    const { entries, sourceType } = buildRawPlantEntries(container, { arrayEntryLineLookup });
    return {
      entries,
      sourceType,
      serialize(sortedPlants) {
        const clone = cloneWithReplacedPath(rawData, path, sortedPlants);
        return JSON.stringify(clone, null, 2) + '\n';
      },
      baseline: JSON.stringify(rawData, null, 2) + '\n'
    };
  }

  throw new Error('rawPlantData.json must contain a "plants" object or array');
}

function parsePlantId(plantId) {
  const normalized = String(plantId).trim();
  const [head, ...rawSuffixParts] = normalized.split('_');
  const numericHead = /^\d+$/.test(head) ? Number(head) : NaN;
  const suffixParts = rawSuffixParts.map((part) => ({
    value: /^\d+$/.test(part) ? Number(part) : part,
    isNumber: /^\d+$/.test(part)
  }));
  return {
    normalized,
    hasNumericHead: Number.isFinite(numericHead),
    numericHead,
    suffixParts
  };
}

function compareSuffixParts(aParts, bParts) {
  const max = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < max; index += 1) {
    const aPart = aParts[index];
    const bPart = bParts[index];

    if (!aPart) {
      return -1;
    }
    if (!bPart) {
      return 1;
    }

    if (aPart.isNumber && bPart.isNumber) {
      if (aPart.value !== bPart.value) {
        return aPart.value - bPart.value;
      }
    } else if (aPart.isNumber) {
      return -1;
    } else if (bPart.isNumber) {
      return 1;
    } else if (aPart.value !== bPart.value) {
      return String(aPart.value).localeCompare(String(bPart.value));
    }
  }
  return 0;
}

function comparePlantIds(a, b) {
  if (a === b) {
    return 0;
  }
  const aParsed = parsePlantId(a);
  const bParsed = parsePlantId(b);

  if (aParsed.hasNumericHead && bParsed.hasNumericHead) {
    if (aParsed.numericHead !== bParsed.numericHead) {
      return aParsed.numericHead - bParsed.numericHead;
    }
    if (aParsed.suffixParts.length === 0 && bParsed.suffixParts.length === 0) {
      return 0;
    }
    if (aParsed.suffixParts.length === 0) {
      return -1;
    }
    if (bParsed.suffixParts.length === 0) {
      return 1;
    }
    return compareSuffixParts(aParsed.suffixParts, bParsed.suffixParts);
  }

  if (aParsed.hasNumericHead) {
    return -1;
  }
  if (bParsed.hasNumericHead) {
    return 1;
  }
  return aParsed.normalized.localeCompare(bParsed.normalized);
}

function getImagePrefix(plantKey) {
  const normalized = String(plantKey).trim();
  if (normalized.includes('_')) {
    return `p${normalized}`;
  }
  return `p${normalized}_0`;
}

function extractImageIndex(imageId, prefix) {
  if (!imageId.startsWith(`${prefix}_`)) {
    return undefined;
  }
  const indexPart = imageId.slice(prefix.length + 1);
  if (/^\d+$/.test(indexPart)) {
    return Number(indexPart);
  }
  return undefined;
}

function sanitizeImages(rawImages, plantKey, existingPlantDataImages = []) {
  const images = Array.isArray(rawImages) ? rawImages : [];
  const sanitizedImages = [];
  const canonicalImages = [];
  const prefix = getImagePrefix(plantKey);
  const usedIds = new Set();
  let maxIndex = 0;

  const registerExistingId = (id) => {
    if (!id) {
      return;
    }
    const normalized = String(id).trim();
    if (!normalized) {
      return;
    }
    usedIds.add(normalized);
    const candidateIndex = extractImageIndex(normalized, prefix);
    if (candidateIndex !== undefined && candidateIndex > maxIndex) {
      maxIndex = candidateIndex;
    }
  };

  existingPlantDataImages.forEach((image) => {
    if (image && typeof image === 'object') {
      registerExistingId(image.id);
    }
  });

  images.forEach((image) => {
    if (image && typeof image === 'object') {
      registerExistingId(image.image_id ?? image.id);
    }
  });

  const takeNextImageId = () => {
    let nextIndex = maxIndex + 1;
    let candidate = `${prefix}_${nextIndex}`;
    while (usedIds.has(candidate)) {
      nextIndex += 1;
      candidate = `${prefix}_${nextIndex}`;
    }
    usedIds.add(candidate);
    if (nextIndex > maxIndex) {
      maxIndex = nextIndex;
    }
    return candidate;
  };

  images.forEach((image, position) => {
    if (!image || typeof image !== 'object') {
      throw new Error(`Image entry at index ${position} for plant ${plantKey} is not an object`);
    }

    const clone = { ...image };
    let resolvedId = sanitizeString(clone.image_id ?? clone.id);
    if (!resolvedId) {
      resolvedId = takeNextImageId();
    } else {
      const normalizedId = String(resolvedId).trim();
      if (!usedIds.has(normalizedId)) {
        usedIds.add(normalizedId);
        const index = extractImageIndex(normalizedId, prefix);
        if (index !== undefined && index > maxIndex) {
          maxIndex = index;
        }
      }
      resolvedId = normalizedId;
    }

    const resolvedSrc = sanitizeString(clone.src);
    if (!resolvedSrc) {
      throw new Error(`Image entry ${resolvedId} for plant ${plantKey} is missing src`);
    }

    const resolvedDifficulty = sanitizeString(clone.difficulty);

    clone.image_id = resolvedId;
    clone.id = resolvedId;
    clone.src = resolvedSrc;
    if (resolvedDifficulty) {
      clone.difficulty = resolvedDifficulty;
    } else if ('difficulty' in clone) {
      delete clone.difficulty;
    }

    sanitizedImages.push(clone);

    const canonicalImage = { id: resolvedId, src: resolvedSrc };
    if (resolvedDifficulty) {
      canonicalImage.difficulty = resolvedDifficulty;
    }
    canonicalImages.push(canonicalImage);
  });

  return { sanitizedImages, canonicalImages };
}

function toCanonicalPlantEntry(entry, { imageIdKey } = { imageIdKey: 'id' }) {
  if (!entry || typeof entry !== 'object') {
    return undefined;
  }

  const id = normalizePlantIdValue(entry.id);
  const names = sanitizeNames(entry.names);
  const difficulty = sanitizeString(entry.difficulty);
  const wrongAnswers = sanitizeWrongAnswers(entry.wrongAnswers);

  const imagesSource = Array.isArray(entry.images) ? entry.images : [];
  const images = [];
  imagesSource.forEach((image) => {
    if (!image || typeof image !== 'object') {
      return;
    }
    const candidateId = sanitizeString(image[imageIdKey] ?? image.id ?? image.image_id);
    const candidateSrc = sanitizeString(image.src);
    if (!candidateId || !candidateSrc) {
      return;
    }
    const candidateDifficulty = sanitizeString(image.difficulty);
    const canonicalImage = { id: candidateId, src: candidateSrc };
    if (candidateDifficulty) {
      canonicalImage.difficulty = candidateDifficulty;
    }
    images.push(canonicalImage);
  });

  const canonical = { id };
  if (names) {
    canonical.names = names;
  }
  if (difficulty) {
    canonical.difficulty = difficulty;
  }
  if (wrongAnswers.length > 0) {
    canonical.wrongAnswers = wrongAnswers;
  }
  if (images.length > 0) {
    canonical.images = images;
  }
  return canonical;
}

function buildPlantDataEntry(canonicalEntry) {
  if (!canonicalEntry) {
    return undefined;
  }
  const result = { id: canonicalEntry.id };
  if (canonicalEntry.names) {
    result.names = canonicalEntry.names;
  }
  if (canonicalEntry.difficulty) {
    result.difficulty = canonicalEntry.difficulty;
  }
  if (canonicalEntry.wrongAnswers) {
    result.wrongAnswers = canonicalEntry.wrongAnswers;
  }
  if (canonicalEntry.images) {
    result.images = canonicalEntry.images.map((image) => {
      const mapped = { id: image.id, src: image.src };
      if (image.difficulty) {
        mapped.difficulty = image.difficulty;
      }
      return mapped;
    });
  }
  return result;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }
  return false;
}

function validateRawHasPlantData(plantId, plantEntry, rawEntry) {
  if (!plantEntry || !rawEntry) {
    return;
  }

  if (plantEntry.names) {
    const rawNames = extractNamesFromRawEntry(rawEntry);
    if (!rawNames) {
      throw new Error(`Plant ${plantId} is missing the names block in rawPlantData.json`);
    }
    Object.entries(plantEntry.names).forEach(([language, value]) => {
      if (hasMeaningfulValue(value) && !hasMeaningfulValue(rawNames[language])) {
        throw new Error(`Plant ${plantId} is missing a value for names.${language} in rawPlantData.json`);
      }
    });
  }

}

function arePlantEntriesEqual(left, right) {
  if (!left && !right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  if (normalizePlantIdValue(left.id) !== normalizePlantIdValue(right.id)) {
    return false;
  }

  const compareObjects = (a, b) => {
    const aKeys = Object.keys(a || {});
    const bKeys = Object.keys(b || {});
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    return aKeys.every((key) => a[key] === b[key]);
  };

  if (!compareObjects(left.names, right.names)) {
    return false;
  }
  if ((left.difficulty || undefined) !== (right.difficulty || undefined)) {
    return false;
  }

  const leftWrong = Array.isArray(left.wrongAnswers) ? left.wrongAnswers.map((value) => String(value)) : [];
  const rightWrong = Array.isArray(right.wrongAnswers) ? right.wrongAnswers.map((value) => String(value)) : [];
  if (leftWrong.length !== rightWrong.length) {
    return false;
  }
  for (let index = 0; index < leftWrong.length; index += 1) {
    if (leftWrong[index] !== rightWrong[index]) {
      return false;
    }
  }

  const leftImages = Array.isArray(left.images) ? left.images : [];
  const rightImages = Array.isArray(right.images) ? right.images : [];
  if (leftImages.length !== rightImages.length) {
    return false;
  }
  for (let index = 0; index < leftImages.length; index += 1) {
    const leftImage = leftImages[index];
    const rightImage = rightImages[index];
    if (!leftImage || !rightImage) {
      return false;
    }
    if (leftImage.id !== rightImage.id || leftImage.src !== rightImage.src || (leftImage.difficulty || undefined) !== (rightImage.difficulty || undefined)) {
      return false;
    }
  }
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const [plantSource, rawSource] = await Promise.all([
    loadJson(options.plantPath, 'plantData.json'),
    loadJson(options.rawPath, 'rawPlantData.json')
  ]);

  const plantData = plantSource.data;
  const rawData = rawSource.data;

  if (!plantData || typeof plantData !== 'object' || !plantData.plants || typeof plantData.plants !== 'object') {
    throw new Error('plantData.json must contain a "plants" object');
  }
  const rawPlantSource = resolveRawPlantSource(rawData, rawSource.text);
  const rawPlantEntries = rawPlantSource.entries;
  const rawPlantSourceType = rawPlantSource.sourceType;

  const processedRawPlants = new Map();
  const canonicalRawEntries = new Map();

  rawPlantEntries.forEach(([plantKey, rawEntry]) => {
    const normalizedId = normalizePlantIdValue(plantKey);
    const existingPlantDataEntry = plantData.plants[plantKey];
    const existingImages = Array.isArray(existingPlantDataEntry?.images) ? existingPlantDataEntry.images : [];
    const legacyImages = normalizeLegacyImages(rawEntry);
    const { sanitizedImages, canonicalImages } = sanitizeImages(legacyImages, plantKey, existingImages);

    const names = extractNamesFromRawEntry(rawEntry);
    const difficulty = sanitizeString(rawEntry.difficulty);
    const wrongAnswers = extractWrongAnswersFromRawEntry(rawEntry);

    const canonicalEntry = {
      id: normalizedId
    };
    if (names) {
      canonicalEntry.names = names;
    }
    if (difficulty) {
      canonicalEntry.difficulty = difficulty;
    }
    if (wrongAnswers.length > 0) {
      canonicalEntry.wrongAnswers = wrongAnswers;
    }
    if (canonicalImages.length > 0) {
      canonicalEntry.images = canonicalImages;
    }

    canonicalRawEntries.set(plantKey, canonicalEntry);

    const sanitizedRawEntry = { ...rawEntry };
    sanitizedRawEntry.id = normalizedId;
    if (names) {
      sanitizedRawEntry.names = { ...names };
      Object.entries(names).forEach(([language, value]) => {
        if (language in sanitizedRawEntry) {
          sanitizedRawEntry[language] = value;
        }
        const legacyKey = `(${language})`;
        if (legacyKey in sanitizedRawEntry) {
          sanitizedRawEntry[legacyKey] = value;
        }
      });
    } else {
      delete sanitizedRawEntry.names;
    }
    if (difficulty) {
      sanitizedRawEntry.difficulty = difficulty;
    } else {
      delete sanitizedRawEntry.difficulty;
    }
    sanitizedRawEntry.wrongAnswers = wrongAnswers;
    const wrongAnswersString = wrongAnswers.map((value) => String(value)).join(', ');
    if ('wrong_answers' in sanitizedRawEntry || wrongAnswersString) {
      sanitizedRawEntry.wrong_answers = wrongAnswersString;
    }

    const imageIdList = sanitizedImages.map((image) => image.id).filter((id) => Boolean(id));

    if (imageIdList.length > 0) {
      sanitizedRawEntry.image_id = imageIdList.join(', ');
    } else if ('image_id' in sanitizedRawEntry) {
      delete sanitizedRawEntry.image_id;
    }

    const difficultyOverrides = sanitizedImages
      .filter((image) => sanitizeString(image.difficulty) && sanitizeString(image.difficulty) !== difficulty)
      .map((image) => `${image.id}:${sanitizeString(image.difficulty)}`);
    if (difficultyOverrides.length > 0) {
      sanitizedRawEntry.difficulty_modificator = difficultyOverrides.join(', ');
    } else if ('difficulty_modificator' in sanitizedRawEntry) {
      sanitizedRawEntry.difficulty_modificator = '';
    }

    sanitizedRawEntry.images = sanitizedImages;
    sanitizedRawEntry.number_of_images = sanitizedImages.length;

    processedRawPlants.set(plantKey, sanitizedRawEntry);
  });

  const canonicalPlantEntries = new Map();
  Object.entries(plantData.plants).forEach(([plantKey, entry]) => {
    const canonicalKey = String(normalizePlantIdValue(plantKey));
    canonicalPlantEntries.set(canonicalKey, toCanonicalPlantEntry(entry, { imageIdKey: 'id' }));
  });

  const updates = [];
  const additions = [];
  const removals = [];
  const removedImageEntries = [];
  const plantDataOutput = { ...plantData.plants };

  canonicalPlantEntries.forEach((plantEntry, plantKey) => {
    const rawEntry = canonicalRawEntries.get(plantKey);
    validateRawHasPlantData(plantKey, plantEntry, rawEntry);
    if (!rawEntry) {
      removals.push(plantKey);
      delete plantDataOutput[plantKey];
      return;
    }

    const plantImages = Array.isArray(plantEntry?.images) ? plantEntry.images : [];
    if (plantImages.length > 0) {
      const rawImages = Array.isArray(rawEntry.images) ? rawEntry.images : [];
      const rawImageIdSet = new Set(rawImages.map((image) => image?.id).filter((id) => Boolean(id)));
      const removedIds = plantImages
        .map((image) => image?.id)
        .filter((id) => Boolean(id) && !rawImageIdSet.has(id));
      if (removedIds.length > 0) {
        removedImageEntries.push([plantKey, removedIds]);
      }
    }

    if (!arePlantEntriesEqual(plantEntry, rawEntry)) {
      plantDataOutput[plantKey] = buildPlantDataEntry(rawEntry);
      updates.push(plantKey);
    }
  });

  canonicalRawEntries.forEach((rawEntry, plantKey) => {
    if (!canonicalPlantEntries.has(plantKey)) {
      const plantDataEntry = buildPlantDataEntry(rawEntry);
      if (!plantDataEntry) {
        throw new Error(`Plant ${plantKey} in rawPlantData.json is missing required fields`);
      }
      if (!plantDataEntry.names || Object.keys(plantDataEntry.names).length === 0) {
        throw new Error(`Plant ${plantKey} in rawPlantData.json must provide localized names before it can be added`);
      }
      plantDataOutput[plantKey] = plantDataEntry;
      additions.push(plantKey);
    }
  });

  const removedMissingRawPlants = removals.sort(comparePlantIds);

  const sortedPlantKeys = Object.keys(plantDataOutput).sort(comparePlantIds);
  const sortedPlants = {};
  sortedPlantKeys.forEach((key) => {
    sortedPlants[key] = plantDataOutput[key];
  });

  const sortedRawKeys = Array.from(processedRawPlants.keys()).sort(comparePlantIds);
  let sortedRawPlants;
  if (rawPlantSourceType === 'array') {
    sortedRawPlants = sortedRawKeys.map((key) => processedRawPlants.get(key));
  } else {
    sortedRawPlants = {};
    sortedRawKeys.forEach((key) => {
      sortedRawPlants[key] = processedRawPlants.get(key);
    });
  }

  const serializedPlantData = JSON.stringify({
    ...plantData,
    plants: sortedPlants
  }, null, 2) + '\n';
  const serializedRawData = rawPlantSource.serialize(sortedRawPlants);

  const plantDataChanged = serializedPlantData !== JSON.stringify(plantData, null, 2) + '\n';
  const rawDataChanged = serializedRawData !== rawPlantSource.baseline;

  if (options.dryRun) {
    if (!plantDataChanged && !rawDataChanged) {
      console.log('No changes detected.');
    } else {
      if (updates.length > 0) {
        console.log(`Would update ${updates.length} plant entries: ${updates.join(', ')}`);
      }
      if (additions.length > 0) {
        console.log(`Would add ${additions.length} new plant entries: ${additions.join(', ')}`);
      }
      if (removedMissingRawPlants.length > 0) {
        console.log(`Would remove ${removedMissingRawPlants.length} plant entries missing from raw data: ${removedMissingRawPlants.join(', ')}`);
      }
      if (removedImageEntries.length > 0) {
        const removedSummary = removedImageEntries
          .map(([plantKey, imageIds]) => (imageIds.length > 0
            ? `${plantKey} (removed: ${imageIds.join(', ')})`
            : plantKey))
          .join(', ');
        console.log(`Would remove images from ${removedImageEntries.length} plant entries: ${removedSummary}`);
      }
      if (rawDataChanged) {
        console.log('Would rewrite rawPlantData.json with normalized image metadata.');
      }
    }
    return;
  }

  const writeTasks = [];
  if (plantDataChanged) {
    writeTasks.push(writeFile(options.plantPath, serializedPlantData));
  }
  if (rawDataChanged) {
    writeTasks.push(writeFile(options.rawPath, serializedRawData));
  }
  await Promise.all(writeTasks);

  if (additions.length === 0 && updates.length === 0 && !rawDataChanged && !plantDataChanged) {
    console.log('No changes detected.');
  } else {
    if (updates.length > 0) {
      console.log(`Updated ${updates.length} plant entries: ${updates.join(', ')}`);
    }
    if (additions.length > 0) {
      console.log(`Added ${additions.length} plant entries: ${additions.join(', ')}`);
    }
    if (removedMissingRawPlants.length > 0) {
      console.log(`Removed ${removedMissingRawPlants.length} plant entries missing from raw data: ${removedMissingRawPlants.join(', ')}`);
    }
    if (removedImageEntries.length > 0) {
      const removedSummary = removedImageEntries
        .map(([plantKey, imageIds]) => (imageIds.length > 0
          ? `${plantKey} (removed: ${imageIds.join(', ')})`
          : plantKey))
        .join(', ');
      console.log(`Removed images from ${removedImageEntries.length} plant entries: ${removedSummary}`);
    }
    if (rawDataChanged) {
      console.log('rawPlantData.json synchronized (image ids and counters).');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
