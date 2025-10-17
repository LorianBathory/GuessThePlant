#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { plantNamesById } from '../src/data/plantNames.js';
import { speciesById, plants as plantQuizEntries } from '../src/data/catalog.js';
import { plantImages } from '../src/data/images.js';
import { plantParametersById, plantFamilies } from '../src/data/plantParameters.js';
import { bouquetQuestions } from '../src/data/catalogBouquets.js';
import { allGenusEntries } from '../src/data/genus/index.js';

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

  const bundle = {
    plantNames: sortedPlantNames,
    species: sortedSpecies,
    plantImages: sortedPlantImages,
    plantParameters: sortedPlantParameters,
    plantFamilies: sortedPlantFamilies,
    bouquetQuestions: sortedBouquets,
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
