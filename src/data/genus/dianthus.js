const dianthusEntries = Object.freeze({
  41: Object.freeze({
    names: Object.freeze({
      ru: 'Гвоздика',
      en: 'Dianthus/Carnation',
      nl: 'Anjer',
      sci: 'Dianthus'
    }),
    images: Object.freeze(['p41_1', 'p41_2', 'p41_3']),
    wrongAnswers: Object.freeze([39, 40, 97, 192])
  }),
  192: Object.freeze({
    names: Object.freeze({
      ru: 'Гвоздика бородатая (турецкая)',
      en: 'Sweet William',
      nl: 'Duizendschoon',
      sci: 'Dianthus barbatus'
    }),
    images: Object.freeze(['p192_1']),
    wrongAnswers: Object.freeze([41, 39, 40])
  })
});

export const dianthusGenus = Object.freeze({
  id: 41,
  slug: 'dianthus',
  wrongAnswers: Object.freeze([39, 40, 97]),
  entries: dianthusEntries
});
