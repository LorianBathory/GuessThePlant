const anemoneEntries = Object.freeze({
  47: Object.freeze({
    names: Object.freeze({
      ru: 'Анемона', en: 'Anemone', nl: 'Anemoon',  sci: 'Anemone'
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
  }),
  '47_2': Object.freeze({
        names: Object.freeze({
            ru: 'Ветреница дубравная ',
            en: 'Wood anemone',
            nl: 'Bosanemoon',
            sci: 'Amenone nemorosa'
        }),
        images: Object.freeze(['p47_2_1', 'p47_2_2']),
        wrongAnswers: Object.freeze([33])
    }),
   '47_3': Object.freeze({
        names: Object.freeze({
            ru: 'Ветреница нежная',
            en: 'Balkan anemone',
            nl: 'Oosterse anemoon',
            sci: 'Anemone blanda'
        }),
        images: Object.freeze(['p47_3_1']),
        wrongAnswers: Object.freeze([33])
    })
});

export const anemoneGenus = Object.freeze({
  id: 47,
  slug: 'anemone',
  wrongAnswers: Object.freeze([33]),
  entries: anemoneEntries
});
