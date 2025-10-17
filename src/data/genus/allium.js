const alliumEntries = Object.freeze({
  13: Object.freeze({
    names: Object.freeze({
      ru: 'Лук',
      en: 'Allium',
      nl: 'Reuzenlook',
      sci: 'Allium'
    }),
    images: Object.freeze(['p13_1', 'p13_2', 'p13_3', 'p13_4'])
  }),
  '13_1': Object.freeze({
    names: Object.freeze({
      ru: 'Черемша',
      en: 'Ramsons',
      nl: 'Daslook',
      sci: 'Allium ursinum'
    }),
    wrongAnswers: Object.freeze([3, 11])
  }),
  '13_2': Object.freeze({
    names: Object.freeze({
      ru: '?',
      en: '?',
      nl: '?',
      sci: 'Allium tuberosum'
    }),
    images: Object.freeze(['p13_5'])
  })
});

export const alliumGenus = Object.freeze({
  id: 13,
  slug: 'allium',
  wrongAnswers: Object.freeze([3, 11]),
  entries: alliumEntries
});
