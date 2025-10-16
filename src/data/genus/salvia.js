const salviaEntries = Object.freeze({
  150: Object.freeze({
    names: Object.freeze({
      ru: 'Шалфей',
      en: 'Common sage',
      nl: 'Salie',
      sci: 'Salvia officinalis'
    }),
    images: Object.freeze(['p150_1', 'p150_2']),
    wrongAnswers: Object.freeze([198])
  }),
  198: Object.freeze({
    names: Object.freeze({
      ru: 'Шалфей луговой',
      en: 'Meadow sage',
      nl: 'Veldsalie',
      sci: 'Salvia pratensis'
    }),
    images: Object.freeze(['p198_1']),
    wrongAnswers: Object.freeze([150])
  })
});

export const salviaGenus = Object.freeze({
  id: 150,
  slug: 'salvia',
  entries: salviaEntries
});
