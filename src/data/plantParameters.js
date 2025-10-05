const plantParametersRaw = Object.freeze({
  1: Object.freeze({
    scientificName: 'Asteriscus maritimus',
    lifeCycle: 'perennial',
    additionalInfo: 'Компактный средиземноморский кустарник, предпочитает солнце и устойчив к засухе.',
    toxicity: Object.freeze([
      Object.freeze({ level: 2, tag: 'skin' }),
      Object.freeze({ level: 3, tag: 'cat' })
    ])
  }),
  2: Object.freeze({ scientificName: 'Daucus carota', lifeCycle: 'biennial' }), //в дикой форме; в культуре однолетник
  3: Object.freeze({ scientificName: 'Agapanthus africanus', lifeCycle: 'perennial' }),
  4: Object.freeze({ scientificName: 'Bougainvillea spectabilis' }),
  5: Object.freeze({ scientificName: 'Camellia japonica' }),
  6: Object.freeze({ scientificName: 'Gerbera jamesonii', lifeCycle: 'perennial' }), //но часто выращивают как однолетник
  8: Object.freeze({ scientificName: 'Gazania', lifeCycle: 'perennial' }), //в умеренном климате — как однолетник
  12: Object.freeze({ scientificName: 'Pastinaca sativa', lifeCycle: 'biennial' }),
  13: Object.freeze({ scientificName: 'Allium', lifeCycle: 'perennial' }),
  14: Object.freeze({ scientificName: 'Camassia', lifeCycle: 'perennial' }),
  15: Object.freeze({ scientificName: 'Globularia', lifeCycle: 'perennial' }),
  16: Object.freeze({ scientificName: 'Fritillaria', lifeCycle: 'perennial' }),
  17: Object.freeze({ scientificName: 'Clematis', lifeCycle: 'perennial' }),
  18: Object.freeze({ scientificName: 'Wisteria', lifeCycle: 'perennial' }),
  19: Object.freeze({ scientificName: 'Nerium oleander' }),
  21: Object.freeze({ scientificName: 'Rhododendron' }),
  22: Object.freeze({ scientificName: 'Tulipa', lifeCycle: 'perennial' }), //луковичный
  23: Object.freeze({ scientificName: 'Gardenia' }),
  24: Object.freeze({ scientificName: 'Magnolia' }),
  25: Object.freeze({ scientificName: 'Leucanthemum vulgare', lifeCycle: 'perennial' }),
  26: Object.freeze({ scientificName: 'Dahlia', lifeCycle: 'perennial' }), //в умеренном климате выращивают как однолетник
  27: Object.freeze({ scientificName: 'Echinacea', lifeCycle: 'perennial' }),
  28: Object.freeze({ scientificName: 'Gomphrena', lifeCycle: 'annual' }),
  29: Object.freeze({ scientificName: 'Chrysanthemum', lifeCycle: 'perennial' }),
  30: Object.freeze({ scientificName: 'Osteospermum', lifeCycle: 'perennial' }), //в умеренном климате — как однолетник
  31: Object.freeze({ scientificName: 'Rosa' }),
  32: Object.freeze({ scientificName: 'Guzmania lingulata', lifeCycle: 'perennial' }),
  33: Object.freeze({ scientificName: 'Papaver' }),
  34: Object.freeze({ scientificName: 'Metrosideros excelsa' }),
  35: Object.freeze({ scientificName: 'Lilium', lifeCycle: 'perennial' }), //луковичный
  36: Object.freeze({ scientificName: 'Hemerocallis', lifeCycle: 'perennial' }),
  39: Object.freeze({ scientificName: 'Heliopsis helianthoides', lifeCycle: 'perennial' }),
  40: Object.freeze({ scientificName: 'Coreopsis' }),
  41: Object.freeze({ scientificName: 'Dianthus' }),
  44: Object.freeze({ scientificName: 'Ananas comosus', lifeCycle: 'perennial' }),
  46: Object.freeze({ scientificName: 'Paeonia', lifeCycle: 'perennial' }),
  47: Object.freeze({ scientificName: 'Anemone', lifeCycle: 'perennial' }),
  50: Object.freeze({ scientificName: 'Jacaranda mimosifolia' }),
  51: Object.freeze({ scientificName: 'Punica granatum' }),
  52: Object.freeze({ scientificName: 'Pittosporum tobira' }),
  53: Object.freeze({ scientificName: 'Sixalix atropurpurea', lifeCycle: 'biennial' }),
  54: Object.freeze({ scientificName: 'Lantana' }),
  55: Object.freeze({ scientificName: 'Hibiscus' }),
  58: Object.freeze({ scientificName: 'Rosa' }),
  59: Object.freeze({ scientificName: 'Crataegus' }),
  62: Object.freeze({ scientificName: 'Malus' }),
  63: Object.freeze({ scientificName: 'Zea mays', lifeCycle: 'annual' }),
  64: Object.freeze({ scientificName: 'Verbena', lifeCycle: 'perennial' }), //в культуре часто как однолетник
  68: Object.freeze({ scientificName: 'Lavandula' }),
  69: Object.freeze({ scientificName: 'Eustoma', lifeCycle: 'biennial' }), //в культуре чаще однолетник
  72: Object.freeze({ scientificName: 'Arctium', lifeCycle: 'biennial' }),
  73: Object.freeze({ scientificName: 'Aster', lifeCycle: 'perennial' }), //иногда однолетник
  74: Object.freeze({ scientificName: 'Phlox', lifeCycle: 'perennial' }), //есть однолетние виды
  75: Object.freeze({ scientificName: 'Syringa' }),
  76: Object.freeze({ scientificName: 'Petunia', lifeCycle: 'perennial' }), //в культуре выращивается как однолетник
  77: Object.freeze({ scientificName: 'Rhodomyrtus' }),
  78: Object.freeze({ scientificName: 'Solanum' }),
  79: Object.freeze({ scientificName: 'Plumbago' }),
  80: Object.freeze({ scientificName: 'Caladium bicolor', lifeCycle: 'perennial' }),
  81: Object.freeze({ scientificName: 'Hosta', lifeCycle: 'perennial' }),
  82: Object.freeze({ scientificName: 'Viola tricolor var. hortensis', lifeCycle: 'biennial' }), //в культуре чаще однолетник
  83: Object.freeze({ scientificName: 'Campanula', lifeCycle: 'perennial' }), //есть двулетние и однолетние виды
  84: Object.freeze({ scientificName: 'Brassica oleracea Gongylodes Group', lifeCycle: 'biennial' }),
  85: Object.freeze({ scientificName: 'Buddleja davidii' }),
  86: Object.freeze({ scientificName: 'Plumeria' }),
  88: Object.freeze({ scientificName: 'Hydrangea macrophylla' }),
  89: Object.freeze({ scientificName: 'Santolina chamaecyparissus' }),
  90: Object.freeze({ scientificName: 'Fagus sylvatica' }),
  91: Object.freeze({ scientificName: 'Begonia', lifeCycle: 'perennial' }), //в культуре часто однолетник
  92: Object.freeze({ scientificName: 'Ranunculus', lifeCycle: 'perennial' }), //есть однолетние виды
  93: Object.freeze({ scientificName: 'Syngonium podophyllum', lifeCycle: 'perennial' }),
  94: Object.freeze({ scientificName: 'Orchidaceae', lifeCycle: 'perennial' }),
  95: Object.freeze({ scientificName: 'Musa', lifeCycle: 'perennial' }),
  96: Object.freeze({ scientificName: 'Zamioculcas zamiifolia', lifeCycle: 'perennial' }),
  97: Object.freeze({ scientificName: 'Tagetes', lifeCycle: 'annual' }),
  98: Object.freeze({ scientificName: 'Passiflora edulis', lifeCycle: 'perennial' }),
  100: Object.freeze({ scientificName: 'Helianthus annuus', lifeCycle: 'annual' }),
  101: Object.freeze({ scientificName: 'Cosmos bipinnatus', lifeCycle: 'annual' }),
  102: Object.freeze({ scientificName: 'Aglaonema', lifeCycle: 'perennial' }),
  104: Object.freeze({ scientificName: 'Scilla', lifeCycle: 'perennial' }),
  105: Object.freeze({ scientificName: 'Narcissus', lifeCycle: 'perennial' }),
  107: Object.freeze({ scientificName: 'Muscari', lifeCycle: 'perennial' }),
  108: Object.freeze({ scientificName: 'Pelargonium', lifeCycle: 'perennial' }), //в культуре часто как однолетник
  109: Object.freeze({ scientificName: 'Calibrachoa', lifeCycle: 'perennial' }), //в культуре как однолетник
  110: Object.freeze({ scientificName: 'Coleus', lifeCycle: 'perennial' }), //в культуре как однолетник
  112: Object.freeze({ scientificName: 'Delphinium', lifeCycle: 'perennial' }),
  113: Object.freeze({ scientificName: 'Brunnera', lifeCycle: 'perennial' }),
  114: Object.freeze({ scientificName: 'Betula' }),
  116: Object.freeze({ scientificName: 'Centaurea cyanus', lifeCycle: 'annual' }),
  117: Object.freeze({ scientificName: 'Centaurea', lifeCycle: 'perennial' }), //есть однолетние виды
  118: Object.freeze({ scientificName: 'Geranium', lifeCycle: 'perennial' }),
  119: Object.freeze({ scientificName: 'Bellis perennis', lifeCycle: 'perennial' }),
  120: Object.freeze({ scientificName: 'Lamprocapnos', lifeCycle: 'perennial' }),
  121: Object.freeze({ scientificName: 'Gaillardia', lifeCycle: 'perennial' }),
  122: Object.freeze({ scientificName: 'Galanthus', lifeCycle: 'perennial' }),
  123: Object.freeze({ scientificName: 'Celosia', lifeCycle: 'annual' }),
  124: Object.freeze({ scientificName: 'Opuntia', lifeCycle: 'perennial' }),
  125: Object.freeze({ scientificName: 'Platycodon grandiflorus', lifeCycle: 'perennial' }),
  127: Object.freeze({ scientificName: 'Zinnia', lifeCycle: 'annual' }),
  130: Object.freeze({ scientificName: 'Crocus', lifeCycle: 'perennial' }),
  131: Object.freeze({ scientificName: 'Veronica austriaca', lifeCycle: 'perennial' }),
  139: Object.freeze({ scientificName: 'Trachelospermum jasminoides', lifeCycle: 'perennial' }),
  142: Object.freeze({ scientificName: 'Hyacinthus', lifeCycle: 'perennial' }),
  146: Object.freeze({ scientificName: 'Trifolium pratense', lifeCycle: 'perennial' }),
  153: Object.freeze({ scientificName: 'Cornus Florida' }),
  155: Object.freeze({ scientificName: 'Angelonia', lifeCycle: 'perennial' }), //в культуре как однолетник
  156: Object.freeze({ scientificName: 'Cynara cardunculus', lifeCycle: 'perennial' }),
  157: Object.freeze({ scientificName: 'Jasminum polyanthum', lifeCycle: 'perennial' }),
  158: Object.freeze({ scientificName: 'Sanchezia' }),
  159: Object.freeze({ scientificName: 'Ageratum', lifeCycle: 'annual' }),
  160: Object.freeze({ scientificName: 'Aquilegia vulgaris', lifeCycle: 'perennial' }),
  161: Object.freeze({ scientificName: 'Aubrieta', lifeCycle: 'perennial' }),
  162: Object.freeze({ scientificName: 'Catharanthus', lifeCycle: 'perennial' }), //в культуре как однолетник
  163: Object.freeze({ scientificName: 'Fittonia', lifeCycle: 'perennial' }),
  164: Object.freeze({ scientificName: 'Fumaria', lifeCycle: 'annual' }),
  165: Object.freeze({ scientificName: 'Helleborus', lifeCycle: 'perennial' }),
  166: Object.freeze({ scientificName: 'Alcea', lifeCycle: 'biennial' }) //иногда короткоживущий многолетник
});

