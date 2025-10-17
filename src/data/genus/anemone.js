const anemoneEntries = Object.freeze({
  47: Object.freeze({
    names: Object.freeze({
      ru: 'Анемона',
      en: 'Anemone',
      nl: 'Anemoon',
      sci: 'Anemone'
    }),
    images: Object.freeze(['p47_1', 'p47_2', 'p47_3', 'p47_4'])
  }),
  '47_1': Object.freeze({
    names: Object.freeze({
      ru: 'Ветреница/анемона корончатая',
      en: 'Poppy anemone',
      nl: 'Tuinanemoon',
      sci: 'Anemone coronaria'
    }),
    images: Object.freeze(['p47_1_1']),
    wrongAnswers: Object.freeze([33])
  })
});

export const anemoneGenus = Object.freeze({
  id: 47,
  slug: 'anemone',
  wrongAnswers: Object.freeze([33]),
  entries: anemoneEntries
});
