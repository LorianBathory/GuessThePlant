const plantParametersRaw = Object.freeze({
  1: Object.freeze({
    scientificName: 'Asteriscus maritimus',
    lifeCycle: 'annual',
    additionalInfo: 'Компактный средиземноморский кустарник, предпочитает солнце и устойчив к засухе.',
    toxicity: Object.freeze([
      Object.freeze({ level: 2, tag: 'skin' }),
      Object.freeze({ level: 3, tag: 'cat' })
    ]),
    light: 'fullSun'
  }),
  2: Object.freeze({ scientificName: 'Daucus carota', lifeCycle: 'biennial' }), //в дикой форме; в культуре однолетник
  3: Object.freeze({
    scientificName: 'Agapanthus africanus',
    lifeCycle: 'perennial',
    additionalInfo: 'Вечнозеленый травянистый многолетник. Высота цветочных стрелок — около 80 см.',
    toxicity: Object.freeze([
      Object.freeze({ level: 2, tag: 'eat' })
    ]),
    hardinessZone: 'H2',
    light: 'fullSun'
  }),
  4: Object.freeze({
    scientificName: 'Bougainvillea spectabilis',
    additionalInfo: 'Компактный и густой кустарник, цветущий с яркими прицветниками. Минимально допустимая ночная температура — 10° С.',
    hardinessZone: 'H1C',
    light: 'fullSun'
  }),
  5: Object.freeze({
    scientificName: 'Camellia japonica',
    additionalInfo: 'Вечнозеленый кустарник, цветущий весной. Бутоны нуждаются в защите от холодного ветра и утреннего солнца.',
    hardinessZone: 'H5',
    light: 'partialShade'
  }),
  6: Object.freeze({
    scientificName: 'Gerbera jamesonii',
    lifeCycle: 'perennial',
    additionalInfo: 'Вечнозеленое растение, цветет с конца весны до конца лета. Часто выращивается как однолетник.',
    hardinessZone: 'H1C',
    light: 'fullSun'
  }), //но часто выращивают как однолетник
  8: Object.freeze({ scientificName: 'Gazania', lifeCycle: 'perennial' }), //в умеренном климате — как однолетник
  12: Object.freeze({ scientificName: 'Pastinaca sativa', lifeCycle: 'biennial' }),
  13: Object.freeze({ scientificName: 'Allium', lifeCycle: 'perennial' }),
  '13_1': Object.freeze({ scientificName: 'Allium ursinum', lifeCycle: 'perennial' }),
  14: Object.freeze({
    scientificName: 'Camassia',
    lifeCycle: 'perennial',
    additionalInfo: 'Луковичное многолетнее растение высотой до 1,2 м. Предпочитает полутень, переносит полное солнце.',
    hardinessZone: 'H4',
    light: 'partialShade'
  }),
  15: Object.freeze({ scientificName: 'Globularia', lifeCycle: 'perennial' }),
  16: Object.freeze({ scientificName: 'Fritillaria', lifeCycle: 'perennial' }),
  17: Object.freeze({ scientificName: 'Clematis', lifeCycle: 'perennial' }),
  18: Object.freeze({ scientificName: 'Wisteria', lifeCycle: 'perennial' }),
  19: Object.freeze({ scientificName: 'Nerium oleander' }),
  21: Object.freeze({ scientificName: 'Rhododendron' }),
  22: Object.freeze({ scientificName: 'Tulipa', lifeCycle: 'perennial' }), //луковичный
  23: Object.freeze({ scientificName: 'Gardenia' }),
  24: Object.freeze({ scientificName: 'Magnolia' }),
  25: Object.freeze({
    scientificName: 'Leucanthemum vulgare',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  26: Object.freeze({ scientificName: 'Dahlia', lifeCycle: 'perennial' }), //в умеренном климате выращивают как однолетник
  27: Object.freeze({ scientificName: 'Echinacea', lifeCycle: 'perennial' }),
  '27_1': Object.freeze({
    scientificName: 'Echinacea purpurea',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  28: Object.freeze({ scientificName: 'Gomphrena', lifeCycle: 'annual' }),
  29: Object.freeze({ scientificName: 'Chrysanthemum', lifeCycle: 'perennial' }),
  30: Object.freeze({ scientificName: 'Osteospermum', lifeCycle: 'perennial' }), //в умеренном климате — как однолетник
  31: Object.freeze({ scientificName: 'Rosa' }),
  '31_1': Object.freeze({ scientificName: 'Rosa canina', lifeCycle: 'perennial' }),
  32: Object.freeze({ scientificName: 'Guzmania lingulata', lifeCycle: 'perennial' }),
  33: Object.freeze({ scientificName: 'Papaver' }),
  34: Object.freeze({ scientificName: 'Metrosideros excelsa' }),
  35: Object.freeze({ scientificName: 'Lilium', lifeCycle: 'perennial' }), //луковичный
  36: Object.freeze({ scientificName: 'Hemerocallis', lifeCycle: 'perennial' }),
  '36_1': Object.freeze({
    scientificName: 'Hemerocallis citrina',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '36_2': Object.freeze({
    scientificName: 'Hemerocallis fulva',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  39: Object.freeze({
    scientificName: 'Heliopsis helianthoides',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  40: Object.freeze({ scientificName: 'Coreopsis' }),
  41: Object.freeze({ scientificName: 'Dianthus' }),
  '41_1': Object.freeze({
    scientificName: 'Dianthus barbatus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  44: Object.freeze({ scientificName: 'Ananas comosus', lifeCycle: 'perennial' }),
  46: Object.freeze({ scientificName: 'Paeonia', lifeCycle: 'perennial' }),
  47: Object.freeze({ scientificName: 'Anemone', lifeCycle: 'perennial' }),
  '47_1': Object.freeze({ scientificName: 'Anemone coronaria', lifeCycle: 'perennial' }),
  '47_2': Object.freeze({
    scientificName: 'Anemone nemorosa',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  50: Object.freeze({ scientificName: 'Jacaranda mimosifolia' }),
  51: Object.freeze({ scientificName: 'Punica granatum' }),
  52: Object.freeze({ scientificName: 'Pittosporum tobira' }),
  53: Object.freeze({ scientificName: 'Sixalix atropurpurea', lifeCycle: 'biennial' }),
  54: Object.freeze({ scientificName: 'Lantana' }),
  55: Object.freeze({ scientificName: 'Hibiscus' }),
  58: Object.freeze({
    scientificName: 'Catharanthus roseus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  59: Object.freeze({ scientificName: 'Crataegus' }),
  62: Object.freeze({ scientificName: 'Malus' }),
  63: Object.freeze({ scientificName: 'Zea mays', lifeCycle: 'annual' }),
  64: Object.freeze({
    scientificName: 'Verbena',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }), //в культуре часто как однолетник
  '64_1': Object.freeze({
    scientificName: 'Verbena bonariensis',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  '66_1': Object.freeze({
    scientificName: 'Mentha suaveolens',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  68: Object.freeze({
    scientificName: 'Lavandula',
    light: 'fullSun'
  }),
  '68_1': Object.freeze({
    scientificName: 'Lavandula angustifolia',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '68_2': Object.freeze({
    scientificName: 'Lavandula × intermedia',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  69: Object.freeze({ scientificName: 'Eustoma', lifeCycle: 'biennial' }), //в культуре чаще однолетник
  72: Object.freeze({ scientificName: 'Arctium', lifeCycle: 'biennial' }),
  73: Object.freeze({
    scientificName: 'Aster',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }), //иногда однолетник
  '73_1': Object.freeze({
    scientificName: 'Aster amellus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  74: Object.freeze({ scientificName: 'Phlox', lifeCycle: 'perennial' }), //есть однолетние виды
  75: Object.freeze({ scientificName: 'Syringa' }),
  76: Object.freeze({ scientificName: 'Petunia', lifeCycle: 'perennial' }), //в культуре выращивается как однолетник
  77: Object.freeze({ scientificName: 'Rhodomyrtus' }),
  78: Object.freeze({ scientificName: 'Solanum' }),
  79: Object.freeze({ scientificName: 'Plumbago' }),
  80: Object.freeze({ scientificName: 'Caladium bicolor', lifeCycle: 'perennial' }),
  81: Object.freeze({ scientificName: 'Hosta', lifeCycle: 'perennial' }),
  82: Object.freeze({
    scientificName: 'Viola tricolor var. hortensis',
    lifeCycle: 'biennial',
    light: 'fullSun'
  }), //в культуре чаще однолетник
  '82_2': Object.freeze({
    scientificName: 'Viola sororia',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  83: Object.freeze({
    scientificName: 'Campanula',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }), //есть двулетние и однолетние виды
  '83_1': Object.freeze({
    scientificName: 'Campanula rotundifolia',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '83_2': Object.freeze({
    scientificName: 'Campanula portenschlagiana',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '83_3': Object.freeze({
    scientificName: 'Campanula poscharskyana',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  84: Object.freeze({ scientificName: 'Brassica oleracea Gongylodes Group', lifeCycle: 'biennial' }),
  85: Object.freeze({ scientificName: 'Buddleja davidii' }),
  86: Object.freeze({ scientificName: 'Plumeria' }),
  88: Object.freeze({ scientificName: 'Hydrangea macrophylla' }),
  89: Object.freeze({
    scientificName: 'Santolina chamaecyparissus',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  90: Object.freeze({ scientificName: 'Fagus sylvatica' }),
  91: Object.freeze({ scientificName: 'Begonia', lifeCycle: 'perennial' }), //в культуре часто однолетник
  92: Object.freeze({ scientificName: 'Ranunculus', lifeCycle: 'perennial' }), //есть однолетние виды
  93: Object.freeze({ scientificName: 'Syngonium podophyllum', lifeCycle: 'perennial' }),
  94: Object.freeze({ scientificName: 'Orchidaceae', lifeCycle: 'perennial' }),
  95: Object.freeze({ scientificName: 'Musa', lifeCycle: 'perennial' }),
  96: Object.freeze({ scientificName: 'Zamioculcas zamiifolia', lifeCycle: 'perennial' }),
  97: Object.freeze({ scientificName: 'Tagetes', lifeCycle: 'annual' }),
  98: Object.freeze({ scientificName: 'Passiflora edulis', lifeCycle: 'perennial' }),
  100: Object.freeze({
    scientificName: 'Helianthus annuus',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  '100_2': Object.freeze({
    scientificName: 'Helianthus tuberosus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  101: Object.freeze({ scientificName: 'Cosmos bipinnatus', lifeCycle: 'annual' }),
  102: Object.freeze({ scientificName: 'Aglaonema', lifeCycle: 'perennial' }),
  104: Object.freeze({ scientificName: 'Scilla', lifeCycle: 'perennial' }),
  105: Object.freeze({ scientificName: 'Narcissus', lifeCycle: 'perennial' }),
  106: Object.freeze({ scientificName: 'Lupinus', lifeCycle: 'perennial' }),
  '106_1': Object.freeze({ scientificName: 'Lupinus polyphyllus', lifeCycle: 'perennial' }),
  '106_2': Object.freeze({ scientificName: 'Lupinus latifolius', lifeCycle: 'perennial' }),
  107: Object.freeze({ scientificName: 'Muscari', lifeCycle: 'perennial' }),
  108: Object.freeze({ scientificName: 'Pelargonium', lifeCycle: 'perennial' }), //в культуре часто как однолетник
  109: Object.freeze({ scientificName: 'Calibrachoa', lifeCycle: 'perennial' }), //в культуре как однолетник
  110: Object.freeze({ scientificName: 'Coleus', lifeCycle: 'perennial' }), //в культуре как однолетник
  112: Object.freeze({ scientificName: 'Delphinium', lifeCycle: 'perennial' }),
  113: Object.freeze({ scientificName: 'Brunnera', lifeCycle: 'perennial' }),
  114: Object.freeze({ scientificName: 'Betula' }),
  '115_1': Object.freeze({
    scientificName: 'Rudbeckia fulgida',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  116: Object.freeze({ scientificName: 'Centaurea', lifeCycle: 'perennial' }), //есть однолетние виды
  '116_1': Object.freeze({ scientificName: 'Centaurea cyanus', lifeCycle: 'annual' }),
  118: Object.freeze({
    scientificName: 'Geranium',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '118_1': Object.freeze({
    scientificName: 'Geranium magnificum',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '118_3': Object.freeze({
    scientificName: 'Geranium × cantabrigiense',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '118_4': Object.freeze({
    scientificName: 'Geranium macrorrhizum',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  119: Object.freeze({
    scientificName: 'Bellis perennis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  120: Object.freeze({ scientificName: 'Lamprocapnos', lifeCycle: 'perennial' }),
  121: Object.freeze({ scientificName: 'Gaillardia', lifeCycle: 'perennial' }),
  122: Object.freeze({ scientificName: 'Galanthus', lifeCycle: 'perennial' }),
  123: Object.freeze({ scientificName: 'Celosia', lifeCycle: 'annual' }),
  124: Object.freeze({ scientificName: 'Opuntia', lifeCycle: 'perennial' }),
  125: Object.freeze({
    scientificName: 'Platycodon grandiflorus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  127: Object.freeze({ scientificName: 'Zinnia', lifeCycle: 'annual' }),
  130: Object.freeze({ scientificName: 'Crocus', lifeCycle: 'perennial' }),
  131: Object.freeze({
    scientificName: 'Veronica austriaca',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '131_1': Object.freeze({
    scientificName: 'Veronica austriaca',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '131_2': Object.freeze({
    scientificName: 'Veronica spicata',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  139: Object.freeze({ scientificName: 'Trachelospermum jasminoides', lifeCycle: 'perennial' }),
  142: Object.freeze({ scientificName: 'Hyacinthus', lifeCycle: 'perennial' }),
  146: Object.freeze({
    scientificName: 'Trifolium pratense',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '146_2': Object.freeze({
    scientificName: 'Trifolium repens',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  150: Object.freeze({
    scientificName: 'Salvia',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '150_1': Object.freeze({
    scientificName: 'Salvia officinalis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '150_2': Object.freeze({
    scientificName: 'Salvia pratensis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '150_3': Object.freeze({
    scientificName: 'Salvia farinacea',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '150_4': Object.freeze({
    scientificName: 'Salvia rosmarinus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '150_5': Object.freeze({
    scientificName: 'Salvia nemorosa',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  153: Object.freeze({ scientificName: 'Cornus Florida' }),
  155: Object.freeze({ scientificName: 'Angelonia', lifeCycle: 'perennial' }), //в культуре как однолетник
  156: Object.freeze({
    scientificName: 'Cynara cardunculus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  157: Object.freeze({ scientificName: 'Jasminum polyanthum', lifeCycle: 'perennial' }),
  158: Object.freeze({ scientificName: 'Sanchezia' }),
  159: Object.freeze({ scientificName: 'Ageratum', lifeCycle: 'annual' }),
  160: Object.freeze({
    scientificName: 'Aquilegia vulgaris',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  161: Object.freeze({ scientificName: 'Aubrieta', lifeCycle: 'perennial' }),
  162: Object.freeze({ scientificName: 'Catharanthus', lifeCycle: 'perennial' }), //в культуре как однолетник
  163: Object.freeze({ scientificName: 'Fittonia', lifeCycle: 'perennial' }),
  164: Object.freeze({ scientificName: 'Fumaria', lifeCycle: 'annual' }),
  165: Object.freeze({ scientificName: 'Helleborus', lifeCycle: 'perennial' }),
  166: Object.freeze({ scientificName: 'Alcea', lifeCycle: 'biennial' }), //иногда короткоживущий многолетник
  169: Object.freeze({ scientificName: 'Amaranthus', lifeCycle: 'annual' }),
  '169_1': Object.freeze({ scientificName: 'Amaranthus cruentus', lifeCycle: 'annual' }),
  '169_2': Object.freeze({ scientificName: 'Amaranthus hypochondriacus', lifeCycle: 'annual' }),
  185: Object.freeze({
    scientificName: 'Eschscholzia californica',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  186: Object.freeze({
    scientificName: 'Helenium autumnale',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  188: Object.freeze({
    scientificName: 'Kalanchoe blossfeldiana',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  194: Object.freeze({
    scientificName: 'Xerochrysum bracteatum',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  195: Object.freeze({
    scientificName: 'Antirrhinum majus',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  201: Object.freeze({
    scientificName: 'Vinca minor',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  214: Object.freeze({
    scientificName: 'Anethum graveolens',
    lifeCycle: 'annual',
    light: 'fullSun'
  }),
  '243_2': Object.freeze({
    scientificName: 'Echinops ritro',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  245: Object.freeze({
    scientificName: 'Lobelia cardinalis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '414_2': Object.freeze({
    scientificName: 'Linaria purpurea',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '414_3': Object.freeze({
    scientificName: 'Lunaria annua',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  416: Object.freeze({
    scientificName: 'Nepeta × faassenii',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  418: Object.freeze({
    scientificName: 'Lotus corniculatus',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  419: Object.freeze({
    scientificName: 'Digitalis purpurea',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '423_1': Object.freeze({
    scientificName: 'Thymus pulegioides',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '423_2': Object.freeze({
    scientificName: 'Thymus serpyllum',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  424: Object.freeze({
    scientificName: 'Hyssopus officinalis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  425: Object.freeze({
    scientificName: 'Origanum vulgare',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  431: Object.freeze({
    scientificName: 'Paeonia lactiflora',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  '435_1': Object.freeze({
    scientificName: 'Iris germanica',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  436: Object.freeze({
    scientificName: 'Alchemilla mollis',
    lifeCycle: 'perennial',
    light: 'fullSun'
  }),
  439: Object.freeze({
    scientificName: 'Armeria maritima',
    lifeCycle: 'perennial',
    light: 'fullSun'
  })
});

const plantFamiliesRaw = Object.freeze({
  'Acanthaceae': Object.freeze([158, 163]),
  'Amaranthaceae': Object.freeze([28, 123, 169, '169_1', '169_2']),
  'Amaryllidaceae': Object.freeze([3, 13, '13_1', 105, 122]),
  'Apiaceae': Object.freeze([2, 12, 214]),
  'Apocynaceae': Object.freeze([19, 58, 86, 139, 162, 201]),
  'Araceae': Object.freeze([80, 93, 96, 102]),
  'Asparagaceae': Object.freeze([14, 81, 104, 107, 142]),
  'Asphodelaceae': Object.freeze([36, '36_1', '36_2']),
  'Asteraceae': Object.freeze([1, 6, 8, 25, 26, 27, '27_1', 29, 30, 39, 40, 72, 73, '73_1', 89, 97, 100, '100_2', 101, '115_1', 116, '116_1', 119, 121, 127, 156, 159, 186, 194, '243_2']),
  'Begoniaceae': Object.freeze([91]),
  'Betulaceae': Object.freeze([114]),
  'Bignoniaceae': Object.freeze([50]),
  'Boraginaceae': Object.freeze([113]),
  'Brassicaceae': Object.freeze([84, 161, '414_3']),
  'Bromeliaceae': Object.freeze([32, 44]),
  'Cactaceae': Object.freeze([124]),
  'Campanulaceae': Object.freeze([83, '83_1', '83_2', '83_3', 125, 245]),
  'Caprifoliaceae': Object.freeze([53]),
  'Caryophyllaceae': Object.freeze([41, '41_1']),
  'Cornaceae': Object.freeze([153]),
  'Ericaceae': Object.freeze([21]),
  'Fabaceae': Object.freeze([18, 106, '106_1', '106_2', 146, '146_2', 418]),
  'Fagaceae': Object.freeze([90]),
  'Gentianaceae': Object.freeze([69]),
  'Geraniaceae': Object.freeze([108, 118, '118_1', '118_3', '118_4']),
  'Hydrangeaceae': Object.freeze([88]),
  'Iridaceae': Object.freeze([130, '435_1']),
  'Lamiaceae': Object.freeze([68, '68_1', '68_2', 110, 150, '150_1', '150_2', '150_3', '150_4', '150_5', '66_1', 416, '423_1', '423_2', 424, 425]),
  'Liliaceae': Object.freeze([16, 22, 35]),
  'Lythraceae': Object.freeze([51]),
  'Magnoliaceae': Object.freeze([24]),
  'Malvaceae': Object.freeze([55, 166]),
  'Musaceae': Object.freeze([95]),
  'Myrtaceae': Object.freeze([34, 77]),
  'Nyctaginaceae': Object.freeze([4]),
  'Oleaceae': Object.freeze([75, 157]),
  'Orchidaceae': Object.freeze([94]),
  'Paeoniaceae': Object.freeze([46, 431]),
  'Papaveraceae': Object.freeze([33, 120, 164, 185]),
  'Passifloraceae': Object.freeze([98]),
  'Pittosporaceae': Object.freeze([52]),
  'Plantaginaceae': Object.freeze([15, 131, '131_1', '131_2', 155, 195, '414_2', 419]),
  'Plumbaginaceae': Object.freeze([79, 439]),
  'Poaceae': Object.freeze([63]),
  'Polemoniaceae': Object.freeze([74]),
  'Ranunculaceae': Object.freeze([17, 47, '47_1', '47_2', 92, 112, 160, 165]),
  'Rosaceae': Object.freeze([31, '31_1', 59, 62, 436]),
  'Rubiaceae': Object.freeze([23]),
  'Scrophulariaceae': Object.freeze([85]),
  'Solanaceae': Object.freeze([76, 78, 109]),
  'Theaceae': Object.freeze([5]),
  'Verbenaceae': Object.freeze([54, 64, '64_1']),
  'Violaceae': Object.freeze([82, '82_2']),
  'Crassulaceae': Object.freeze([188])
});

const NUMERIC_ID_PATTERN = /^\d+$/;

function normalizePlantId(rawId) {
  const stringId = String(rawId);
  return NUMERIC_ID_PATTERN.test(stringId) ? Number(stringId) : stringId;
}

const plantFamilyById = Object.freeze(Object.fromEntries(
  Object.entries(plantFamiliesRaw).flatMap(([family, ids]) =>
    ids.map((id) => {
      const normalizedId = normalizePlantId(id);
      return [normalizedId, family];
    })
  )
));

export const plantFamilies = plantFamiliesRaw;

export const plantParametersById = Object.freeze(Object.fromEntries(
  Object.entries(plantParametersRaw).map(([id, params]) => {
    const normalizedId = normalizePlantId(id);
    const family = plantFamilyById[normalizedId] || plantFamilyById[id] || null;

    return [
      normalizedId,
      Object.freeze({ ...params, family })
    ];
  })
));

export function getPlantParameters(id) {
  return plantParametersById[id] || null;
}
