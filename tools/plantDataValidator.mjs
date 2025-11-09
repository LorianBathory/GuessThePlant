#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGameDataForTesting, deriveNormalizedPlantData } from '../src/game/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_PLANT_DATA_PATH = resolve(REPO_ROOT, 'src', 'data', 'json', 'plantData.json');

const LEGACY_FIELD_ALIASES = new Map([
  ['id ', 'id'],
  ['id', 'id'],
  ['plantid', 'id'],
  ['(ru)', 'ru'],
  ['ru', 'ru'],
  ['(en)', 'en'],
  ['en', 'en'],
  ['(nl)', 'nl'],
  ['nl', 'nl'],
  ['(sci)', 'sci'],
  ['sci', 'sci'],
  ['scientificname', 'sci'],
  ['number_of_images', 'imageCount'],
  ['image_count', 'imageCount'],
  ['imagecount', 'imageCount'],
  ['количество изображений', 'imageCount'],
  ['images', 'imageFiles'],
  ['imagefiles', 'imageFiles'],
  ['названия файлов', 'imageFiles'],
  ['image_id', 'imageIds'],
  ['imageid', 'imageIds'],
  ['id изображений', 'imageIds'],
  ['idизображений', 'imageIds'],
  ['imageids', 'imageIds'],
  ['wronganswers', 'wrongAnswers'],
  ['wrong answers', 'wrongAnswers'],
  ['wrong_answers', 'wrongAnswers'],
  ['сложность', 'difficulty'],
  ['difficulty', 'difficulty'],
  ['difficulty_modificator', 'difficultyOverrides'],
  ['переопределения сложности', 'difficultyOverrides'],
  ['difficulty overrides', 'difficultyOverrides'],
  ['difficultyoverrides', 'difficultyOverrides'],
  ['extra', 'extra']
]);

const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

const DIFFICULTY_LABEL_ORDER = Object.values(DIFFICULTY_LEVELS);

const DIFFICULTY_NORMALIZATION_MAP = new Map(
  Object.entries(DIFFICULTY_LEVELS).flatMap(([key, label]) => [
    [key.toLowerCase(), label],
    [label.toLowerCase(), label]
  ])
);

function stripWrappingQuotes(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let trimmed = String(value).trim();

  const startsWithQuote = (text) => text.startsWith('"') || text.startsWith("'");
  const endsWithQuote = (text) => text.endsWith('"') || text.endsWith("'");

  while (trimmed.length > 1 && startsWithQuote(trimmed) && endsWithQuote(trimmed)) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (startsWithQuote(trimmed)) {
    trimmed = trimmed.slice(1).trim();
  }

  if (endsWithQuote(trimmed)) {
    trimmed = trimmed.slice(0, -1).trim();
  }

  return trimmed;
}

function toTrimmedString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function normalizeId(id) {
  return stripWrappingQuotes(id);
}

function isNumericId(id) {
  return /^\d+$/.test(id);
}

function parsePlantId(id) {
  const normalized = normalizeId(id);
  const [head, ...rawSuffixParts] = normalized.split('_');
  const hasNumericHead = isNumericId(head);
  const suffixParts = rawSuffixParts.map((part) => ({
    type: isNumericId(part) ? 'number' : 'string',
    value: isNumericId(part) ? Number(part) : part
  }));

  return {
    normalized,
    head,
    hasNumericHead,
    numericHead: hasNumericHead ? Number(head) : null,
    suffixParts
  };
}

function compareSuffixParts(aParts, bParts) {
  const maxLength = Math.max(aParts.length, bParts.length);
  for (let index = 0; index < maxLength; index += 1) {
    const aPart = aParts[index];
    const bPart = bParts[index];

    if (!aPart) {
      return -1;
    }
    if (!bPart) {
      return 1;
    }

    if (aPart.type === bPart.type) {
      if (aPart.value < bPart.value) return -1;
      if (aPart.value > bPart.value) return 1;
    } else if (aPart.type === 'number') {
      return -1;
    } else if (bPart.type === 'number') {
      return 1;
    }
  }
  return 0;
}

function comparePlantIds(a, b) {
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

  if (aParsed.hasNumericHead) return -1;
  if (bParsed.hasNumericHead) return 1;

  return aParsed.normalized.localeCompare(bParsed.normalized, 'en');
}

function hasVariantSuffix(plantId) {
  return plantId.includes('_');
}

