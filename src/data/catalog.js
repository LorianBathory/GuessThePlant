import { getDifficultyByQuestionId, getDifficultyByImageId } from './difficulties.js';
import { plantNamesById } from './plantNames.js';
import { plantImagesById } from './images.js';
import { questionTypes } from './questionTypes.js';
import { genusById } from './genus/index.js';

// Дополнительные данные для видов (кроме локализации).
const speciesCatalog = Object.freeze({
  1:  { images: ['p1_1'], wrongAnswers: [7, 8, 9] }, //Asteriscus
  2:  { images: ['p2_1'], wrongAnswers: [10, 11, 12] }, //Daucus carota
  3:  { images: ['p3_1', 'p3_2'], wrongAnswers: [13, 14, 15, 16, 142] }, //Agapanthus
  4:  { images: ['p4_1', 'p4_2'], wrongAnswers: [17, 18, 19, 21] }, //Bougainvillea
  5:  { images: ['p5_1', 'p5_2', 'p5_3', 'p5_4', 'p5_5'], wrongAnswers: [21, 31, 23, 24] }, //camellia
  6:  { images: ['p6_1'], wrongAnswers: [25, 26, 27, 29] }, //Gerbera
  //7: - не будет
    8: {images: ['p8_1', 'p8_2', 'p8_3', 'p8_4', 'p8_5', 'p8_6', 'p8_7'], wrongAnswers: [30, 100, 39]}, //gazania
  //9 - не будет
  //10 - не будет
  //11 - не будет
  12: {images: ['p12_1'], wrongAnswers: [2, 11]}, //Parsnip
  13: { genusId: 13 }, //Allium
  14: {images: ['p14_1'], wrongAnswers: [112, 131, 142]}, //camassia
  15: { images: ['p15_1'], wrongAnswers: [116] }, //globularia
  16: {images: ['p16_1'], wrongAnswers: [35, '83_1']}, //Fritillary
  17: { images: ['p17_1', 'p17_2', 'p17_3'] },
  18: { images: ['p18_1', 'p18_2', 'p18_3', 'p18_4', 'p18_5'] }, //Wisteria
  19: { images: ['p19_1', 'p19_2'],  wrongAnswers: [5, 21, 49]}, //Oleander. осталось добавить адениус
  20: { images: ['p20_1']}, //Sorbus
  21: { images: ['p21_1', 'p21_2', 'p21_3', 'p21_4'], wrongAnswers: [5, 19] }, //Rhododendron. добавить вишню для вариантов ответа
  22: { images: ['p22_1', 'p22_2'], wrongAnswers: [35, 46]  }, //Tulip
  23: { images: ['p23_1'], wrongAnswers: [5, 21, 31] }, //gardenia
  24: { images: ['p24_1', 'p24_2', 'p24_3'] }, //magnolia
  25: { images: ['p25_1'],  wrongAnswers: [29, 119] }, //Shasta Daisy, добавить ромашку аптечную в список растений
  26: { images: ['p26_1', 'p26_2', 'p26_3', 'p26_4'], wrongAnswers: [29, 33, 73, 77] }, //Dahlia. добавить циннию
  27: { images: ['p27_1', 'p27_2', 'p27_3', 'p27_4'], wrongAnswers: [6, 38, 115, 121] }, //Echinacea
  28: { images: ['p28_1', 'p28_2', 'p28_3', 'p28_4', 'p28_5'] }, //Gomphrena
  29: { images: ['p29_1', 'p29_2', 'p29_3', 'p29_4', 'p29_5', 'p29_6'], wrongAnswers: [6, 26, 41, 73] }, //Chrysanthemum
  30: { images: ['p30_1', 'p30_2'], wrongAnswers: [38, 39, 40, 6, 25, 8] }, //osteospermum
  31: { genusId: 31 }, //rosa
  32: { images: ['p32_1', 'p32_2'], wrongAnswers: [43, 44, 45] }, //Guzmania
  33: { images: ['p33_1', 'p33_2', 'p33_3', 'p33_4'], wrongAnswers: [47, 41, 26] }, //Papaver
  34: { images: ['p34_1'], wrongAnswers: [48, 49] },
  35: { images: ['p35_1', 'p35_2', 'p35_3', 'p35_4'], wrongAnswers: [36, 37] }, //Lily
    36: { genusId: 36 }, //Hemerocallis
  //37 не будет
  //38 не будет
  39: {images: ['p39_1'], wrongAnswers: [40, 100, 121] }, //heliopsis, рядом с родом Helianthus
  40: { images: ['p40_1', 'p40_2'] }, //Coreopsis
  41: { genusId: 41 }, //Dianthus - ждет добавления агростеммы
  //42
  //43
  44: { images: ['p44_1', 'p44_2', 'p44_3'] }, //Pineapple
  //45
  46: { images: ['p46_1', 'p46_2', 'p46_3', 'p46_4', 'p46_5'], wrongAnswers: [31, 33, 41] }, //Peony
  47: { genusId: 47 }, //anemone
  //48
  //49
  50: { images: ['p50_1', 'p50_2'], wrongAnswers: [18, 34, 56, 57, 79] },
  51: { images: ['p51_1', 'p51_2'], wrongAnswers: [58, 59, 5] },
  52: { images: ['p52_1'], wrongAnswers: [61] }, //Japanese pittosporum
  53: { images: ['p53_1'], wrongAnswers: [13, 15, 116] }, //scabious
  54: { images: ['p54_1', 'p54_2', 'p54_3'], wrongAnswers: [64, 65, 66] }, //lantana
  55: { images: ['p55_1', 'p55_2', 'p55_3', 'p55_4'], wrongAnswers: [67] }, //Hibiscus
  56: { images: ['p56_1', 'p56_2', 'p56_3'], wrongAnswers: [18, 57, 137] }, //Robinia
  //57 Paulownia
  //58: FREE
  59: { images: ['p59_1', 'p59_2', 'p59_3'] }, //Hawthorn
  //60
  //61
  62: {images: ['p62_1', 'p62_2', 'p62_3'], wrongAnswers: [2] }, //apple, wrongAnswers надо
  63: { images: ['p63_1'] }, //Corn
  64: { images: ['p64_1', 'p64_2', 'p64_3'] }, //Verbena
    //65
    66: { images: ['p66_1'] }, //Mint
    //67
  68: { images: ['p68_1', 'p68_2', 'p68_3'] }, //lavender
  69: { images: ['p69_1'], wrongAnswers: [31, 22] },
  70: { images: ['p70_1']}, //Physalis
  //71
  72: { images: ['p72_1'], wrongAnswers: [11] }, //лопух. wrongAnswers надо заменить
  73: { images: ['p73_1', 'p73_2', 'p73_3', 'p73_4', 'p73_5', 'p73_6'], wrongAnswers: [29] }, //aster, wrongAnswers надо
  74: { images: ['p74_1'], wrongAnswers: [41, 54] }, //phlox, wrongAnswers надо дополнить
  75: { images: ['p75_1', 'p75_2'] },
  76: { images: ['p76_1', 'p76_2'] }, //petunia
  77: { images: ['p77_1'], wrongAnswers: [58, 48, 57] },
  78: { images: ['p78_1', 'p78_2'], wrongAnswers: [76] },
  79: { images: ['p79_1', 'p79_2'], wrongAnswers: [18] },
  80: { images: ['p80_1'], wrongAnswers: [17] }, //временный wrongAnswer +
  81: { images: ['p81_1', 'p81_2'], wrongAnswers: [19] }, //Hosta временный wrongAnswer +
  82: { images: ['p82_1'], wrongAnswers: [20] }, //viola. временный wrongAnswer +
  83: { genusId: 83 }, //campanula, временный wrongAnswer +
  84: { images: ['p84_1'], wrongAnswers: [22] }, //Kohlrabi, временный wrongAnswer +
  85: { images: ['p85_1', 'p85_2', 'p85_3', 'p85_4'], wrongAnswers: [23] }, //Buddleja, временный wrongAnswer +
  86: { images: ['p86_1', 'p86_2'], wrongAnswers: [24] }, //Plumeria временный wrongAnswer +
     //87. Lotus пока не залит.
    88: { images: ['p88_1', 'p88_2', 'p88_3', 'p88_4'], wrongAnswers: [10] }, //Hydrangea, нужно добавить еще wrongAnswer, но 10 нельзя убирать +
    89: { images: ['p89_1'], wrongAnswers: [25] }, //Santolina временный wrongAnswer +
    90: { images: ['p90_1'], wrongAnswers: [26] }, //Fagus временный wrongAnswer +
    91: { images: ['p91_1', 'p91_2', 'p91_3', 'p91_4'], wrongAnswers: [27] }, //Begonia временный wrongAnswer+
    92: { images: ['p92_1', 'p92_2'], wrongAnswers: [28] }, //Ranunculus временный wrongAnswer+
    93: { images: ['p93_1'], wrongAnswers: [80, 81] }, //Syngonium временный wrongAnswer+
    94: { images: ['p94_1'], wrongAnswers: [86, 79, 69] }, //Orchid, временный wrongAnswer
    95: { images: ['p95_1', 'p95_2'], wrongAnswers: [62, 44] }, //Banana временный wrongAnswer +
    96: { images: ['p96_1'], wrongAnswers: [29, 93] }, //Zamioculcas временный wrongAnswer +
    97: { images: ['p97_1', 'p97_2', 'p97_3', 'p97_4', 'p97_5', 'p97_6'], wrongAnswers: [30, 95] }, //Tagetes временный wrongAnswer +
    98: { images: ['p98_1', 'p98_2'], wrongAnswers: [31] }, //Passiflora временный wrongAnswer +
    //99: { images: ['p83_1'], wrongAnswers: [43, 44] }, //временный wrongAnswer
    100: { genusId: 100 }, //Sunflower + Helianthus
    101: { images: ['p101_1', 'p101_2', 'p101_3'], wrongAnswers: [16, 50] }, //Cosmos временный wrongAnswer +
    102: { images: ['p102_1', 'p102_2'] }, //Aglaonema
    //103 без изображений
    104: { images: ['p104_1'] }, //Scilla
    105: { images: ['p105_1'] }, //Narcissus
    106: { genusId: 106 }, //Lupinus
    107: { images: ['p107_1', 'p107_2', 'p107_3'] }, //Muscari
    108: { images: ['p108_1'] }, //Pelargonium
    109: { images: ['p109_1'] }, //Calibrachoa
    110: { images: ['p110_1', 'p110_2', 'p110_3', 'p110_4'] }, //Coleus
    //'83_1': в род Campanula
    112: { images: ['p112_1', 'p112_2', 'p112_3'], wrongAnswers: [131] }, //Delphinium+
    113: { images: ['p113_1'] }, //Brunnera
    114: { images: ['p114_1'] }, //Betula
    115: { images: ['p115_1', 'p115_2', 'p115_3'] },
    116: { genusId: 116 }, //cornflower
    //'116_1': в род Centaurea (василёк синий)
    118: { images: ['p118_1', 'p118_2', 'p118_3', 'p118_4'] }, //Hardy geranium
    119: { genusId: 119 }, //Bellis
    120: { images: ['p120_1', 'p120_2'] }, //Dicentra
    121: { images: ['p121_1', 'p121_2'] }, //Gaillardia
    122: { images: ['p122_1'] }, //Galanthus
    123: { images: ['p123_1', 'p123_2', 'p123_3'] }, //Celosia
    124: { images: ['p124_1'] }, //Opuntia
    125: { images: ['p125_1'] }, //Platycodon
    126: { images: ['p126_1', 'p126_2'] }, //Eucalyptus
    127: { images: ['p127_1', 'p127_2', 'p127_3'] }, //Zinnia
    130: { images: ['p130_1', 'p130_2'] }, //Crocus
    131: { genusId: 131 }, //veronica+
    139: { images: ['p139_1'] }, //Star jasmine
    140: { images: ['p140_1'] }, //Lonicera tatarica
    142: { images: ['p142_1', 'p142_2', 'p142_3', 'p142_4', 'p142_5', 'p142_6', 'p142_7'], wrongAnswers: [14] }, //Hyacinthus+
    146: { images: ['p146_1', 'p146_2'] }, //Red clover
    150: { genusId: 150 }, //Common sage
  152: { images: ['p152_1', 'p152_2'] }, //Malva
  153: {images: ['p153_1', 'p153_2', 'p153_3'], wrongAnswers: [17, 24]}, //Cornus Florida
    155: { images: ['p155_1'] }, //Angelonia
    156: { images: ['p156_1'] }, //Artichoke
    157: { images: ['p157_1'] }, //Jasmine
    158: { images: ['p158_1'] }, //Sanchezia
    159: { images: ['p159_1', 'p159_2'] }, //Ageratum
    160: { images: ['p160_1'] }, //Aquilegia
    161: { images: ['p161_1'] }, //Aubrieta
    162: { images: ['p162_1'] }, //Catharanthus
    163: { images: ['p163_1', 'p163_2'] }, //Fittonia
    164: { images: ['p164_1'] }, //Fumaria
    165: { images: ['p165_1'] }, //Helleborus
    166: { images: ['p166_1'] }, //Hollyhock
    167: { images: ['p167_1'] }, //Chicory
    168: { images: ['p168_1', 'p168_2'] }, //Water Lily
    169: { genusId: 169 }, //Red amaranth
    //'169_1': в род Amaranthus (Amaranthus cruentus)
    171: { images: ['p171_1', 'p171_2'] }, //Ceanothus impressus
    172: { images: ['p172_1'] }, //Euonymus
    173: { genusId: 173 }, //Hebe speciosa
    174: { images: ['p174_1'] }, //Fan aloe
    175: { images: ['p175_1'] }, //Lewisia cotyledon
    176: { images: ['p176_1'] }, //Paulownia / Princess tree
    177: { images: ['p177_1'] }, //Phacelia
    178: { images: ['p178_1', 'p178_2', 'p178_3', 'p178_4'] }, //Cherry laurel
    179: { images: ['p179_1'] }, //Pyracantha coccinea
    180: { images: ['p180_1'] }, //Rosemary
    181: { images: ['p181_1'] }, //Dandelion
    //'47_1': в род Anemone (Anemone coronaria)
    183: { images: ['p183_1'] }, //Anthurium
    184: { images: ['p184_1'] }, //Calluna
    185: { images: ['p185_1'] }, //Eschscholzia californica
    186: { images: ['p186_1', 'p186_2', 'p186_3'] }, //Helenium autumnale
    187: { images: ['p187_1'] }, //Heliconia psittacorum
    188: { images: ['p188_1', 'p188_2'] }, //Kalanchoe blossfeldiana
    189: { images: ['p189_1'] }, //Strawberry
    190: { images: ['p190_1'] }, //Schlumbergera truncata
    191: { images: ['p191_1'] }, //Convallaria majalis
    //'41_1': в род Dianthus (Dianthus barbatus)
    193: { images: ['p193_1'] }, //Silene chalcedonica
    194: { images: ['p194_1', 'p194_2'] }, //Xerochrysum bracteatum
    195: { images: ['p195_1'] }, //Antirrhinum majus
    196: { images: ['p196_1'] }, //Justicia carnea
    197: { images: ['p197_1'] }, //Aichryson
    //'150_2': в род Salvia pratensis
    //'106_2': в род Lupinus latifolius
    200: { images: ['p200_1'] }, //Coriandrum sativum
    201: { images: ['p201_1', 'p201_2'] }, //Vinca minor
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

