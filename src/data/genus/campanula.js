const campanulaEntries = Object.freeze({
  83: Object.freeze({
    names: Object.freeze({
        //предполагается, что мы никогда не покажем вопрос с этим растением (только с дочерними элементами). Поэтому его имя заменено на "?",
        // чтобы увидеть ошибку, если оно будет показано
      ru: '?',
      en: '?',
      nl: '?',
      sci: '?'
    }),
  }),
  '83_1': Object.freeze({
    names: Object.freeze({
      ru: 'Колокольчик круглолистный',
      en: 'Harebell',
      nl: 'Grasklokje',
      sci: 'Campanula rotundifolia'
    }),
    images: Object.freeze(['p83_1_1']),
    wrongAnswers: Object.freeze([21])
  }),
    '83_2': Object.freeze({
        names: Object.freeze({
            ru: 'Колокольчик Портеншлага',
            en: 'Dalmatian bellflower',
            nl: 'Klokjesbloem',
            sci: 'Campanula Portenschlagiana'
        }),
        images: Object.freeze(['p83_2_1']),
        wrongAnswers: Object.freeze([21])
    }),
    '83_3': Object.freeze({
        names: Object.freeze({
            ru: 'Колокольчик Пожарского',
            en: 'Serbian bellflower',
            nl: 'Kruipklokje',
            sci: 'Campanula poscharskyana'
        }),
        images: Object.freeze(['p83_3_1']),
        wrongAnswers: Object.freeze([21])
    })
});

export const campanulaGenus = Object.freeze({
  id: 83,
  slug: 'campanula',
  wrongAnswers: Object.freeze([21]),
  entries: campanulaEntries
});