function buildImageIdPrefix(plantId) {
  const normalizedId = normalizeId(plantId);
  if (!normalizedId) {
    throw new Error('Невозможно сгенерировать imageId без plantId.');
  }
  const suffix = hasVariantSuffix(normalizedId) ? normalizedId : `${normalizedId}_0`;
  return `p${suffix}`;
}

function generateImageId(plantId, index) {
  const prefix = buildImageIdPrefix(plantId);
  return `${prefix}_${index + 1}`;
}

function normalizeDifficultyLabel(value, { fieldName } = {}) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = stripWrappingQuotes(value);
  if (!trimmed || trimmed.toLowerCase() === 'null') {
    return null;
  }

  const normalized = DIFFICULTY_NORMALIZATION_MAP.get(trimmed.toLowerCase());
  if (normalized) {
    return normalized;
  }

  const suffix = fieldName ? ` (${fieldName})` : '';
  throw new Error(
    `Неизвестное значение сложности "${trimmed}"${suffix}. Допустимые значения: ${DIFFICULTY_LABEL_ORDER.join(', ')}.`
  );
}

function ensureArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function extractList(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => stripWrappingQuotes(item))
      .filter((item) => item !== '');
  }

  const text = stripWrappingQuotes(rawValue);
  if (!text) {
    return [];
  }

  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => stripWrappingQuotes(item))
          .filter((item) => item !== '');
      }
    } catch (error) {
      // fall through to comma-separated parsing
    }
  }

  return text
    .split(',')
    .map((segment) => stripWrappingQuotes(segment))
    .filter((segment) => segment !== '');
}

function normalizeWrongAnswerId(id) {
  const normalized = normalizeId(id);
  if (!normalized) {
    return null;
  }
  return isNumericId(normalized) ? Number(normalized) : normalized;
}

function parseOverrides(rawOverrides, { entryLabel } = {}) {
  const overrides = new Map();
  const source = stripWrappingQuotes(rawOverrides);
  if (!source) {
    return overrides;
  }

  const segments = ensureArray(
    Array.isArray(rawOverrides)
      ? rawOverrides
      : source.split(',')
  );

  segments
    .map((segment) => stripWrappingQuotes(segment))
    .filter((segment) => segment !== '')
    .forEach((segment) => {
      const [imageIdPart, difficultyPart] = segment.split(':').map((piece) => stripWrappingQuotes(piece));
      if (!imageIdPart || !difficultyPart) {
        return;
      }
      const normalizedDifficulty = normalizeDifficultyLabel(difficultyPart, {
        fieldName: `переопределение сложности для ${imageIdPart}${entryLabel ? ` (${entryLabel})` : ''}`
      });
      overrides.set(imageIdPart, normalizedDifficulty);
    });

  return overrides;
}

function parseDifficultyCell(baseCell, overridesCell, { entryLabel } = {}) {
  const rawBase = stripWrappingQuotes(baseCell);
  const overridesSource = stripWrappingQuotes(overridesCell);

  if (!overridesSource) {
    const legacyMatch = rawBase.match(/^(.*?)(?:\s*\(overrides:\s*(.+)\))$/i);
    if (legacyMatch) {
      const base = legacyMatch[1].trim();
      const overrides = parseOverrides(legacyMatch[2], { entryLabel });
      return {
        base: normalizeDifficultyLabel(base, {
          fieldName: entryLabel ? `базовая сложность для ${entryLabel}` : 'базовая сложность'
        }),
        overrides
      };
    }
  }

  const base = rawBase
    ? normalizeDifficultyLabel(rawBase, {
      fieldName: entryLabel ? `базовая сложность для ${entryLabel}` : 'базовая сложность'
    })
    : null;
  const overrides = parseOverrides(overridesSource, { entryLabel });

  return { base, overrides };
}

function compareDifficultyLabels(a, b) {
  const indexA = DIFFICULTY_LABEL_ORDER.indexOf(a);
  const indexB = DIFFICULTY_LABEL_ORDER.indexOf(b);

  if (indexA === -1 && indexB === -1) {
    return a.localeCompare(b, 'en');
  }

  if (indexA === -1) {
    return 1;
  }

  if (indexB === -1) {
    return -1;
  }

  return indexA - indexB;
}

function incrementDifficultyCounter(counterMap, difficulty) {
  if (!difficulty) {
    return;
  }
  counterMap.set(difficulty, (counterMap.get(difficulty) ?? 0) + 1);
}