const plantFamiliesRaw = Object.freeze({
  'Acanthaceae': Object.freeze([158, 163]),
  'Amaranthaceae': Object.freeze([28, 123]),
  'Amaryllidaceae': Object.freeze([3, 13, 105, 122]),
  'Apiaceae': Object.freeze([2, 12]),
  'Apocynaceae': Object.freeze([19, 86, 139, 162]),
  'Araceae': Object.freeze([80, 93, 96, 102]),
  'Asparagaceae': Object.freeze([14, 81, 104, 107, 142]),
  'Asphodelaceae': Object.freeze([36]),
  'Asteraceae': Object.freeze([1, 6, 8, 25, 26, 27, 29, 30, 39, 40, 72, 73, 89, 97, 100, 101, 116, 117, 119, 121, 127, 156, 159]),
  'Begoniaceae': Object.freeze([91]),
  'Betulaceae': Object.freeze([114]),
  'Bignoniaceae': Object.freeze([50]),
  'Boraginaceae': Object.freeze([113]),
  'Brassicaceae': Object.freeze([84, 161]),
  'Bromeliaceae': Object.freeze([32, 44]),
  'Cactaceae': Object.freeze([124]),
  'Campanulaceae': Object.freeze([83, 125]),
  'Caprifoliaceae': Object.freeze([53]),
  'Caryophyllaceae': Object.freeze([41]),
  'Cornaceae': Object.freeze([153]),
  'Ericaceae': Object.freeze([21]),
  'Fabaceae': Object.freeze([18, 146]),
  'Fagaceae': Object.freeze([90]),
  'Gentianaceae': Object.freeze([69]),
  'Geraniaceae': Object.freeze([108, 118]),
  'Hydrangeaceae': Object.freeze([88]),
  'Iridaceae': Object.freeze([130]),
  'Lamiaceae': Object.freeze([68, 110]),
  'Liliaceae': Object.freeze([16, 22, 35]),
  'Lythraceae': Object.freeze([51]),
  'Magnoliaceae': Object.freeze([24]),
  'Malvaceae': Object.freeze([55, 166]),
  'Musaceae': Object.freeze([95]),
  'Myrtaceae': Object.freeze([34, 77]),
  'Nyctaginaceae': Object.freeze([4]),
  'Oleaceae': Object.freeze([75, 157]),
  'Orchidaceae': Object.freeze([94]),
  'Paeoniaceae': Object.freeze([46]),
  'Papaveraceae': Object.freeze([33, 120, 164]),
  'Passifloraceae': Object.freeze([98]),
  'Pittosporaceae': Object.freeze([52]),
  'Plantaginaceae': Object.freeze([15, 131, 155]),
  'Plumbaginaceae': Object.freeze([79]),
  'Poaceae': Object.freeze([63]),
  'Polemoniaceae': Object.freeze([74]),
  'Ranunculaceae': Object.freeze([17, 47, 92, 112, 160, 165]),
  'Rosaceae': Object.freeze([31, 58, 59, 62]),
  'Rubiaceae': Object.freeze([23]),
  'Scrophulariaceae': Object.freeze([85]),
  'Solanaceae': Object.freeze([76, 78, 109]),
  'Theaceae': Object.freeze([5]),
  'Verbenaceae': Object.freeze([54, 64]),
  'Violaceae': Object.freeze([82])
});

const plantFamilyById = Object.freeze(Object.fromEntries(
  Object.entries(plantFamiliesRaw).flatMap(([family, ids]) =>
    ids.map((id) => [id, family])
  )
));

export const plantFamilies = plantFamiliesRaw;

export const plantParametersById = Object.freeze(Object.fromEntries(
  Object.entries(plantParametersRaw).map(([id, params]) => [
    Number(id),
    Object.freeze({ ...params, family: plantFamilyById[id] || null })
  ])
));

export function getPlantParameters(id) {
  return plantParametersById[id] || null;
}
