const salviaEntries = Object.freeze({
  150: Object.freeze({
    names: Object.freeze({
      ru: 'Шалфей',
      en: 'Sage',
      nl: 'Salie',
      sci: 'Salvia'
    }),
    images: Object.freeze(['p150_1', 'p150_2'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '150_1': Object.freeze({
    names: Object.freeze({
      ru: 'Шалфей лекарственный',
      en: 'Common sage',
      nl: 'Tuin salie',
      sci: 'Salvia officinalis'
    }),
    images: Object.freeze(['p150_1_1', 'p150_1_2'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '150_2': Object.freeze({
    names: Object.freeze({
      ru: 'Шалфей луговой',
      en: 'Meadow sage',
      nl: 'Veldsalie',
      sci: 'Salvia pratensis'
    }),
    images: Object.freeze(['p150_2_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '150_3': Object.freeze({
    names: Object.freeze({
      ru: '?',
      en: '?',
      nl: '?',
      sci: 'Salvia farinacea'
    }),
    images: Object.freeze(['p150_3_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '150_4': Object.freeze({
    names: Object.freeze({
      ru: '?',
      en: '?',
      nl: '?',
      sci: 'Salvia rosmarinus'
    }),
    images: Object.freeze(['p150_4_1'])
    //wrongAnswers: Object.freeze([?, ?])
  })
});

export const salviaGenus = Object.freeze({
  id: 150,
  slug: 'salvia',
  entries: salviaEntries
});
