import { getParameterTagLabel } from '../data/parameterTags.js';
import { getPlantParameters } from '../data/plantParameters.js';
import { defaultLang } from '../i18n/uiTexts.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

const ACCENT_COLOR = '#C29C27';
const FALLBACK_ACCENT = 'rgba(194, 156, 39, 0.35)';
const CARD_BACKGROUND = 'linear-gradient(155deg, rgba(8, 38, 36, 0.95) 0%, rgba(16, 72, 69, 0.92) 45%, rgba(24, 100, 95, 0.88) 100%)';

function ensureReact() {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering this component.');
  }
  return ReactGlobal;
}

const colors = Object.freeze({
  green: '#3FB86B',
  yellow: '#F2D16B',
  lightYellow: '#FFDE8A',
  accent: '#5FB0C9',
  accentLight: '#D2EEF5',
  primaryLight: '#1F6F6B',
  gray: '#8EA7A9',
  red: '#E0594A',
  redOrange: '#E7774A',
  purple: '#9C7EDA',
  blue: '#6AB7E6'
});

function createIcon(pathElements, viewBox = '0 0 24 24') {
  const { createElement } = ensureReact();
  return createElement('svg', {
    width: 26,
    height: 26,
    viewBox,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  }, pathElements.map((props, index) => createElement(props.tag, { key: index, ...props.attrs })));
}

function SunIcon() {
  return createIcon([
    { tag: 'circle', attrs: { cx: 12, cy: 12, r: 4 } },
    { tag: 'line', attrs: { x1: 12, y1: 2, x2: 12, y2: 5 } },
    { tag: 'line', attrs: { x1: 12, y1: 19, x2: 12, y2: 22 } },
    { tag: 'line', attrs: { x1: 5, y1: 12, x2: 2, y2: 12 } },
    { tag: 'line', attrs: { x1: 22, y1: 12, x2: 19, y2: 12 } },
    { tag: 'line', attrs: { x1: 4.2, y1: 4.2, x2: 6.3, y2: 6.3 } },
    { tag: 'line', attrs: { x1: 17.7, y1: 17.7, x2: 19.8, y2: 19.8 } },
    { tag: 'line', attrs: { x1: 4.2, y1: 19.8, x2: 6.3, y2: 17.7 } },
    { tag: 'line', attrs: { x1: 17.7, y1: 6.3, x2: 19.8, y2: 4.2 } }
  ]);
}

function CloudIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M7 18a4 4 0 1 1 .7-7.95A5 5 0 0 1 12 6a5 5 0 0 1 4.58 3.1A4 4 0 1 1 19 18H7z' } }
  ]);
}

function MoonIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M21 12.8A9 9 0 0 1 11.2 3 7 7 0 1 0 21 12.8z' } }
  ]);
}

function InfinityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M18.5 15a3.5 3.5 0 1 0 0-7c-3.5 0-5.5 6-9 6a3.5 3.5 0 0 1 0-7c3.5 0 5.5 6 9 6' } }
  ]);
}

function ThermometerIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M14 14.76V5a2 2 0 1 0-4 0v9.76a4 4 0 1 0 4 0z' } },
    { tag: 'line', attrs: { x1: 12, y1: 8, x2: 12, y2: 12 } }
  ]);
}

function DropletToxicityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z' } }
  ]);
}

function DrumstickToxicityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M15.4 15.63a7.875 6 135 1 1 6.23-6.23 4.5 3.43 135 0 0-6.23 6.23' } },
    { tag: 'path', attrs: { d: 'm8.29 12.71-2.6 2.6a2.5 2.5 0 1 0-1.65 4.65A2.5 2.5 0 1 0 8.7 18.3l2.59-2.59' } }
  ]);
}

function FlameToxicityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4' } }
  ]);
}

function CatToxicityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M12 5c.67 0 1.35.09 2 .26 1.78-2 5.03-2.84 6.42-2.26 1.4.58-.42 7-.42 7 .57 1.07 1 2.24 1 3.44C21 17.9 16.97 21 12 21s-9-3-9-7.56c0-1.25.5-2.4 1-3.44 0 0-1.89-6.42-.5-7 1.39-.58 4.72.23 6.5 2.23A9.04 9.04 0 0 1 12 5Z' } },
    { tag: 'path', attrs: { d: 'M8 14v.5' } },
    { tag: 'path', attrs: { d: 'M16 14v.5' } },
    { tag: 'path', attrs: { d: 'M11.25 16.25h1.5L12 17l-.75-.75Z' } }
  ]);
}

function DogToxicityIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M11.25 16.25h1.5L12 17z' } },
    { tag: 'path', attrs: { d: 'M16 14v.5' } },
    { tag: 'path', attrs: { d: 'M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309' } },
    { tag: 'path', attrs: { d: 'M8 14v.5' } },
    { tag: 'path', attrs: { d: 'M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5' } }
  ]);
}

const arrowIconPaths = [
  { tag: 'path', attrs: { d: 'M5 12h14' } },
  { tag: 'path', attrs: { d: 'M13 6l6 6-6 6' } }
];

const toxicityLevelColors = Object.freeze({
  1: colors.blue,
  2: colors.yellow,
  3: colors.red
});

const toxicityNoticeLabels = Object.freeze({
  skin: Object.freeze({
    ru: 'не трогать сок',
    en: 'Avoid sap contact',
    nl: 'Sap vermijden'
  }),
  eat: Object.freeze({
    ru: 'не есть',
    en: 'Do not eat',
    nl: 'Niet eten'
  }),
  smoke: Object.freeze({
    ru: 'не жечь',
    en: 'Do not burn',
    nl: 'Niet verbranden'
  }),
  cat: Object.freeze({
    ru: 'опасно для кошек',
    en: 'Dangerous to cats',
    nl: 'Gevaarlijk voor katten'
  }),
  dog: Object.freeze({
    ru: 'опасно для собак',
    en: 'Dangerous to dogs',
    nl: 'Gevaarlijk voor honden'
  })
});

const toxicityNoticeTypeMeta = Object.freeze({
  skin: Object.freeze({ icon: DropletToxicityIcon, label: toxicityNoticeLabels.skin }),
  eat: Object.freeze({ icon: DrumstickToxicityIcon, label: toxicityNoticeLabels.eat }),
  smoke: Object.freeze({ icon: FlameToxicityIcon, label: toxicityNoticeLabels.smoke }),
  cat: Object.freeze({ icon: CatToxicityIcon, label: toxicityNoticeLabels.cat }),
  dog: Object.freeze({ icon: DogToxicityIcon, label: toxicityNoticeLabels.dog })
});

function ArrowIcon() {
  return createIcon(arrowIconPaths);
}

function getSunlightIcon(lightTag) {
  switch (lightTag) {
    case 'partialShade':
      return { icon: CloudIcon, color: colors.accent };
    case 'fullShade':
      return { icon: MoonIcon, color: colors.gray };
    case 'fullSun':
    default:
      return { icon: SunIcon, color: colors.lightYellow };
  }
}

function getPhColor(phLevel) {
  if (typeof phLevel !== 'string') {
    return colors.blue;
  }

  const phMatch = phLevel.match(/pH\s*(\d+\.?\d*)/i);
  if (phMatch) {
    const ph = Number.parseFloat(phMatch[1]);
    if (!Number.isNaN(ph)) {
      if (ph < 6.5) return colors.redOrange;
      if (ph <= 7.5) return colors.green;
      return colors.purple;
    }
  }

  return colors.blue;
}

function getLifespanIcon(lifeCycleTag) {
  switch (lifeCycleTag) {
    case 'biennial':
      return { content: '2', icon: null };
    case 'perennial':
      return { content: null, icon: InfinityIcon };
    case 'annual':
    default:
      return { content: '1', icon: null };
  }
}

function parseHardinessRange(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/[\s–—]+/g, '-');
  const rangeMatch = normalized.match(/^(\d+)-(\d+)$/);

  if (rangeMatch) {
    const minZone = Number.parseInt(rangeMatch[1], 10);
    const maxZone = Number.parseInt(rangeMatch[2], 10);

    if (Number.isNaN(minZone) || Number.isNaN(maxZone)) {
      return null;
    }

    return {
      min: Math.min(minZone, maxZone),
      max: Math.max(minZone, maxZone)
    };
  }

  const singleMatch = normalized.match(/(\d+)/);
  if (!singleMatch) {
    return null;
  }

  const zone = Number.parseInt(singleMatch[1], 10);
  if (Number.isNaN(zone)) {
    return null;
  }

  return { min: zone, max: zone };
}

