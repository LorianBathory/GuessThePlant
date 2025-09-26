// ЕДИНЫЙ ИСТОЧНИК ДАННЫХ: все таксоны в одном месте.
// У некоторых есть image => они могут быть вопросами; у остальных пока только варианты.
export const speciesById = {
  1:  { names:{ru:"Астерискус приморский", en:"Beach Daisy", sci:"Asteriscus maritimus"}, image:"images/BeachDaisy.JPG", wrongAnswers:[7,8,9] },
  2:  { names:{ru:"Дикая морковь",         en:"Sea Carrot",  sci:"Daucus carota"},       image:"images/MoonCarrot.JPG",   wrongAnswers:[10,11,12] },
  3:  { names:{ru:"Агапантус",             en:"Agapanthus",  sci:"Agapanthus africanus"}, image:"images/Agapanthus.JPG",   wrongAnswers:[13,14,15,16] },
  4:  { names:{ru:"Бугенвиллия",           en:"Bougainvillea", sci:"Bougainvillea spectabilis"}, image:"images/bougainvillea.JPG", wrongAnswers:[17,18,19,20] },
  5:  { names:{ru:"Камелия",               en:"Camellia",    sci:"Camellia japonica"},   image:"images/camelia.JPG",      wrongAnswers:[20,21,22,23,24] },
  6:  { names:{ru:"Гербера",               en:"Gerbera",     sci:"Gerbera jamesonii"},   image:"images/Gerbera.JPG",      wrongAnswers:[25,26,27,28,29] },

  // (пока только варианты; позже можно добавить image — и они станут вопросами автоматически)
  7:  { names:{ru:"Арктотека ноготковая",  en:"Cape Weed",   sci:"Arctotheca calendula"} },
  8:  { names:{ru:"Гацания",               en:"Gazania",     sci:"Gazania"} },
  9:  { names:{ru:"Лампрантус золотой",    en:"Golden Ice Plant", sci:"Lampranthus aureus"} },
  10: { names:{ru:"Борщевик",              en:"Hogweed",     sci:"Heracleum"} },
  11: { names:{ru:"Дудник лесной",         en:"Wild Parsley", sci:"Angelica sylvestris"} },
  12: { names:{ru:"Пастернак",             en:"Parsnip",     sci:"Pastinaca sativa"} },
  13: { names:{ru:"Лук гигантский",        en:"Giant Allium", sci:"Allium giganteum"} },
  14: { names:{ru:"Камассия",              en:"Camas",       sci:"Camassia"} },
  15: { names:{ru:"Глобулярия",            en:"Globe Daisy", sci:"Globularia"} },
  16: { names:{ru:"Рябчик",                en:"Fritillary",  sci:"Fritillaria"} },
  17: { names:{ru:"Клематис",              en:"Clematis",    sci:"Clematis"} },
  18: { names:{ru:"Глициния",              en:"Wisteria",    sci:"Wisteria"} },
  19: { names:{ru:"Олеандр",               en:"Oleander",    sci:"Nerium oleander"} },
  20: { names:{ru:"Азалия",                en:"Azalea",      sci:"Rhododendron"} },
  21: { names:{ru:"Рододендрон",           en:"Rhododendron", sci:"Rhododendron"} },
  22: { names:{ru:"Роза",                  en:"Rose",        sci:"Rosa"} },
  23: { names:{ru:"Гардения",              en:"Gardenia",    sci:"Gardenia"} },
  24: { names:{ru:"Магнолия",              en:"Magnolia",    sci:"Magnolia"} },
  25: { names:{ru:"Нивяник",               en:"Shasta Daisy", sci:"Leucanthemum x superbum"} },
  26: { names:{ru:"Георгин",               en:"Dahlia",      sci:"Dahlia"} },
  27: { names:{ru:"Эхинацея",              en:"Coneflower",  sci:"Echinacea"} },
  28: { names:{ru:"Арктотис",              en:"African Daisy", sci:"Arctotis"} },
  29: { names:{ru:"Хризантема крупноцветковая", en:"Max Chrysanthemum", sci:"Chrysanthemum maximum"} },

  // Новые с изображениями (игровые вопросы уже сейчас)
  30: { names:{ru:"Остеоспермум",          en:"African Daisy", sci:"Osteospermum"},       image:"images/Osteospermum.JPG" },
  31: { names:{ru:"Роза",                  en:"Rose",          sci:"Rosa"},               image:"images/Rose.JPG" },
  32: { names:{ru:"Гузмания",              en:"Scarlet Star",  sci:"Guzmania lingulata"}, image:"images/Guzmania.JPG" },
  33: { names:{ru:"Мак",                   en:"Poppy",         sci:"Papaver"},            image:"images/Poppy.JPG" },
  34: { names:{ru:"Похутукава",            en:"Pohutukawa",    sci:"Metrosideros excelsa"}, image:"images/Pohutukawa.JPG" },
  35: { names:{ru:"Лилия",                 en:"Lily",          sci:"Lilium"},             image:"images/Lily.JPG" }
};

// ПРОИЗВОДНЫЕ ПРЕДСТАВЛЕНИЯ (для совместимости с текущей логикой):
export const choicesById = Object.fromEntries(
  Object.entries(speciesById).map(([id, v]) => [Number(id), v.names])
);

export const ALL_CHOICE_IDS = Object.freeze(
  Object.keys(speciesById).map(n => Number(n))
);

// Растения, доступные как ВОПРОСЫ прямо сейчас (есть image):
export const plants = Object.entries(speciesById)
  .filter(([, v]) => !!v.image)
  .map(([id, v]) => ({
    id: Number(id),
    image: v.image,
    names: v.names,
    wrongAnswers: v.wrongAnswers
  }));
