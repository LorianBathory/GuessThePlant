import { getPlantParameters } from '../data/plantParameters.js';
import { defaultLang } from '../i18n/uiTexts.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

const ACCENT_COLOR = '#C29C27';
const FALLBACK_ACCENT = 'rgba(194, 156, 39, 0.35)';
const PARAMETER_CARD_BACKGROUND = 'linear-gradient(135deg, rgba(10, 42, 40, 0.88) 0%, rgba(13, 55, 53, 0.92) 100%)';
const HARDINESS_BACKGROUND = 'linear-gradient(135deg, rgba(13, 52, 50, 0.85) 0%, rgba(16, 64, 61, 0.9) 100%)';
const CARD_BACKGROUND = 'linear-gradient(155deg, rgba(8, 38, 36, 0.95) 0%, rgba(16, 72, 69, 0.92) 45%, rgba(24, 100, 95, 0.88) 100%)';
const HARDINESS_ZONES = Array.from({ length: 13 }, (_, index) => index + 1);

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

function ShieldIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M12 3l7 3v5c0 5-3.5 9.2-7 10-3.5-.8-7-5-7-10V6l7-3z' } }
  ]);
}

function AlertTriangleIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M10.3 3.5l-7 12A1 1 0 0 0 4.2 17.5h15.6a1 1 0 0 0 .87-1.5l-7-12a1 1 0 0 0-1.74 0z' } },
    { tag: 'line', attrs: { x1: 12, y1: 9, x2: 12, y2: 13 } },
    { tag: 'line', attrs: { x1: 12, y1: 16, x2: 12.01, y2: 16 } }
  ]);
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

function DropletIcon() {
  return createIcon([
    { tag: 'path', attrs: { d: 'M12 3.5C9.5 7 6 10 6 13.5a6 6 0 0 0 12 0c0-3.5-3.5-6.5-6-10z' } }
  ]);
}

const arrowIconPaths = [
  { tag: 'path', attrs: { d: 'M5 12h14' } },
  { tag: 'path', attrs: { d: 'M13 6l6 6-6 6' } }
];

function ArrowIcon() {
  return createIcon(arrowIconPaths);
}

function getToxicityIcon(toxicity) {
  switch (toxicity) {
    case 'Non-toxic':
    case 'Нетоксично для людей и животных':
    case 'Niet giftig voor mensen en dieren':
    case 'Нетоксично, но осторожно с шипами':
    case 'Non-toxic to people and pets':
      return { icon: ShieldIcon, color: colors.green };
    case 'Mildly toxic':
    case 'Легко токсична для животных при проглатывании':
    case 'Mildly toxic to pets if ingested':
      return { icon: AlertTriangleIcon, color: colors.yellow };
    case 'Toxic':
    case 'Toxic if ingested':
    case 'Highly toxic to people and pets':
    case 'Токсичен для людей и животных':
    case 'Токсична при проглатывании':
    case 'Сильно токсично для людей и животных':
      return { icon: AlertTriangleIcon, color: colors.red };
    default:
      return { icon: ShieldIcon, color: colors.green };
  }
}

