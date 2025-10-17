const hebeEntries = Object.freeze({
  173: Object.freeze({
    names: Object.freeze({
      ru: 'Хебе',
      en: 'Hebe',
      nl: 'Hebe (struikveronica)',
      sci: 'Hebe'
    }),
      wrongAnswers: Object.freeze([123, 143, 172])
  }),
    '173_1': Object.freeze({
        names: Object.freeze({
            ru: 'Хебе красивая',
            en: 'Showy hebe / Shrubby veronica',
            nl: 'Struikveronica',
            sci: 'Hebe speciosa'
        }),
        images: Object.freeze(['p173_1_1']),
        wrongAnswers: Object.freeze([33])
    }),
    '47_2': Object.freeze({
        names: Object.freeze({
            ru: 'Хебе Андерсона',
            en: 'Anderson\'s hebe (Shrubby veronica)',
            nl: 'Hebe (struikveronica) Andersonii',
            sci: 'Hebe Andersonii'
        }),
        images: Object.freeze(['p173_2_1']),
        wrongAnswers: Object.freeze([33])
    }),
});

export const hebeGenus = Object.freeze({
  id: 173,
  slug: 'hebe',
  entries: hebeEntries
});
