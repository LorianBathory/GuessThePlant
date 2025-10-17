const campanulaEntries = Object.freeze({
  83: Object.freeze({
    names: Object.freeze({
      ru: 'Кампанула',
      en: 'Bellflower',
      nl: 'Klokje',
      sci: 'Campanula'
    }),
    images: Object.freeze(['p83_1', 'p83_2'])
  }),
  '83_1': Object.freeze({
    names: Object.freeze({
      ru: 'Колокольчик круглолистный',
      en: 'Harebell',
      nl: 'Grasklokje',
      sci: 'Campanula rotundifolia'
    }),
    images: Object.freeze(['p83_1_1']),
    wrongAnswers: Object.freeze([21])
  })
});

export const campanulaGenus = Object.freeze({
  id: 83,
  slug: 'campanula',
  wrongAnswers: Object.freeze([21]),
  entries: campanulaEntries
});
