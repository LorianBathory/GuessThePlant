const centaureaEntries = Object.freeze({
  116: Object.freeze({
    names: Object.freeze({
      ru: 'Василек',
      en: 'Cornflower (esp. C. cyanus)',
      nl: 'Korenbloem',
      sci: 'Centaurea cyanus'
    }),
    images: Object.freeze(['p116_1']),
    wrongAnswers: Object.freeze([117])
  }),
  117: Object.freeze({
    names: Object.freeze({
      ru: 'Василек',
      en: 'Knapweeds',
      nl: 'Knoopkruid',
      sci: 'Centaurea'
    }),
    images: Object.freeze(['p117_1']),
    wrongAnswers: Object.freeze([116])
  })
});

export const centaureaGenus = Object.freeze({
  id: 116,
  slug: 'centaurea',
  entries: centaureaEntries
});
