const centaureaEntries = Object.freeze({
  116: Object.freeze({
    names: Object.freeze({
      ru: 'Василёк',
      en: 'Knapweeds',
      nl: 'Knoopkruid',
      sci: 'Centaurea'
    }),
    images: Object.freeze(['p116_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '116_1': Object.freeze({
    names: Object.freeze({
      ru: 'Василёк синий',
      en: 'Cornflower',
      nl: 'Korenbloem',
      sci: 'Centaurea cyanus'
    }),
    images: Object.freeze(['p116_1_1'])
    //wrongAnswers: Object.freeze([?, ?])
  })
});

export const centaureaGenus = Object.freeze({
  id: 116,
  slug: 'centaurea',
  entries: centaureaEntries
});