function formatError(error) {
  if (error && error.stack) {
    return error.stack;
  }
  if (error && error.message) {
    return error.message;
  }
  return String(error);
}

function normalizeLocalizedNames(names) {
  const source = names && typeof names === 'object' ? names : {};
  const normalized = {};
  const preferredKeys = ['ru', 'en', 'nl', 'sci'];

  preferredKeys.forEach((key) => {
    const value = stripWrappingQuotes(source[key]);
    if (value) {
      normalized[key] = value;
    }
  });

  Object.keys(source)
    .filter((key) => !preferredKeys.includes(key))
    .sort()
    .forEach((key) => {
      const value = stripWrappingQuotes(source[key]);
      if (value) {
        normalized[key] = value;
      }
    });

  return normalized;
}

function normalizeWrongAnswers(rawWrongAnswers) {
  if (!rawWrongAnswers) {
    return [];
  }

  const sourceArray = Array.isArray(rawWrongAnswers)
    ? rawWrongAnswers
    : String(rawWrongAnswers)
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value !== '');

  const wrongAnswers = [];
  const seenWrongAnswers = new Set();
  sourceArray.forEach((value) => {
    const normalizedValue = normalizeWrongAnswerId(value);
    if (normalizedValue === null) {
      return;
    }
    const key = typeof normalizedValue === 'number' ? String(normalizedValue) : normalizedValue;
    if (seenWrongAnswers.has(key)) {
      return;
    }
    seenWrongAnswers.add(key);
    wrongAnswers.push(normalizedValue);
  });

  return wrongAnswers;
}

function resolveImageSource(rawSource, fallbackId) {
  let normalizedSource = stripWrappingQuotes(rawSource);
  if (normalizedSource) {
    if (normalizedSource.startsWith('./')) {
      normalizedSource = normalizedSource.slice(2);
    }
    if (normalizedSource.startsWith('/')) {
      normalizedSource = normalizedSource.slice(1);
    }
    if (!normalizedSource.startsWith('images/')) {
      normalizedSource = `images/${normalizedSource}`;
    }
    return normalizedSource;
  }

  if (!fallbackId) {
    return null;
  }

  return `images/${fallbackId}.JPG`;
}

function normalizePlantEntry(plantIdKey, plantEntry, context) {
  if (!plantEntry || typeof plantEntry !== 'object') {
    throw new Error(`Запись растения ${plantIdKey} должна быть объектом.`);
  }

  const normalizedPlantId = normalizeId(plantEntry.id ?? plantIdKey);
  if (!normalizedPlantId) {
    throw new Error(`Не указан идентификатор растения (ключ ${plantIdKey}).`);
  }

  const plantKey = String(normalizedPlantId);
  const idValue = isNumericId(normalizedPlantId) ? Number(normalizedPlantId) : normalizedPlantId;

  const localizedNames = normalizeLocalizedNames(plantEntry.names);
  const baseDifficulty = plantEntry.difficulty
    ? normalizeDifficultyLabel(plantEntry.difficulty, {
      fieldName: `базовая сложность для ${plantKey}`
    })
    : null;

  const wrongAnswers = normalizeWrongAnswers(plantEntry.wrongAnswers);

  const normalizedImages = [];
  const seenPlantImageIds = new Set();
  const rawImageEntries = Array.isArray(plantEntry.images) ? plantEntry.images : [];

  rawImageEntries.forEach((rawImageEntry, index) => {
    if (rawImageEntry === null || rawImageEntry === undefined) {
      return;
    }

    let normalizedImageId = '';
    let rawSource = '';
    let explicitDifficulty = null;

    if (typeof rawImageEntry === 'string') {
      rawSource = rawImageEntry;
    } else if (typeof rawImageEntry === 'object') {
      normalizedImageId = normalizeId(rawImageEntry.id ?? rawImageEntry.imageId ?? '');
      rawSource = rawImageEntry.src ?? rawImageEntry.image ?? rawImageEntry.file ?? rawImageEntry.fileName ?? '';
      if (rawImageEntry.difficulty !== undefined && rawImageEntry.difficulty !== null) {
        explicitDifficulty = normalizeDifficultyLabel(rawImageEntry.difficulty, {
          fieldName: `сложность изображения ${normalizedImageId || `${plantKey}[${index + 1}]`}`
        });
      }
    } else {
      return;
    }

    if (!normalizedImageId) {
      normalizedImageId = generateImageId(plantKey, normalizedImages.length);
    }

    if (seenPlantImageIds.has(normalizedImageId)) {
      throw new Error(`Растение ${plantKey} содержит повторяющийся imageId ${normalizedImageId}.`);
    }

    const resolvedSource = resolveImageSource(rawSource, normalizedImageId);
    if (!resolvedSource) {
      throw new Error(`Не удалось определить путь к изображению для ${normalizedImageId} (${plantKey}).`);
    }

    const existingImage = context.seenImageIds.get(normalizedImageId);
    if (existingImage && existingImage.src !== resolvedSource) {
      throw new Error(`imageId ${normalizedImageId} уже используется другим растением с другим файлом (обнаружено в ${plantKey}).`);
    }

    seenPlantImageIds.add(normalizedImageId);
    if (!existingImage) {
      context.seenImageIds.set(normalizedImageId, { plantKey, src: resolvedSource });
    }

    const resolvedDifficulty = explicitDifficulty || baseDifficulty;
    if (resolvedDifficulty) {
      incrementDifficultyCounter(context.difficultyCounts, resolvedDifficulty);
    }

    const normalizedImageEntry = {
      id: normalizedImageId,
      src: resolvedSource,
      ...(resolvedDifficulty ? { difficulty: resolvedDifficulty } : {})
    };

    normalizedImages.push(normalizedImageEntry);
    context.totalImages += 1;
  });

  normalizedImages.sort((a, b) => a.id.localeCompare(b.id, 'en'));

  const normalizedEntry = {
    id: idValue,
    names: localizedNames
  };

  if (baseDifficulty) {
    normalizedEntry.difficulty = baseDifficulty;
  }

  if (wrongAnswers.length > 0) {
    normalizedEntry.wrongAnswers = wrongAnswers;
  }

  if (normalizedImages.length > 0) {
    normalizedEntry.images = normalizedImages;
  }

  return { key: plantKey, entry: normalizedEntry };
}

