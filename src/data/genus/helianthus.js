const helianthusEntries = Object.freeze({
  100: Object.freeze({
    names: Object.freeze({
      ru: 'Подсолнечник',
      en: 'Sunflower',
      nl: 'Zonnebloem',
      sci: 'Helianthus'
    }),
    images: Object.freeze(['p100_1'])
  }),
  '100_1': Object.freeze({
    names: Object.freeze({
      ru: 'Подсолнечник однолетний',
      en: 'Common Sunflower',
      nl: 'Zonnebloem',
      sci: 'Helianthus annuus'
    }),
    images: Object.freeze(['p100_1_1'])
  }),
  '100_2': Object.freeze({
    names: Object.freeze({
      ru: 'Топинамбур',
      en: 'Jerusalem artichoke',
      nl: 'Aardpeer',
      sci: 'Helianthus tuberosus'
    }),
    images: Object.freeze(['p100_2_1'])
  })
});

export const helianthusGenus = Object.freeze({
  id: 100,
  slug: 'helianthus',
  wrongAnswers: Object.freeze([6, 39, 27]),
  entries: helianthusEntries
});
