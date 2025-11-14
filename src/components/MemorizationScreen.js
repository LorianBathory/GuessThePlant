import { getParameterTagLabel } from '../data/parameterTags.js';
import { getPlantParameters, getPlantTagDefinition, memorizationPlants } from '../game/dataLoader.js';
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
  blue: '#6AB7E6',
  hotPink: '#FF4FA3'
});

const tagIconComponentCache = new Map();

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

function ArrowIcon({ isMobile = false, disabled = false }) {
  const { createElement } = ensureReact();
  const triangleHeight = isMobile ? 24 : 32;
  const triangleWidth = isMobile ? 48 : 60;
  const triangleColor = disabled ? 'rgba(194, 156, 39, 0.35)' : ACCENT_COLOR;

  return createElement('div', {
    'aria-hidden': 'true',
    style: {
      width: 0,
      height: 0,
      borderTop: `${triangleHeight}px solid transparent`,
      borderBottom: `${triangleHeight}px solid transparent`,
      borderLeft: `${triangleWidth}px solid ${triangleColor}`,
      transition: 'border-left-color 0.2s ease'
    }
  });
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

function hasExplicitNullValue(object, keys) {
  if (!object || typeof object !== 'object' || !Array.isArray(keys)) {
    return false;
  }

  return keys.some(key => Object.prototype.hasOwnProperty.call(object, key) && object[key] === null);
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

function getTagIconComponent(iconUrl) {
  if (typeof iconUrl !== 'string') {
    return null;
  }

  const normalizedUrl = iconUrl.trim();

  if (!normalizedUrl) {
    return null;
  }

  if (tagIconComponentCache.has(normalizedUrl)) {
    return tagIconComponentCache.get(normalizedUrl);
  }

  function TagIcon() {
    const { createElement } = ensureReact();

    return createElement('img', {
      src: normalizedUrl,
      alt: '',
      style: {
        width: '18px',
        height: '18px',
        objectFit: 'contain'
      },
      decoding: 'async',
      loading: 'lazy',
      'aria-hidden': 'true'
    });
  }

  tagIconComponentCache.set(normalizedUrl, TagIcon);
  return TagIcon;
}

function normalizeTagId(entry) {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    return trimmed || null;
  }

  if (entry && typeof entry === 'object') {
    const rawId = typeof entry.id === 'string' ? entry.id : typeof entry.tag === 'string' ? entry.tag : null;
    if (typeof rawId === 'string') {
      const trimmed = rawId.trim();
      return trimmed || null;
    }
  }

  return null;
}

function extractTagIds(rawTags) {
  if (!rawTags) {
    return [];
  }

  const entries = Array.isArray(rawTags) ? rawTags : [rawTags];
  return entries
    .map(normalizeTagId)
    .filter(tagId => typeof tagId === 'string' && tagId.length > 0);
}

function buildCustomTagParameterItems(rawTags, language, unknownLabel) {
  if (!rawTags) {
    return [];
  }

  const entries = Array.isArray(rawTags) ? rawTags : [rawTags];

  return entries
    .map((entry, index) => {
      if (entry === null || entry === undefined) {
        return null;
      }

      let tagId = normalizeTagId(entry);
      let fallbackLabel = null;
      let circleColor = colors.hotPink;
      let circleContent = undefined;

      if (entry && typeof entry === 'object') {
        const labelSource = entry.label ?? entry.text ?? entry.name;
        fallbackLabel = getLocalizedValue(labelSource, language);

        if (typeof entry.circleColor === 'string' && entry.circleColor.trim()) {
          circleColor = entry.circleColor.trim();
        }

        if (Object.prototype.hasOwnProperty.call(entry, 'circleContent')) {
          circleContent = entry.circleContent;
        }
      }

      const definition = tagId ? getPlantTagDefinition(tagId) : null;

      if (!definition && !fallbackLabel && tagId) {
        fallbackLabel = tagId;
      }

      const localizedLabel = definition ? getLocalizedValue(definition.label, language) : null;
      const labelCandidate = typeof localizedLabel === 'string' && localizedLabel.trim()
        ? localizedLabel.trim()
        : (typeof fallbackLabel === 'string' && fallbackLabel.trim() ? fallbackLabel.trim() : null);

      const labelText = labelCandidate || unknownLabel;

      if (definition && typeof definition.circleColor === 'string' && definition.circleColor.trim()) {
        circleColor = definition.circleColor.trim();
      }

      if (definition && Object.prototype.hasOwnProperty.call(definition, 'circleContent')) {
        circleContent = definition.circleContent;
      }

      let icon = null;

      if (definition && typeof definition.icon === 'string' && definition.icon.trim()) {
        icon = getTagIconComponent(definition.icon.trim());
        circleContent = null;
      }

      return {
        key: `custom-tag-${index}-${tagId || 'unknown'}`,
        label: labelText,
        icon,
        circleContent: circleContent === undefined ? null : circleContent,
        circleColor,
        isUnknown: labelText === unknownLabel,
        tagId: tagId || null
      };
    })
    .filter(Boolean);
}

function PlantImage({ plant, texts }) {
  const { createElement, useMemo, useState, useEffect, useCallback } = ensureReact();

  const imageEntries = useMemo(() => {
    if (!plant) {
      return [];
    }

    const entries = Array.isArray(plant.images)
      ? plant.images
        .map(imageEntry => {
          if (!imageEntry) {
            return null;
          }

          if (typeof imageEntry === 'string') {
            const trimmed = imageEntry.trim();
            return trimmed ? { id: null, src: trimmed } : null;
          }

          if (typeof imageEntry === 'object') {
            const src = typeof imageEntry.src === 'string' ? imageEntry.src.trim() : '';
            if (!src) {
              return null;
            }

            const id = typeof imageEntry.id === 'string' && imageEntry.id.trim() ? imageEntry.id.trim() : null;
            return { id, src };
          }

          return null;
        })
        .filter(Boolean)
      : [];

    if (entries.length > 0) {
      return entries;
    }

    const fallbackSrc = plant && typeof plant.image === 'string' ? plant.image.trim() : '';
    if (!fallbackSrc) {
      return [];
    }

    const fallbackId = plant && typeof plant.imageId === 'string' && plant.imageId.trim() ? plant.imageId.trim() : null;
    return [{ id: fallbackId, src: fallbackSrc }];
  }, [plant]);

  const [currentIndex, setCurrentIndex] = useState(0);

  const plantIdentifier = plant ? plant.id : null;

  useEffect(() => {
    setCurrentIndex(0);
  }, [plantIdentifier, imageEntries.length]);

  const hasImages = imageEntries.length > 0;
  const hasMultipleImages = imageEntries.length > 1;
  const currentImage = hasImages ? imageEntries[Math.min(currentIndex, imageEntries.length - 1)] : null;

  useEffect(() => {
    if (currentIndex >= imageEntries.length && imageEntries.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, imageEntries.length]);

  const selectImageAtIndex = useCallback(index => {
    if (!hasMultipleImages || typeof index !== 'number') {
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, imageEntries.length - 1));
    setCurrentIndex(safeIndex);
  }, [hasMultipleImages, imageEntries.length]);

  const imageSrc = currentImage && typeof currentImage.src === 'string' ? currentImage.src : null;
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
      className: 'w-full flex flex-col items-center justify-center text-center',
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

  return createElement(
    'div',
    {
      className: 'w-full flex flex-col items-center',
      style: { position: 'relative' }
    },
    [
      createElement('div', {
        key: 'image-wrapper',
        className: 'w-full flex items-stretch',
        style: { position: 'relative' }
      }, [
        hasMultipleImages
          ? createElement('div', {
            key: 'gallery-indicators',
            className: 'flex flex-col items-center',
            style: {
              position: 'absolute',
              top: '50%',
              left: '-24px',
              transform: 'translateY(-50%)',
              gap: '10px',
              padding: '6px 0',
              zIndex: 2
            }
          }, imageEntries.map((entry, index) => {
            const isActive = index === currentIndex;
            const imageLabelText = texts?.memorizationImageLabel || 'Фото';

            return createElement('button', {
              key: `indicator-${entry?.id || index}`,
              type: 'button',
              onClick: () => selectImageAtIndex(index),
              'aria-current': isActive ? 'true' : undefined,
              'aria-label': `${imageLabelText} ${index + 1}`,
              style: {
                width: '14px',
                height: '14px',
                borderRadius: '9999px',
                border: `2px solid ${isActive ? ACCENT_COLOR : FALLBACK_ACCENT}`,
                backgroundColor: isActive ? ACCENT_COLOR : 'transparent',
                opacity: isActive ? 1 : 0.7,
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, opacity 0.2s ease'
              }
            }, createElement('span', { className: 'sr-only' }, `${imageLabelText} ${index + 1}`));
          }))
          : null,
        createElement('div', {
          key: 'image-container',
          className: 'relative w-full h-0',
          style: { ...containerStyle, flex: '1 1 0%' }
        }, [
          createElement('div', {
            key: 'glow',
            className: 'absolute inset-0',
            style: {
              background: 'radial-gradient(circle at 20% 25%, rgba(194, 156, 39, 0.22), transparent 55%)'
            }
          }),
          createElement('img', {
            key: `image-${currentImage?.id || currentIndex}`,
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
          })
        ])
      ])
    ]
  );
}

function TagGalleryPreviewCard({ entry, onSelect, isActive }) {
  const { createElement, useMemo, useCallback } = ensureReact();
  const { secureSrc, status } = useSecureImageSource(entry.imageSrc);

  const handleSelect = useCallback(() => {
    if (typeof onSelect === 'function') {
      onSelect(entry.id);
    }
  }, [entry.id, onSelect]);

  const buttonStyle = useMemo(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '8px',
    width: '100%',
    borderRadius: '12px',
    border: `2px solid ${isActive ? ACCENT_COLOR : 'rgba(194, 156, 39, 0.35)'}`,
    background: isActive ? 'rgba(194, 156, 39, 0.18)' : 'rgba(8, 38, 36, 0.6)',
    color: '#FDF6D8',
    padding: '10px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'transform 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
    boxShadow: isActive ? '0 8px 20px rgba(194, 156, 39, 0.2)' : 'none'
  }), [isActive]);

  const imageWrapperStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    paddingBottom: '66.67%',
    borderRadius: '8px',
    overflow: 'hidden',
    background: 'linear-gradient(160deg, rgba(12, 52, 50, 0.9), rgba(18, 82, 78, 0.7))'
  }), []);

  const renderImageContent = () => {
    if (status === 'error') {
      return createElement('div', {
        key: 'error',
        className: 'absolute inset-0 flex items-center justify-center text-center text-xs',
        style: { color: ACCENT_COLOR, padding: '8px' }
      }, 'Изображение недоступно');
    }

    if (status !== 'ready' || !secureSrc) {
      return createElement('div', {
        key: 'loading',
        className: 'absolute inset-0 flex items-center justify-center'
      }, createElement('span', { className: 'sr-only' }, 'Загрузка изображения'));
    }

    return createElement('img', {
      key: 'image',
      src: secureSrc,
      alt: entry.displayName || 'Предпросмотр растения',
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
    });
  };

  return createElement('button', {
    type: 'button',
    onClick: handleSelect,
    style: buttonStyle
  }, [
    createElement('div', {
      key: 'image-wrapper',
      style: imageWrapperStyle
    }, [
      createElement('div', {
        key: 'glow',
        className: 'absolute inset-0 pointer-events-none',
        style: {
          background: 'radial-gradient(circle at 20% 25%, rgba(194, 156, 39, 0.18), transparent 55%)'
        }
      }),
      renderImageContent()
    ]),
    createElement('div', {
      key: 'text',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }
    }, [
      createElement('span', {
        key: 'name',
        style: {
          fontWeight: 700,
          fontSize: '0.95rem',
          color: '#FDF6D8',
          lineHeight: 1.25
        }
      }, entry.displayName || '—'),
      entry.scientificName
        ? createElement('span', {
          key: 'sci',
          style: {
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: 'rgba(194, 156, 39, 0.9)'
          }
        }, entry.scientificName)
        : null
    ].filter(Boolean))
  ]);
}