function getSunlightIcon(sunlight) {
  switch (sunlight) {
    case 'Full sun':
    case 'Full sun (6+ hours)':
    case 'Полное солнце (6+ часов)':
      return { icon: SunIcon, color: colors.lightYellow };
    case 'Partial shade':
    case 'Bright filtered light or partial shade':
    case 'Dappled light or partial shade':
    case 'Полутень':
    case 'Рассеянный свет, полутень':
      return { icon: CloudIcon, color: colors.accent };
    case 'Full shade':
      return { icon: MoonIcon, color: colors.gray };
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

function getLifespanIcon(lifespan) {
  switch (lifespan) {
    case 'Annual':
    case 'Однолетник':
      return { content: '1', icon: null };
    case 'Biennial':
    case 'Двулетник':
      return { content: '2', icon: null };
    case 'Perennial':
    case 'Perennial shrub':
    case 'Многолетник':
    case 'Многолетний кустарник':
      return { content: null, icon: InfinityIcon };
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
        parameterCards: [],
        hardinessRange: null
      };
    }

    const data = getPlantParameters(plant.id);
    const familyValue = getLocalizedValue(data?.family, interfaceLanguage) || unknownLabel;
    const lifeCycleValue = getLocalizedValue(data?.lifeCycle, interfaceLanguage) || unknownLabel;
    const lightValue = getLocalizedValue(data?.light, interfaceLanguage) || unknownLabel;
    const toxicityValue = getLocalizedValue(data?.toxicity, interfaceLanguage) || unknownLabel;
    const phValue = getLocalizedValue(data?.ph, interfaceLanguage) || getLocalizedValue(data?.soilPh, interfaceLanguage) || unknownLabel;

    const hardinessRaw = typeof data?.hardinessZone === 'string' && data.hardinessZone.trim()
      ? data.hardinessZone
      : unknownLabel;
    const hardinessRange = hardinessRaw !== unknownLabel ? parseHardinessRange(hardinessRaw) : null;

    const sunlightMeta = getSunlightIcon(lightValue);
    const toxicityMeta = getToxicityIcon(toxicityValue);
    const lifespanMeta = getLifespanIcon(lifeCycleValue);
    const phColor = getPhColor(phValue);

    return {
      family: familyValue,
      parameterCards: [
        {
          key: 'lifeCycle',
          value: lifeCycleValue,
          Icon: lifespanMeta.icon,
          content: lifespanMeta.content,
          accent: lifeCycleValue === unknownLabel ? FALLBACK_ACCENT : colors.yellow
        },
        {
          key: 'light',
          value: lightValue,
          Icon: sunlightMeta.icon,
          accent: lightValue === unknownLabel ? FALLBACK_ACCENT : sunlightMeta.color
        },
        {
          key: 'toxicity',
          value: toxicityValue,
          Icon: toxicityMeta.icon,
          accent: toxicityValue === unknownLabel ? FALLBACK_ACCENT : toxicityMeta.color
        },
        {
          key: 'ph',
          value: phValue,
          Icon: DropletIcon,
          accent: phValue === unknownLabel ? FALLBACK_ACCENT : phColor
        }
      ],
      hardinessRange
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
    gap: isMobile ? '16px' : '24px',
    padding: '24px',
    color: '#F8F2D0'
  }), [isMobile]);

  const layoutStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: isMobile ? '16px' : '28px',
    width: '100%',
    maxWidth: isMobile ? '560px' : '1040px'
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

  const parameterItems = useMemo(() => parameters.parameterCards.map(card => {
    const IconComponent = card.Icon;
    const isUnknownValue = card.value === unknownLabel;

    return createElement('div', {
      key: card.key,
      style: {
        background: PARAMETER_CARD_BACKGROUND,
        border: '1px solid rgba(194, 156, 39, 0.25)',
        borderRadius: 0,
        padding: isMobile ? '16px' : '20px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '16px'
      }
    }, [
      createElement('div', {
        key: `${card.key}-icon`,
        style: {
          width: isMobile ? '52px' : '56px',
          height: isMobile ? '52px' : '56px',
          borderRadius: '50%',
          backgroundColor: card.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isUnknownValue ? 'rgba(15, 45, 43, 0.6)' : '#0B2423',
          fontWeight: 700,
          fontSize: '1.2rem',
          flex: '0 0 auto'
        }
      }, IconComponent
        ? createElement(IconComponent)
        : createElement('span', {
          style: {
            fontWeight: 700,
            fontSize: '1.1rem'
          }
        }, card.content || '—')
      ),
      createElement('span', {
        key: `${card.key}-value`,
        style: {
          fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: 600,
          color: isUnknownValue ? 'rgba(248, 242, 208, 0.65)' : '#FDF6D8',
          textAlign: 'left',
          lineHeight: 1.35
        }
      }, card.value)
    ]);
  }), [createElement, isMobile, parameters.parameterCards, unknownLabel]);

  const parameterGrid = createElement('div', {
    key: 'parameters',
    style: {
      display: 'grid',
      gap: isMobile ? '16px' : '20px',
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
    }
  }, parameterItems);

  const zoneElements = useMemo(() => {
    const range = parameters.hardinessRange;
    const hasRange = Boolean(range);
    const minZone = hasRange ? range.min : null;
    const maxZone = hasRange ? range.max : null;
    const zoneSize = isMobile ? 'clamp(24px, 9vw, 44px)' : 'clamp(24px, 3.2vw, 48px)';
    const fontScale = isMobile ? '0.46' : '0.44';

    return HARDINESS_ZONES.map(zone => {
      const isInRange = hasRange && zone >= minZone && zone <= maxZone;
      const isEdge = hasRange && (zone === minZone || zone === maxZone);

      return createElement('div', {
        key: `zone-${zone}`,
        style: {
          '--zone-size': zoneSize,
          width: 'var(--zone-size)',
          height: 'var(--zone-size)',
           flex: '0 1 var(--zone-size)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: `calc(var(--zone-size) * ${fontScale})`,
          backgroundColor: isInRange
            ? (isEdge ? ACCENT_COLOR : 'rgba(194, 156, 39, 0.82)')
            : 'rgba(7, 32, 30, 0.85)',
          color: isInRange ? '#163B3A' : '#C29C27',
          border: isInRange ? 'none' : '1px solid rgba(194, 156, 39, 0.35)'
        }
      }, zone);
    });
  }, [createElement, isMobile, parameters.hardinessRange]);

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
            background: HARDINESS_BACKGROUND,
            border: '1px solid rgba(194, 156, 39, 0.3)',
            borderRadius: 0,
            padding: isMobile ? '12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        }
    }, [
        createElement('div', {
            key: 'hardiness-header',
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
            }
        }, [
            createElement('span', {
                key: 'hardiness-label',
                style: {
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontSize: '0.75rem',
                    color: 'rgba(248, 242, 208, 0.65)'
                }
            }, texts.memorizationHardinessLabel || 'Hardiness zone')
        ]),
        createElement('div', {
            key: 'hardiness-zones',
            style: {
                display: 'flex',
                flexWrap: 'nowrap',  // ← Изменено с 'wrap' на 'nowrap'
                justifyContent: 'center',
                gap: 'clamp(2px, 0.5vw, 6px)',  // ← Адаптивный gap
                overflow: 'hidden',  // ← Добавлено
                width: '100%'  // ← Добавлено
            }
        }, zoneElements)
    ]);

  const cardElement = createElement('div', {
    key: 'card',
    className: 'w-full',
    style: cardStyle
  }, [
    createElement('div', {
      key: 'image-section',
      style: {
        position: 'relative'
      }
    }, [
      createElement('div', {
        key: 'heading-overlay',
        className: 'absolute inset-0 pointer-events-none',
        style: {
          background: 'linear-gradient(180deg, rgba(194, 156, 39, 0.1) 0%, rgba(9, 39, 38, 0) 60%)',
          zIndex: 5
        }
      }),
      createElement(PlantImage, { plant }),
      createElement('div', {
        key: 'heading-wrapper',
        className: 'absolute inset-x-0',
        style: {
          padding: isMobile ? '8px 20px 12px' : '12px 32px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
          zIndex: 10,
          bottom: 0,
          textAlign: 'left'
        }
      }, [
        createElement('h1', {
          key: 'plant-name',
          className: isMobile ? 'text-2xl font-bold' : 'text-3xl font-bold',
          style: {
            color: ACCENT_COLOR,
            textAlign: 'left',
            width: '100%'
          }
        }, plantName),
        (scientificName || parameters.family) && createElement('div', {
          key: 'scientific-line',
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
            color: ACCENT_COLOR
          }
        }, [
          scientificName && createElement('span', {
            key: 'scientific-name',
            style: {
              fontStyle: 'italic',
              fontSize: isMobile ? '1rem' : '1.125rem'
            }
          }, scientificName),
          parameters.family && createElement('span', {
            key: 'family-name',
            style: {
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: 600
            }
          }, `${texts.memorizationFamilyLabel || 'Family'}: ${parameters.family}`)
        ])
      ])
    ]),
    createElement('div', {
      key: 'info-section',
      style: infoSectionStyle
    }, [
      parameterGrid,
      hardinessSection
    ])
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
