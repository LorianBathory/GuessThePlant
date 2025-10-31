#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  plantNamesById,
  speciesById,
  plants as plantQuizEntries,
  plantImages,
  bouquetQuestions,
  allGenusEntries,
  difficultyLevels as rawDifficultyLevels,
  questionIdsByDifficulty as rawQuestionIdsByDifficulty,
  imageIdsByDifficulty as rawImageIdsByDifficulty,
  plantParametersById,
  plantFamilies
} from '../src/game/dataLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'src', 'data', 'json');
const outputFile = path.join(outputDir, 'plantData.json');

function comparePlantIds(a, b) {
  const asNumber = Number(a);
  const bsNumber = Number(b);
  const aIsNumber = Number.isInteger(asNumber) && String(asNumber) === String(a);
  const bIsNumber = Number.isInteger(bsNumber) && String(bsNumber) === String(b);

  if (aIsNumber && bIsNumber) {
    return asNumber - bsNumber;
  }

  if (aIsNumber) {
    return -1;
  }

  if (bIsNumber) {
    return 1;
  }

  return String(a).localeCompare(String(b), 'en');
}

function compareImageEntries(a, b) {
  return a.id.localeCompare(b.id, 'en');
}

function compareQuestionEntries(a, b) {
  if (a.id !== b.id) {
    return comparePlantIds(a.id, b.id);
  }

  return a.imageId.localeCompare(b.imageId, 'en');
}

function compareBouquetEntries(a, b) {
  return a.questionVariantId.localeCompare(b.questionVariantId, 'en');
}

function compareStrings(a, b) {
  return String(a).localeCompare(String(b), 'en');
}

function compareByOrder(a, b, order) {
  const indexA = order.indexOf(a);
  const indexB = order.indexOf(b);

  if (indexA === -1 && indexB === -1) {
    return compareStrings(a, b);
  }

  if (indexA === -1) {
    return 1;
  }

  if (indexB === -1) {
    return -1;
  }

  return indexA - indexB;
}

const DIFFICULTY_LEVEL_ORDER = ['EASY', 'MEDIUM', 'HARD'];
const DIFFICULTY_NAME_ORDER = ['Easy', 'Medium', 'Hard'];
const QUESTION_TYPE_ORDER = ['plant', 'bouquet'];

function sortDifficultyLevels(levels = {}) {
  return Object.fromEntries(
    Object.entries(levels)
      .sort(([levelA], [levelB]) => compareByOrder(levelA, levelB, DIFFICULTY_LEVEL_ORDER))
  );
}

function sortDifficultyBuckets(buckets = {}, compareFn = compareStrings) {
  return Object.fromEntries(
    Object.entries(buckets)
      .sort(([difficultyA], [difficultyB]) => compareByOrder(difficultyA, difficultyB, DIFFICULTY_NAME_ORDER))
      .map(([difficulty, ids]) => [
        difficulty,
        Array.isArray(ids) ? [...ids].sort(compareFn) : []
      ])
  );
}

function sortDifficultyByType(entries = {}, comparators = {}) {
  return Object.fromEntries(
    Object.entries(entries)
      .sort(([typeA], [typeB]) => compareByOrder(typeA, typeB, QUESTION_TYPE_ORDER))
      .map(([type, buckets]) => [
        type,
        sortDifficultyBuckets(buckets || {}, comparators[type] || compareStrings)
      ])
  );
}

function buildSortedDifficulties() {
  return {
    difficultyLevels: sortDifficultyLevels(rawDifficultyLevels || {}),
    questionIdsByDifficulty: sortDifficultyByType(rawQuestionIdsByDifficulty || {}, {
      plant: comparePlantIds
    }),
    imageIdsByDifficulty: sortDifficultyByType(rawImageIdsByDifficulty || {})
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const sortedPlantNames = Object.fromEntries(
    Object.entries(plantNamesById)
      .sort(([idA], [idB]) => comparePlantIds(idA, idB))
  );

  const sortedSpecies = Object.fromEntries(
    Object.entries(speciesById)
      .sort(([idA], [idB]) => comparePlantIds(idA, idB))
  );

  const sortedPlantImages = [...plantImages].sort(compareImageEntries);

  const sortedPlantParameters = Object.fromEntries(
    Object.entries(plantParametersById)
      .sort(([idA], [idB]) => comparePlantIds(idA, idB))
  );

  const sortedPlantFamilies = Object.fromEntries(
    Object.entries(plantFamilies)
      .sort(([familyA], [familyB]) => familyA.localeCompare(familyB, 'en'))
      .map(([family, ids]) => [
        family,
        [...ids].sort(comparePlantIds)
      ])
  );

  const sortedBouquets = [...bouquetQuestions].sort(compareBouquetEntries);
  const sortedGenus = [...allGenusEntries].sort((a, b) => comparePlantIds(a.id, b.id));
  const sortedPlantQuestions = [...plantQuizEntries].sort(compareQuestionEntries);
  const sortedDifficulties = buildSortedDifficulties();

  const bundle = {
    plantNames: sortedPlantNames,
    species: sortedSpecies,
    plantImages: sortedPlantImages,
    plantParameters: sortedPlantParameters,
    plantFamilies: sortedPlantFamilies,
    bouquetQuestions: sortedBouquets,
    difficulties: sortedDifficulties,
    genus: sortedGenus,
    plantQuestions: sortedPlantQuestions
  };

  const json = `${JSON.stringify(bundle, null, 2)}\n`;
  await fs.writeFile(outputFile, json, 'utf8');

  console.log(`Exported Guess The Plant data bundle to ${path.relative(repoRoot, outputFile)}`);
}

main().catch((error) => {
  console.error('Failed to export Guess The Plant data bundle.');
  console.error(error);
  process.exitCode = 1;
});
