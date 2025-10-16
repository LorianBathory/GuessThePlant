const amaranthusEntries = Object.freeze({
  169: Object.freeze({
    names: Object.freeze({
      ru: 'Амарант багряный',
      en: 'Red amaranth',
      nl: 'Rode amarant',
      sci: 'Amaranthus cruentus'
    }),
    images: Object.freeze(['p169_1']),
    wrongAnswers: Object.freeze([170])
  }),
  170: Object.freeze({
    names: Object.freeze({
      ru: 'Амарант тёмный (печальный)',
      en: "Prince's-feather",
      nl: 'Amaranthus hypochondriacus',
      sci: 'Amaranthus hypochondriacus'
    }),
    images: Object.freeze(['p170_1']),
    wrongAnswers: Object.freeze([169])
  })
});

export const amaranthusGenus = Object.freeze({
  id: 169,
  slug: 'amaranthus',
  entries: amaranthusEntries
});
