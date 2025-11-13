#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const DEFAULT_MEMORIZATION_PATH = resolve(REPO_ROOT, 'src', 'data', 'json', 'memorization.json');
const PLANT_DATA_PATH = resolve(REPO_ROOT, 'src', 'data', 'json', 'plantData.json');

const CSV_HEADER = [
  'id',
  'scientificName',
  'family',
  'lifeCycle',
  'hardinessZone',
  'light',
  'toxicity',
  'additionalInfo',
  'imageId'
];

const HEADER_ALIASES = new Map([
  ['id', 'id'],
  ['scientificname', 'scientificName'],
  ['scientific_name', 'scientificName'],
  ['(sci)', 'scientificName'],
  ['family', 'family'],
  ['lifeCycle'.toLowerCase(), 'lifeCycle'],
  ['lifecycle', 'lifeCycle'],
  ['hardinesszone', 'hardinessZone'],
  ['hardiness_zone', 'hardinessZone'],
  ['light', 'light'],
  ['toxicity', 'toxicity'],
  ['additionalinfo', 'additionalInfo'],
  ['additional_info', 'additionalInfo'],
  ['imageid', 'imageId'],
  ['image_id', 'imageId']
]);

function stripBom(text) {
  if (!text) {
    return '';
  }
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function stripWrappingQuotes(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let trimmed = String(value).trim();

  if (trimmed.startsWith('=') && trimmed.length > 2) {
    const potentialQuote = trimmed[1];
    if (potentialQuote === '"' || potentialQuote === "'") {
      const trailingQuoteIndex = trimmed.lastIndexOf(potentialQuote);
      if (trailingQuoteIndex > 1) {
        trimmed = trimmed.slice(2, trailingQuoteIndex).trim();
      }
    }
  }

  if (trimmed.startsWith('=') && trimmed.length > 1) {
    const candidate = trimmed.slice(1).trim();
    if (candidate) {
      trimmed = candidate;
    }
  }

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

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (str === '') {
    return '';
  }
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function stringifyCsvRow(values) {
  return values.map(csvEscape).join(',');
}

function clonePlainObject(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return Object.fromEntries(Object.entries(value));
}

function cloneArray(array) {
  return Array.isArray(array) ? array.slice() : null;
}

function getLookupKeysForPlantId(rawId) {
  const normalized = normalizeId(rawId);
  if (!normalized) {
    return [];
  }

  const keys = new Set([normalized]);
  if (isNumericId(normalized)) {
    keys.add(String(Number(normalized)));
  }
  return Array.from(keys);
}

async function loadPlantCatalog() {
  try {
    const plantDataText = await readFile(PLANT_DATA_PATH, 'utf8');
    const plantData = JSON.parse(plantDataText);
    const plantEntries = plantData && typeof plantData === 'object' ? plantData.plants : null;

    if (!plantEntries || typeof plantEntries !== 'object') {
      return { plantById: new Map(), imageById: new Map(), isEmpty: true };
    }

    const plantById = new Map();
    const imageById = new Map();

    Object.entries(plantEntries).forEach(([rawId, plant]) => {
      const lookupKeys = getLookupKeysForPlantId(rawId);
      if (lookupKeys.length === 0) {
        return;
      }

      const baseKey = lookupKeys[0];
      const plantId = isNumericId(baseKey) ? Number(baseKey) : baseKey;
      const normalizedPlant = plant && typeof plant === 'object' ? { ...plant, id: plantId } : { id: plantId };

      lookupKeys.forEach((key) => {
        plantById.set(key, normalizedPlant);
      });

      const images = Array.isArray(plant?.images) ? plant.images : [];
      images.forEach((image) => {
        if (!image || typeof image.id !== 'string') {
          return;
        }

        const imageId = normalizeId(image.id);
        if (!imageId) {
          return;
        }

        imageById.set(imageId, {
          ...image,
          id: imageId,
          plantLookupKey: baseKey,
          plantId
        });
      });
    });

    return {
      plantById,
      imageById,
      isEmpty: plantById.size === 0
    };
  } catch (error) {
    return { plantById: new Map(), imageById: new Map(), isEmpty: true };
  }
}

function enrichPlantEntry({ baseEntry, plantLookupKey, imageId, record, plantCatalog }) {
  const result = { ...baseEntry };
  delete result.imageId;

  if (!plantCatalog || plantCatalog.isEmpty) {
    if (!result.questionVariantId) {
      result.questionVariantId = `memorization-${plantLookupKey}`;
    }
    if (!result.selectionGroupId) {
      result.selectionGroupId = `memorization-${plantLookupKey}`;
    }
    if (!result.questionType) {
      result.questionType = 'plant';
    }
    if (!result.questionPromptKey) {
      result.questionPromptKey = 'question';
    }
    result.correctAnswerId = baseEntry.id;
    return result;
  }

  const species = plantCatalog.plantById.get(plantLookupKey);
  if (!species) {
    throw new Error(`Не найдено растение с id «${plantLookupKey}» в plantData.json (строка ${record.__line}).`);
  }

  let imageEntry = null;

  if (imageId) {
    imageEntry = plantCatalog.imageById.get(imageId);
    if (!imageEntry) {
      throw new Error(`Изображение с imageId «${imageId}» не найдено в plantData.json (строка ${record.__line}).`);
    }

    const imagePlantKey = normalizeId(imageEntry.plantLookupKey ?? imageEntry.plantId ?? '');
    if (imagePlantKey && imagePlantKey !== plantLookupKey) {
      throw new Error(`Изображение «${imageId}» не относится к растению «${plantLookupKey}» (строка ${record.__line}).`);
    }
  }

  if (!imageEntry) {
    const fallbackImages = Array.isArray(species.images)
      ? species.images
        .map((image) => {
          if (!image) {
            return null;
          }
          if (typeof image === 'string') {
            const candidateId = normalizeId(image);
            return candidateId ? plantCatalog.imageById.get(candidateId) || null : null;
          }
          if (typeof image === 'object' && image.id) {
            const candidateId = normalizeId(image.id);
            if (!candidateId) {
              return null;
            }
            return plantCatalog.imageById.get(candidateId) || null;
          }
          return null;
        })
        .filter(Boolean)
      : [];

    imageEntry = fallbackImages[0] || null;
  }

  result.correctAnswerId = baseEntry.id;

  if (species.names && typeof species.names === 'object') {
    const clonedNames = clonePlainObject(species.names);
    if (clonedNames) {
      result.names = clonedNames;
    }
  }

  const wrongAnswers = cloneArray(species.wrongAnswers);
  if (wrongAnswers) {
    result.wrongAnswers = wrongAnswers;
  }

  if (imageEntry && imageEntry.src) {
    result.image = imageEntry.src;
  }

  if (imageEntry && imageEntry.difficulty !== undefined && imageEntry.difficulty !== null) {
    result.difficulty = imageEntry.difficulty;
  } else if (species.difficulty !== undefined && species.difficulty !== null && result.difficulty === undefined) {
    result.difficulty = species.difficulty;
  }

  if (!result.questionVariantId) {
    result.questionVariantId = `memorization-${plantLookupKey}`;
  }
  if (!result.selectionGroupId) {
    result.selectionGroupId = `memorization-${plantLookupKey}`;
  }
  if (!result.questionType) {
    result.questionType = 'plant';
  }
  if (!result.questionPromptKey) {
    result.questionPromptKey = 'question';
  }

  return result;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(current);
      current = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = '';
    } else {
      current += char;
    }
  }
  if (current !== '' || text.endsWith(',') || text.endsWith('\n')) {
    row.push(current);
  }
  if (row.length > 0) {
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function parseCsvRows(rows) {
  if (rows.length === 0) {
    throw new Error('CSV не содержит данных.');
  }

  const header = rows[0].map((cell, index) => (index === 0 ? stripBom(cell).trim() : cell.trim()));
  const columns = header.map((cell) => HEADER_ALIASES.get(cell.toLowerCase()) || cell);
  const dataRows = rows.slice(1);

  return dataRows
    .map((row, index) => {
      const record = {};
      columns.forEach((column, columnIndex) => {
        if (!column) {
          return;
        }
        record[column] = row[columnIndex] !== undefined ? row[columnIndex].trim() : '';
      });
      record.__line = index + 2;
      return record;
    })
    .filter((record) => {
      const cells = Object.entries(record)
        .filter(([key]) => key !== '__line')
        .map(([, value]) => value);
      return cells.some((value) => value && value.trim() !== '');
    });
}

function formatToxicityForCsv(toxicity) {
  if (!Array.isArray(toxicity) || toxicity.length === 0) {
    return '';
  }
  const entries = toxicity
    .map((entry) => {
      if (!entry || (entry.level === undefined && !entry.tag)) {
        return '';
      }
      const level = entry.level !== undefined ? entry.level : '';
      const tag = entry.tag || '';
      if (!tag && level === '') {
        return '';
      }
      if (!tag) {
        return String(level);
      }
      if (level === '') {
        return tag;
      }
      return `${tag}:${level}`;
    })
    .filter((item) => item !== '');
  return entries.join('; ');
}

function parseToxicityCell(rawValue, lineNumber) {
  const trimmed = stripWrappingQuotes(rawValue);
  if (!trimmed) {
    return [];
  }

  const segments = trimmed.split(';').map((segment) => segment.trim()).filter((segment) => segment !== '');
  const entries = [];

  segments.forEach((segment) => {
    const [firstPart = '', secondPart = ''] = segment.split(':').map((part) => part.trim());
    if (!firstPart && !secondPart) {
      return;
    }

    let tag = '';
    let levelValue = null;

    const firstNumber = Number(firstPart);
    const secondNumber = Number(secondPart);
    const firstIsNumber = firstPart !== '' && !Number.isNaN(firstNumber);
    const secondIsNumber = secondPart !== '' && !Number.isNaN(secondNumber);

    if (firstIsNumber && secondIsNumber) {
      throw new Error(`Некорректный формат токсичности в строке ${lineNumber}: «${segment}».`);
    }

    if (firstIsNumber) {
      levelValue = firstNumber;
      tag = secondPart;
    } else if (secondIsNumber) {
      tag = firstPart;
      levelValue = secondNumber;
    } else if (secondPart === '') {
      tag = firstPart;
      levelValue = null;
    } else {
      throw new Error(`Не удалось определить уровень токсичности в строке ${lineNumber}: «${segment}».`);
    }

    if (!tag) {
      throw new Error(`Отсутствует тег токсичности в строке ${lineNumber}: «${segment}».`);
    }

    if (levelValue !== null) {
      if (!Number.isFinite(levelValue) || !Number.isInteger(levelValue)) {
        throw new Error(`Уровень токсичности должен быть целым числом в строке ${lineNumber}: «${segment}».`);
      }
      entries.push({ tag, level: levelValue });
    } else {
      entries.push({ tag });
    }
  });

  return entries;
}

function formatPlantParametersForCsv(id, entry, imageId) {
  const scientificName = entry?.scientificName || '';
  const family = entry?.family || '';
  const lifeCycle = entry?.lifeCycle || '';
  const hardinessZone = entry?.hardinessZone || '';
  const light = entry?.light || '';
  const toxicity = formatToxicityForCsv(entry?.toxicity);
  const additionalInfo = entry?.additionalInfo || '';

  return [
    id,
    scientificName,
    family,
    lifeCycle,
    hardinessZone,
    light,
    toxicity,
    additionalInfo,
    imageId || ''
  ];
}

async function convertJsonToCsv(inputPath, outputPath) {
  const jsonText = await readFile(inputPath, 'utf8');
  const data = JSON.parse(jsonText);

  if (!data || typeof data !== 'object') {
    throw new Error('Некорректный формат memorization.json.');
  }

  const plantParameters = data.plantParameters && typeof data.plantParameters === 'object' ? data.plantParameters : {};
  const plants = Array.isArray(data.plants) ? data.plants : [];

  const imageIdByPlantId = new Map();
  plants.forEach((plantEntry) => {
    if (!plantEntry) {
      return;
    }
    const id = normalizeId(plantEntry.id ?? '');
    const imageId = normalizeId(plantEntry.imageId ?? '');
    if (!id || !imageId) {
      return;
    }
    imageIdByPlantId.set(id, imageId);
  });

  const plantIds = new Set([
    ...Object.keys(plantParameters || {}),
    ...imageIdByPlantId.keys()
  ]);

  const sortedIds = Array.from(plantIds).sort(comparePlantIds);
  const rows = sortedIds.map((id) => {
    const entry = plantParameters[id];
    const imageId = imageIdByPlantId.get(id) || '';
    return stringifyCsvRow(formatPlantParametersForCsv(id, entry, imageId));
  });

  const headerRow = stringifyCsvRow(CSV_HEADER);
  const csvOutput = [headerRow, ...rows].join('\n');
  await writeFile(outputPath, `${csvOutput}\n`, 'utf8');
  const relativePath = relative(REPO_ROOT, outputPath);
  console.log(`Converted memorization.json to CSV: ${relativePath}`);
}

function buildPlantParametersFromRecord(record) {
  const scientificName = stripWrappingQuotes(record.scientificName || '');
  if (!scientificName) {
    throw new Error(`Не указано научное название в строке ${record.__line}.`);
  }

  const entry = {
    scientificName
  };

  const family = stripWrappingQuotes(record.family || '');
  if (family) {
    entry.family = family;
  }

  const lifeCycle = stripWrappingQuotes(record.lifeCycle || '');
  if (lifeCycle) {
    entry.lifeCycle = lifeCycle;
  }

  const hardinessZone = stripWrappingQuotes(record.hardinessZone || '');
  if (hardinessZone) {
    entry.hardinessZone = hardinessZone;
  }

  const light = stripWrappingQuotes(record.light || '');
  if (light) {
    entry.light = light;
  }

  const toxicityRaw = record.toxicity || '';
  const toxicity = parseToxicityCell(toxicityRaw, record.__line);
  if (toxicity.length > 0) {
    entry.toxicity = toxicity;
  }

  const additionalInfo = stripWrappingQuotes(record.additionalInfo || '');
  if (additionalInfo) {
    entry.additionalInfo = additionalInfo;
  }

  return entry;
}

function getPlantIdentifiers(record) {
  const rawId = record.id || '';
  const plantId = normalizeId(rawId);
  if (!plantId) {
    throw new Error(`Не указан идентификатор растения в строке ${record.__line}.`);
  }

  const entryId = isNumericId(plantId) ? Number(plantId) : plantId;

  return {
    plantId,
    entryId
  };
}

function buildPlantsArrayFromRecords(records, { existingPlants = [], plantCatalog } = {}) {
  const plants = [];
  const imageIds = new Set();

  const existingById = new Map();
  existingPlants.forEach((plant) => {
    if (!plant || typeof plant !== 'object') {
      return;
    }
    const keys = getLookupKeysForPlantId(plant.id ?? plant.correctAnswerId ?? plant.plantId);
    keys.forEach((key) => {
      if (key) {
        existingById.set(key, plant);
      }
    });
  });

  records.forEach((record) => {
    const rawImageId = record.imageId || '';
    const imageId = normalizeId(rawImageId);
    if (imageId) {
      if (imageIds.has(imageId)) {
        throw new Error(`Повторяющийся imageId «${imageId}» в строке ${record.__line}.`);
      }
      imageIds.add(imageId);
    }

    const { plantId, entryId } = getPlantIdentifiers(record);
    const lookupKeys = getLookupKeysForPlantId(plantId);

    let existingEntry = null;
    for (const key of lookupKeys) {
      if (existingById.has(key)) {
        existingEntry = existingById.get(key);
        break;
      }
    }

    if (!existingEntry && !imageId) {
      return;
    }

    const plantLookupKey = lookupKeys[0] || plantId;
    const speciesExists = !plantCatalog || plantCatalog.isEmpty
      ? true
      : plantCatalog.plantById.has(plantLookupKey);

    if (!speciesExists) {
      if (existingEntry && typeof existingEntry === 'object') {
        const preserved = { ...existingEntry, id: entryId };
        delete preserved.imageId;
        plants.push(preserved);
      }
      return;
    }

    const baseEntry = existingEntry && typeof existingEntry === 'object'
      ? { ...existingEntry, id: entryId }
      : { id: entryId };

    delete baseEntry.imageId;

    const enriched = enrichPlantEntry({
      baseEntry,
      plantLookupKey,
      imageId: imageId || null,
      record,
      plantCatalog
    });

    plants.push(enriched);
  });

  plants.sort((a, b) => comparePlantIds(String(a.id), String(b.id)));
  return plants;
}

async function convertCsvToJson(inputPath, outputPath) {
  const csvText = await readFile(inputPath, 'utf8');
  const rows = parseCsv(csvText);
  const records = parseCsvRows(rows);

  const plantParameters = new Map();

  const normalizedRecords = records.map((record) => {
    const identifiers = getPlantIdentifiers(record);

    if (plantParameters.has(identifiers.plantId)) {
      throw new Error(
        `Повторяющийся идентификатор растения «${identifiers.plantId}» в строке ${record.__line}.`
      );
    }

    const entry = buildPlantParametersFromRecord(record);
    plantParameters.set(identifiers.plantId, entry);

    return {
      ...record,
      id: identifiers.plantId
    };
  });

  const sortedIds = Array.from(plantParameters.keys()).sort(comparePlantIds);
  const normalizedPlantParameters = Object.fromEntries(sortedIds.map((id) => [id, plantParameters.get(id)]));

  let existingGenus = [];
  let existingPlants = [];
  try {
    const existingText = await readFile(outputPath, 'utf8');
    const existingJson = JSON.parse(existingText);
    if (existingJson && Array.isArray(existingJson.genus)) {
      existingGenus = existingJson.genus;
    }
    if (existingJson && Array.isArray(existingJson.plants)) {
      existingPlants = existingJson.plants;
    }
  } catch (error) {
    existingGenus = [];
    existingPlants = [];
  }

  const plantCatalog = await loadPlantCatalog();

  const imageRows = normalizedRecords.filter((record) => normalizeId(record.imageId || ''));
  const rowsWithImageId = imageRows.length;

  let plants = [];
  if (rowsWithImageId === 0) {
    plants = Array.isArray(existingPlants)
      ? existingPlants
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => {
          const clone = { ...entry };
          delete clone.imageId;
          return clone;
        })
        .sort((a, b) => comparePlantIds(String(a.id), String(b.id)))
      : [];
  } else {
    plants = buildPlantsArrayFromRecords(normalizedRecords, {
      existingPlants,
      plantCatalog
    });
  }
  console.log(
    `Строк с imageId в CSV: ${rowsWithImageId}. Добавлено записей в раздел plants: ${plants.length}.`
  );

  if (rowsWithImageId > 0) {
    const sample = imageRows.slice(0, 5).map((record) => {
      const imageId = normalizeId(record.imageId || '');
      const plantId = normalizeId(record.id || '');
      const lineNumber = record.__line || '?';
      return `${plantId || '(пустой id)'} → ${imageId} (строка ${lineNumber})`;
    });
    console.log(`Примеры строк с imageId: ${sample.join('; ')}`);
  } else {
    console.log('В CSV не найдено ни одной строки с imageId.');
  }

  const rowsWithoutImageId = normalizedRecords.filter((record) => !normalizeId(record.imageId || ''));
  if (rowsWithoutImageId.length > 0) {
    const sample = rowsWithoutImageId.slice(0, 5).map((record) => {
      const plantId = normalizeId(record.id || '');
      const lineNumber = record.__line || '?';
      return `${plantId || '(пустой id)'} (строка ${lineNumber})`;
    });
    console.log(
      `Примеры строк без imageId (показываем первые ${sample.length} из ${rowsWithoutImageId.length}): ${sample.join('; ')}`
    );
  }

  const result = {
    plantParameters: normalizedPlantParameters,
    genus: existingGenus,
    plants
  };

  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const relativePath = relative(REPO_ROOT, outputPath);
  console.log(`CSV успешно преобразован в JSON: ${relativePath}`);
}

function printHelp() {
  console.log(
    [
      'Использование: node tools/memorizationConverter.mjs <команда> [параметры]',
      '',
      'Доступные команды:',
      '  to-csv   [--input <путь к memorization.json>] --output <csv файл>',
      '  to-json  --input <путь к csv> [--output <путь к memorization.json>]',
      '  --help   Показать подсказку',
      '',
      'По умолчанию скрипт использует src/data/json/memorization.json, сохраняя раздел genus.'
    ].join('\n')
  );
}

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const command = args[0];
  const options = new Map();
  for (let i = 1; i < args.length; i += 1) {
    const key = args[i];
    if (key.startsWith('--')) {
      const value = args[i + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`Ожидалось значение для параметра ${key}`);
      }
      options.set(key.slice(2), value);
      i += 1;
    }
  }

  if (command === 'to-csv') {
    const input = options.get('input');
    const output = options.get('output');
    if (!output) {
      throw new Error('Команда to-csv требует параметр --output.');
    }
    const resolvedInput = input
      ? resolve(process.cwd(), input)
      : DEFAULT_MEMORIZATION_PATH;
    await convertJsonToCsv(resolvedInput, resolve(process.cwd(), output));
  } else if (command === 'to-json') {
    const input = options.get('input');
    if (!input) {
      throw new Error('Команда to-json требует параметр --input.');
    }
    const output = options.get('output');
    const resolvedOutput = output ? resolve(process.cwd(), output) : DEFAULT_MEMORIZATION_PATH;
    await convertCsvToJson(resolve(process.cwd(), input), resolvedOutput);
  } else {
    printHelp();
    throw new Error(`Неизвестная команда: ${command}`);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
