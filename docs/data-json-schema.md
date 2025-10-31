# Data JSON Structure Overview

This document summarizes the JSON-like structures that power Guess The Plant's datasets and the required fields each entity exposes. Runtime data is assembled by [`src/game/dataLoader.js`](../src/game/dataLoader.js), which combines the plant catalogue from `plantData.json` with question-definition files that live next to it.

## Identifier formats

- **Plant IDs** come from `plantNamesById` and related catalogs. They are either integers or strings that start with digits and may include underscore-delimited numeric suffixes (e.g., `83_1`). The helper `parseCatalogId` inside the loader normalizes numeric-looking values to numbers, leaving composite IDs как строки.【F:src/game/dataLoader.js†L96-L112】
- **Image IDs** for plants are alphanumeric strings such as `p13_1` or `97_6`. Bouquet-specific images use IDs like `bq001`. All plant image paths start with `images/`, while bouquet assets live under `images/bouquets/`. Plant image metadata lives in `plantData.json`, while bouquet assets are described inside [`bouquetQuestions.json`](../src/data/json/bouquetQuestions.json).【F:src/data/json/plantData.json†L7562-L7706】【F:src/game/dataLoader.js†L70-L84】

## Core entities

### Localized plant name (`plantNamesById`)
- **Location:** Раздел `plantNames` в `src/data/json/plantData.json`.
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

### Question sets registry (`questionSetsByType`)
- **Location:** Построен загрузчиком `dataLoader.js` и экспортируется в виде `questionSetsByType` и `questionsByType` (см. [`src/data/questions.js`](../src/data/questions.js)).
- **Shape:** Объект, где ключ — тип вопроса из [`questionTypes.js`](../src/data/questionTypes.js), а значение — уже нормализованный массив вопросов этого типа. Сейчас поддерживаются типы `plant` и `bouquet`.【F:src/game/dataLoader.js†L504-L533】【F:src/data/questions.js†L1-L15】
- **Usage:** UI и конфигурация раундов читают вопросы через этот реестр, поэтому добавление нового типа требует только регистратора нормализатора и обновления карты данных.

### Plant parameter entry (`plantParametersById`)
Loaded from [`plantFacts.json`](../src/data/json/plantFacts.json) и нормализованный загрузчиком, который приводит идентификаторы к общему формату и подставляет семейство растения, если оно отсутствует.
- **Required fields:** `scientificName` (string).
- **Optional fields:** `lifeCycle` (enum-like string), `additionalInfo` (string), `toxicity` (array of `{ level: number, tag: string }`), `hardinessZone` (string), `light` (string), `family` (string or `null`). Plant IDs can be numeric or underscore-delimited strings, normalized via `parseCatalogId` в загрузчике.【F:src/game/dataLoader.js†L182-L243】

### Plant family catalog (`plantFamilies`)
- **Shape:** Object mapping botanical family names to arrays of plant IDs (numeric or string) that belong to the family. IDs are normalized the same way as species IDs.【F:src/game/dataLoader.js†L144-L181】

### Plant image entry (`plantImages` / `plantImagesById`)
- **Shape:** Each entry has `id` (string) and `src` (relative image path starting with `images/`).
- **Required fields:** `id`, `src`.
- **Optional fields:** None. The helper `plantImagesById` materializes an ID→entry map for lookups.【F:src/data/json/plantData.json†L7562-L7706】【F:src/game/dataLoader.js†L256-L275】

### Bouquet question definition (`bouquetQuestions.json`)
- **Location:** Отдельный файл [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json), который читается загрузчиком при старте игры.
- **Required fields:** `imageId`, `image`, `correctPlantId` (или `correctAnswerId`), `wrongAnswerIds` (до трёх элементов). Допустимо указывать `selectionGroupId`, `questionPromptKey`, `questionVariantId` и кастомные `names`.
- **Normalization:** `buildBouquetQuestions` подставляет локализованные `names` по `correctPlantId`, вычисляет `questionType`, `questionPromptKey`, `difficulty` и `selectionGroupId`, а затем выдаёт готовые объекты, которые попадают в `questionSetsByType[questionTypes.BOUQUET]`.【F:src/game/dataLoader.js†L392-L455】【F:src/game/dataLoader.js†L511-L533】
- **Relationships:** `correctPlantId` должен существовать в `plantNamesById`; `imageId`/`image` должны ссылаться на файл в `images/bouquets/` и быть перечислены в `plantImages` при необходимости проверки существования. Если `difficulty` не указан, загрузчик попытается вывести его из таблиц сложности по ID растения или изображения.

## Cross-entity references

- `images` arrays in species or genus entries must reference image IDs declared in `plantImages`.
- `wrongAnswers` arrays always contain plant IDs that must resolve through `plantNamesById`/`speciesById`.
- `genusId` on a species record must reference an entry from the `genus` array so the loader can inherit defaults.【F:src/game/dataLoader.js†L198-L286】
- Bouquet question `correctPlantId` values must exist in `plantNamesById`, ensuring `names` is always hydrated during normalization.【F:src/game/dataLoader.js†L392-L455】


## Tooling

- Run `npm run export:data` to regenerate `src/data/json/plantData.json` and `bouquetQuestions.json` from the authoritative JS modules.【F:scripts/exportDataBundle.mjs†L1-L95】
- Run `npm run validate:data` to ensure the exported JSON matches `src/data/schema/plant.schema.json`. The validator uses Ajv (draft-07) and will fail when paths or references drift from the schema.【F:scripts/validateDataBundle.mjs†L1-L46】【F:src/data/schema/plant.schema.json†L1-L188】
