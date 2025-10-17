const veronicaEntries = Object.freeze({
  131: Object.freeze({
    names: Object.freeze({
      ru: 'Вероника',
      en: 'Veronica',
      nl: 'Ereprijs',
      sci: 'Veronica'
    })
  }),
  '131_1': Object.freeze({
    names: Object.freeze({
      ru: '?',
      en: '?',
      nl: '?',
      sci: 'Veronica austriaca'
    }),
    images: Object.freeze(['p131_1']),
    wrongAnswers: Object.freeze([14, 112])
  }),
  '131_2': Object.freeze({
    names: Object.freeze({
      ru: '?',
      en: '?',
      nl: '?',
      sci: 'Veronica spicata'
    }),
    images: Object.freeze(['p131_2'])
  })
});

export const veronicaGenus = Object.freeze({
  id: 131,
  slug: 'veronica',
  entries: veronicaEntries
});
