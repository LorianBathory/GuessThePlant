const amaranthusEntries = Object.freeze({
  169: Object.freeze({
    names: Object.freeze({
      ru: 'Амарант',
      en: 'Amaranth',
      nl: 'Amarant',
      sci: 'Amaranthus'
    }),
    images: Object.freeze(['p169_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '169_1': Object.freeze({
    names: Object.freeze({
      ru: 'Амарант багряный',
      en: 'Red amaranth',
      nl: 'Rode amarant',
      sci: 'Amaranthus cruentus'
    }),
    images: Object.freeze(['p169_1_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '169_2': Object.freeze({
    names: Object.freeze({
      ru: 'Амарант тёмный (печальный)',
      en: "Prince's-feather",
      nl: 'Amaranthus hypochondriacus',
      sci: 'Amaranthus hypochondriacus'
    }),
    images: Object.freeze(['p169_2_1'])
    //wrongAnswers: Object.freeze([?, ?])
  })
});

export const amaranthusGenus = Object.freeze({
  id: 169,
  slug: 'amaranthus',
  entries: amaranthusEntries
});
