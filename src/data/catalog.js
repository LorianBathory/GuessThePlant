import { getDifficultyByQuestionId, getDifficultyByImageId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { plantImagesById } from './images.js';
import { questionTypes } from './questionTypes.js';

// Дополнительные данные для видов (кроме локализации).
const speciesCatalog = Object.freeze({
  1:  { images: ['p001'], wrongAnswers: [7, 8, 9] }, //Asteriscus
  2:  { images: ['p002'], wrongAnswers: [10, 11, 12] }, //Daucus carota
  3:  { images: ['p003', 'p046'], wrongAnswers: [13, 14, 15, 16, 142] }, //Agapanthus
  4:  { images: ['p004', 'p044'], wrongAnswers: [17, 18, 19, 21] }, //Bougainvillea
  5:  { images: ['p005', 'p043', 'p054', 'p095'], wrongAnswers: [21, 31, 23, 24] }, //camellia
  6:  { images: ['p006'], wrongAnswers: [25, 26, 27, 29] }, //Gerbera
    8: {images: ['p107', 'p108', 'p109', 'p110', 'p111', 'p112', 'p113'], wrongAnswers: [30, 100, 39]}, //gazania
    12: {images: ['p124'], wrongAnswers: [2, 11]}, //Parsnip
  13: {images: ['p086', 'p087', 'p088'], wrongAnswers: [3, 11, 129]}, //Allium
  14: {images: ['p057'], wrongAnswers: [142]}, //camassia
  16: {images: ['p105'], wrongAnswers: [35, 111]}, //Fritillary
  17: { images: ['p007'] },
  19: { images: ['p008'],  wrongAnswers: [5, 21, 49]}, //Oleander. осталось добавить адениус
    //20: { images: ['p009'], wrongAnswers: [3, 11, 12]}, - Celosia, нужно добавить в растения амарант и астильбу
  21: {images: ['p076', 'p128', 'p129'], wrongAnswers: [5, 19] }, //Rhododendron. добавить вишню для вариантов ответа
  22: { images: ['p009', 'p133'], wrongAnswers: [35, 46]  }, //Tulip
  23: { images: ['p106'], }, wrongAnswers: [5, 21, 31], //gardenia
  24: { images: ['p120', 'p121'] }, //magnolia
  25: { images: ['p130'],  wrongAnswers: [29, 119] }, //Shasta Daisy, добавить ромашку аптечную в список растений
  26: { images: ['p010', 'p011', 'p100'], wrongAnswers: [29, 33, 73, 77] }, //Dahlia. добавить циннию
  27: { images: ['p012', 'p103', 'p104'], wrongAnswers: [6, 38, 115, 121] }, //Echinacea
  29: { images: ['p013', 'p014', 'p096', 'p097', 'p098'], wrongAnswers: [6, 26, 41, 73] }, //Chrysanthemum
  30: { images: ['p015', 'p066'], wrongAnswers: [38, 39, 40, 6, 25, 8] }, //osteospermum
  31: { images: ['p016', 'p017', 'p018', 'p077', 'p078'], wrongAnswers: [41, 69, 46, 5] },
  32: { images: ['p019'], wrongAnswers: [43, 44, 45] },
  33: { images: ['p020', 'p021', 'p122', 'p123'], wrongAnswers: [47, 41, 26] }, //Papaver
  34: { images: ['p022'], wrongAnswers: [448, 49] },
  35: { images: ['p023', 'p118', 'p119'], wrongAnswers: [36, 37] }, //Lily
  36: { images: ['p114', 'p115'] }, //Hemerocallis
    39: {images: ['p134'], wrongAnswers: [40, 100, 121] }, //heliopsis, надо добавить топинамбур - 135
  41: { images: ['p024', 'p101'], wrongAnswers: [39, 40, 97] }, //Dianthus - ждет добавления агростеммы
  46: { images: ['p025', 'p125', 'p126'], wrongAnswers: [31, 33, 41] }, //Peony
  47: { images: ['p026', 'p027', 'p089'], wrongAnswers: [33] }, //anemone
  50: { images: ['p028', 'p045'], wrongAnswers: [18, 34, 56, 57, 79] },
  51: { images: ['p029', 'p073'], wrongAnswers: [58, 59, 5] },
  52: { images: ['p030'], wrongAnswers: [61] }, //Japanese pittosporum
  53: { images: ['p031'], wrongAnswers: [13, 15, 116] }, //scabious
  54: { images: ['p032', 'p063', 'p064'], wrongAnswers: [64, 65, 66] }, //lantana
  55: { images: ['p033', 'p034', 'p035'], wrongAnswers: [67] }, //Hibiscus
    58: { images: ['p102'], wrongAnswers: [4] }, //Dog-rose, wrongAnswers надо
    62: {images: ['p090', 'p091'], wrongAnswers: [2] }, //apple, wrongAnswers надо
  68: { images: ['p036', 'p116', 'p117'] }, //lavender
  69: { images: ['p037'], wrongAnswers: [31, 22] },
  72: { images: ['p052'], wrongAnswers: [11] }, //лопух. wrongAnswers надо заменить
  73: { images: ['p038', 'p047', 'p092', 'p093'], wrongAnswers: [29] }, //aster, wrongAnswers надо
  74: { images: ['p070'], wrongAnswers: [41, 54] }, //phlox, wrongAnswers надо дополнить
  75: { images: ['p039', 'p082'] },
  76: { images: ['p069', 'p127'] }, //petunia
  77: { images: ['p040'], wrongAnswers: [58, 48, 57] },
  78: { images: ['p041'], wrongAnswers: [76] },
  79: { images: ['p042'], wrongAnswers: [18] },
  80: { images: ['p053'], wrongAnswers: [17] }, //временный wrongAnswer +
  81: { images: ['p059'], wrongAnswers: [19] }, //временный wrongAnswer +
  82: { images: ['p084'], wrongAnswers: [20] }, //viola. временный wrongAnswer +
  83: { images: ['p055'], wrongAnswers: [21] }, //campanula, временный wrongAnswer +
  84: { images: ['p062'], wrongAnswers: [22] }, //Kohlrabi, временный wrongAnswer +
  85: { images: ['p051', 'p094'], wrongAnswers: [23] }, //Buddleja, временный wrongAnswer +
    86: { images: ['p071', 'p072'], wrongAnswers: [24] }, //Plumeria временный wrongAnswer +
     //87. Lotus пока не залит.
    88: { images: ['p060', 'p061'], wrongAnswers: [10] }, //Hydrangea, нужно добавить еще wrongAnswer, но 10 нельзя убирать +
    89: { images: ['p079'], wrongAnswers: [25] }, //Santolina временный wrongAnswer +
    90: { images: ['p058'], wrongAnswers: [26] }, //Fagus временный wrongAnswer +
    91: { images: ['p049', 'p050'], wrongAnswers: [27] }, //Begonia временный wrongAnswer+
    92: { images: ['p074', 'p075'], wrongAnswers: [28] }, //Ranunculus временный wrongAnswer+
    93: { images: ['p081'], wrongAnswers: [80, 81] }, //Syngonium временный wrongAnswer+
    94: { images: ['p065'], wrongAnswers: [86, 79, 69] }, //Orchid, временный wrongAnswer
    95: { images: ['p048'], wrongAnswers: [62, 44] }, //Banana временный wrongAnswer +
    96: { images: ['p085'], wrongAnswers: [29, 93] }, //Zamioculcas временный wrongAnswer +
    97: { images: ['p083', 'p131', 'p132'], wrongAnswers: [30, 95] }, //Tagetes временный wrongAnswer +
    98: { images: ['p067', 'p068'], wrongAnswers: [31] }, //Passiflora временный wrongAnswer +
    //99: { images: ['p055'], wrongAnswers: [43, 44] }, //временный wrongAnswer
    100: { images: ['p080'], wrongAnswers: [6, 39, 27] }, //Sunflower +
    101: { images: ['p056', 'p099'], wrongAnswers: [16, 50] }, //Cosmos временный wrongAnswer +
    //102-111
    112: { images: ['p140', 'p141', 'p142'] },
    //102-141
    142: {images: ['p134', 'p135', 'p136', 'p137', 'p138', 'p139'], wrongAnswers: [14] }, //Hyacinthus
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
      const overrideDifficulty = getDifficultyByImageId(imageEntry.id, questionTypes.PLANT);

      return {
        id: numericId,
        correctAnswerId: numericId,
        imageId: imageEntry.id,
        image: imageEntry.src,
        names: v.names,
        wrongAnswers: v.wrongAnswers,
        difficulty: overrideDifficulty || getDifficultyByQuestionId(numericId, questionTypes.PLANT),
        questionVariantId: `${numericId}-${index}`,
        questionType: questionTypes.PLANT,
        selectionGroupId: `plant-${numericId}`,
        questionPromptKey: 'question'
      };
    });
  });