function normalizeDifficultyLevels(levels) {
  const normalized = { ...DIFFICULTY_LEVELS };
  if (levels && typeof levels === 'object') {
    Object.entries(levels).forEach(([key, value]) => {
      if (DIFFICULTY_LEVELS[key] && typeof value === 'string' && value.trim()) {
        normalized[key] = value.trim();
      }
    });
  }
  return normalized;
}

function formatDifficultyCounts(counterMap) {
  if (!counterMap || counterMap.size === 0) {
    return {};
  }

  const entries = Array.from(counterMap.entries());
  entries.sort(([difficultyA], [difficultyB]) => compareDifficultyLabels(difficultyA, difficultyB));
  return Object.fromEntries(entries);
}

function extractColumnNamesFromSource(columnsSource) {
  if (!columnsSource) {
    return [];
  }

  if (Array.isArray(columnsSource)) {
    return columnsSource
      .map((column) => {
        if (typeof column === 'string') {
          return toTrimmedString(column);
        }
        if (column && typeof column === 'object') {
          const candidateKeys = ['name', 'column', 'key', 'field', 'title', 'caption', 'label'];
          for (const key of candidateKeys) {
            const value = column[key];
            if (typeof value === 'string' && value.trim()) {
              return value.trim();
            }
          }
        }
        return '';
      })
      .map((name) => toTrimmedString(name))
      .filter((name) => name);
  }

  if (typeof columnsSource === 'object') {
    const nestedCandidates = ['columns', 'names', 'headers', 'fields'];
    for (const key of nestedCandidates) {
      if (Array.isArray(columnsSource[key])) {
        return extractColumnNamesFromSource(columnsSource[key]);
      }
    }
    return [];
  }

  if (typeof columnsSource === 'string') {
    return columnsSource
      .split(',')
      .map((segment) => toTrimmedString(segment))
      .filter((name) => name);
  }

  return [];
}

function extendColumnNames(baseNames, length) {
  const result = [];
  for (let index = 0; index < length; index += 1) {
    const baseName = Array.isArray(baseNames) ? baseNames[index] : undefined;
    const trimmed = toTrimmedString(baseName);
    if (trimmed) {
      result.push(trimmed);
    } else {
      result.push(`column${index + 1}`);
    }
  }
  return result;
}

function convertRowValuesToRecord(values, columnNames) {
  const record = {};
  const limit = Math.max(values.length, columnNames.length);
  for (let index = 0; index < limit; index += 1) {
    const columnName = toTrimmedString(columnNames[index] ?? '');
    if (!columnName) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(record, columnName)) {
      continue;
    }
    record[columnName] = values[index];
  }
  return record;
}

