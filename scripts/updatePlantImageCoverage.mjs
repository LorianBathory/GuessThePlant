import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { speciesById } from '../src/data/catalog.js';
import { plantImagesById } from '../src/data/images.js';
import { getDifficultyByQuestionId, getDifficultyByImageId } from '../src/data/difficulties.js';
import { questionTypes } from '../src/data/questionTypes.js';

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

const sortedEntries = Object.values(speciesById)
  .slice()
  .sort((a, b) => collator.compare(String(a.id), String(b.id)));

const header = [
  '| id растения | Название (ru) | Название (en) | Название (nl) | Название (sci) | Количество фото | ID фотографий | Названия изображений | Сложность |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'
];

const rows = sortedEntries.map(species => {
  const { id, names = {}, images = [], genusId } = species;
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

  const baseDifficulty = getDifficultyByQuestionId(id, questionTypes.PLANT);
  const genusDifficulty = genusId != null && genusId !== id
    ? getDifficultyByQuestionId(genusId, questionTypes.PLANT)
    : null;
  const difficultyValue = baseDifficulty ?? genusDifficulty ?? null;

  const difficultyOverrides = imageIds
    .map(imageId => {
      const override = getDifficultyByImageId(imageId, questionTypes.PLANT);

      if (!override || override === difficultyValue) {
        return null;
      }

      return `${imageId}:${override}`;
    })
    .filter(Boolean);

  let difficultyCell = difficultyValue ?? 'null';

  if (difficultyOverrides.length > 0) {
    const overridesText = difficultyOverrides.join(', ');
    difficultyCell = `${difficultyCell} (overrides: ${overridesText})`;
  }

  const imageCount = imageIds.length;

  return `| ${escapeCell(id)} | ${ruName} | ${enName} | ${nlName} | ${sciName} | ${imageCount} | ${imageIdCell} | ${imageNameCell} | ${escapeCell(difficultyCell)} |`;
});

const output = header.concat(rows).join('\n');

await fs.writeFile(outputPath, `${output}\n`);

