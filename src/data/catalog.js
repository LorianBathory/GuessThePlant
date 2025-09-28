import { getDifficultyByQuestionId, getDifficultyByImageId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { plantImagesById } from './images.js';

// Дополнительные данные для видов (кроме локализации).
const speciesCatalog = Object.freeze({
  1:  { images: ['p001'], wrongAnswers: [7, 8, 9] },
  2:  { images: ['p002'], wrongAnswers: [10, 11, 12] },
  3:  { images: ['p003'], wrongAnswers: [13, 14, 15, 16] },
  4:  { images: ['p004', 'p044'], wrongAnswers: [17, 18, 19, 20] },
  5:  { images: ['p005', 'p043'], wrongAnswers: [20, 21, 31, 23, 24] },
  6:  { images: ['p006'], wrongAnswers: [25, 26, 27, 28, 29] },
  17: { images: ['p007'] },
  19: { images: ['p008'] },
  22: { images: ['p009'] },
  26: { images: ['p010', 'p011'], wrongAnswers: [33, 73, 77, 39] },
  27: { images: ['p012'], wrongAnswers: [6, 26] },
  29: { images: ['p013', 'p014'], wrongAnswers: [7, 41, 42] },
  30: { images: ['p015'], wrongAnswers: [38, 39, 40, 6, 25, 16] },
  31: { images: ['p016', 'p017', 'p018'], wrongAnswers: [7, 41, 42] },
  32: { images: ['p019'], wrongAnswers: [43, 44, 45] },
  33: { images: ['p020', 'p021'], wrongAnswers: [31, 47, 46] },
  34: { images: ['p022'], wrongAnswers: [43, 48, 49] },
  35: { images: ['p023'], wrongAnswers: [16, 36, 37] },
  41: { images: ['p024'], wrongAnswers: [39, 40, 67] },
  46: { images: ['p025'], wrongAnswers: [31, 33] },
  47: { images: ['p026', 'p027'], wrongAnswers: [76] },
  50: { images: ['p028', 'p045'], wrongAnswers: [18, 56, 57, 79] },
  51: { images: ['p029'], wrongAnswers: [58, 59, 60] },
  52: { images: ['p030'], wrongAnswers: [61, 62] },
  53: { images: ['p031'], wrongAnswers: [63] },
  54: { images: ['p032'], wrongAnswers: [64, 65, 66] },
  55: { images: ['p033', 'p034', 'p035'], wrongAnswers: [67] },
  68: { images: ['p036'] },
  69: { images: ['p037'], wrongAnswers: [31, 22] },
  73: { images: ['p038'], wrongAnswers: [29] },
  75: { images: ['p039'] },
  77: { images: ['p040'], wrongAnswers: [58, 48, 57] },
  78: { images: ['p041'], wrongAnswers: [76] },
  79: { images: ['p042'], wrongAnswers: [18] },
  80: { images: ['p053'], wrongAnswers: [17] }, //временный wrongAnswer +
  81: { images: ['p059'], wrongAnswers: [19] }, //временный wrongAnswer +
  82: { images: ['p084'], wrongAnswers: [20] }, //viola. временный wrongAnswer +
  83: { images: ['p055'], wrongAnswers: [21] }, //campanula, временный wrongAnswer +
  84: { images: ['p062'], wrongAnswers: [22] }, //Kohlrabi, временный wrongAnswer +
  85: { images: ['p051'], wrongAnswers: [23] }, //Buddleja, временный wrongAnswer +
    86: { images: ['p071', 'p072'], wrongAnswers: [24] }, //Plumeria временный wrongAnswer +
     //87. Lotus пока не залит.
    88: { images: ['p060', 'p061'], wrongAnswers: [10] }, //Hydrangea, нужно добавить еще wrongAnswer, но 10 нельзя убирать +
    89: { images: ['p079'], wrongAnswers: [25] }, //Santolina временный wrongAnswer +
    90: { images: ['p058'], wrongAnswers: [26] }, //Fagus временный wrongAnswer +
    91: { images: ['p049', 'p050'], wrongAnswers: [43, 44] }, //Begonia временный wrongAnswer
    92: { images: ['p055'], wrongAnswers: [43, 44] }, //Ranunculus временный wrongAnswer
    93: { images: ['p055'], wrongAnswers: [43, 44] }, //Syngonium временный wrongAnswer
    94: { images: ['p055'], wrongAnswers: [43, 44] }, //Orchid временный wrongAnswer
    95: { images: ['p055'], wrongAnswers: [43, 44] }, //Banana временный wrongAnswer
    96: { images: ['p055'], wrongAnswers: [43, 44] }, //Zamioculcas временный wrongAnswer
    97: { images: ['p055'], wrongAnswers: [43, 44] }, //Tagetes временный wrongAnswer
    98: { images: ['p055'], wrongAnswers: [43, 44] }, //Passiflora временный wrongAnswer
    // 99: { images: ['p055'], wrongAnswers: [43, 44] }, //временный wrongAnswer
    100: { images: ['p055'], wrongAnswers: [43, 44] }, //Sunflower временный wrongAnswer
    101: { images: ['p055'], wrongAnswers: [43, 44] }, //Cosmos временный wrongAnswer
});

// ЕДИНЫЙ ИСТОЧНИК ДАННЫХ: все таксоны в одном месте.
export const speciesById = Object.freeze(
  Object.fromEntries(
    Object.entries(plantNamesById).map(([id, names]) => {
      const numericId = Number(id);
      const catalogEntry = speciesCatalog[numericId] || {};
      const images = catalogEntry.images
        ? Object.freeze([...catalogEntry.images])
        : undefined;
      const wrongAnswers = catalogEntry.wrongAnswers
        ? Object.freeze([...catalogEntry.wrongAnswers])
        : undefined;

      return [
        numericId,
        {
          names,
          ...(images ? { images } : {}),
          ...(wrongAnswers ? { wrongAnswers } : {})
        }
      ];
    })
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
    const imageEntries = (v.images || [])
      .map(imageId => plantImagesById[imageId])
      .filter(imageEntry => imageEntry && typeof imageEntry.src === 'string');

    return imageEntries.map((imageEntry, index) => {
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
