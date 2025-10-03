import { getPlantParameters } from '../data/plantParameters.js';
import { defaultLang } from '../i18n/uiTexts.js';
import useSecureImageSource from '../hooks/useSecureImageSource.js';

const ACCENT_COLOR = '#C29C27';

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

function PlantImage({ plant, isMobile }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering PlantImage.');
  }

  const { createElement, useMemo } = ReactGlobal;
  const imageSrc = plant && typeof plant.image === 'string' ? plant.image : null;
  const { secureSrc, status } = useSecureImageSource(imageSrc);

  const containerStyle = useMemo(() => ({
    position: 'relative',
    width: '100%',
    paddingBottom: isMobile ? '66%' : '100%',
    backgroundColor: '#0E2625',
    border: isMobile ? '3px solid ' + ACCENT_COLOR : `6px solid ${ACCENT_COLOR}`,
    overflow: 'hidden'
  }), [isMobile]);

  if (!imageSrc) {
    return null;
  }

  if (status === 'error') {
    return createElement('div', {
      className: 'w-full flex items-center justify-center text-center p-6',
      style: { ...containerStyle, padding: '24px', border: `2px dashed ${ACCENT_COLOR}` }
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
  }, createElement('img', {
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
  }));
}

export default function MemorizationScreen({
  texts,
  plantLanguage,
  interfaceLanguage,
  onPlantLanguageChange = () => {},
  onNextPlant = () => {},
  onReturnToMenu = () => {},
  plant = null,
  isMobile = false
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering MemorizationScreen.');
  }

  const { createElement, useMemo } = ReactGlobal;

  const heading = texts.memorizationModeHeading || texts.memorizationModeButton || 'Memorization';
  const instruction = texts.memorizationInstruction || '';
  const unknownLabel = texts.memorizationUnknown || '—';
  const nextButtonLabel = texts.memorizationNextButton || 'Next plant';
  const backButtonLabel = texts.backToMenu || 'Back to Menu';

  const availablePlantLanguages = useMemo(() => Array.from(new Set([
    interfaceLanguage,
    'sci'
  ].filter(Boolean))), [interfaceLanguage]);

  const plantName = plant && plant.names
    ? (plant.names[plantLanguage] || plant.names[defaultLang] || plant.names.ru || Object.values(plant.names)[0])
    : '';
  const scientificName = plant && plant.names ? plant.names.sci : '';
  const parameters = useMemo(() => {
    if (!plant) {
      return [];
    }

    const data = getPlantParameters(plant.id);
    const items = [
      {
        key: 'family',
        label: texts.memorizationFamilyLabel || 'Family',
        value: getLocalizedValue(data?.family, interfaceLanguage)
      },
      {
        key: 'lifeCycle',
        label: texts.memorizationLifeCycleLabel || 'Life cycle',
        value: getLocalizedValue(data?.lifeCycle, interfaceLanguage)
      },
      {
        key: 'hardinessZone',
        label: texts.memorizationHardinessLabel || 'Hardiness zone',
        value: data?.hardinessZone || null
      },
      {
        key: 'light',
        label: texts.memorizationLightLabel || 'Light requirements',
        value: getLocalizedValue(data?.light, interfaceLanguage)
      },
      {
        key: 'toxicity',
        label: texts.memorizationToxicityLabel || 'Toxicity',
        value: getLocalizedValue(data?.toxicity, interfaceLanguage)
      }
    ];

    return items.map(item => ({
      ...item,
      value: item.value || unknownLabel
    }));
  }, [plant, interfaceLanguage, texts, unknownLabel]);

  if (!plant) {
    return createElement('div', {
      className: 'min-h-screen flex flex-col items-center justify-center text-center gap-6',
      style: { backgroundColor: '#163B3A', color: ACCENT_COLOR, padding: '24px' }
    }, [
      createElement('p', {
        key: 'no-plant',
        className: 'text-xl font-semibold'
      }, texts.memorizationNoPlant || 'Нет данных для отображения.'),
      createElement('button', {
        key: 'back-button',
        onClick: onReturnToMenu,
        className: 'px-6 py-3 font-semibold transition-all',
        style: {
          backgroundColor: ACCENT_COLOR,
          color: '#163B3A',
          border: `3px solid ${ACCENT_COLOR}`
        }
      }, backButtonLabel)
    ]);
  }

  const layoutClass = isMobile
    ? 'flex flex-col gap-6'
    : 'grid grid-cols-2 gap-10 items-start';

  return createElement('div', {
    className: 'min-h-screen w-full flex flex-col items-center',
    style: {
      backgroundColor: '#163B3A',
      color: ACCENT_COLOR,
      padding: isMobile ? '16px' : '32px'
    }
  }, [
    createElement('div', {
      key: 'content',
      className: `w-full ${layoutClass}`,
      style: {
        maxWidth: '1100px'
      }
    }, [
      createElement('div', {
        key: 'image-section',
        className: 'w-full'
      }, [
        createElement('h1', {
          key: 'heading',
          className: isMobile ? 'text-3xl font-semibold mb-4 text-center' : 'text-4xl font-semibold mb-6',
          style: { color: ACCENT_COLOR }
        }, heading),
        createElement(PlantImage, { plant, isMobile })
      ]),
      createElement('div', {
        key: 'info-section',
        className: 'w-full flex flex-col gap-5'
      }, [
        createElement('div', {
          key: 'name-block',
          className: 'flex flex-col gap-2'
        }, [
          createElement('div', {
            key: 'language-switcher',
            className: 'flex gap-2 flex-wrap'
          }, availablePlantLanguages.map(lang => createElement('button', {
            key: `lang-${lang}`,
            onClick: () => onPlantLanguageChange(lang),
            className: 'px-3 py-1 text-sm font-bold uppercase transition-all',
            style: {
              backgroundColor: plantLanguage === lang ? ACCENT_COLOR : 'transparent',
              color: plantLanguage === lang ? '#163B3A' : ACCENT_COLOR,
              border: `2px solid ${ACCENT_COLOR}`
            }
          }, lang === 'sci' ? 'Sci' : lang.toUpperCase()))),
          createElement('h2', {
            key: 'plant-name',
            className: isMobile ? 'text-2xl font-bold' : 'text-3xl font-bold',
            style: { color: ACCENT_COLOR }
          }, plantName),
          scientificName && createElement('span', {
            key: 'scientific-name',
            className: 'italic text-lg',
            style: { color: ACCENT_COLOR, opacity: 0.8 }
          }, scientificName)
        ].filter(Boolean)),
        instruction && createElement('p', {
          key: 'instruction',
          className: 'text-base',
          style: { color: ACCENT_COLOR, opacity: 0.85 }
        }, instruction),
        createElement('div', {
          key: 'parameters',
          className: 'flex flex-col gap-3'
        }, parameters.map(param => createElement('div', {
          key: param.key,
          className: 'flex flex-col gap-1'
        }, [
          createElement('span', {
            key: `${param.key}-label`,
            className: 'text-sm uppercase tracking-wide',
            style: { opacity: 0.75 }
          }, param.label),
          createElement('span', {
            key: `${param.key}-value`,
            className: 'text-lg font-medium'
          }, param.value)
        ]))),
        createElement('div', {
          key: 'buttons',
          className: isMobile ? 'flex flex-col gap-3 mt-4' : 'flex gap-4 mt-auto'
        }, [
          createElement('button', {
            key: 'next-button',
            onClick: onNextPlant,
            className: 'px-6 py-3 font-semibold transition-all',
            style: {
              backgroundColor: ACCENT_COLOR,
              color: '#163B3A',
              border: `3px solid ${ACCENT_COLOR}`
            }
          }, nextButtonLabel),
          createElement('button', {
            key: 'back-button',
            onClick: onReturnToMenu,
            className: 'px-6 py-3 font-semibold transition-all',
            style: {
              backgroundColor: 'transparent',
              color: ACCENT_COLOR,
              border: `3px solid ${ACCENT_COLOR}`
            }
          }, backButtonLabel)
        ])
      ])
    ])
  ]);
}
