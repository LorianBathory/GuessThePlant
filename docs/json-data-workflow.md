# Работа с JSON-данными каталога

Начиная с этого изменения, все исходные данные викторины хранятся в JSON-файлах в директории [`src/data/json/`](../src/data/json/). Загрузчик [`src/game/dataLoader.js`](../src/game/dataLoader.js) отвечает за сборку итоговых структур (каталога видов, вопросов, индексов сложностей) на основе этих файлов.

## Добавление нового растения

1. **Имена** – добавьте локализованные названия в [`plantNames.json`](../src/data/json/plantNames.json). Используйте существующую схему идентификаторов (`100`, `100_1` и т. п.).
2. **Изображения** – добавьте информацию о снимках в [`plantImages.json`](../src/data/json/plantImages.json). Убедитесь, что файлы лежат в `images/` и не относятся к `images/bouquets/`.
3. **Каталог вида** – заполните [`speciesCatalog.json`](../src/data/json/speciesCatalog.json). Укажите `images`, `wrongAnswers` и, при необходимости, `genusId` для наследования настроек из рода.
4. **Род** – если растение относится к новому роду или использует наследование, обновите [`genus.json`](../src/data/json/genus.json) (поле `entries`).
5. **Сложность** – при необходимости скорректируйте уровни сложности в [`difficulties.json`](../src/data/json/difficulties.json).

После правок запустите

```bash
npm test
npm run lint
```

Скрипт `npm test` вызывает [`scripts/verifyGameData.js`](../scripts/verifyGameData.js), который проверяет корректность загрузки JSON и построение структур.

## Пересборка пакета данных

- [`scripts/exportGameData.js`](../scripts/exportGameData.js) перечитывает существующие JSON-файлы каталога и приводит их к единому форматированию (включая `plantNames.json`, `plantImages.json`, `genus.json`, `speciesCatalog.json`, `bouquetQuestions.json`, `difficulties.json`).
- [`scripts/exportDataBundle.mjs`](../scripts/exportDataBundle.mjs) собирает агрегированный `plantData.json` из текущего состояния каталога и дополнительных параметров.
