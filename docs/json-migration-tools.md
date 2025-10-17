# JSON Migration Tooling Review

This document records the current state of the JSON migration tooling, checks that were run, and follow-up work required before the application can rely on JSON as the primary data source. The tooling lives on the dedicated `json` integration branch while we keep the production `main` branch on the original JS data path, so all commands and paths below assume you are working from that branch.

## Delivered tooling

- **`scripts/exportDataBundle.mjs`** bundles all runtime data (localized names, species catalog, images, plant parameters, families, bouquet questions, genus definitions and generated plant questions) into `src/data/json/plantData.json`. The exporter sorts records to provide deterministic diffs and exposes a single entrypoint that mirrors the existing in-memory structures.【F:scripts/exportDataBundle.mjs†L1-L95】
- **`scripts/validateDataBundle.mjs`** validates the generated bundle against `src/data/schema/plant.schema.json` using Ajv. Validation is strict enough to catch data regressions (for example, a missing `images/` prefix in `src/data/images.js` blocked the first validation run).【F:scripts/validateDataBundle.mjs†L1-L46】【F:src/data/images.js†L80-L87】
- **`package.json`** now exposes `npm run export:data` and `npm run validate:data` so the dataset can be regenerated and checked locally or in CI.【F:package.json†L6-L22】
- **`src/data/json/plantData.json`** is the canonical JSON export produced by the new script. It matches the `plant.schema.json` expectations and can be used for downstream tooling or future runtime loaders.【F:src/data/json/plantData.json†L1-L20】【F:src/data/schema/plant.schema.json†L1-L188】

## Validation results

1. `npm run export:data` succeeds and recreates the bundle from the current JS sources.【7a9ea9†L1-L7】
2. `npm run validate:data` passes once the image path regression is fixed, confirming the exported JSON is schema-compliant.【6a7ca7†L1-L7】

## Gaps and risks

- **Runtime still depends on JS modules.** The game code continues to import JS datasets; JSON is generated offline only. A loader that hydrates runtime state from `plantData.json` is still missing.
- **No CSV/tabular ingest path yet.** The exporter makes it easy to snapshot current data but there is no inverse process that would take spreadsheet rows (or the JSON bundle) and apply them back into the JS sources or a new JSON-first pipeline.
- **Schema target downgraded to draft-07.** Validation uses Ajv v6, so the schema currently relies on draft-07 features only. If we want 2020-12 features we will need to vendor Ajv v8 or adjust installation policies.
- **Image existence and auxiliary checks out of scope.** The validator ensures structural correctness but does not check that image files exist on disk, that wrong answer IDs resolve, or that difficulty mappings stay synchronized. Those checks are still enforced implicitly by the JS pipeline.

## Recommended next steps

1. **Build a runtime loader for JSON** that replicates the current `catalog.js` assembly logic while reading from `plantData.json`. Ship the loader behind a feature flag so we can compare JS-vs-JSON output before switching the game over.
2. **Add a round-trip test** that runs `npm run export:data`, loads the bundle back through the new loader, and asserts equality with `speciesById`, `plants`, `bouquetQuestions`, etc. This prevents divergence between the JSON snapshot and runtime logic.
3. **Automate referential integrity checks** (IDs resolving to known species, image files existing, difficulty references staying valid). These can live in the validator script alongside the schema check.
4. **Design an ingest workflow** for editors (CSV → JSON or direct JSON editing) and document it. Ideally provide a script that can merge tabular updates into the bundle while maintaining sorting and validation guarantees.
5. **Update developer docs/CI** once the loader is ready: integrate `npm run export:data && npm run validate:data` into the standard pre-commit/CI routines so regressions are caught early.

With these steps the project can safely transition from JS-first data definitions to a JSON-centric content pipeline while maintaining data quality guarantees.
