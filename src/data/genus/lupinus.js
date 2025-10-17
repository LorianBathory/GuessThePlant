const lupinusEntries = Object.freeze({
  106: Object.freeze({
    names: Object.freeze({
      ru: 'Люпин',
      en: 'Lupine',
      nl: 'Lupine',
      sci: 'Lupinus'
    }),
    wrongAnswers: Object.freeze([138, 56])
  }),
  '106_1': Object.freeze({
    names: Object.freeze({
      ru: 'Люпин многолистный',
      en: 'Large-leaved lupine',
      nl: 'Vaste lupine',
      sci: 'Lupinus polyphyllus'
    }),
    images: Object.freeze(['p106_1_1', 'p106_1_2', 'p106_1_3'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
  '106_2': Object.freeze({
    names: Object.freeze({
      ru: 'Люпин широколистный',
      en: 'Broadleaf lupine',
      nl: 'Lupinus latifolius', //нет специфического названия на нидерландском
      sci: 'Lupinus latifolius'
    }),
    images: Object.freeze(['p106_2_1'])
    //wrongAnswers: Object.freeze([?, ?])
  }),
    '106_3': Object.freeze({
        names: Object.freeze({
            ru: 'Люпин Rivularis',
            en: 'Riverbank lupine',
            nl: 'Lupinus Rivularis', //нет специфического названия на нидерландском
            sci: 'Lupinus Rivularis'
        }),
        images: Object.freeze(['p106_3_1'])
        //wrongAnswers: Object.freeze([?, ?])
    }),
    '106_4': Object.freeze({
        names: Object.freeze({
            ru: 'Люпин волосистый',
            en: 'Blue lupine',
            nl: 'Lupinus pilosus', //нет специфического названия на нидерландском
            sci: 'Lupinus pilosus'
        }),
        images: Object.freeze(['p106_4_1'])
        //wrongAnswers: Object.freeze([?, ?])
    })
});

export const lupinusGenus = Object.freeze({
  id: 106,
  slug: 'lupinus',
  entries: lupinusEntries
});
