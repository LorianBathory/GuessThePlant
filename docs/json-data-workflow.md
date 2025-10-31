# Работа с JSON-данными каталога

Игровые данные распределены по нескольким JSON-файлам в каталоге [`src/data/json/`](../src/data/json):

- [`plantCatalog.json`](../src/data/json/plantCatalog.json) хранит локализованные названия, список видов (`species`) и метаданные изображений (`plantImages`).
- [`plantFacts.json`](../src/data/json/plantFacts.json) содержит параметры растений (`plantParameters`), ботанические семейства (`plantFamilies`) и определения родов (`genus`).
- [`plantData.json`](../src/data/json/plantData.json) держит игровые вопросы (`plantQuestions`), таблицы сложности (`difficulties`) и вспомогательные режимы (например, `memorization`).

Загрузчик [`src/game/dataLoader.js`](../src/game/dataLoader.js) объединяет эти файлы в единый бандл (`speciesById`, `plants`, индексы сложности) и дополняет результат вопросами, которые подгружаются из отдельных файлов по типу. Для букетов используется [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json); в дальнейшем по аналогии можно добавить новые типы вопросов, просто зарегистрировав их нормализатор и указав путь к файлу.

## Табличный цикл редактирования

Для офлайн-редактирования локализаций и справочных данных используется CSV-слепок `PlantData.csv`, который поддерживает конвертер [`tools/plantDataConverter.mjs`](../tools/plantDataConverter.mjs). Рабочий процесс выглядит так:

1. Обновите CSV из легаси-бандла (если требуется актуальная копия):

   ```bash
   node tools/plantDataConverter.mjs to-csv --input docs/legacy/plantData.bundle.json --output PlantData.csv
   ```

2. Внесите изменения в `PlantData.csv` (вручную или через вспомогательные скрипты наподобие [`scripts/translate/translation_pipeline.py`](../scripts/translate/translation_pipeline.py)). Структура колонок описана в `docs/plant-data-converter-guide.md`.
3. Преобразуйте таблицу обратно в JSON, указав временный артефакт (например, `PlantData.json`) или перезаписав `docs/legacy/plantData.bundle.json`:

   ```bash
   node tools/plantDataConverter.mjs to-json --input PlantData.csv --output PlantData.json
   ```

4. Сопоставьте изменения с модульными файлами в `src/data/json/` и перенесите обновлённые значения в соответствующие разделы (`plantCatalog.json`, `plantFacts.json`, `plantData.json`). После синхронизации запустите `npm run export:data` и `npm run validate:data`, чтобы обновить легаси-бандл и убедиться в корректности структуры.

Файл `PlantData.json`, созданный на шаге 3, служит промежуточным артефактом и не хранится в Git. Его можно удалять после того, как изменения перенесены в модульные JSON.

## Добавление нового растения

1. **Имена** – добавьте локализованные названия в раздел `plantNames` внутри [`plantCatalog.json`](../src/data/json/plantCatalog.json). Используйте существующую схему идентификаторов (`100`, `100_1` и т. п.).
2. **Изображения** – укажите карточку изображения в массиве `plantImages` того же файла. Файлы должны лежать в `images/` (для букетов см. раздел ниже).
3. **Каталог вида** – дополните раздел `species` в `plantCatalog.json`, прописав `images`, `wrongAnswers` и, при необходимости, `genusId` для наследования настроек из рода.
4. **Род** – если растение относится к новому роду или использует наследование, обновите раздел `genus` в [`plantFacts.json`](../src/data/json/plantFacts.json) (поле `entries`).
5. **Сложность** – при необходимости скорректируйте уровни сложности в блоке `difficulties` (`questionIdsByDifficulty` и `imageIdsByDifficulty`) внутри [`plantData.json`](../src/data/json/plantData.json).

После правок запустите `npm run lint` и при необходимости `npm run validate:data`, чтобы убедиться в корректности легаси-бандла (`docs/legacy/plantData.bundle.json`). Скрипт [`scripts/verifyGameData.js`](../scripts/verifyGameData.js) остаётся частью `npm test` и проверяет, что загрузчик успешно собирает игровые данные из модульных JSON.

## Пересборка пакета данных

- [`scripts/exportDataBundle.mjs`](../scripts/exportDataBundle.mjs) пересобирает легаси-бандл `docs/legacy/plantData.bundle.json`, сортируя записи и обеспечивая стабильные диффы. Сам каталог `src/data/json/` при этом не перезаписывается.
- Файл с букетными вопросами (`bouquetQuestions.json`) остаётся в `src/data/json/` и заполняется вручную.

## Подключение букетных вопросов

1. Добавьте или обновите записи в [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json). Для каждой карточки укажите `image`, `imageId`, `correctPlantId` и до трёх `wrongAnswerIds`. Дополнительно можно задать `selectionGroupId`, `questionPromptKey`, `questionVariantId` и собственные `names`.
2. Убедитесь, что `imageId` ведёт к существующему файлу в `images/bouquets/` (путь в поле `image` должен содержать префикс `images/`).
3. Проверьте, что `correctPlantId` и все значения в `wrongAnswerIds` присутствуют в `plantCatalog.json` (раздел `plantNames`/`species`). Загрузчик автоматически подтянет локализации и подсказки.
4. При необходимости назначьте сложность: можно прописать поле `difficulty` прямо в объекте или использовать таблицы `questionIdsByDifficulty`/`imageIdsByDifficulty` в `plantData.json`.
5. После добавления данных запустите игру — `dataLoader.js` объединит растения и букеты в `questionsByType`, а классический режим гарантирует один букетный вопрос за сессию, пока остаются неразыгранные группы.
