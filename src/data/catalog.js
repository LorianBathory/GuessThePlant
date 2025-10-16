import { getDifficultyByQuestionId, getDifficultyByImageId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { plantImagesById } from './images.js';
import { questionTypes } from './questionTypes.js';
import { genusById } from './genus/index.js';

// Дополнительные данные для видов (кроме локализации).
const speciesCatalog = Object.freeze({
  1:  { images: ['p001'], wrongAnswers: [7, 8, 9] }, //Asteriscus
  2:  { images: ['p002'], wrongAnswers: [10, 11, 12] }, //Daucus carota
  3:  { images: ['p003', 'p046'], wrongAnswers: [13, 14, 15, 16, 142] }, //Agapanthus
  4:  { images: ['p004', 'p044'], wrongAnswers: [17, 18, 19, 21] }, //Bougainvillea
  5:  { images: ['p005', 'p043', 'p054', 'p095', 'p158'], wrongAnswers: [21, 31, 23, 24] }, //camellia
  6:  { images: ['p006'], wrongAnswers: [25, 26, 27, 29] }, //Gerbera
  //7: - не будет
    8: {images: ['p107', 'p108', 'p109', 'p110', 'p111', 'p112', 'p113'], wrongAnswers: [30, 100, 39]}, //gazania
  //9 - не будет
  //10 - не будет
  //11 - не будет
  12: {images: ['p124'], wrongAnswers: [2, 11]}, //Parsnip
  13: {images: ['p086', 'p087', 'p088', 'p299'], wrongAnswers: [3, 11, 129]}, //Allium
  14: {images: ['p057'], wrongAnswers: [112, 131, 142]}, //camassia
  15: { images: ['p144'], wrongAnswers: [116] }, //globularia
  16: {images: ['p105'], wrongAnswers: [35, 111]}, //Fritillary
  17: { images: ['p007', 'p250', 'p251'] },
  18: { images: ['p209', 'p210', 'p246', 'p297', 'p298'] }, //Wisteria
  19: { images: ['p008'],  wrongAnswers: [5, 21, 49]}, //Oleander. осталось добавить адениус
  //20: { images: ['p009'], wrongAnswers: [3, 11, 12]}, - Celosia, нужно добавить в растения амарант и астильбу
  21: {images: ['p076', 'p128', 'p129', 'p261'], wrongAnswers: [5, 19] }, //Rhododendron. добавить вишню для вариантов ответа
  22: { images: ['p009', 'p133'], wrongAnswers: [35, 46]  }, //Tulip
  23: { images: ['p106'], wrongAnswers: [5, 21, 31] }, //gardenia
  24: { images: ['p120', 'p121', 'p256'] }, //magnolia
  25: { images: ['p130'],  wrongAnswers: [29, 119] }, //Shasta Daisy, добавить ромашку аптечную в список растений
  26: { images: ['p010', 'p011', 'p100', 'p190'], wrongAnswers: [29, 33, 73, 77] }, //Dahlia. добавить циннию
  27: { images: ['p012', 'p103', 'p104', 'p253'], wrongAnswers: [6, 38, 115, 121] }, //Echinacea
  28: { images: ['p198', 'p220', 'p271', 'p272', 'p306'] }, //Gomphrena
  29: { images: ['p013', 'p014', 'p096', 'p097', 'p098', 'p302'], wrongAnswers: [6, 26, 41, 73] }, //Chrysanthemum
  30: { images: ['p015', 'p066'], wrongAnswers: [38, 39, 40, 6, 25, 8] }, //osteospermum
  31: { images: ['p016', 'p017', 'p018', 'p077', 'p078', 'p224', 'p295', 'p317'], wrongAnswers: [41, 69, 46, 5] }, //rosa
  32: { images: ['p019', 'p307'], wrongAnswers: [43, 44, 45] }, //Guzmania
  33: { images: ['p020', 'p021', 'p122', 'p123'], wrongAnswers: [47, 41, 26] }, //Papaver
  34: { images: ['p022'], wrongAnswers: [48, 49] },
  35: { images: ['p023', 'p118', 'p119', 'p222'], wrongAnswers: [36, 37] }, //Lily
  36: { images: ['p114', 'p115'] }, //Hemerocallis
  //37
  //38
  39: {images: ['p134'], wrongAnswers: [40, 100, 121] }, //heliopsis, рядом с родом Helianthus
  40: { images: ['p161', 'p162'] }, //Coreopsis
  41: { images: ['p024', 'p101', 'p218'], wrongAnswers: [39, 40, 97] }, //Dianthus - ждет добавления агростеммы
  //42
  //43
  44: { images: ['p152', 'p283', 'p316'] }, //Pineapple
  //45
  46: { images: ['p025', 'p125', 'p126', 'p260', 'p281'], wrongAnswers: [31, 33, 41] }, //Peony
  47: { images: ['p026', 'p027', 'p089', 'p179'], wrongAnswers: [33] }, //anemone
  //48
  //49
  50: { images: ['p028', 'p045'], wrongAnswers: [18, 34, 56, 57, 79] },
  51: { images: ['p029', 'p073'], wrongAnswers: [58, 59, 5] },
  52: { images: ['p030'], wrongAnswers: [61] }, //Japanese pittosporum
  53: { images: ['p031'], wrongAnswers: [13, 15, 116] }, //scabious
  54: { images: ['p032', 'p063', 'p064'], wrongAnswers: [64, 65, 66] }, //lantana
  55: { images: ['p033', 'p034', 'p035'], wrongAnswers: [67] }, //Hibiscus
  //56
  //57
  58: { images: ['p102'], wrongAnswers: [4] }, //Dog-rose, wrongAnswers надо
  59: { images: ['p165', 'p166', 'p189'] }, //Hawthorn
  //60
  //61
  62: {images: ['p090', 'p091', 'p248'], wrongAnswers: [2] }, //apple, wrongAnswers надо
  63: { images: ['p188'] }, //Corn
  64: { images: ['p176', 'p226', 'p227'] }, //Verbena
    //65
    66: { images: ['p258'] }, //Mint
    //67
  68: { images: ['p036', 'p116', 'p117'] }, //lavender
  69: { images: ['p037'], wrongAnswers: [31, 22] },
  //70
  //71
  72: { images: ['p052'], wrongAnswers: [11] }, //лопух. wrongAnswers надо заменить
  73: { images: ['p038', 'p047', 'p092', 'p093', 'p180', 'p212'], wrongAnswers: [29] }, //aster, wrongAnswers надо
  74: { images: ['p070'], wrongAnswers: [41, 54] }, //phlox, wrongAnswers надо дополнить
  75: { images: ['p039', 'p082'] },
  76: { images: ['p069', 'p127'] }, //petunia
  77: { images: ['p040'], wrongAnswers: [58, 48, 57] },
  78: { images: ['p041'], wrongAnswers: [76] },
  79: { images: ['p042', 'p223'], wrongAnswers: [18] },
  80: { images: ['p053'], wrongAnswers: [17] }, //временный wrongAnswer +
  81: { images: ['p059', 'p311'], wrongAnswers: [19] }, //Hosta временный wrongAnswer +
  82: { images: ['p084'], wrongAnswers: [20] }, //viola. временный wrongAnswer +
  83: { images: ['p055', 'p228'], wrongAnswers: [21] }, //campanula, временный wrongAnswer +
  84: { images: ['p062'], wrongAnswers: [22] }, //Kohlrabi, временный wrongAnswer +
  85: { images: ['p051', 'p094', 'p214', 'p215'], wrongAnswers: [23] }, //Buddleja, временный wrongAnswer +
    86: { images: ['p071', 'p072'], wrongAnswers: [24] }, //Plumeria временный wrongAnswer +
     //87. Lotus пока не залит.
    88: { images: ['p060', 'p061', 'p221'], wrongAnswers: [10] }, //Hydrangea, нужно добавить еще wrongAnswer, но 10 нельзя убирать +
    89: { images: ['p079'], wrongAnswers: [25] }, //Santolina временный wrongAnswer +
    90: { images: ['p058'], wrongAnswers: [26] }, //Fagus временный wrongAnswer +
    91: { images: ['p049', 'p050', 'p264', 'p300'], wrongAnswers: [27] }, //Begonia временный wrongAnswer+
    92: { images: ['p074', 'p075'], wrongAnswers: [28] }, //Ranunculus временный wrongAnswer+
    93: { images: ['p081'], wrongAnswers: [80, 81] }, //Syngonium временный wrongAnswer+
    94: { images: ['p065'], wrongAnswers: [86, 79, 69] }, //Orchid, временный wrongAnswer
    95: { images: ['p048', 'p213'], wrongAnswers: [62, 44] }, //Banana временный wrongAnswer +
    96: { images: ['p085'], wrongAnswers: [29, 93] }, //Zamioculcas временный wrongAnswer +
    97: { images: ['p083', 'p131', 'p132', 'p245', 'p296'], wrongAnswers: [30, 95] }, //Tagetes временный wrongAnswer +
    98: { images: ['p067', 'p068'], wrongAnswers: [31] }, //Passiflora временный wrongAnswer +
    //99: { images: ['p055'], wrongAnswers: [43, 44] }, //временный wrongAnswer
    100: { genusId: 100 }, //Sunflower + Helianthus
    101: { images: ['p056', 'p099', 'p164'], wrongAnswers: [16, 50] }, //Cosmos временный wrongAnswer +
    102: { images: ['p177', 'p178'] }, //Aglaonema
    //103 без изображений
    104: { images: ['p206'] }, //Scilla
    105: { images: ['p202'] }, //Narcissus
    106: { images: ['p255'] }, //Lupinus
    107: { images: ['p201', 'p280', 'p315'] }, //Muscari
    108: { images: ['p172'] }, //Pelargonium
    109: { images: ['p184'] }, //Calibrachoa
    110: { images: ['p187', 'p216', 'p217', 'p303'] }, //Coleus
    111: { images: ['p249'] }, //Campanula rotundifolia
    112: { images: ['p140', 'p141', 'p142'], wrongAnswers: [131] }, //Delphinium+
    113: { images: ['p157'] }, //Brunnera
    114: { images: ['p183'] }, //Betula
    //115 без изображений
    116: { images: ['p145'] }, //cornflower
    117: { images: ['p186'] }, //Centaurea (knapweeds)
    118: { images: ['p194', 'p195', 'p196', 'p197'] }, //Hardy geranium
    119: { images: ['p181', 'p182'] }, //Bellis
    120: { images: ['p191', 'p252'] }, //Dicentra
    121: { images: ['p192', 'p219'] }, //Gaillardia
    122: { images: ['p193'] }, //Galanthus
    123: { images: ['p185'] }, //Celosia
    124: { images: ['p203'] }, //Opuntia
    125: { images: ['p205'] }, //Platycodon
    126: { images: ['p254', 'p304'] }, //Eucalyptus
    127: { images: ['p211', 'p247'] }, //Zinnia
    130: { images: ['p167', 'p268'] }, //Crocus
    131: { images: ['p143', 'p207'], wrongAnswers: [14, 112] }, //veronica+
    139: { images: ['p174'] }, //Star jasmine
    142: { images: ['p135', 'p136', 'p137', 'p138', 'p139', 'p312'], wrongAnswers: [14] }, //Hyacinthus+
    146: { images: ['p160', 'p225'] }, //Red clover
    150: { images: ['p284', 'p285'] }, //Common sage
  152: { images: ['p257', 'p314'] }, //Malva
  153: {images: ['p163'], wrongAnswers: [17, 24]}, //Cornus Florida
    155: { images: ['p153'] }, //Angelonia
    156: { images: ['p155'] }, //Artichoke
    157: { images: ['p171'] }, //Jasmine
    158: { images: ['p173'] }, //Sanchezia
    159: { images: ['p150'] }, //Ageratum
    160: { images: ['p154'] }, //Aquilegia
    161: { images: ['p156'] }, //Aubrieta
    162: { images: ['p159'] }, //Catharanthus
    163: { images: ['p168', 'p305'] }, //Fittonia
    164: { images: ['p169'] }, //Fumaria
    165: { images: ['p170'] }, //Helleborus
    166: { images: ['p175'] }, //Hollyhock
    167: { images: ['p266'] }, //Chicory
    168: { images: ['p208', 'p259'] }, //Water Lily
    169: { images: ['p230'] }, //Red amaranth
    170: { images: ['p229'] }, //Prince's-feather
    171: { images: ['p231', 'p301'] }, //Ceanothus impressus
    172: { images: ['p232'] }, //Euonymus
    173: { images: ['p233', 'p308'] }, //Hebe speciosa
    174: { images: ['p234'] }, //Fan aloe
    175: { images: ['p235'] }, //Lewisia cotyledon
    176: { images: ['p236'] }, //Paulownia / Princess tree
    177: { images: ['p237'] }, //Phacelia
    178: { images: ['p238', 'p239', 'p240', 'p241'] }, //Cherry laurel
    179: { images: ['p242'] }, //Pyracantha coccinea
    180: { images: ['p243'] }, //Rosemary
    181: { images: ['p244'] }, //Dandelion
    182: { images: ['p294'] }, //Anemone coronaria
    183: { images: ['p263'] }, //Anthurium
    184: { images: ['p265'] }, //Calluna
    185: { images: ['p270'] }, //Eschscholzia californica
    186: { images: ['p273', 'p274', 'p309'] }, //Helenium autumnale
    187: { images: ['p275'] }, //Heliconia psittacorum
    188: { images: ['p277', 'p278'] }, //Kalanchoe blossfeldiana
    189: { images: ['p289'] }, //Strawberry
    190: { images: ['p287'] }, //Schlumbergera truncata
    191: { images: ['p267'] }, //Convallaria majalis
    192: { images: ['p269'] }, //Dianthus barbatus
    193: { images: ['p288'] }, //Silene chalcedonica
    194: { images: ['p292'] }, //Xerochrysum bracteatum
    195: { images: ['p262'] }, //Antirrhinum majus
    196: { images: ['p276'] }, //Justicia carnea
    197: { images: ['p293'] }, //Aichryson
    198: { images: ['p286'] }, //Salvia pratensis
    199: { images: ['p279'] }, //Lupinus latifolius
    200: { images: ['p282'] }, //Coriandrum sativum
    201: { images: ['p290', 'p291'] }, //Vinca minor
});

// ЕДИНЫЙ ИСТОЧНИК ДАННЫХ: все таксоны в одном месте.
const NUMERIC_ID_PATTERN = /^\d+$/;

function parseCatalogId(rawId) {
  const stringId = String(rawId);
  return NUMERIC_ID_PATTERN.test(stringId) ? Number(stringId) : stringId;
}

const speciesEntries = new Map();

Object.entries(plantNamesById).forEach(([id, names]) => {
  const parsedId = parseCatalogId(id);
  speciesEntries.set(parsedId, { id: parsedId, names });
});

Object.entries(speciesCatalog).forEach(([id, entry]) => {
  const parsedId = parseCatalogId(id);
  const normalizedEntry = entry || {};

  if (normalizedEntry.genusId != null) {
    const genus = genusById[normalizedEntry.genusId];

    if (!genus || typeof genus !== 'object') {
      return;
    }

    const genusEntries = genus.entries && typeof genus.entries === 'object'
      ? genus.entries
      : {};

    const baseWrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
      ? Object.freeze(normalizedEntry.wrongAnswers.slice())
      : Array.isArray(genus.wrongAnswers)
        ? Object.freeze(genus.wrongAnswers.slice())
        : undefined;

    Object.entries(genusEntries).forEach(([childId, genusEntry]) => {
      if (!genusEntry || typeof genusEntry !== 'object') {
        return;
      }

      const parsedChildId = parseCatalogId(childId);
      const existing = speciesEntries.get(parsedChildId) || {};
      const names = genusEntry.names || existing.names;

      if (!names) {
        return;
      }

      const images = Array.isArray(genusEntry.images)
        ? Object.freeze(genusEntry.images.slice())
        : existing.images;
      const wrongAnswers = Array.isArray(genusEntry.wrongAnswers)
        ? Object.freeze(genusEntry.wrongAnswers.slice())
        : baseWrongAnswers || existing.wrongAnswers;

      speciesEntries.set(parsedChildId, {
        ...existing,
        id: parsedChildId,
        names,
        ...(images ? { images } : {}),
        ...(wrongAnswers ? { wrongAnswers } : {}),
        genusId: genus.id
      });
    });

    return;
  }

  const existing = speciesEntries.get(parsedId);
  if (!existing) {
    return;
  }

  const images = Array.isArray(normalizedEntry.images)
    ? Object.freeze(normalizedEntry.images.slice())
    : existing.images;
  const wrongAnswers = Array.isArray(normalizedEntry.wrongAnswers)
    ? Object.freeze(normalizedEntry.wrongAnswers.slice())
    : existing.wrongAnswers;

  speciesEntries.set(parsedId, {
    ...existing,
    ...(images ? { images } : {}),
    ...(wrongAnswers ? { wrongAnswers } : {})
  });
});

export const speciesById = Object.freeze(
  Object.fromEntries(
    Array.from(speciesEntries.entries()).map(([id, value]) => [
      id,
      Object.freeze(value)
    ])
  )
);

// ПРОИЗВОДНЫЕ ПРЕДСТАВЛЕНИЯ (для совместимости с текущей логикой):
export const choicesById = Object.fromEntries(
  Object.values(speciesById).map(entry => [entry.id, entry.names])
);

export const ALL_CHOICE_IDS = Object.freeze(
  Object.values(speciesById).map(entry => entry.id)
);

// Растения, доступные как ВОПРОСЫ прямо сейчас (есть image):
// Каждое растение может содержать несколько изображений (см. plantImages в images.js).
// Для каждого снимка можно указать собственную сложность через difficulties.js.
// Если она не задана, применяется общее правило из difficulties.js.
// questionVariantId остаётся уникальным идентификатором конкретного снимка,
// при этом поле id всегда соответствует идентификатору растения для ответов.
export const plants = Object.values(speciesById)
  .flatMap(species => {
    const imageEntries = (species.images || [])
      .map(imageId => plantImagesById[imageId])
      .filter(imageEntry => imageEntry && typeof imageEntry.src === 'string');

    return imageEntries.map((imageEntry, index) => {
      const overrideDifficulty = getDifficultyByImageId(imageEntry.id, questionTypes.PLANT);
      const baseDifficulty = getDifficultyByQuestionId(species.id, questionTypes.PLANT);
      const genusDifficulty = species.genusId != null && species.genusId !== species.id
        ? getDifficultyByQuestionId(species.genusId, questionTypes.PLANT)
        : null;

      return {
        id: species.id,
        correctAnswerId: species.id,
        imageId: imageEntry.id,
        image: imageEntry.src,
        names: species.names,
        wrongAnswers: species.wrongAnswers,
        difficulty: overrideDifficulty || baseDifficulty || genusDifficulty,
        questionVariantId: `${species.id}-${index}`,
        questionType: questionTypes.PLANT,
        selectionGroupId: `plant-${species.id}`,
        questionPromptKey: 'question'
      };
    });
  });

