import { promises as fs } from 'node:fs';
import path, { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  speciesById,
  plantImagesById,
  getDifficultyByImageId,
  getDifficultyByQuestionId,
  dataBundle
} from '../src/game/dataLoader.js';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'docs', 'plant-image-coverage.csv');

const CSV_HEADER = [
  'id',
  '(ru)',
  '(en)',
  '(nl)',
  '(sci)',
  'images',
  'ID изображений',
  'Названия файлов',
  'Сложность',
  'Переопределения сложности',
  'Family'
];

function csvEscape(value) {
  const stringValue = value == null ? '' : String(value);
  if (stringValue === '') {
    return '';
  }

  return /[",\n]/.test(stringValue)
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}

function stringifyCsvRow(values) {
  return values.map(csvEscape).join(',');
}

function getScientificName(species) {
  const idKey = String(species.id);
  return species.names?.sci
    || dataBundle.plantParameters?.[idKey]?.scientificName
    || '';
}

function getFamily(species) {
  const idKey = String(species.id);
  return dataBundle.plantParameters?.[idKey]?.family || '';
}

const sortedEntries = Object.values(speciesById)
  .slice()
  .sort((a, b) => collator.compare(String(a.id), String(b.id)));

const rows = [CSV_HEADER.join(',')];

sortedEntries.forEach(species => {
  const names = species.names || {};
  const baseDifficulty = getDifficultyByQuestionId(species.id) || '';
  const imageIds = Array.isArray(species.images) ? species.images.slice() : [];

  const imageEntries = imageIds
    .map(imageId => {
      const imageEntry = plantImagesById[imageId];
      const fileName = imageEntry?.src ? basename(imageEntry.src) : '';
      const override = getDifficultyByImageId(imageId) || '';
      return { imageId, fileName, override };
    })
    .sort((a, b) => a.imageId.localeCompare(b.imageId, 'en'));

  const formattedOverrides = imageEntries
    .filter(entry => entry.override && (baseDifficulty === '' || entry.override !== baseDifficulty))
    .map(entry => `${entry.imageId}:${entry.override}`)
    .join(', ');

  const row = [
    species.id,
    names.ru || '',
    names.en || '',
    names.nl || '',
    getScientificName(species),
    String(imageEntries.length),
    imageEntries.map(entry => entry.imageId).filter(Boolean).join(', '),
    imageEntries.map(entry => entry.fileName).filter(Boolean).join(', '),
    baseDifficulty,
    formattedOverrides,
    getFamily(species)
  ];

  rows.push(stringifyCsvRow(row));
});

await fs.writeFile(outputPath, `${rows.join('\n')}\n`);
