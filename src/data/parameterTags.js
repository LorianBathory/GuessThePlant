import { defaultLang } from '../i18n/uiTexts.js';

const toxicityLabels = Object.freeze({
  nonToxic: Object.freeze({
    ru: 'Нетоксично',
    en: 'Non-toxic',
    nl: 'Niet giftig'
  }),
  mildlyToxic: Object.freeze({
    ru: 'Слабо токсично',
    en: 'Mildly toxic',
    nl: 'Licht giftig'
  }),
  toxic: Object.freeze({
    ru: 'Токсично',
    en: 'Toxic',
    nl: 'Giftig'
  })
});

const lifeCycleLabels = Object.freeze({
  annual: Object.freeze({
    ru: 'Однолетник',
    en: 'Annual',
    nl: 'Eenjarig'
  }),
  biennial: Object.freeze({
    ru: 'Двулетник',
    en: 'Biennial',
    nl: 'Tweejarig'
  }),
  perennial: Object.freeze({
    ru: 'Многолетник',
    en: 'Perennial',
    nl: 'Meerjarig'
  })
});

const lightLabels = Object.freeze({
  fullSun: Object.freeze({
    ru: 'Полное солнце',
    en: 'Full sun',
    nl: 'Volle zon'
  }),
  partialShade: Object.freeze({
    ru: 'Полутень',
    en: 'Partial shade',
    nl: 'Halfschaduw'
  }),
  fullShade: Object.freeze({
    ru: 'Тень',
    en: 'Full shade',
    nl: 'Schaduw'
  })
});

export const parameterTagLabels = Object.freeze({
  toxicity: toxicityLabels,
  lifeCycle: lifeCycleLabels,
  light: lightLabels
});

export function getParameterTagLabel(category, tag, language) {
  if (!tag || !category) {
    return null;
  }

  const categoryLabels = parameterTagLabels[category];
  if (!categoryLabels) {
    return null;
  }

  const tagLabels = categoryLabels[tag];
  if (!tagLabels) {
    return null;
  }

  if (tagLabels[language]) {
    return tagLabels[language];
  }

  if (tagLabels[defaultLang]) {
    return tagLabels[defaultLang];
  }

  const firstLabel = Object.values(tagLabels).find(Boolean);
  return typeof firstLabel === 'string' ? firstLabel : null;
}
