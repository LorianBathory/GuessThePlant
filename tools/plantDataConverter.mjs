#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const CSV_HEADER = [
  'id',
  '(ru)',
  '(en)',
  '(nl)',
  '(sci)',
  'images',
  'ID изображений',
  'Названия файлов',
  'wrongAnswers',
  'Сложность',
  'Переопределения сложности',
  'Family'
];

const HEADER_ALIASES = new Map([
  ['id ', 'id'],
  ['id', 'id'],
  ['(ru)', 'ru'],
  ['(en)', 'en'],
  ['(nl)', 'nl'],
  ['(sci)', 'sci'],
  ['images', 'imageCount'],
  ['id изображений', 'imageIds'],
  ['названия файлов', 'imageFiles'],
  ['wronganswers', 'wrongAnswers'],
  ['сложность', 'difficulty'],
  ['difficulty overrides', 'difficultyOverrides'],
  ['переопределения сложности', 'difficultyOverrides'],
  ['difficultyoverrides', 'difficultyOverrides'],
  ['family', 'family']
]);

const DIFFICULTY_LEVELS = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
};

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

function normalizeId(id) {
  return stripWrappingQuotes(id);
}

function normalizeWrongAnswerId(id) {
  const normalized = normalizeId(id);
  if (!normalized) {
    return null;
  }
  return isNumericId(normalized) ? Number(normalized) : normalized;
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

function parseOverrides(rawOverrides) {
  const overrides = new Map();
  if (!rawOverrides) {
    return overrides;
  }
  const segments = rawOverrides.split(',');
  for (const segment of segments) {
    const [imageIdPart, difficultyPart] = segment.split(':').map((piece) => stripWrappingQuotes(piece));
    if (imageIdPart && difficultyPart) {
      overrides.set(imageIdPart, difficultyPart);
    }
  }
  return overrides;
}

function parseDifficultyCell(baseCell, overridesCell = '') {
  const rawBase = stripWrappingQuotes(baseCell);
  const overridesSource = stripWrappingQuotes(overridesCell);
  if (!overridesSource) {
    const legacyMatch = rawBase.match(/^(.*?)(?:\s*\(overrides:\s*(.+)\))$/i);
    if (legacyMatch) {
      const base = legacyMatch[1].trim();
      const overrides = parseOverrides(legacyMatch[2]);
      return { base: base && base.toLowerCase() !== 'null' ? base : null, overrides };
    }
  }

  const base = rawBase && rawBase.toLowerCase() !== 'null' ? rawBase : null;
  const overrides = parseOverrides(overridesSource);
  return { base, overrides };
}

function formatBaseDifficulty(base) {
  return base || '';
}

function formatDifficultyOverrides(overrides) {
  const entries = Array.from(overrides.entries());
  if (entries.length === 0) {
    return '';
  }
  return entries
    .sort(([idA], [idB]) => comparePlantIds(idA, idB))
    .map(([imageId, difficulty]) => `${imageId}:${difficulty}`)
    .join(', ');
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

async function convertJsonToCsv(inputPath, outputPath) {
  const jsonText = await readFile(inputPath, 'utf8');
  const plantData = JSON.parse(jsonText);

  const namesById = plantData.plantNames || {};
  const speciesById = plantData.species || {};
  const parametersById = plantData.plantParameters || {};
  const questions = ensureArray(plantData.plantQuestions).filter((entry) => entry?.questionType === 'plant');
  const difficultySource = plantData.difficulties || {};
  const questionIdsByDifficulty = difficultySource.questionIdsByDifficulty?.plant || {};

  const baseDifficultyById = new Map();
  for (const [difficulty, ids] of Object.entries(questionIdsByDifficulty)) {
    for (const id of ensureArray(ids)) {
      baseDifficultyById.set(normalizeId(id), difficulty);
    }
  }

  const questionsByPlantId = new Map();
  for (const question of questions) {
    const plantId = normalizeId(question.correctAnswerId ?? question.id);
    if (!questionsByPlantId.has(plantId)) {
      questionsByPlantId.set(plantId, []);
    }
    questionsByPlantId.get(plantId).push(question);
  }

  const rows = [CSV_HEADER.join(',')];

  const plantIds = Object.keys(namesById).sort(comparePlantIds);
  for (const plantId of plantIds) {
    const names = namesById[plantId] || {};
    const params = parametersById[plantId] || {};
    const scientificName = names.sci || params.scientificName || '';
    const family = params.family || '';
    const speciesEntry = speciesById[plantId] || {};
    const wrongAnswers = Array.isArray(speciesEntry.wrongAnswers) ? speciesEntry.wrongAnswers : [];

    const questionEntries = (questionsByPlantId.get(plantId) || []).map((entry) => ({
      imageId: normalizeId(entry.imageId || ''),
      imageFile: entry.image ? basename(entry.image) : '',
      difficulty: entry.difficulty || null
    }));

    questionEntries.sort((a, b) => a.imageId.localeCompare(b.imageId, 'en'));

    const baseDifficulty = baseDifficultyById.get(plantId) || null;
    const overrides = new Map();
    for (const entry of questionEntries) {
      if (!entry.imageId) continue;
      if (!baseDifficulty || entry.difficulty !== baseDifficulty) {
        if (entry.difficulty) {
          overrides.set(entry.imageId, entry.difficulty);
        }
      }
    }

    const row = [
      plantId,
      names.ru || '',
      names.en || '',
      names.nl || '',
      scientificName || '',
      String(questionEntries.length),
      questionEntries.map((entry) => entry.imageId).filter(Boolean).join(', '),
      questionEntries.map((entry) => entry.imageFile).filter(Boolean).join(', '),
      wrongAnswers.map((answerId) => normalizeId(answerId)).filter(Boolean).join(', '),
      formatBaseDifficulty(baseDifficulty),
      formatDifficultyOverrides(overrides),
      family || ''
    ];

    rows.push(stringifyCsvRow(row));
  }

  await writeFile(outputPath, rows.join('\n'), 'utf8');
  console.log(`Converted ${plantIds.length} plants to CSV: ${outputPath}`);
}

function parseCsvRows(rows) {
  if (rows.length === 0) {
    throw new Error('CSV не содержит данных.');
  }
  const header = rows[0].map((cell) => cell.trim());
  const columns = header.map((cell) => HEADER_ALIASES.get(cell.toLowerCase()) || cell.toLowerCase());
  const dataRows = rows.slice(1);

  return dataRows.map((row, index) => {
    const record = {};
    columns.forEach((column, columnIndex) => {
      record[column] = row[columnIndex] !== undefined ? row[columnIndex].trim() : '';
    });
    record.__line = index + 2;
    return record;
  });
}

function extractList(cell) {
  if (!cell) return [];
  return cell
    .split(',')
    .map((item) => stripWrappingQuotes(item))
    .filter((item) => item !== '');
}

function parseCsvData(rows) {
  const records = parseCsvRows(rows);
  const plantNames = {};
  const species = {};
  const plantQuestions = [];
  const plantImages = new Map();
  const plantParameters = {};
  const plantFamilies = new Map();
  const baseDifficultyById = new Map();
  const imageDifficultyById = new Map();

  for (const record of records) {
    const plantId = normalizeId(record.id ?? record['id '] ?? '');
    if (!plantId) {
      throw new Error(`Не указан идентификатор растения в строке ${record.__line}.`);
    }

    const ru = record.ru || '';
    const en = record.en || '';
    const nl = record.nl || '';
    const sci = record.sci || '';
    const family = record.family || '';
    const { base, overrides } = parseDifficultyCell(
      record.difficulty || '',
      record.difficultyOverrides || ''
    );

    plantNames[plantId] = { ru, en, nl, sci };

    if (sci || family) {
      const params = {};
      if (sci) params.scientificName = sci;
      if (family) params.family = family;
      plantParameters[plantId] = params;
    }

    if (family) {
      if (!plantFamilies.has(family)) {
        plantFamilies.set(family, []);
      }
      plantFamilies.get(family).push(plantId);
    }

    if (base) {
      baseDifficultyById.set(plantId, base);
    }

    const wrongAnswersRaw = extractList(record.wrongAnswers || '');
    const wrongAnswers = wrongAnswersRaw
      .map((value) => normalizeWrongAnswerId(value))
      .filter((value) => value !== null);

    const imageFiles = extractList(record.imageFiles || '');
    const manualImageIds = extractList(record.imageIds || '');
    const normalizedManualImageIds = manualImageIds
      .map((manualId) => normalizeId(manualId))
      .filter((manualId) => manualId);

    if (imageFiles.length > 0 && normalizedManualImageIds.length > 0 && normalizedManualImageIds.length !== imageFiles.length) {
      throw new Error(`Количество imageId и файлов не совпадает (строка ${record.__line}).`);
    }

    const autoImageIds = imageFiles.map((_, index) => generateImageId(plantId, index));
    const finalImageIds = autoImageIds.length > 0 ? autoImageIds : normalizedManualImageIds;

    const legacyImageIdMap = new Map();
    if (autoImageIds.length > 0) {
      normalizedManualImageIds.forEach((normalizedManualId, index) => {
        const autoId = autoImageIds[index];
        if (normalizedManualId && autoId && normalizedManualId !== autoId) {
          legacyImageIdMap.set(normalizedManualId, autoId);
        }
      });
    }

    const normalizedOverrides = new Map();
    overrides.forEach((difficulty, imageId) => {
      const normalizedId = normalizeId(imageId);
      const autoId = legacyImageIdMap.get(normalizedId) || normalizedId;
      normalizedOverrides.set(autoId, difficulty);
    });

    species[plantId] = {
      id: isNumericId(plantId) ? Number(plantId) : plantId,
      names: { ru, en, nl, sci },
      images: finalImageIds,
      ...(wrongAnswers.length > 0 ? { wrongAnswers } : {})
    };

    finalImageIds.forEach((imageId, index) => {
      const imageFile = imageFiles[index] || '';
      if (imageFile) {
        plantImages.set(imageId, { id: imageId, src: imageFile.startsWith('images/') ? imageFile : `images/${imageFile}` });
      }
      const variantIndex = index;
      const difficulty = normalizedOverrides.get(imageId) || base || null;
      if (difficulty) {
        imageDifficultyById.set(imageId, difficulty);
      }
      const questionWrongAnswers = wrongAnswers.length > 0 ? wrongAnswers : [];
      plantQuestions.push({
        id: isNumericId(plantId) ? Number(plantId) : plantId,
        correctAnswerId: isNumericId(plantId) ? Number(plantId) : plantId,
        imageId,
        image: imageFile ? (imageFile.startsWith('images/') ? imageFile : `images/${imageFile}`) : '',
        names: { ru, en, nl, sci },
        ...(questionWrongAnswers.length > 0 ? { wrongAnswers: questionWrongAnswers.slice() } : {}),
        difficulty: difficulty || null,
        questionVariantId: `${plantId}-${variantIndex}`,
        questionType: 'plant',
        selectionGroupId: `plant-${plantId}`,
        questionPromptKey: 'question'
      });
    });
  }

  const questionIdsByDifficulty = {
    plant: {
      Easy: [],
      Medium: [],
      Hard: []
    }
  };

  for (const [plantId, difficulty] of baseDifficultyById.entries()) {
    if (questionIdsByDifficulty.plant[difficulty]) {
      questionIdsByDifficulty.plant[difficulty].push(isNumericId(plantId) ? Number(plantId) : plantId);
    }
  }

  for (const level of Object.keys(questionIdsByDifficulty.plant)) {
    questionIdsByDifficulty.plant[level].sort(comparePlantIds);
  }

  const imageIdsByDifficulty = {
    plant: {
      Easy: [],
      Medium: [],
      Hard: []
    }
  };

  for (const [imageId, difficulty] of imageDifficultyById.entries()) {
    if (imageIdsByDifficulty.plant[difficulty]) {
      imageIdsByDifficulty.plant[difficulty].push(imageId);
    }
  }

  for (const level of Object.keys(imageIdsByDifficulty.plant)) {
    imageIdsByDifficulty.plant[level].sort((a, b) => a.localeCompare(b, 'en'));
  }

  const plantFamiliesObject = {};
  for (const [family, ids] of plantFamilies.entries()) {
    plantFamiliesObject[family] = ids.sort(comparePlantIds);
  }

  const result = {
    plantNames,
    species,
    plantImages: Array.from(plantImages.values()).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    plantParameters,
    plantFamilies: plantFamiliesObject,
    bouquetQuestions: [],
    genus: [],
    plantQuestions,
    difficulties: {
      difficultyLevels: { ...DIFFICULTY_LEVELS },
      questionIdsByDifficulty,
      imageIdsByDifficulty
    }
  };

  return result;
}

async function convertCsvToJson(inputPath, outputPath) {
  const csvText = await readFile(inputPath, 'utf8');
  const rows = parseCsv(csvText);
  const data = parseCsvData(rows);
  await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`CSV успешно преобразован в JSON: ${outputPath}`);
}

function printHelp() {
  console.log(`Использование: node tools/plantDataConverter.mjs <команда> [параметры]\n\nДоступные команды:\n  to-csv   --input <путь к PlantData.json> --output <csv файл>\n  to-json  --input <путь к csv> --output <PlantData.json>\n  --help   Показать подсказку\n`);
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

  const input = options.get('input');
  const output = options.get('output');
  if (!input || !output) {
    throw new Error('Необходимо указать параметры --input и --output.');
  }

  if (command === 'to-csv') {
    await convertJsonToCsv(input, output);
  } else if (command === 'to-json') {
    await convertCsvToJson(input, output);
  } else {
    printHelp();
    throw new Error(`Неизвестная команда: ${command}`);
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
