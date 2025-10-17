#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const dataPath = path.join(repoRoot, 'src', 'data', 'json', 'plantData.json');
const schemaPath = path.join(repoRoot, 'src', 'data', 'schema', 'plant.schema.json');

function formatError(error) {
  const dataPath = error.instancePath || error.dataPath || '';
  const location = dataPath ? dataPath : '<root>';
  return `${location}: ${error.message}`;
}

async function main() {
  const [dataRaw, schemaRaw] = await Promise.all([
    fs.readFile(dataPath, 'utf8'),
    fs.readFile(schemaPath, 'utf8')
  ]);

  const data = JSON.parse(dataRaw);
  const schema = JSON.parse(schemaRaw);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  const valid = validate(data);

  if (!valid) {
    console.error('Guess The Plant data bundle does not satisfy plant.schema.json');
    (validate.errors || []).map(formatError).forEach((line) => {
      console.error(`  - ${line}`);
    });
    process.exitCode = 1;
    return;
  }

  console.log('Guess The Plant data bundle matches plant.schema.json');
}

main().catch((error) => {
  console.error('Failed to validate Guess The Plant data bundle.');
  console.error(error);
  process.exitCode = 1;
});