function TagGalleryOverlay({
  tagLabel,
  entries,
  onClose,
  onSelectPlant,
  activePlantId,
  closeLabel,
  emptyLabel,
  isMobile
}) {
  const { createElement, useMemo, useCallback } = ensureReact();

  const overlayStyle = useMemo(() => ({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(7, 20, 19, 0.82)',
    zIndex: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '16px' : '32px'
  }), [isMobile]);

  const containerStyle = useMemo(() => ({
    width: 'min(1120px, 100%)',
    maxHeight: 'min(85vh, 760px)',
    background: 'linear-gradient(160deg, rgba(8, 38, 36, 0.95), rgba(16, 72, 69, 0.92))',
    borderRadius: '18px',
    border: `3px solid ${ACCENT_COLOR}`,
    boxShadow: '0 28px 60px rgba(0, 0, 0, 0.55)',
    padding: isMobile ? '18px' : '26px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  }), [isMobile]);

  const gridWrapperStyle = useMemo(() => ({
    flex: '1 1 auto',
    overflowY: 'auto',
    paddingRight: '4px'
  }), []);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap: isMobile ? '12px' : '16px',
    width: '100%'
  }), [isMobile]);

  const handleBackdropClick = useCallback(event => {
    if (event && event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const highlightId = activePlantId != null ? String(activePlantId) : null;

  return createElement('div', {
    key: 'tag-gallery-overlay',
    style: overlayStyle,
    onClick: handleBackdropClick
  }, [
    createElement('div', {
      key: 'tag-gallery-container',
      style: containerStyle,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-label': tagLabel
    }, [
      createElement('div', {
        key: 'header',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }
      }, [
        createElement('h2', {
          key: 'title',
          style: {
            margin: 0,
            fontSize: isMobile ? '1.35rem' : '1.6rem',
            color: ACCENT_COLOR,
            fontWeight: 700
          }
        }, tagLabel),
        createElement('button', {
          key: 'close-button',
          type: 'button',
          onClick: onClose,
          style: {
            borderRadius: '999px',
            border: `2px solid ${ACCENT_COLOR}`,
            background: 'transparent',
            color: ACCENT_COLOR,
            padding: '6px 18px',
            cursor: 'pointer',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }
        }, closeLabel)
      ]),
      entries.length > 0
        ? createElement('div', {
          key: 'grid-wrapper',
          style: gridWrapperStyle
        }, [
          createElement('div', {
            key: 'grid',
            style: gridStyle
          }, entries.map(entry => createElement(TagGalleryPreviewCard, {
            key: `tag-gallery-entry-${entry.id}`,
            entry,
            onSelect: onSelectPlant,
            isActive: highlightId != null && String(entry.id) === highlightId
          })))
        ])
        : createElement('div', {
          key: 'empty',
          style: {
            flex: '1 1 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FDF6D8',
            textAlign: 'center',
            fontSize: isMobile ? '1rem' : '1.1rem'
          }
        }, emptyLabel)
    ])
  ]);
}

export default function MemorizationScreen({
  texts,
  plantLanguage,
  interfaceLanguage,
  onNextPlant = () => {},
  onSelectPlant = () => {},
  plant = null,
  isMobile = false,
  onAddToCollection = () => {},
  onRemoveFromCollection = () => {},
  isInCollection = false,
  collectionFilter = 'all',
  onCollectionFilterChange = () => {},
  collectionSize = 0,
  filterOptions = null
}) {
  const { createElement, useMemo, useState, useCallback, useEffect } = ensureReact();

  const unknownLabel = texts.memorizationUnknown || '—';
  const nextButtonLabel = texts.memorizationNextButton || 'Next plant';
  const addToCollectionLabel = texts.memorizationAddToCollection || 'Add to collection';
  const removeFromCollectionLabel = texts.memorizationRemoveFromCollection || 'Remove from collection';
  const filterLabel = texts.memorizationFilterLabel || 'Study set';
  const filterAllLabel = texts.memorizationFilterAll || 'All cards';
  const filterCollectionLabel = texts.memorizationFilterCollection || 'Collection only';

  const collectionButtonDisabled = !plant || plant.id == null;
  const collectionButtonLabel = isInCollection ? removeFromCollectionLabel : addToCollectionLabel;
  const filterCollectionLabelWithCount = collectionSize > 0
    ? `${filterCollectionLabel} (${collectionSize})`
    : filterCollectionLabel;
  const isCollectionFilterDisabled = collectionSize === 0;

  const resolvedFilterOptions = useMemo(() => {
    if (Array.isArray(filterOptions) && filterOptions.length > 0) {
      return filterOptions
        .map(option => {
          if (!option || typeof option !== 'object') {
            return null;
          }

          const id = typeof option.id === 'string' && option.id.trim() ? option.id.trim() : null;
          if (!id) {
            return null;
          }

          const labelValue = typeof option.label === 'string' && option.label.trim()
            ? option.label.trim()
            : id;
          const disabled = option.disabled === true;

          return { id, label: labelValue, disabled };
        })
        .filter(Boolean);
    }

    return [
      { id: 'all', label: filterAllLabel, disabled: false },
      { id: 'collection', label: filterCollectionLabelWithCount, disabled: isCollectionFilterDisabled }
    ];
  }, [filterOptions, filterAllLabel, filterCollectionLabelWithCount, isCollectionFilterDisabled]);

  const filterOptionMap = useMemo(() => {
    const map = new Map();
    resolvedFilterOptions.forEach(option => {
      if (option && typeof option.id === 'string') {
        map.set(option.id, option);
      }
    });
    return map;
  }, [resolvedFilterOptions]);

  const fallbackFilterId = useMemo(() => {
    const firstEnabled = resolvedFilterOptions.find(option => option && !option.disabled && typeof option.id === 'string');
    if (firstEnabled && firstEnabled.id) {
      return firstEnabled.id;
    }

    const firstOption = resolvedFilterOptions[0];
    if (firstOption && typeof firstOption.id === 'string' && firstOption.id) {
      return firstOption.id;
    }

    return 'all';
  }, [resolvedFilterOptions]);

  const normalizedCollectionFilter = typeof collectionFilter === 'string' && collectionFilter
    ? collectionFilter
    : '';
  const activeFilter = (() => {
    const option = filterOptionMap.get(normalizedCollectionFilter);
    if (option && !option.disabled) {
      return normalizedCollectionFilter;
    }
    return fallbackFilterId;
  })();

  const tagGalleryCloseLabel = texts.memorizationTagGalleryClose || 'Закрыть';
  const tagGalleryEmptyLabel = texts.memorizationTagGalleryEmpty || 'Нет карточек с этим тегом.';
  const [activeTagState, setActiveTagState] = useState(null);

  const activeTag = useMemo(() => {
    if (!activeTagState || typeof activeTagState.id !== 'string') {
      return null;
    }

    const normalizedId = activeTagState.id.trim();
    if (!normalizedId) {
      return null;
    }

    const definition = getPlantTagDefinition(normalizedId);
    const localizedLabel = definition ? getLocalizedValue(definition.label, interfaceLanguage) : null;
    const fallbackLabel = typeof activeTagState.fallbackLabel === 'string' && activeTagState.fallbackLabel.trim()
      ? activeTagState.fallbackLabel.trim()
      : normalizedId;
    const resolvedLabel = typeof localizedLabel === 'string' && localizedLabel.trim()
      ? localizedLabel.trim()
      : fallbackLabel;

    return {
      id: normalizedId,
      label: resolvedLabel
    };
  }, [activeTagState, interfaceLanguage]);

  const openTagGallery = useCallback(tagItem => {
    if (!tagItem || typeof tagItem.tagId !== 'string') {
      return;
    }

    const normalizedId = tagItem.tagId.trim();
    if (!normalizedId) {
      return;
    }

    const fallbackLabel = typeof tagItem.label === 'string' && tagItem.label.trim()
      ? tagItem.label.trim()
      : normalizedId;

    setActiveTagState({
      id: normalizedId,
      fallbackLabel
    });
  }, []);

  const closeTagGallery = useCallback(() => {
    setActiveTagState(null);
  }, []);

  useEffect(() => {
    if (!activeTag) {
      return undefined;
    }

    if (typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = event => {
      if (event && (event.key === 'Escape' || event.key === 'Esc')) {
        event.preventDefault();
        closeTagGallery();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTag, closeTagGallery]);

  const handleGalleryPlantSelect = useCallback(plantId => {
    if (plantId == null) {
      return;
    }

    onSelectPlant(plantId);
    closeTagGallery();
  }, [onSelectPlant, closeTagGallery]);

  const tagGalleryEntries = useMemo(() => {
    if (!activeTag || !activeTag.id) {
      return [];
    }

    const normalizedId = activeTag.id;

    if (!Array.isArray(memorizationPlants) || memorizationPlants.length === 0) {
      return [];
    }

    const results = [];
    const seenIds = new Set();
    const collator = typeof Intl !== 'undefined'
      ? new Intl.Collator(interfaceLanguage || defaultLang, { sensitivity: 'base' })
      : null;

    memorizationPlants.forEach(plantEntry => {
      if (!plantEntry || plantEntry.id == null) {
        return;
      }

      const stringId = String(plantEntry.id);
      if (!stringId || seenIds.has(stringId)) {
        return;
      }

      const parametersForPlant = getPlantParameters(plantEntry.id);
      const tagCandidates = new Set([
        ...extractTagIds(parametersForPlant?.tags),
        ...extractTagIds(parametersForPlant?.tagIds),
        ...extractTagIds(parametersForPlant?.newTags)
      ]);

      const lifeCycleTagId = normalizeTagId(
        parametersForPlant?.lifeCycle
          ?? parametersForPlant?.lifeCycleTag
          ?? parametersForPlant?.lifeCycleId
      );
      if (lifeCycleTagId) {
        tagCandidates.add(lifeCycleTagId);
      }

      const lightTagId = normalizeTagId(
        parametersForPlant?.light
          ?? parametersForPlant?.lightTag
          ?? parametersForPlant?.lightId
          ?? parametersForPlant?.sunlight
      );
      if (lightTagId) {
        tagCandidates.add(lightTagId);
      }

      if (!tagCandidates.has(normalizedId)) {
        return;
      }

      seenIds.add(stringId);

      const localizedName = plantEntry.names
        ? (plantEntry.names[interfaceLanguage]
          || plantEntry.names[defaultLang]
          || plantEntry.names.ru
          || Object.values(plantEntry.names)[0]
          || '')
        : '';

      const scientificName = plantEntry.names?.sci
        || getLocalizedValue(parametersForPlant?.scientificName, interfaceLanguage)
        || getLocalizedValue(parametersForPlant?.scientificName, defaultLang)
        || '';

      let imageSrc = null;
      if (Array.isArray(plantEntry.images) && plantEntry.images.length > 0) {
        const primaryImage = plantEntry.images[0];
        if (primaryImage && typeof primaryImage.src === 'string') {
          imageSrc = primaryImage.src;
        }
      }

      if (!imageSrc && typeof plantEntry.image === 'string') {
        imageSrc = plantEntry.image;
      }

      results.push({
        id: plantEntry.id,
        displayName: localizedName,
        scientificName,
        imageSrc: imageSrc || null
      });
    });

    if (results.length > 1) {
      if (collator) {
        results.sort((a, b) => collator.compare(a.displayName || '', b.displayName || ''));
      } else {
        results.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', interfaceLanguage || defaultLang));
      }
    }

    return results;
  }, [activeTag, interfaceLanguage]);
  const handleCollectionButtonClick = () => {
    if (collectionButtonDisabled) {
      return;
    }

    if (isInCollection) {
      onRemoveFromCollection(plant.id);
    } else {
      onAddToCollection(plant.id);
    }
  };

  const handleFilterSelect = value => {
    const normalizedValue = typeof value === 'string' ? value.trim() : String(value || '').trim();
    const option = normalizedValue ? filterOptionMap.get(normalizedValue) : null;

    if (option && option.disabled) {
      return;
    }

    const nextFilter = option ? normalizedValue : fallbackFilterId;

    if (!nextFilter || nextFilter === activeFilter) {
      return;
    }

    const fallbackOption = filterOptionMap.get(nextFilter);
    if (fallbackOption && fallbackOption.disabled) {
      return;
    }

    onCollectionFilterChange(nextFilter);
  };

  const collectionButtonStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '12px 18px' : '12px 22px',
    borderRadius: '999px',
    border: `2px solid ${ACCENT_COLOR}`,
    backgroundColor: isInCollection ? ACCENT_COLOR : 'rgba(194, 156, 39, 0.12)',
    color: isInCollection ? '#052625' : ACCENT_COLOR,
    cursor: collectionButtonDisabled ? 'not-allowed' : 'pointer',
    opacity: collectionButtonDisabled ? 0.6 : 1,
    fontWeight: 700,
    fontSize: isMobile ? '0.95rem' : '1rem',
    letterSpacing: '0.01em',
    textTransform: 'none',
    transition: 'background-color 0.2s ease, color 0.2s ease',
    width: '100%'
  }), [isMobile, isInCollection, collectionButtonDisabled]);

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
    const lifeCycleTag = normalizeTagId(
      data?.lifeCycle
        ?? data?.lifeCycleTag
        ?? data?.lifeCycleId
    );
    const hasLightNullOverride = hasExplicitNullValue(data, ['light', 'lightTag', 'lightId', 'sunlight']);
    const lightTag = hasLightNullOverride
      ? null
      : normalizeTagId(
        data?.light
          ?? data?.lightTag
          ?? data?.lightId
          ?? data?.sunlight
      );

    const lifeCycleValue = lifeCycleTag
      ? getParameterTagLabel('lifeCycle', lifeCycleTag, interfaceLanguage)
      : null;

    const resolvedLifeCycleValue = lifeCycleValue || null;

    const hasPhNullOverride = hasExplicitNullValue(data, ['ph', 'soilPh']);

    const lifespanMeta = getLifespanIcon(lifeCycleTag);

    const toxicityParameterItems = buildToxicityParameterItems(data?.toxicity, interfaceLanguage, unknownLabel);

    const hardinessRange = parseHardinessRange(
      getLocalizedValue(data?.hardiness, interfaceLanguage) ||
      getLocalizedValue(data?.hardinessZone, interfaceLanguage)
    );

    const parameterItems = [];

    if (!hasLightNullOverride) {
      const sunlightMeta = getSunlightIcon(lightTag);
      const lightValue = lightTag
        ? getParameterTagLabel('light', lightTag, interfaceLanguage)
        : null;
      const resolvedLightValue = lightValue || unknownLabel;

      parameterItems.push({
        key: 'light',
        label: resolvedLightValue,
        icon: sunlightMeta.icon,
        circleContent: null,
        circleColor: resolvedLightValue === unknownLabel ? FALLBACK_ACCENT : sunlightMeta.color,
        isUnknown: resolvedLightValue === unknownLabel,
        tagId: lightTag && resolvedLightValue !== unknownLabel ? lightTag : null
      });
    }

    if (!hasPhNullOverride) {
      const phRawValue = getLocalizedValue(data?.ph, interfaceLanguage)
        || getLocalizedValue(data?.soilPh, interfaceLanguage)
        || unknownLabel;
      const phColor = phRawValue === unknownLabel ? FALLBACK_ACCENT : getPhColor(phRawValue);
      const phDisplayValue = phRawValue === unknownLabel
        ? unknownLabel
        : phRawValue.replace(/pH\s*/gi, '').trim() || unknownLabel;

      parameterItems.push({
        key: 'ph',
        label: phDisplayValue,
        icon: null,
        circleContent: 'pH',
        circleColor: phRawValue === unknownLabel ? FALLBACK_ACCENT : phColor,
        isUnknown: phDisplayValue === unknownLabel
      });
    }

    parameterItems.push(...toxicityParameterItems);

    const customTagSource = data?.tags ?? data?.tagIds ?? data?.newTags;
    parameterItems.push(...buildCustomTagParameterItems(customTagSource, interfaceLanguage, unknownLabel));

    if (lifeCycleTag && resolvedLifeCycleValue) {
      parameterItems.push({
        key: 'lifeCycle',
        label: resolvedLifeCycleValue,
        icon: lifespanMeta.icon,
        circleContent: lifespanMeta.content,
        circleColor: colors.purple,
        isUnknown: false,
        tagId: lifeCycleTag
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
    const sidePadding = isMobile ? 32 : 48;
    const bottomPadding = isMobile ? 32 : 56;

    return {
      minHeight: '100vh',
      width: '100%',
      background: '#163B3A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: isMobile ? '16px' : '24px',
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
    overflow: 'visible',
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
    gap: '16px',
    width: '100%',
    maxWidth: isMobile ? '560px' : '1040px',
    margin: '0 auto'
  }), [isMobile]);

  const arrowButtonStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    width: isMobile ? '64px' : '72px',
    height: isMobile ? '64px' : '88px',
    background: 'transparent',
    border: 'none',
    cursor: plant ? 'pointer' : 'not-allowed',
    opacity: plant ? 1 : 0.45,
    flexShrink: 0,
    outlineOffset: '4px',
    transition: 'transform 0.2s ease, opacity 0.2s ease'
  }), [isMobile, plant]);

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
      const normalizedTagId = typeof item.tagId === 'string' ? item.tagId.trim() : '';
      const isTagItem = Boolean(normalizedTagId);

      const circleContentStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      };

      const circleChild = IconComponent
        ? createElement(IconComponent)
        : (item.circleContent === undefined
          ? createElement('span', { style: circleContentStyle }, '—')
          : (item.circleContent === null
            ? null
            : createElement('span', { style: circleContentStyle }, item.circleContent)));

      const containerStyle = {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
        padding: isTagItem ? '4px 10px' : 0,
        borderRadius: isTagItem ? '999px' : 0,
        border: isTagItem ? `1px solid ${ACCENT_COLOR}` : 'none',
        backgroundColor: isTagItem ? 'rgba(194, 156, 39, 0.14)' : 'transparent',
        cursor: isTagItem ? 'pointer' : 'default',
        transition: isTagItem ? 'background-color 0.2s ease, transform 0.2s ease' : undefined
      };

      const handleItemClick = () => {
        if (isTagItem) {
          openTagGallery({ tagId: normalizedTagId, label });
        }
      };

      const handleKeyDown = event => {
        if (!isTagItem || !event) {
          return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openTagGallery({ tagId: normalizedTagId, label });
        }
      };

      return createElement('div', {
        key: item.key,
        role: isTagItem ? 'button' : undefined,
        tabIndex: isTagItem ? 0 : undefined,
        onClick: isTagItem ? handleItemClick : undefined,
        onKeyDown: isTagItem ? handleKeyDown : undefined,
        style: containerStyle
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
        }, circleChild),
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
  }, [createElement, isMobile, openTagGallery, parameters.parameterItems, unknownLabel]);

  const collectionButtonElement = createElement('button', {
    key: 'collection-button',
    type: 'button',
    onClick: handleCollectionButtonClick,
    style: collectionButtonStyle,
    disabled: collectionButtonDisabled
  }, collectionButtonLabel);

  const renderFilterButtons = () => resolvedFilterOptions
    .map(option => {
      if (!option || typeof option.id !== 'string') {
        return null;
      }

      const value = option.id;
      const isActive = activeFilter === value;
      const disabled = option.disabled === true;
      const label = typeof option.label === 'string' && option.label ? option.label : value;

      return createElement('button', {
        key: `filter-option-${value}`,
        type: 'button',
        onClick: () => {
          if (!disabled) {
            handleFilterSelect(value);
          }
        },
        disabled,
        'aria-pressed': isActive ? 'true' : 'false',
        style: {
          padding: isMobile ? '10px 14px' : '10px 18px',
          borderRadius: 0,
          border: `2px solid ${ACCENT_COLOR}`,
          backgroundColor: isActive ? ACCENT_COLOR : 'transparent',
          color: isActive ? '#052625' : ACCENT_COLOR,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          fontWeight: 600,
          fontSize: isMobile ? '0.88rem' : '0.95rem',
          letterSpacing: '0.01em',
          textTransform: 'none',
          transition: 'background-color 0.2s ease, color 0.2s ease'
        }
      }, label);
    })
    .filter(Boolean);

  const buildFilterControl = (key, styleOverrides = {}) => createElement('div', {
    key,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: isMobile ? '12px' : '14px 18px',
      borderRadius: 0,
      border: 'none',
      backgroundColor: 'transparent',
      ...styleOverrides
    }
  }, [
    createElement('span', {
      key: 'filter-label',
      style: {
        fontSize: isMobile ? '0.78rem' : '0.82rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: ACCENT_COLOR
      }
    }, filterLabel),
    createElement('div', {
      key: 'filter-buttons',
      style: {
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '8px',
        flexWrap: 'wrap',
        alignItems: isMobile ? 'stretch' : 'center'
      }
    }, renderFilterButtons())
  ]);

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
  const emptyStateMessage = texts.memorizationNoPlant || 'Нет данных для отображения.';

  const emptyStateContent = createElement('div', {
    key: 'empty-state',
    style: {
      padding: isMobile ? '20px' : '24px',
      backgroundColor: 'rgba(8, 38, 36, 0.55)',
      border: `1px solid ${ACCENT_COLOR}`,
      borderRadius: '12px',
      color: '#F8F2D0',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }
  }, [
    createElement('p', {
      key: 'empty-message',
      style: {
        margin: 0,
        fontSize: isMobile ? '1rem' : '1.1rem',
        fontWeight: 600
      }
    }, emptyStateMessage)
  ]);

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

  const infoChildren = plant
    ? [headingSection, parameterRow, additionalInfoBlock, hardinessSection]
    : [emptyStateContent];

  const cardChildren = [];

  if (plant) {
    cardChildren.push(createElement(PlantImage, { plant, texts }));
  }

  cardChildren.push(createElement('div', {
    key: 'info-section',
    style: infoSectionStyle
  }, infoChildren.filter(Boolean)));

  const cardElement = createElement('div', {
    key: 'card',
    className: 'w-full',
    style: cardStyle
  }, cardChildren);

  const arrowButton = createElement('button', {
    key: 'next-arrow',
    type: 'button',
    onClick: onNextPlant,
    style: arrowButtonStyle,
    'aria-label': nextButtonLabel,
    disabled: !plant
  }, createElement(ArrowIcon, { isMobile, disabled: !plant }));

  const collectionButtonWrapper = createElement('div', {
    key: 'collection-button-wrapper',
    style: {
      marginTop: isMobile ? '12px' : '20px',
      width: '100%',
      display: 'flex',
      justifyContent: 'center'
    }
  }, [
    createElement('div', {
      key: 'collection-button-inner',
      style: {
        width: '100%',
        maxWidth: isMobile ? '360px' : '420px',
        display: 'flex',
        justifyContent: 'center'
      }
    }, [collectionButtonElement])
  ]);

  let layoutChildren = [];
  const trailingChildren = [collectionButtonWrapper];

  if (isMobile) {
    layoutChildren = [
      cardElement,
      createElement('div', {
        key: 'arrow-mobile-wrapper',
        style: {
          display: 'flex',
          justifyContent: 'center',
          width: '100%'
        }
      }, [arrowButton])
    ];

    trailingChildren.push(buildFilterControl('filter-control-mobile', {
      width: '100%'
    }));
  } else {
    const sideColumnChildren = [];

    sideColumnChildren.push(buildFilterControl('filter-control-desktop', {
      alignSelf: 'stretch',
      width: '260px'
    }));

    sideColumnChildren.push(createElement('div', {
      key: 'arrow-container',
      style: {
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: '4px'
      }
    }, [arrowButton]));

    const sideColumn = createElement('div', {
      key: 'side-column',
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: '20px',
        flex: '0 0 auto'
      }
    }, sideColumnChildren);

    layoutChildren = [cardElement, sideColumn];
  }

  const layoutElement = createElement('div', {
    key: 'layout',
    style: layoutStyle
  }, layoutChildren);

  const overlayElement = activeTag
    ? createElement(TagGalleryOverlay, {
      key: 'tag-gallery',
      tagLabel: activeTag.label,
      entries: tagGalleryEntries,
      onClose: closeTagGallery,
      onSelectPlant: handleGalleryPlantSelect,
      activePlantId: plant ? plant.id : null,
      closeLabel: tagGalleryCloseLabel,
      emptyLabel: tagGalleryEmptyLabel,
      isMobile
    })
    : null;

  const children = [layoutElement, ...trailingChildren];
  if (overlayElement) {
    children.push(overlayElement);
  }

  return createElement('div', {
    className: 'w-full',
    style: outerStyle
  }, children);
}