function maybeTreatAsHeader(rowValues, state) {
  if (!Array.isArray(rowValues) || rowValues.length === 0) {
    return false;
  }

  const trimmedValues = rowValues.map((value) => toTrimmedString(value));
  const nonEmpty = trimmedValues.filter((value) => value);
  if (nonEmpty.length === 0) {
    return false;
  }

  const normalizedRow = trimmedValues.map((value) => value.toLowerCase());
  const normalizedKnown = Array.isArray(state.columnNames)
    ? state.columnNames.map((value) => toTrimmedString(value).toLowerCase())
    : [];

  const matchesKnown = normalizedKnown.length > 0
    && normalizedRow.length <= normalizedKnown.length
    && normalizedRow.every((value, index) => {
      const known = normalizedKnown[index];
      return known && value === known;
    });

  if (matchesKnown) {
    state.headerConsumed = true;
    return true;
  }

  if (state.headerConsumed) {
    return false;
  }

  let recognized = 0;
  normalizedRow.forEach((value) => {
    if (value && LEGACY_FIELD_ALIASES.has(value)) {
      recognized += 1;
    }
  });

  if (recognized >= Math.max(1, Math.ceil(nonEmpty.length / 2))) {
    if (!state.columnNames || state.columnNames.length === 0) {
      state.columnNames = trimmedValues;
    }
    state.headerConsumed = true;
    return true;
  }

  return false;
}

function materializeLegacyRow(rawRow, state, index) {
  if (rawRow === null || rawRow === undefined) {
    return null;
  }

  const entryLabel = `строка ${index + 1}`;
  const columnErrorMessage =
    `${entryLabel}: не удалось определить названия колонок в табличном JSON. ` +
    'Добавьте строку заголовка или экспортируйте JSON вместе со списком колонок.';

  if (Array.isArray(rawRow)) {
    if (maybeTreatAsHeader(rawRow, state)) {
      return null;
    }
    if (!state.columnNames || state.columnNames.length === 0) {
      throw new Error(columnErrorMessage);
    }
    const columnNames = extendColumnNames(state.columnNames, rawRow.length);
    return convertRowValuesToRecord(rawRow, columnNames);
  }

  if (typeof rawRow === 'object') {
    const nestedObjectKeys = ['row', 'record', 'data'];
    for (const key of nestedObjectKeys) {
      const nested = rawRow[key];
      if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        return materializeLegacyRow(nested, state, index);
      }
    }

    const valueCandidates = [
      { values: rawRow.values, columns: rawRow.columns || rawRow.headers || rawRow.names || rawRow.fields },
      { values: rawRow.row, columns: rawRow.columns || rawRow.headers || rawRow.names || rawRow.fields },
      { values: rawRow.cells, columns: rawRow.columns || rawRow.headers || rawRow.names || rawRow.fields }
    ];

    for (const candidate of valueCandidates) {
      if (Array.isArray(candidate.values)) {
        const columnCandidates = extractColumnNamesFromSource(candidate.columns);
        if (columnCandidates.length > 0) {
          state.columnNames = columnCandidates;
        }
        if (maybeTreatAsHeader(candidate.values, state)) {
          return null;
        }
        if (!state.columnNames || state.columnNames.length === 0) {
          throw new Error(columnErrorMessage);
        }
        const columnNames = extendColumnNames(state.columnNames, candidate.values.length);
        return convertRowValuesToRecord(candidate.values, columnNames);
      }
    }

    return rawRow;
  }

  return null;
}

function normalizeLegacyRecord(rawRecord, index) {
  if (!rawRecord || typeof rawRecord !== 'object') {
    return null;
  }

  const normalized = {};
  Object.entries(rawRecord).forEach(([rawKey, rawValue]) => {
    if (rawKey === null || rawKey === undefined) {
      return;
    }

    const trimmedKey = toTrimmedString(rawKey);
    if (!trimmedKey) {
      return;
    }

    const aliasKey = LEGACY_FIELD_ALIASES.get(trimmedKey.toLowerCase()) || trimmedKey;
    normalized[aliasKey] = rawValue;
  });

  normalized.__entryIndex = index;
  return normalized;
}

