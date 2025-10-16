const lupinusEntries = Object.freeze({
  106: Object.freeze({
    names: Object.freeze({
      ru: 'Люпин многолистный',
      en: 'Large-leaved lupine',
      nl: 'Vaste lupine',
      sci: 'Lupinus polyphyllus'
    }),
    images: Object.freeze(['p106_1']),
    wrongAnswers: Object.freeze([199])
  }),
  199: Object.freeze({
    names: Object.freeze({
      ru: 'Люпин широколистный',
      en: 'Broadleaf lupine',
      nl: 'Lupine',
      sci: 'Lupinus latifolius'
    }),
    images: Object.freeze(['p199_1']),
    wrongAnswers: Object.freeze([106])
  })
});

export const lupinusGenus = Object.freeze({
  id: 106,
  slug: 'lupinus',
  entries: lupinusEntries
});
