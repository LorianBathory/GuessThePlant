# Работа с JSON-данными каталога

Начиная с этого изменения, растениеведческие данные (названия, виды, изображения, таблицы сложности) остаются в едином файле [`src/data/json/plantData.json`](../src/data/json/plantData.json). Загрузчик [`src/game/dataLoader.js`](../src/game/dataLoader.js) строит из него каталоги (`speciesById`, `plants`, индексы сложности) и дополняет результат вопросами, которые подгружаются из отдельных файлов по типу. Для букетов используется [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json); в дальнейшем по аналогии можно добавить новые типы вопросов, просто зарегистрировав их нормализатор и указав путь к файлу.

## Добавление нового растения

1. **Имена** – добавьте локализованные названия в раздел `plantNames` внутри [`plantData.json`](../src/data/json/plantData.json). Используйте существующую схему идентификаторов (`100`, `100_1` и т. п.).
2. **Изображения** – укажите карточку изображения в массиве `plantImages`. Файлы должны лежать в `images/` (для букетов см. раздел ниже).
3. **Каталог вида** – дополните раздел `species`, прописав `images`, `wrongAnswers` и, при необходимости, `genusId` для наследования настроек из рода.
4. **Род** – если растение относится к новому роду или использует наследование, обновите раздел `genus` (поле `entries`).
5. **Сложность** – при необходимости скорректируйте уровни сложности в блоке `difficulties` (`questionIdsByDifficulty` и `imageIdsByDifficulty`).

После правок запустите `npm run lint` и при необходимости `npm run validate:data`, чтобы убедиться в корректности структуры `plantData.json`. Скрипт [`scripts/verifyGameData.js`](../scripts/verifyGameData.js) остаётся частью `npm test` и проверяет, что загрузчик успешно собирает игровые данные.

## Пересборка пакета данных

- [`scripts/exportDataBundle.mjs`](../scripts/exportDataBundle.mjs) пересобирает `plantData.json` из данных, которые загружает игра (включая параметры растений), сортируя записи и обеспечивая стабильные диффы.
- Файл с букетными вопросами (`bouquetQuestions.json`) собирается тем же скриптом и попадает в каталог `src/data/json/` рядом с `plantData.json`.

## Подключение букетных вопросов

1. Добавьте или обновите записи в [`src/data/json/bouquetQuestions.json`](../src/data/json/bouquetQuestions.json). Для каждой карточки укажите `image`, `imageId`, `correctPlantId` и до трёх `wrongAnswerIds`. Дополнительно можно задать `selectionGroupId`, `questionPromptKey`, `questionVariantId` и собственные `names`.
2. Убедитесь, что `imageId` ведёт к существующему файлу в `images/bouquets/` (путь в поле `image` должен содержать префикс `images/`).
3. Проверьте, что `correctPlantId` и все значения в `wrongAnswerIds` присутствуют в `plantData.json` (раздел `plantNames`/`species`). Загрузчик автоматически подтянет локализации и подсказки.
4. При необходимости назначьте сложность: можно прописать поле `difficulty` прямо в объекте или использовать таблицы `questionIdsByDifficulty`/`imageIdsByDifficulty` в `plantData.json`.
5. После добавления данных запустите игру — `dataLoader.js` объединит растения и букеты в `questionsByType`, а классический режим гарантирует один букетный вопрос за сессию, пока остаются неразыгранные группы.
