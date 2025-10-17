import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { speciesById } from '../src/data/catalog.js';
import { plantImagesById } from '../src/data/images.js';
import {
  getDifficultyByImageId,
  getDifficultyByQuestionId
} from '../src/data/difficulties.js';

const collator = new Intl.Collator('ru', { numeric: true, sensitivity: 'base' });
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(projectRoot, 'docs', 'plant-image-coverage.md');

function escapeCell(value) {
  if (value == null) {
    return '';
  }

  const stringValue = String(value);
  return stringValue.replace(/\r?\n|\r/g, ' ').replace(/\|/g, '\\|');
}

function formatDifficulty(species, imageIds) {
  const baseDifficulty = getDifficultyByQuestionId(species.id);
  const genusDifficulty = species.genusId != null && species.genusId !== species.id
    ? getDifficultyByQuestionId(species.genusId)
    : null;
  const effectiveDifficulty = baseDifficulty || genusDifficulty || null;

  const overrides = imageIds
    .map(imageId => {
      const overrideDifficulty = getDifficultyByImageId(imageId);
      if (!overrideDifficulty || overrideDifficulty === effectiveDifficulty) {
        return null;
      }

      return `${imageId}:${overrideDifficulty}`;
    })
    .filter(Boolean);

  const detailParts = [];

  if (!baseDifficulty && genusDifficulty) {
    detailParts.push(`from genus ${species.genusId}`);
  }

  if (overrides.length > 0) {
    detailParts.push(`overrides: ${overrides.join(', ')}`);
  }

  const difficultyLabel = effectiveDifficulty ?? 'null';
  if (detailParts.length === 0) {
    return difficultyLabel;
  }

  return `${difficultyLabel} (${detailParts.join('; ')})`;
}

const sortedEntries = Object.values(speciesById)
  .slice()
  .sort((a, b) => collator.compare(String(a.id), String(b.id)));

const header = [
  '| id растения | Название (ru) | Название (en) | Название (nl) | Название (sci) | Количество фото | ID фотографий | Названия изображений | Сложность |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
];

const rows = sortedEntries.map(species => {
  const { id, names = {}, images = [] } = species;
  const ruName = escapeCell(names.ru ?? '');
  const enName = escapeCell(names.en ?? '');
  const nlName = escapeCell(names.nl ?? '');
  const sciName = escapeCell(names.sci ?? '');

  const imageIds = Array.isArray(images) ? images : [];
  const imageEntries = imageIds
    .map(imageId => plantImagesById[imageId])
    .filter(imageEntry => imageEntry && typeof imageEntry.src === 'string');

  const imageIdCell = escapeCell(imageIds.join(', '));
  const imageNameCell = escapeCell(
    imageEntries
      .map(imageEntry => imageEntry.src.split('/').pop() ?? imageEntry.src)
      .join(', ')
  );

  const imageCount = imageIds.length;
  const difficultyCell = escapeCell(formatDifficulty(species, imageIds));

  return `| ${escapeCell(id)} | ${ruName} | ${enName} | ${nlName} | ${sciName} | ${imageCount} | ${imageIdCell} | ${imageNameCell} | ${difficultyCell} |`;
});

const output = header.concat(rows).join('\n');

await fs.writeFile(outputPath, `${output}\n`);
