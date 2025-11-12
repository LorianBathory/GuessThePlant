import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(ROOT_DIR, 'data-export.json');
const SCHEMA_PATH = resolve(ROOT_DIR, 'docs/data-json-schema.md');

function toFileUrl(path) {
  return pathToFileURL(path).href;
}

async function importModule(relativePath) {
  const moduleUrl = toFileUrl(resolve(ROOT_DIR, relativePath));
  return import(moduleUrl);
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeId(value) {
  return String(value);
}

async function loadSchema() {
  const schemaMarkdown = await readFile(SCHEMA_PATH, 'utf8');
  const match = schemaMarkdown.match(/```json\n([\s\S]*?)\n```/);

  if (!match) {
    throw new Error('Не удалось найти JSON-схему в docs/data-json-schema.md');
  }

  return JSON.parse(match[1]);
}

function validateSpecies(species, imagesById) {
  const seenIds = new Set();

  for (const entry of Object.values(species)) {
    assertCondition(entry && typeof entry === 'object', 'Некорректная запись вида в species.');
    const idKey = normalizeId(entry.id);
    assertCondition(!seenIds.has(idKey), `Повторяющийся идентификатор вида: ${entry.id}`);
    seenIds.add(idKey);

    if (Array.isArray(entry.images)) {
      entry.images.forEach((imageId) => {
        assertCondition(
          imagesById[imageId],
          `Вид ${entry.id} ссылается на отсутствующее изображение ${imageId}`
        );
      });
    }

    if (Array.isArray(entry.wrongAnswers)) {
      entry.wrongAnswers.forEach((wrongId) => {
        assertCondition(
          species[wrongId] != null || species[normalizeId(wrongId)] != null,
          `Вид ${entry.id} содержит неверный ответ с неизвестным идентификатором ${wrongId}`
        );
      });
    }
  }

  return seenIds;
}

function validatePlantImages(imageList) {
  const seenIds = new Set();

  imageList.forEach((image) => {
    assertCondition(image && typeof image === 'object', 'Некорректная запись изображения.');
    assertCondition(typeof image.id === 'string' && image.id.length > 0, 'Изображение без идентификатора.');
    assertCondition(typeof image.src === 'string' && image.src.length > 0, `Изображение ${image.id} без пути.`);
    assertCondition(!seenIds.has(image.id), `Повторяющийся идентификатор изображения: ${image.id}`);
    seenIds.add(image.id);
  });

  return seenIds;
}

function validateQuestions(exportedQuestions, speciesIdSet, plantImageIds, plantImagesById, questionTypes) {
  const variantIds = new Set();
  const plantVariantIds = new Set(exportedQuestions.plants.map((question) => question.questionVariantId));
  const bouquetVariantIds = new Set(exportedQuestions.bouquets.map((question) => question.questionVariantId));

  assertCondition(
    exportedQuestions.all.length === exportedQuestions.plants.length + exportedQuestions.bouquets.length,
    'Количество записей в allQuestions не соответствует сумме plants и bouquets.'
  );

  exportedQuestions.all.forEach((question) => {
    assertCondition(question && typeof question === 'object', 'Обнаружен некорректный вопрос.');

    assertCondition(!variantIds.has(question.questionVariantId), `Повторяющийся questionVariantId: ${question.questionVariantId}`);
    variantIds.add(question.questionVariantId);

    assertCondition(
      speciesIdSet.has(normalizeId(question.correctAnswerId)),
      `Вопрос ${question.questionVariantId} ссылается на неизвестный правильный ответ ${question.correctAnswerId}`
    );

    if (Array.isArray(question.wrongAnswers)) {
      question.wrongAnswers.forEach((wrongId) => {
        assertCondition(
          speciesIdSet.has(normalizeId(wrongId)),
          `Вопрос ${question.questionVariantId} содержит неверный ответ ${wrongId}, которого нет в каталоге.`
        );
      });
    }

    if (question.questionType === questionTypes.PLANT) {
      assertCondition(
        plantImageIds.has(question.imageId),
        `Растительный вопрос ${question.questionVariantId} использует неизвестное изображение ${question.imageId}`
      );
      const imageEntry = plantImagesById[question.imageId];
      assertCondition(
        imageEntry && imageEntry.src === question.image,
        `Несоответствие пути изображения для вопроса ${question.questionVariantId}`
      );
      assertCondition(
        plantVariantIds.has(question.questionVariantId),
        `Вопрос ${question.questionVariantId} отсутствует в списке plant-вопросов.`
      );
    } else if (question.questionType === questionTypes.BOUQUET) {
      assertCondition(
        bouquetVariantIds.has(question.questionVariantId),
        `Букетный вопрос ${question.questionVariantId} отсутствует в списке bouquet-вопросов.`
      );
      assertCondition(
        typeof question.image === 'string' && question.image.length > 0,
        `Букетный вопрос ${question.questionVariantId} не содержит путь к изображению.`
      );
    } else {
      throw new Error(`Неизвестный тип вопроса ${question.questionType} у варианта ${question.questionVariantId}`);
    }
  });
}

function validateDifficulties(difficulties, speciesIdSet, exportedQuestions, plantImagesById, questionTypes) {
  const bouquetByVariantId = new Map(exportedQuestions.bouquets.map((question) => [question.questionVariantId, question]));
  const bouquetByImageId = new Map(exportedQuestions.bouquets.map((question) => [question.imageId, question]));

  Object.entries(difficulties.questionIds).forEach(([type, byDifficulty]) => {
    Object.entries(byDifficulty).forEach(([difficulty, ids]) => {
      ids.forEach((id) => {
        if (type === questionTypes.PLANT) {
          assertCondition(
            speciesIdSet.has(normalizeId(id)),
            `Настройка сложности ${difficulty} (тип ${type}) ссылается на неизвестный идентификатор ${id}`
          );
        } else if (type === questionTypes.BOUQUET) {
          assertCondition(
            bouquetByVariantId.has(String(id)),
            `Настройка сложности ${difficulty} для букетов ссылается на неизвестный вопрос ${id}`
          );
        }
      });
    });
  });

  Object.entries(difficulties.imageIds).forEach(([type, byDifficulty]) => {
    Object.entries(byDifficulty).forEach(([difficulty, ids]) => {
      ids.forEach((imageId) => {
        if (type === questionTypes.PLANT) {
          assertCondition(
            plantImagesById[imageId],
            `Настройка сложности изображения ${difficulty} (тип ${type}) ссылается на неизвестное изображение ${imageId}`
          );
        } else if (type === questionTypes.BOUQUET) {
          assertCondition(
            bouquetByImageId.has(imageId),
            `Настройка сложности изображения ${difficulty} для букетов ссылается на неизвестный идентификатор ${imageId}`
          );
        }
      });
    });
  });

  Object.entries(difficulties.overrides).forEach(([compositeKey, difficulty]) => {
    const [type, imageId] = compositeKey.split('::');
    if (type === questionTypes.PLANT) {
      assertCondition(
        plantImagesById[imageId],
        `Переопределение сложности для изображения ${imageId} (тип ${type}) не найдено в каталоге.`
      );
    } else if (type === questionTypes.BOUQUET) {
      assertCondition(
        bouquetByImageId.has(imageId),
        `Переопределение сложности для букета ${imageId} не найдено.`
      );
    } else {
      throw new Error(`Неизвестный тип ${type} в таблице переопределений сложности (${compositeKey} -> ${difficulty}).`);
    }
  });
}

async function main() {
  const [
    {
      speciesById,
      plants,
      bouquetQuestions,
      plantImages,
      plantImagesById,
      difficultyLevels,
      questionIdsByDifficulty,
      imageIdsByDifficulty,
      imageDifficultyOverrides,
      plantParametersById,
      plantFamilies,
      plantTagDefinitionsById
    },
    { allQuestions },
    { parameterTagLabels },
    { questionTypes }
  ] = await Promise.all([
    importModule('src/game/dataLoader.js'),
    importModule('src/data/questions.js'),
    importModule('src/data/parameterTags.js'),
    importModule('src/data/questionTypes.js')
  ]);

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    species: speciesById,
    images: {
      list: plantImages,
      byId: plantImagesById
    },
    questions: {
      plants,
      bouquets: bouquetQuestions,
      all: allQuestions
    },
    difficulties: {
      levels: difficultyLevels,
      questionIds: questionIdsByDifficulty,
      imageIds: imageIdsByDifficulty,
      overrides: imageDifficultyOverrides
    },
    parameters: {
      byId: plantParametersById,
      families: plantFamilies,
      tagLabels: parameterTagLabels,
      tags: plantTagDefinitionsById
    }
  };

  const speciesIdSet = validateSpecies(exportPayload.species, plantImagesById);
  const plantImageIds = validatePlantImages(plantImages);
  validateQuestions(exportPayload.questions, speciesIdSet, plantImageIds, plantImagesById, questionTypes);
  validateDifficulties(exportPayload.difficulties, speciesIdSet, exportPayload.questions, plantImagesById, questionTypes);

  const schema = await loadSchema();
  const ajv = new Ajv({ strict: false, allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(exportPayload);

  if (!valid) {
    const errorMessages = validate.errors?.map((error) => `${error.instancePath || '<root>'} ${error.message}`).join('\n');
    throw new Error(`Экспортируемые данные не проходят проверку по схеме:\n${errorMessages}`);
  }

  const json = `${JSON.stringify(exportPayload, null, 2)}\n`;
  await writeFile(OUTPUT_PATH, json, 'utf8');
  const relativePath = relative(ROOT_DIR, OUTPUT_PATH) || OUTPUT_PATH;
  console.log(`Данные успешно экспортированы: ${relativePath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
