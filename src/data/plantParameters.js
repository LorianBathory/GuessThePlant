const createLocalized = (ru, en, nl) => Object.freeze({ ru, en, nl });

export const plantParametersById = Object.freeze({
  1: Object.freeze({
    family: createLocalized('Asteraceae', 'Asteraceae', 'Asteraceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '9-11',
    light: createLocalized('Полное солнце (6+ часов)', 'Full sun (6+ hours)', 'Volle zon (6+ uur)'),
    toxicity: createLocalized('Нетоксично для людей и животных', 'Non-toxic to people and pets', 'Niet giftig voor mensen en dieren')
  }),
  3: Object.freeze({
    family: createLocalized('Amaryllidaceae', 'Amaryllidaceae', 'Amaryllidaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '7-10',
    light: createLocalized('Солнце — от 6 часов', 'Full sun (6+ hours)', 'Volle zon (6+ uur)'),
    toxicity: createLocalized('Токсичен для людей и животных', 'Toxic to people and pets', 'Giftig voor mensen en dieren')
  }),
  5: Object.freeze({
    family: createLocalized('Theaceae', 'Theaceae', 'Theaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '7-9',
    light: createLocalized('Яркий рассеянный свет или полутень', 'Bright filtered light or partial shade', 'Helder gefilterd licht of halfschaduw'),
    toxicity: createLocalized('Нетоксично для людей и животных', 'Non-toxic to people and pets', 'Niet giftig voor mensen en dieren')
  }),
  13: Object.freeze({
    family: createLocalized('Amaryllidaceae', 'Amaryllidaceae', 'Amaryllidaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '4-9',
    light: createLocalized('Полное солнце (6+ часов)', 'Full sun (6+ hours)', 'Volle zon (6+ uur)'),
    toxicity: createLocalized('Токсично для домашних животных при проглатывании', 'Toxic to pets if ingested', 'Giftig voor huisdieren bij inname')
  }),
  21: Object.freeze({
    family: createLocalized('Ericaceae', 'Ericaceae', 'Ericaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '4-8',
    light: createLocalized('Рассеянный свет, полутень', 'Dappled light or partial shade', 'Gefilterd licht of halfschaduw'),
    toxicity: createLocalized('Сильно токсично для людей и животных', 'Highly toxic to people and pets', 'Sterk giftig voor mensen en dieren')
  }),
  31: Object.freeze({
    family: createLocalized('Rosaceae', 'Rosaceae', 'Rosaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '3-9',
    light: createLocalized('Полное солнце (6+ часов)', 'Full sun (6+ hours)', 'Volle zon (6+ uur)'),
    toxicity: createLocalized('Нетоксично, но осторожно с шипами', 'Non-toxic, but watch the thorns', 'Niet giftig, maar pas op voor de doornen')
  }),
  68: Object.freeze({
    family: createLocalized('Lamiaceae', 'Lamiaceae', 'Lamiaceae'),
    lifeCycle: createLocalized('Многолетник', 'Perennial', 'Meerjarig'),
    hardinessZone: '5-9',
    light: createLocalized('Полное солнце (6+ часов)', 'Full sun (6+ hours)', 'Volle zon (6+ uur)'),
    toxicity: createLocalized('Легко токсична для животных при проглатывании', 'Mildly toxic to pets if ingested', 'Licht giftig voor huisdieren bij inname')
  }),
  88: Object.freeze({
    family: createLocalized('Hydrangeaceae', 'Hydrangeaceae', 'Hydrangeaceae'),
    lifeCycle: createLocalized('Многолетний кустарник', 'Perennial shrub', 'Meerjarige struik'),
    hardinessZone: '5-9',
    light: createLocalized('Утреннее солнце и дневная полутень', 'Morning sun with afternoon shade', 'Ochtendezon en middaghalfschaduw'),
    toxicity: createLocalized('Токсична при проглатывании', 'Toxic if ingested', 'Giftig bij inname')
  })
});

export function getPlantParameters(id) {
  return plantParametersById[id] || null;
}
