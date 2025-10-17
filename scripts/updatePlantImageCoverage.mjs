import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { speciesById } from '../src/data/catalog.js';
import { plantImagesById } from '../src/data/images.js';

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
  '| id растения | Название (ru) | Название (en) | Название (nl) | Название (sci) | Количество фото | ID фотографий | Названия изображений |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |'
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

  return `| ${escapeCell(id)} | ${ruName} | ${enName} | ${nlName} | ${sciName} | ${imageCount} | ${imageIdCell} | ${imageNameCell} |`;
});

const output = header.concat(rows).join('\n');

await fs.writeFile(outputPath, `${output}\n`);

