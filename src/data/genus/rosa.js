const rosaEntries = Object.freeze({
  31: Object.freeze({
    names: Object.freeze({
      ru: 'Роза',
      en: 'Rose',
      nl: 'Roos',
      sci: 'Rosa'
    }),
    images: Object.freeze([
      'p31_1',
      'p31_2',
      'p31_3',
      'p31_4',
      'p31_5',
      'p31_6',
      'p31_7',
      'p31_8'
    ])
  }),
  '31_1': Object.freeze({
    names: Object.freeze({
      ru: 'Шиповник',
      en: 'Dog-rose',
      nl: 'Roos',
      sci: 'Rosa canina'
    }),
    images: Object.freeze(['p31_1_1']),
    wrongAnswers: Object.freeze([4])
  })
});

export const rosaGenus = Object.freeze({
  id: 31,
  slug: 'rosa',
  wrongAnswers: Object.freeze([41, 69, 46, 5]),
  entries: rosaEntries
});
