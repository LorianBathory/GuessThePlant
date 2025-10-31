# Legacy plant data bundle

The file [`plantData.bundle.json`](./plantData.bundle.json) stores a self-contained export of all plant-related data. It mirrors
the structure produced by `npm run export:data` and exists as a convenience artifact for tooling such as
`tools/plantDataConverter.mjs`, which expects the historical single-file layout (`plantNames`, `species`, `plantImages`,
`plantParameters`, `plantFamilies`, `genus`, `plantQuestions`, `difficulties`).

Runtime no longer reads this bundle directly: the game uses the normalized JSON modules under `src/data/json/` instead.
Whenever the active datasets change, regenerate the archive with:

```bash
npm run export:data
```

The command rewrites `docs/legacy/plantData.bundle.json`, keeping the bundle in sync with the authoritative JSON modules.
