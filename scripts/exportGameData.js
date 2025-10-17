import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { plantNamesById } from '../src/data/plantNames.js';
import { plantImages } from '../src/data/images.js';
import { allGenusEntries } from '../src/data/genus/index.js';
import { difficultyLevels, questionIdsByDifficulty, imageIdsByDifficulty } from '../src/data/difficulties.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonDir = path.resolve(__dirname, '../src/data/json');

async function ensureJsonDir() {
  await fs.mkdir(jsonDir, { recursive: true });
}

function normalizeForJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([^:\\])\/\/.*$/gm, '$1');
}

function stripObjectFreeze(source) {
  return source.replace(/Object\.freeze\s*\(/g, '(');
}

async function extractLiteral(filePath, variableName) {
  const source = await fs.readFile(filePath, 'utf8');
  const objectPattern = new RegExp(`const\\s+${variableName}\\s*=\\s*Object\\.freeze\\((\\{[\\s\\S]*?\\})\\);`);
  const arrayPattern = new RegExp(`const\\s+${variableName}\\s*=\\s*Object\\.freeze\\((\\[[\\s\\S]*?\\])\\);`);

  const objectMatch = source.match(objectPattern);
  const arrayMatch = source.match(arrayPattern);
  const match = objectMatch || arrayMatch;

  if (!match) {
    throw new Error(`Could not locate literal for ${variableName} in ${filePath}`);
  }

  const literalSource = stripObjectFreeze(stripComments(match[1]));
  return new Function(`return (${literalSource});`)();
}

async function writeJson(fileName, data) {
  const outputPath = path.join(jsonDir, fileName);
  const normalized = normalizeForJson(data);
  const jsonText = `${JSON.stringify(normalized, null, 2)}\n`;
  await fs.writeFile(outputPath, jsonText, 'utf8');
}

async function main() {
  await ensureJsonDir();

  let speciesCatalog;
  try {
    speciesCatalog = await extractLiteral(
      path.resolve(__dirname, '../src/data/catalog.js'),
      'speciesCatalog'
    );
  } catch (error) {
    console.warn('speciesCatalog literal not found, skipping export from catalog.js');
    const existing = await fs.readFile(path.join(jsonDir, 'speciesCatalog.json'), 'utf8').catch(() => 'null');
    speciesCatalog = JSON.parse(existing || 'null') || {};
  }

  let bouquetQuestions;
  try {
    bouquetQuestions = await extractLiteral(
      path.resolve(__dirname, '../src/data/catalogBouquets.js'),
      'rawBouquetQuestions'
    );
  } catch (error) {
    console.warn('rawBouquetQuestions literal not found, skipping export from catalogBouquets.js');
    const existing = await fs.readFile(path.join(jsonDir, 'bouquetQuestions.json'), 'utf8').catch(() => 'null');
    bouquetQuestions = JSON.parse(existing || 'null') || [];
  }

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
