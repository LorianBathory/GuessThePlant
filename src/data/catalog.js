import { getDifficultyByQuestionId, getDifficultyByImageId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { getImagesByPlantId } from './images.js';

// Дополнительные данные для видов (кроме локализации и списка изображений).
const speciesAdditionalData = {
  1:  { wrongAnswers: [7, 8, 9] },
  2:  { wrongAnswers: [10, 11, 12] },
  3:  { wrongAnswers: [13, 14, 15, 16] },
  4:  { wrongAnswers: [17, 18, 19, 20] },
  5:  { wrongAnswers: [20, 21, 31, 23, 24] },
  6:  { wrongAnswers: [25, 26, 27, 28, 29] },
  26: { wrongAnswers: [33, 73, 77, 39] },
  27: { wrongAnswers: [6, 26] },
  29: { wrongAnswers: [7, 41, 42] },
  30: { wrongAnswers: [38, 39, 40, 6, 25, 16] },
  31: { wrongAnswers: [7, 41, 42] },
  32: { wrongAnswers: [43, 44, 45] },
  33: { wrongAnswers: [31, 47, 46] },
  34: { wrongAnswers: [43, 48, 49] },
  35: { wrongAnswers: [16, 36, 37] },
  41: { wrongAnswers: [39, 40, 67] },
  46: { wrongAnswers: [31, 33] },
  47: { wrongAnswers: [76] },
  50: { wrongAnswers: [18, 56, 57, 79] },
  51: { wrongAnswers: [58, 59, 60] },
  52: { wrongAnswers: [61, 62] },
  53: { wrongAnswers: [63] },
  54: { wrongAnswers: [64, 65, 66] },
  55: { wrongAnswers: [67] },
  69: { wrongAnswers: [31, 22] },
  73: { wrongAnswers: [29] },
  77: { wrongAnswers: [58, 48, 57] },
  78: { wrongAnswers: [76] },
  79: { wrongAnswers: [18] }
};

// ЕДИНЫЙ ИСТОЧНИК ДАННЫХ: все таксоны в одном месте.
export const speciesById = Object.freeze(
  Object.fromEntries(
    Object.entries(plantNamesById).map(([id, names]) => [
      Number(id),
      {
        names,
        ...(speciesAdditionalData[id] || {})
      }
    ])
  )
);

// ПРОИЗВОДНЫЕ ПРЕДСТАВЛЕНИЯ (для совместимости с текущей логикой):
export const choicesById = Object.fromEntries(
  Object.entries(speciesById).map(([id, v]) => [Number(id), v.names])
);

export const ALL_CHOICE_IDS = Object.freeze(
  Object.keys(speciesById).map(n => Number(n))
);

// Растения, доступные как ВОПРОСЫ прямо сейчас (есть image):
// Каждое растение может содержать несколько изображений (см. plantImages в images.js).
// Для каждого снимка можно указать собственную сложность через difficulties.js.
// Если она не задана, применяется общее правило из difficulties.js.
// questionVariantId остаётся уникальным идентификатором конкретного снимка,
// при этом поле id всегда соответствует идентификатору растения для ответов.
export const plants = Object.entries(speciesById)
  .flatMap(([id, v]) => {
    const numericId = Number(id);
    const imageEntries = getImagesByPlantId(numericId);

    return imageEntries
      .filter(imageEntry => imageEntry && typeof imageEntry.src === 'string')
      .map((imageEntry, index) => {
        const overrideDifficulty = getDifficultyByImageId(imageEntry.id);

        return {
          id: numericId,
          imageId: imageEntry.id,
          image: imageEntry.src,
          names: v.names,
          wrongAnswers: v.wrongAnswers,
          difficulty: overrideDifficulty || getDifficultyByQuestionId(numericId),
          questionVariantId: `${numericId}-${index}`
        };
      });
  });