function normalizeLegacyRows(rows, options = {}) {
  const state = {
    columnNames: extractColumnNamesFromSource(options.columns),
    headerConsumed: false
  };

  const context = {
    seenImageIds: new Map(),
    difficultyCounts: new Map(),
    totalImages: 0
  };

  const plants = new Map();
  const plantSources = new Map();

  let materializedCount = 0;

  rows.forEach((rawRow, index) => {
    const materialized = materializeLegacyRow(rawRow, state, index);
    if (!materialized) {
      return;
    }

    const record = normalizeLegacyRecord(materialized, index);
    if (!record) {
      return;
    }

    materializedCount += 1;

    const entryLabel = `запись ${index + 1}`;
    const plantId = normalizeId(record.id ?? record['id '] ?? '');
    if (!plantId) {
      throw new Error(`Не указан идентификатор растения (${entryLabel}).`);
    }

    const plantKey = String(plantId);
    const numericId = isNumericId(plantId) ? Number(plantId) : plantId;

    const localizedNames = {};
    ['ru', 'en', 'nl', 'sci'].forEach((key) => {
      const value = stripWrappingQuotes(record[key]);
      if (value) {
        localizedNames[key] = value;
      }
    });

    const { base: baseDifficulty, overrides } = parseDifficultyCell(
      record.difficulty || '',
      record.difficultyOverrides || '',
      { entryLabel: plantKey }
    );

    const wrongAnswersRaw = extractList(record.wrongAnswers || '');
    const wrongAnswers = [];
    const seenWrongAnswers = new Set();
    wrongAnswersRaw.forEach((value) => {
      const normalizedValue = normalizeWrongAnswerId(value);
      if (normalizedValue === null) {
        return;
      }
      const key = typeof normalizedValue === 'number' ? String(normalizedValue) : normalizedValue;
      if (seenWrongAnswers.has(key)) {
        return;
      }
      seenWrongAnswers.add(key);
      wrongAnswers.push(normalizedValue);
    });

    const imageFiles = extractList(record.imageFiles || '');
    const manualImageIds = extractList(record.imageIds || '');
    const normalizedManualImageIds = manualImageIds
      .map((manualId) => normalizeId(manualId))
      .filter((manualId) => manualId);

    if (imageFiles.length > 0 && normalizedManualImageIds.length > 0 && normalizedManualImageIds.length !== imageFiles.length) {
      throw new Error(`Количество imageId и файлов не совпадает (${entryLabel}).`);
    }

    const useManualIds = normalizedManualImageIds.length > 0;
    const autoImageIds = useManualIds
      ? []
      : imageFiles.map((_, imageIndex) => generateImageId(plantKey, imageIndex));
    const finalImageIds = useManualIds ? normalizedManualImageIds : autoImageIds;

    const legacyImageIdMap = new Map();
    if (!useManualIds) {
      normalizedManualImageIds.forEach((manualId, manualIndex) => {
        const autoId = autoImageIds[manualIndex];
        if (manualId && autoId && manualId !== autoId) {
          legacyImageIdMap.set(manualId, autoId);
        }
      });
    }

    const normalizedOverrides = new Map();
    overrides.forEach((difficulty, imageId) => {
      const normalizedId = normalizeId(imageId);
      const autoId = legacyImageIdMap.get(normalizedId) || normalizedId;
      if (autoId) {
        normalizedOverrides.set(autoId, difficulty);
      }
    });

    const normalizedImages = [];
    const seenPlantImageIds = new Set();

    finalImageIds.forEach((imageId, imageIndex) => {
      const normalizedImageId = normalizeId(imageId);
      if (!normalizedImageId) {
        return;
      }

      if (seenPlantImageIds.has(normalizedImageId)) {
        throw new Error(`Растение ${plantKey} содержит повторяющийся imageId ${normalizedImageId}.`);
      }

      if (context.seenImageIds.has(normalizedImageId)) {
        const previous = context.seenImageIds.get(normalizedImageId);
        throw new Error(
          `imageId ${normalizedImageId} уже используется растением ${previous.plantKey} (${entryLabel}).`
        );
      }

      const imageFile = imageFiles[imageIndex] || '';
      const resolvedSource = resolveImageSource(imageFile, normalizedImageId);

      context.seenImageIds.set(normalizedImageId, { plantKey, src: resolvedSource });
      seenPlantImageIds.add(normalizedImageId);

      const resolvedDifficulty = normalizedOverrides.get(normalizedImageId) || baseDifficulty;
      if (resolvedDifficulty) {
        incrementDifficultyCounter(context.difficultyCounts, resolvedDifficulty);
      }

      const imageEntry = {
        id: normalizedImageId,
        src: resolvedSource,
        ...(resolvedDifficulty ? { difficulty: resolvedDifficulty } : {})
      };

      normalizedImages.push(imageEntry);
      context.totalImages += 1;
    });

    const normalizedEntry = {
      id: numericId,
      names: localizedNames
    };

    if (baseDifficulty) {
      normalizedEntry.difficulty = baseDifficulty;
    }

    if (wrongAnswers.length > 0) {
      normalizedEntry.wrongAnswers = wrongAnswers;
    }

    if (normalizedImages.length > 0) {
      normalizedEntry.images = normalizedImages.sort((a, b) => a.id.localeCompare(b.id, 'en'));
    }

    if (plantSources.has(plantKey)) {
      const previousLabel = plantSources.get(plantKey);
      throw new Error(
        `Обнаружены дублирующиеся записи растения ${plantKey} (${previousLabel} и ${entryLabel}).`
      );
    }

    plants.set(plantKey, normalizedEntry);
    plantSources.set(plantKey, entryLabel);
  });

  if (rows.length > 0 && materializedCount === 0) {
    throw new Error(
      'Не удалось распознать строки табличного JSON. Проверьте, что экспорт содержит данные PlantData.'
    );
  }

  const sortedPlants = Array.from(plants.entries()).sort(([a], [b]) => comparePlantIds(a, b));

  return {
    data: {
      difficultyLevels: { ...DIFFICULTY_LEVELS },
      plants: Object.fromEntries(sortedPlants)
    },
    stats: {
      plantCount: sortedPlants.length,
      imageCount: context.totalImages,
      difficultyCounts: formatDifficultyCounts(context.difficultyCounts)
    }
  };
}

