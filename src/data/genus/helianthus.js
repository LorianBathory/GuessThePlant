const helianthusEntries = Object.freeze({
  100: Object.freeze({
    names: Object.freeze({
      ru: 'Подсолнечник',
      en: 'Sunflower',
      nl: 'Zonnebloem',
      sci: 'Helianthus'
    }),
    images: Object.freeze(['p080'])
  }),
  '100_1': Object.freeze({
    names: Object.freeze({
      ru: 'Подсолнечник однолетний',
      en: 'Common Sunflower',
      nl: 'Zonnebloem',
      sci: 'Helianthus annuus'
    }),
    images: Object.freeze(['p310'])
  }),
  '100_2': Object.freeze({
    names: Object.freeze({
      ru: 'Топинамбур',
      en: 'Jerusalem artichoke',
      nl: 'Aardpeer',
      sci: 'Helianthus tuberosus'
    }),
    images: Object.freeze(['p199'])
  })
});

export const helianthusGenus = Object.freeze({
  id: 100,
  slug: 'helianthus',
  wrongAnswers: Object.freeze([6, 39, 27]),
  entries: helianthusEntries
});
