import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  plantNamesById,
  plantImages,
  allGenusEntries,
  difficultyLevels,
  questionIdsByDifficulty,
  imageIdsByDifficulty
} from '../src/game/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonDir = path.resolve(__dirname, '../src/data/json');

async function ensureJsonDir() {
  await fs.mkdir(jsonDir, { recursive: true });
}

function normalizeForJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function writeJson(fileName, data) {
  const outputPath = path.join(jsonDir, fileName);
  const normalized = normalizeForJson(data);
  const jsonText = `${JSON.stringify(normalized, null, 2)}\n`;
  await fs.writeFile(outputPath, jsonText, 'utf8');
}

async function readJsonIfExists(fileName, fallback) {
  try {
    const filePath = path.join(jsonDir, fileName);
    const text = await fs.readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    return fallback;
  }
}

async function main() {
  await ensureJsonDir();

  const speciesCatalog = await readJsonIfExists('speciesCatalog.json', {});
  const bouquetQuestions = await readJsonIfExists('bouquetQuestions.json', []);

  const difficulties = {
    difficultyLevels,
    questionIdsByDifficulty,
    imageIdsByDifficulty
  };

  await Promise.all([
    writeJson('plantNames.json', plantNamesById),
    writeJson('plantImages.json', plantImages),
    writeJson('genus.json', allGenusEntries),
    writeJson('speciesCatalog.json', speciesCatalog),
    writeJson('bouquetQuestions.json', bouquetQuestions),
    writeJson('difficulties.json', difficulties)
  ]);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