function getLocalizedValue(value, language) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    if (value[language]) {
      return value[language];
    }
    if (value[defaultLang]) {
      return value[defaultLang];
    }
    const firstValue = Object.values(value).find(Boolean);
    return typeof firstValue === 'string' ? firstValue : null;
  }
  return null;
}

function buildToxicityParameterItems(toxicityData, language, unknownLabel) {
  if (!toxicityData) {
    return [];
  }

  const entries = Array.isArray(toxicityData) ? toxicityData : [toxicityData];

  return entries
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const typeKey = typeof entry.type === 'string' ? entry.type : (typeof entry.tag === 'string' ? entry.tag : null);
      const typeMeta = typeKey ? toxicityNoticeTypeMeta[typeKey] : null;

      if (!typeMeta) {
        return null;
      }

      const severityLevel = typeof entry.level === 'number'
        ? entry.level
        : Number.parseInt(entry.level, 10);
      const circleColor = toxicityLevelColors[severityLevel] || FALLBACK_ACCENT;

      const customLabelSource = entry.label ?? entry.text;

      const resolvedLabel = typeof customLabelSource === 'string'
        ? customLabelSource
        : getLocalizedValue(customLabelSource, language) || getLocalizedValue(typeMeta.label, language);

      const labelText = typeof resolvedLabel === 'string' && resolvedLabel.trim()
        ? resolvedLabel.trim()
        : (getLocalizedValue(typeMeta.label, language) || unknownLabel);

      return {
        key: `toxicity-${index}-${typeKey}`,
        label: labelText,
        icon: typeMeta.icon,
        circleContent: null,
        circleColor,
        isUnknown: labelText === unknownLabel
      };
    })
    .filter(Boolean);
}

function PlantImage({ plant }) {
  const { createElement, useMemo } = ensureReact();
  const imageSrc = plant && typeof plant.image === 'string' ? plant.image : null;
  const { secureSrc, status } = useSecureImageSource(imageSrc);

  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    paddingBottom: '66.67%',
    background: 'linear-gradient(140deg, #082726 0%, #0E3A38 45%, #12504D 100%)',
    borderBottom: `4px solid ${ACCENT_COLOR}`,
    overflow: 'hidden'
  }), []);

  if (!imageSrc) {
    return null;
  }

  if (status === 'error') {
    return createElement('div', {
      className: 'w-full flex items-center justify-center text-center',
      style: {
        ...containerStyle,
        padding: '24px',
        background: 'linear-gradient(160deg, rgba(12, 52, 50, 0.9), rgba(18, 82, 78, 0.7))',
        borderBottom: `4px dashed ${ACCENT_COLOR}`
      }
    }, 'Изображение недоступно');
  }

  if (status !== 'ready' || !secureSrc) {
    return createElement('div', {
      className: 'w-full flex items-center justify-center',
      style: containerStyle
    }, createElement('span', { className: 'sr-only' }, 'Загрузка изображения'));
  }

  return createElement('div', {
    className: 'relative w-full h-0',
    style: containerStyle
  }, [
    createElement('div', {
      key: 'glow',
      className: 'absolute inset-0',
      style: {
        background: 'radial-gradient(circle at 20% 25%, rgba(194, 156, 39, 0.22), transparent 55%)'
      }
    }),
    createElement('img', {
      key: 'image',
      src: secureSrc,
      alt: plant.names?.[defaultLang] || `Plant ${plant.id}`,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      },
      draggable: false,
      onContextMenu: event => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      }
    }),
    createElement('div', {
      key: 'shade',
      className: 'absolute inset-0 pointer-events-none',
      style: {
        background: 'linear-gradient(180deg, rgba(8, 27, 26, 0) 40%, rgba(8, 27, 26, 0.75) 100%)'
      }
    })
  ]);
}

