# Работа с JSON-данными каталога

Игровые данные распределены по нескольким JSON-файлам в каталоге [`src/data/json/`](../src/data/json):

- [`plantData.json`](../src/data/json/plantData.json) хранит нормализованный каталог растений: `plantNames`, `species`, `plantImages` и таблицы сложности (`difficulties`). Игровые вопросы (`plants`) собираются автоматически функцией `buildPlants()` во время загрузки.
- [`memorization.json`](../src/data/json/memorization.json) хранит параметры растений (`plantParameters`), ботанические семейства (`plantFamilies`), определения родов (`genus`) и список карточек режима заучивания (`plants`).
- [`bouquetQuestions.json`](../src/data/json/bouquetQuestions.json) содержит вопросы о букетах.

Загрузчик [`src/game/dataLoader.js`](../src/game/dataLoader.js) объединяет эти файлы в единый бандл (`speciesById`, `plants`, индексы сложности) и дополняет результат вопросами, которые подгружаются из отдельных файлов по типу. Для букетов используется [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json), для заучивания — [`src/data/json/memorization.json`](../src/data/json/memorization.json); в дальнейшем по аналогии можно добавить новые типы вопросов, просто зарегистрировав их нормализатор и указав путь к файлу.

## Жёсткие инварианты данных
- **`plantQuestions`** — не редактируются вручную и не хранятся в нормализованном `plantData.json`. Их формирует `buildPlants()` на основе разделов `plantNames`/`species`/`plantImages` и таблиц сложности. Любые попытки добавить или дублировать `plantQuestions` в других файлах считаются ошибкой.
- **`bouquet`** — все букетные вопросы хранятся только в [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json), причём пути к изображениям обязаны начинаться с `images/bouquets/`. В `plantData.json` не должно быть ни одной записи про букеты.
- **`memorization`** — конфигурация режима заучивания располагается строго в [`src/data/json/memorization.json`](../src/data/json/memorization.json). `plantData.json` не содержит разделов `memorization` или иных вспомогательных режимов.
- **Раздельные модули** — модульные JSON-файлы в `src/data/json/` являются каноничными. Склейка в единый бандл возможна только внутри экспортных и валидационных скриптов (`npm run export:data`, `npm run validate:data`); хранить объединённые структуры в репозитории нельзя.

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

4. Сопоставьте изменения с модульными файлами в `src/data/json/` и перенесите обновлённые значения в соответствующие разделы (`plantData.json`, `memorization.json`, `bouquetQuestions.json` при необходимости). После синхронизации запустите `npm run export:data` и `npm run validate:data`, чтобы обновить легаси-бандл и убедиться в корректности структуры.

Файл `PlantData.json`, созданный на шаге 3, служит промежуточным артефактом и не хранится в Git. Его можно удалять после того, как изменения перенесены в модульные JSON.

## Добавление нового растения

1. **Локализации** – добавьте или обновите объект внутри `plants` в [`plantData.json`](../src/data/json/plantData.json): укажите `id` (например, `123` или `123_1`) и переводы в блоке `names` (`ru`, `en`, `nl`, `sci`).
2. **Отвлекающие ответы и сложности** – при необходимости заполните `wrongAnswers` (список ID других растений) и базовое поле `difficulty`. Лоадер применит эти значения ко всем изображениям, если не задано индивидуальных переопределений.
3. **Изображения** – разместите файлы в каталоге `images/` и перечислите их в массиве `images` соответствующей записи (`{ "id": "pNNN_0_1", "src": "images/..." }`). Для отдельных снимков можно добавить `difficulty`, чтобы переопределить базовый уровень.
4. **Род** – если растение относится к новому роду или использует наследование, обновите раздел `genus` в [`memorization.json`](../src/data/json/memorization.json) (поле `entries`).

После правок запустите `npm run lint` и при необходимости `npm run validate:data`, чтобы убедиться в корректности легаси-бандла (`docs/legacy/plantData.bundle.json`). Скрипт [`scripts/verifyGameData.js`](../scripts/verifyGameData.js) остаётся частью `npm test` и проверяет, что загрузчик успешно собирает игровые данные из модульных JSON.

## Пересборка пакета данных

- [`scripts/exportDataBundle.mjs`](../scripts/exportDataBundle.mjs) пересобирает легаси-бандл `docs/legacy/plantData.bundle.json`, сортируя записи и обеспечивая стабильные диффы. Сам каталог `src/data/json/` при этом не перезаписывается.
- Файл с букетными вопросами (`bouquetQuestions.json`) остаётся в `src/data/json/` и заполняется вручную.

## Подключение букетных вопросов

1. Добавьте или обновите записи в [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json). Для каждой карточки укажите `image`, `imageId`, `correctPlantId` и до трёх `wrongAnswerIds`. Дополнительно можно задать `selectionGroupId`, `questionPromptKey`, `questionVariantId` и собственные `names`.
2. Убедитесь, что `imageId` ведёт к существующему файлу в `images/bouquets/` (путь в поле `image` должен содержать префикс `images/`).
3. Проверьте, что `correctPlantId` и все значения в `wrongAnswerIds` присутствуют в каталоге `plants` [`plantData.json`](../src/data/json/plantData.json). Загрузчик автоматически подтянет локализации и подсказки.
4. При необходимости назначьте сложность: можно прописать поле `difficulty` прямо в объекте или в конкретных изображениях внутри `plants`.
5. После добавления данных запустите игру — `dataLoader.js` объединит растения и букеты в `questionsByType`, а классический режим гарантирует один букетный вопрос за сессию, пока остаются неразыгранные группы.