function normalizePlantDataStructure(plantData) {
  if (Array.isArray(plantData)) {
    return normalizeLegacyRows(plantData);
  }

  if (!plantData || typeof plantData !== 'object') {
    throw new Error('Ожидается объект JSON с описанием каталога растений.');
  }

  const possibleRows = plantData.rows || plantData.data || plantData.records;
  if (Array.isArray(possibleRows)) {
    const columnSource =
      plantData.columns
      || plantData.cols
      || plantData.header
      || plantData.headers
      || plantData.fields
      || (plantData.meta && (plantData.meta.columns || plantData.meta.headers || plantData.meta.fields));
    return normalizeLegacyRows(possibleRows, { columns: columnSource });
  }

  const plantsSource = plantData.plants && typeof plantData.plants === 'object'
    ? plantData.plants
    : {};

  const context = {
    seenImageIds: new Map(),
    difficultyCounts: new Map(),
    totalImages: 0
  };

  const normalizedPlants = new Map();
  const normalizedPlantOrigins = new Map();
  const plantIds = Object.keys(plantsSource);
  plantIds.sort(comparePlantIds);

  plantIds.forEach((plantIdKey) => {
    const normalized = normalizePlantEntry(plantIdKey, plantsSource[plantIdKey], context);
    const previousOrigin = normalizedPlantOrigins.get(normalized.key);
    if (previousOrigin) {
      throw new Error(
        `Идентификатор растения ${normalized.key} конфликтует между ключами ${previousOrigin} и ${plantIdKey}.`
      );
    }

    normalizedPlants.set(normalized.key, normalized.entry);
    normalizedPlantOrigins.set(normalized.key, plantIdKey);
  });

  const sortedPlants = Array.from(normalizedPlants.entries()).sort(([a], [b]) => comparePlantIds(a, b));

  const normalizedData = {
    difficultyLevels: normalizeDifficultyLevels(plantData.difficultyLevels),
    plants: Object.fromEntries(sortedPlants)
  };

  return {
    data: normalizedData,
    stats: {
      plantCount: sortedPlants.length,
      imageCount: context.totalImages,
      difficultyCounts: formatDifficultyCounts(context.difficultyCounts)
    }
  };
}

