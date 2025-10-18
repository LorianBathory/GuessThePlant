# Repository-wide Guidance

Welcome to *Guess The Plant*! This project is a static React (UMD) application loaded straight from `index.html` without a bundler. Please follow these rules whenever you modify files in this repository:

## General principles
- **Keep the app bundler-free.** All browser code must remain valid as native ES modules executed directly from the filesystem. Avoid syntax or APIs that require a build step (e.g., JSX, TypeScript, decorators). Stick to plain JavaScript modules and DOM APIs that work in evergreen browsers.
- **Respect the React global.** Components import `globalThis.React` (and `ReactDOM`) that are attached by the UMD bundles in `index.html`. Never replace them with `import React from 'react'` style statements.
- **Prefer functional, side-effect-free helpers.** Utility functions should stay pure unless side effects are required (e.g., storage, network). Reuse existing helpers in `src/utils/` and `src/gameConfig.js` when possible.
- **Use existing localization patterns.** Interface strings live in `src/i18n/uiTexts.js`, plant names in `src/data/json/plantNames.json` (exposed via `src/game/dataLoader.js`), and game texts are selected through helpers in those modules. Add new languages or strings by extending these files rather than hardcoding text.
- **Image security matters.** When working with plant images, use the secure loading flow (`SecurePlantImage` + `useSecureImageSource`). Do not expose raw file names or bypass the blob URL indirection.
- **Follow ESLint.** Run `npm run lint` before submitting changes and keep code compatible with the settings in `eslint.config.js`.

## File/Directory conventions
- `src/components/` render React elements via `React.createElement`. Maintain this style; do not introduce JSX.
- `src/hooks/` contain stateful logic shared across components. Encapsulate mode-specific behavior in hooks instead of components when possible.
- `src/data/` modules are plain configuration objects. Keep IDs stable and follow the existing hierarchy for genus/species (`100`, `100_1`, etc.).
- `voice-mode/` is a parallel entry point optimised for screen readers. Any shared logic should live in `src/voiceMode/` or shared hooks; avoid duplicating core rules.

## Testing & documentation
- For significant UI changes that affect layout or styles, capture a screenshot via the provided browser tooling and attach it to your final report.
- Update documentation (`README.md`, `PROJECT_STRUCTURE`) when structural project changes occur.

Have fun building the quiz! 🎍