export default function MemorizationScreen({
  texts,
  plantLanguage,
  interfaceLanguage,
  onNextPlant = () => {},
  plant = null,
  isMobile = false
}) {
  const { createElement, useMemo } = ensureReact();

  const unknownLabel = texts.memorizationUnknown || '—';
  const nextButtonLabel = texts.memorizationNextButton || 'Next plant';

  const plantName = plant && plant.names
    ? (plant.names[plantLanguage] || plant.names[defaultLang] || plant.names.ru || Object.values(plant.names)[0])
    : '';
  const scientificName = plant && plant.names ? plant.names.sci : '';
  const parameters = useMemo(() => {
    if (!plant) {
      return {
        family: unknownLabel,
        parameterItems: [],
        hardinessRange: null,
        additionalInfo: null
      };
    }

    const data = getPlantParameters(plant.id);
    const familyValue = getLocalizedValue(data?.family, interfaceLanguage) || unknownLabel;
    const lifeCycleTag = typeof data?.lifeCycle === 'string' ? data.lifeCycle : null;
    const lightTag = typeof data?.light === 'string' ? data.light : null;

    const lifeCycleValue = lifeCycleTag
      ? getParameterTagLabel('lifeCycle', lifeCycleTag, interfaceLanguage)
      : null;
    const lightValue = lightTag
      ? getParameterTagLabel('light', lightTag, interfaceLanguage)
      : null;

    const resolvedLifeCycleValue = lifeCycleValue || null;
    const resolvedLightValue = lightValue || unknownLabel;
    const phRawValue = getLocalizedValue(data?.ph, interfaceLanguage) || getLocalizedValue(data?.soilPh, interfaceLanguage) || unknownLabel;

    const sunlightMeta = getSunlightIcon(lightTag);
    const lifespanMeta = getLifespanIcon(lifeCycleTag);
    const phColor = phRawValue === unknownLabel ? FALLBACK_ACCENT : getPhColor(phRawValue);

    const toxicityParameterItems = buildToxicityParameterItems(data?.toxicity, interfaceLanguage, unknownLabel);

    const hardinessRange = parseHardinessRange(
      getLocalizedValue(data?.hardiness, interfaceLanguage) ||
      getLocalizedValue(data?.hardinessZone, interfaceLanguage)
    );

    const phDisplayValue = phRawValue === unknownLabel
      ? unknownLabel
      : phRawValue.replace(/pH\s*/gi, '').trim() || unknownLabel;

    const parameterItems = [];

    if (resolvedLightValue) {
      parameterItems.push({
        key: 'light',
        label: resolvedLightValue,
        icon: sunlightMeta.icon,
        circleContent: null,
        circleColor: resolvedLightValue === unknownLabel ? FALLBACK_ACCENT : sunlightMeta.color,
        isUnknown: resolvedLightValue === unknownLabel
      });
    }

    parameterItems.push({
      key: 'ph',
      label: phDisplayValue,
      icon: null,
      circleContent: 'pH',
      circleColor: phRawValue === unknownLabel ? FALLBACK_ACCENT : phColor,
      isUnknown: phDisplayValue === unknownLabel
    });

    parameterItems.push(...toxicityParameterItems);

    if (lifeCycleTag && resolvedLifeCycleValue) {
      parameterItems.push({
        key: 'lifeCycle',
        label: resolvedLifeCycleValue,
        icon: lifespanMeta.icon,
        circleContent: lifespanMeta.content,
        circleColor: colors.purple,
        isUnknown: false
      });
    }

    const additionalInfo = getLocalizedValue(data?.additionalInfo, interfaceLanguage);

    return {
      family: familyValue,
      parameterItems,
      hardinessRange,
      additionalInfo: typeof additionalInfo === 'string' && additionalInfo.trim() ? additionalInfo.trim() : null
    };
  }, [plant, interfaceLanguage, unknownLabel]);

  const outerStyle = useMemo(() => {
    const sidePadding = isMobile ? 16 : 48;
    const bottomPadding = isMobile ? 32 : 56;

    return {
      minHeight: '100vh',
      width: '100%',
      background: '#163B3A',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '24px',
      paddingRight: `${sidePadding}px`,
      paddingLeft: `${sidePadding}px`,
      paddingBottom: `${bottomPadding}px`,
      boxSizing: 'border-box'
    };
  }, [isMobile]);

  const cardStyle = useMemo(() => ({
    width: '100%',
    maxWidth: isMobile ? '520px' : '720px',
    background: CARD_BACKGROUND,
    borderRadius: 0,
    border: `4px solid ${ACCENT_COLOR}`,
    overflow: 'hidden',
    flex: '1 1 auto'
  }), [isMobile]);

  const infoSectionStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    padding: isMobile ? '20px' : '28px',
    color: '#F8F2D0'
  }), [isMobile]);

  const layoutStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: isMobile ? '16px' : '24px',
    width: '100%',
    maxWidth: isMobile ? '560px' : '860px'
  }), [isMobile]);

  const arrowButtonStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '12px' : '0px',
    minWidth: isMobile ? '64px' : '76px',
    height: isMobile ? '64px' : '100%',
    background: 'rgba(8, 38, 36, 0.65)',
    border: `3px solid ${ACCENT_COLOR}`,
    borderRadius: 0,
    cursor: 'pointer',
    color: ACCENT_COLOR
  }), [isMobile]);

  const parameterElements = useMemo(() => {
    if (!parameters.parameterItems.length) {
      return [createElement('span', {
        key: 'parameters-empty',
        style: {
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: 600,
          color: 'rgba(248, 242, 208, 0.65)'
        }
      }, unknownLabel)];
    }

    return parameters.parameterItems.map(item => {
      const IconComponent = item.icon;
      const label = item.label || unknownLabel;
      const isUnknownValue = item.isUnknown || label === unknownLabel;

      return createElement('div', {
        key: item.key,
        style: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '8px'
        }
      }, [
        createElement('div', {
          key: `${item.key}-icon`,
          style: {
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: item.circleColor || FALLBACK_ACCENT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isUnknownValue ? 'rgba(15, 45, 43, 0.6)' : '#052625',
            fontWeight: 700,
            fontSize: '0.85rem'
          }
        }, IconComponent
          ? createElement(IconComponent)
          : createElement('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          }, item.circleContent || '—')
        ),
        createElement('span', {
          key: `${item.key}-label`,
          style: {
            fontSize: isMobile ? '0.92rem' : '1rem',
            fontWeight: 600,
            color: isUnknownValue ? 'rgba(248, 242, 208, 0.65)' : '#FDF6D8',
            lineHeight: 1.35,
            whiteSpace: 'nowrap'
          }
        }, label)
      ]);
    });
  }, [createElement, isMobile, parameters.parameterItems, unknownLabel]);

  const parameterRow = createElement('div', {
    key: 'parameters',
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '16px',
      textAlign: 'center'
    }
  }, parameterElements);

  const headingSection = createElement('div', {
    key: 'heading-section',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '8px',
      marginBottom: '16px'
    }
  }, [
    createElement('h1', {
      key: 'plant-name-heading',
      style: {
        fontSize: isMobile ? '28px' : '36px',
        fontWeight: 700,
        color: ACCENT_COLOR,
        margin: 0
      }
    }, plantName || unknownLabel),
    scientificName && createElement('span', {
      key: 'plant-scientific-name',
      style: {
        fontStyle: 'italic',
        fontSize: isMobile ? '18px' : '20px',
        color: 'rgba(194, 156, 39, 0.85)'
      }
    }, scientificName),
    parameters.family && createElement('span', {
      key: 'plant-family-name',
      style: {
        fontSize: '14px',
        color: 'rgba(194, 156, 39, 0.8)'
      }
    }, parameters.family)
  ].filter(Boolean));

  const additionalInfoText = parameters.additionalInfo || texts.memorizationAdditionalInfoEmpty || 'не заполнено';

  const additionalInfoBlock = createElement('div', {
    key: 'additional-info',
    style: {
      padding: '12px',
      backgroundColor: `${colors.primaryLight}4D`,
      border: `1px solid ${ACCENT_COLOR}`,
      color: colors.accentLight,
      fontSize: '14px',
      lineHeight: 1.5,
      whiteSpace: 'pre-wrap',
      marginTop: '16px'
    }
  }, additionalInfoText);

  const hardinessScale = useMemo(() => {
    const range = parameters.hardinessRange;
    if (!range) {
      return null;
    }

    const clampZone = zone => Math.min(13, Math.max(1, zone));
    const segmentWidth = 100 / 12;
    const minZone = clampZone(range.min);
    const maxZone = clampZone(range.max);

    let highlightLeft = ((minZone - 1) / 12) * 100;
    let highlightWidth = Math.min(100 - highlightLeft, (maxZone - minZone + 1) * segmentWidth);

    if (highlightWidth <= 0) {
      highlightWidth = segmentWidth;
      highlightLeft = Math.max(0, highlightLeft - segmentWidth);
    }

    const uniqueZones = Array.from(new Set([minZone, maxZone]));
    const ticks = uniqueZones.map(zone => ({
      zone,
      percent: ((zone - 1) / 12) * 100
    }));

    return {
      highlightLeft,
      highlightWidth,
      ticks
    };
  }, [parameters.hardinessRange]);

  if (!plant) {
    return createElement('div', {
      className: 'w-full',
      style: outerStyle
    }, createElement('div', {
      className: 'w-full',
      style: cardStyle
    }, [
      createElement('div', {
        key: 'empty-info',
        style: {
          padding: isMobile ? '32px' : '48px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center',
          textAlign: 'center',
          color: '#F8F2D0'
        }
      }, [
        createElement('p', {
          key: 'no-plant',
          className: 'text-xl font-semibold'
        }, texts.memorizationNoPlant || 'Нет данных для отображения.')
      ])
    ]));
  }

  const hardinessSection = createElement('div', {
    key: 'hardiness',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
      marginTop: additionalInfoBlock ? '20px' : '24px'
    }
  }, [
    createElement('div', {
      key: 'hardiness-icon',
      style: {
        width: '32px',
        height: '32px',
        transform: 'translateY(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: ACCENT_COLOR
      }
    }, createElement(ThermometerIcon)),
    createElement('div', {
      key: 'hardiness-scale',
      style: {
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }
    }, [
      createElement('div', {
        key: 'hardiness-numbers',
        style: {
          position: 'relative',
          height: '24px'
        }
      }, hardinessScale
        ? hardinessScale.ticks.map(tick => createElement('span', {
          key: `zone-label-${tick.zone}`,
          style: {
            position: 'absolute',
            left: `${tick.percent}%`,
            transform: 'translateX(-50%)',
            fontSize: '16px',
            fontWeight: 700,
            color: ACCENT_COLOR
          }
        }, tick.zone))
        : null),
      createElement('div', {
        key: 'hardiness-bar',
        style: {
          position: 'relative',
          height: '12px',
          background: 'linear-gradient(to right, #3B82F6 0%, #10B981 25%, #FBBF24 50%, #F59E0B 75%, #EF4444 100%)',
          overflow: 'visible'
        }
      }, [
        hardinessScale && createElement('div', {
          key: 'hardiness-active',
          style: {
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${hardinessScale.highlightLeft}%`,
            width: `${hardinessScale.highlightWidth}%`,
            backgroundColor: 'rgba(194, 156, 39, 0.4)'
          }
        }),
        ...(hardinessScale ? hardinessScale.ticks.map(tick => createElement('div', {
          key: `zone-tick-${tick.zone}`,
          style: {
            position: 'absolute',
            top: '-6px',
            left: `${tick.percent}%`,
            transform: 'translateX(-50%)',
            width: '4px',
            height: '24px',
            backgroundColor: ACCENT_COLOR
          }
        })) : [])
      ])
    ])
  ]);

  const cardElement = createElement('div', {
    key: 'card',
    className: 'w-full',
    style: cardStyle
  }, [
    createElement(PlantImage, { plant }),
    createElement('div', {
      key: 'info-section',
      style: infoSectionStyle
    }, [
      headingSection,
      parameterRow,
      additionalInfoBlock,
      hardinessSection
    ].filter(Boolean))
  ]);

  const arrowButton = createElement('button', {
    key: 'next-arrow',
    type: 'button',
    onClick: onNextPlant,
    style: arrowButtonStyle,
    'aria-label': nextButtonLabel
  }, createElement(ArrowIcon));

  const layoutChildren = [cardElement, arrowButton];

  return createElement('div', {
    className: 'w-full',
    style: outerStyle
  }, createElement('div', {
    key: 'layout',
    style: layoutStyle
  }, layoutChildren));
}
