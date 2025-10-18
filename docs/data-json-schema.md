# Data JSON Structure Overview

This document summarizes the JSON-like structures that power Guess The Plant's datasets and the required fields each entity exposes.

## Identifier formats

- **Plant IDs** come from `plantNamesById` and related catalogs. They are either integers or strings that start with digits and may include underscore-delimited numeric suffixes (e.g., `83_1`). The helper `parseCatalogId` inside the loader normalizes numeric-looking values to numbers, leaving composite IDs как строки.【F:src/game/dataLoader.js†L96-L112】
- **Image IDs** for plants are alphanumeric strings such as `p13_1` or `97_6`. Bouquet-specific images use IDs like `bq001`. All plant image paths start with `images/`, while bouquet assets live under `images/bouquets/`.【F:src/data/json/plantImages.json†L1-L40】【F:src/data/json/plantData.json†L7562-L7706】

## Core entities

### Localized plant name (`plantNamesById`)
- **Location:** Раздел `plantNames` в `src/data/json/plantData.json` (или в источнике `plantNames.json` перед сборкой бандла).
- **Shape:** Объект, сопоставляющий каждому идентификатору растения структуру локализаций.
- **Required fields:** `ru`, `en`, `nl`, `sci` (строки с локализованным и научным названием).【F:src/data/json/plantData.json†L1-L120】
- **Optional fields:** None.

### Genus definition (`genus` entries)
Каждая запись в массиве `genus` внутри `plantData.json` описывает род со следующей структурой:
- **Required fields:**
  - `id` (integer plant ID shared by the genus umbrella entry).
  - `slug` (string identifier used for lookups).
  - `entries` (object map of plant IDs to genus entries).
- **Optional fields:** `wrongAnswers` (array of plant IDs suggested as distractors).【F:src/data/json/plantData.json†L7296-L7356】

### Genus entry (`entries` map inside each genus)
- **Required fields:**
  - `names` (same localization shape as `plantNamesById`).
- **Optional fields:**
  - `images` (array of plant image IDs referencing `plantImages`).
  - `wrongAnswers` (array of plant IDs overriding genus-level defaults).【F:src/data/json/plantData.json†L7296-L7356】

### Species catalog entry (`speciesById`)
`dataLoader` merges локализованные названия, данные родов и раздел `species` из JSON в нормализованную запись вида.
- **Required fields:**
  - `id` (plant ID).
  - `names` (localization object from `plantNamesById`).
- **Optional fields:**
  - `images` (array of plant image IDs; when present, every ID must be resolvable via `plantImagesById`).
  - `wrongAnswers` (array of plant IDs used for quiz distractors).
  - `genusId` (plant ID pointing to the genus definition that provided the data).【F:src/game/dataLoader.js†L198-L286】

### Plant quiz question (`plants` array)
Derived from `speciesById` плюс загруженные изображения и рассчитанные уровни сложности.
- **Required fields:** `id`, `correctAnswerId`, `imageId`, `image`, `names`, `questionVariantId`, `questionType`, `selectionGroupId`, `questionPromptKey`.
- **Optional fields:** `wrongAnswers` (array) and `difficulty` (string from `difficultyLevels`). Image references must match an entry from `plantImages`/`plantImagesById`.【F:src/game/dataLoader.js†L314-L378】

### Plant parameter entry (`plantParametersById`)
Created from `plantParametersRaw` and enriched with family data.
- **Required fields:** `scientificName` (string).
- **Optional fields:** `lifeCycle` (enum-like string), `additionalInfo` (string), `toxicity` (array of `{ level: number, tag: string }`), `hardinessZone` (string), `light` (string), `family` (string or `null`). Plant IDs can be numeric or underscore-delimited strings, normalized via `normalizePlantId`.【F:src/data/plantParameters.js†L1-L172】【F:src/data/plantParameters.js†L200-L258】

### Plant family catalog (`plantFamilies`)
- **Shape:** Object mapping botanical family names to arrays of plant IDs (numeric or string) that belong to the family. IDs are normalized the same way as species IDs.【F:src/data/plantParameters.js†L174-L244】

### Plant image entry (`plantImages` / `plantImagesById`)
- **Shape:** Each entry has `id` (string) and `src` (relative image path starting with `images/`).
- **Required fields:** `id`, `src`.
- **Optional fields:** None. The helper `plantImagesById` materializes an ID→entry map for lookups.【F:src/data/json/plantImages.json†L1-L40】【F:src/game/dataLoader.js†L256-L275】

### Bouquet question entry (`bouquetQuestions`)
- **Source:** Раздел `bouquetQuestions` в `plantData.json` (формируется экспортными скриптами из JSON-источников).
- **Required fields:** `id` (plant ID of the correct answer), `correctAnswerId` (duplicate of `id`), `imageId`, `image`, `names`, `wrongAnswers` (array capped at three IDs), `difficulty` (nullable string), `questionVariantId`, `questionType`, `selectionGroupId`, `questionPromptKey`.
- **Relationships:** `names` is resolved from `plantNamesById` by `correctPlantId`, and `image`/`imageId` must point to bouquet-specific assets in `images/bouquets/`.
- **Optional fields:** None after normalization (defaults are applied before freezing).【F:src/game/dataLoader.js†L378-L450】

## Cross-entity references

- `images` arrays in species or genus entries must reference image IDs declared in `plantImages`.
- `wrongAnswers` arrays always contain plant IDs that must resolve through `plantNamesById`/`speciesById`.
- `genusId` on a species record must reference an entry from the `genus` array so the loader can inherit defaults.【F:src/game/dataLoader.js†L198-L286】
- Bouquet question `correctPlantId` values must exist in `plantNamesById`, ensuring `names` is always hydrated during normalization.【F:src/game/dataLoader.js†L378-L450】


## Tooling

- Run `npm run export:data` to regenerate `src/data/json/plantData.json` from the authoritative JS modules.【F:scripts/exportDataBundle.mjs†L1-L95】
- Run `npm run validate:data` to ensure the exported JSON matches `src/data/schema/plant.schema.json`. The validator uses Ajv (draft-07) and will fail when paths or references drift from the schema.【F:scripts/validateDataBundle.mjs†L1-L46】【F:src/data/schema/plant.schema.json†L1-L188】