function validateAgainstGameLoader(plantData) {
  const normalizedCatalog = deriveNormalizedPlantData(plantData);
  const normalizedImages = Array.isArray(normalizedCatalog.plantImages) ? normalizedCatalog.plantImages : [];
  const imageIds = new Set(
    normalizedImages
      .map((entry) => normalizeId(entry.id ?? ''))
      .filter((id) => id)
  );

  const normalizedGameData = buildGameDataForTesting({
    plantNames: normalizedCatalog.plantNames || {},
    speciesEntries: normalizedCatalog.species || {},
    plantImages: normalizedImages,
    difficulties: normalizedCatalog.difficulties || {},
    bouquetQuestions: []
  });

  const questions = Array.isArray(normalizedGameData.plants) ? normalizedGameData.plants : [];
  const missingImageIds = new Set();
  questions.forEach((question) => {
    const imageId = normalizeId(question.imageId || question.id || '');
    if (imageId && !imageIds.has(imageId)) {
      missingImageIds.add(imageId);
    }
  });

  if (missingImageIds.size > 0) {
    throw new Error(
      `Игровой бандл ссылается на imageId, которых нет в plantImages: ${Array.from(missingImageIds).join(', ')}`
    );
  }

  return {
    questionCount: questions.length
  };
}

function printSummary(stats, loaderSummary, { wroteToFile }) {
  const baseSummary = [
    `Проверка завершена: ${stats.plantCount} растений, ${stats.imageCount} изображений, ${loaderSummary.questionCount} вопросов.`
  ];

  if (wroteToFile) {
    baseSummary.push('Нормализованный JSON сохранён.');
  }

  console.log(baseSummary.join(' '));

  const difficultyEntries = Object.entries(stats.difficultyCounts);
  if (difficultyEntries.length > 0) {
    console.log('Распределение по сложностям:');
    difficultyEntries.forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count}`);
    });
  }
}

function printHelp() {
  console.log(
    [
      'Использование: node tools/plantDataValidator.mjs [--input <путь>] [--output <путь>] [--write]',
      '',
      'Без параметров скрипт проверяет и нормализует src/data/json/plantData.json без записи на диск.',
      '--input <путь>  — использовать другой источник данных.',
      '--output <путь> — сохранить нормализованный JSON в отдельный файл.',
      '--write        — перезаписать входной файл нормализованной версией.',
      '--help         — показать эту подсказку.'
    ].join('\n')
  );
}

function parseOptions(argv) {
  const options = {
    write: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--write') {
      options.write = true;
      continue;
    }
    if (arg === '--input') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Параметр --input требует путь к файлу.');
      }
      options.input = value;
      index += 1;
      continue;
    }
    if (arg === '--output') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('Параметр --output требует путь к файлу.');
      }
      options.output = value;
      index += 1;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`Неизвестный параметр ${arg}. Используйте --help для подсказки.`);
    }
    throw new Error(`Неожиданный аргумент ${arg}. Используйте --help для подсказки.`);
  }

  return options;
}

async function run() {
  let options;
  try {
    options = parseOptions(process.argv.slice(2));
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  const inputPath = resolve(process.cwd(), options.input || DEFAULT_PLANT_DATA_PATH);

  let rawText;
  try {
    rawText = await readFile(inputPath, 'utf8');
  } catch (error) {
    console.error(`Не удалось прочитать файл ${inputPath}:`, formatError(error));
    process.exitCode = 1;
    return;
  }

  let plantData;
  try {
    plantData = JSON.parse(rawText);
  } catch (error) {
    console.error(`Файл ${inputPath} не является корректным JSON:`, formatError(error));
    process.exitCode = 1;
    return;
  }

  let normalized;
  try {
    normalized = normalizePlantDataStructure(plantData);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
    return;
  }

  let loaderSummary;
  try {
    loaderSummary = validateAgainstGameLoader(normalized.data);
  } catch (error) {
    console.error(formatError(error));
    process.exitCode = 1;
    return;
  }

  let wroteToFile = false;
  if (options.write || options.output) {
    const targetPath = resolve(process.cwd(), options.output || inputPath);
    try {
      await writeFile(targetPath, `${JSON.stringify(normalized.data, null, 2)}\n`, 'utf8');
      const relativePath = relative(REPO_ROOT, targetPath);
      if (targetPath === inputPath) {
        console.log(`Файл обновлён: ${relativePath}`);
      } else {
        console.log(`Нормализованный JSON сохранён в ${relativePath}`);
      }
      wroteToFile = true;
    } catch (error) {
      console.error(`Не удалось записать файл ${targetPath}:`, formatError(error));
      process.exitCode = 1;
      return;
    }
  }

  printSummary(normalized.stats, loaderSummary, { wroteToFile });
}

run().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
