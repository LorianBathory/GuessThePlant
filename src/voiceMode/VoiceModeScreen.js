import useSecureImageSource from '../hooks/useSecureImageSource.js';
import { useVoiceAnnouncements } from './useVoiceAnnouncements.js';
import useVoiceCommands from './useVoiceCommands.js';

const UPSCALE_FACTOR = 1.1;
const BUTTON_SCALE_ADJUSTMENT = 1.15;
const BASE_DESKTOP_IMAGE_WIDTH = 675;
const BASE_DESKTOP_BUTTON_FONT_SIZE = 20;
const BASE_MOBILE_BUTTON_FONT_SIZE = 20.8;
const BASE_DESKTOP_PADDING_Y = 16;
const BASE_DESKTOP_PADDING_X = 24;
const BASE_MOBILE_PADDING_Y = 12;
const BASE_MOBILE_PADDING_X = 14;

const DESKTOP_IMAGE_WIDTH = BASE_DESKTOP_IMAGE_WIDTH * UPSCALE_FACTOR;
const NUMBER_COMMAND_PATTERNS = [
  { index: 0, patterns: [/\bодин\b/, /\b1\b/] },
  { index: 1, patterns: [/\bдва\b/, /\b2\b/] },
  { index: 2, patterns: [/\bтри\b/, /\b3\b/] },
  { index: 3, patterns: [/\bчетыре\b/, /\b4\b/] }
];
const REPEAT_PATTERNS = [/\bповтори\b/, /\bповторить\b/, /\bповтор\b/];

function VoicePlantImage({ src, alt, containerStyle, sectionStyle }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoicePlantImage.');
  }

  const { createElement } = ReactGlobal;
  const { secureSrc, status } = useSecureImageSource(src);

  if (!src) {
    return null;
  }

  const frame = createElement('div', {
    key: 'image-frame',
    className: 'flex justify-center',
    style: sectionStyle
  }, createElement('div', {
    className: 'flex items-center justify-center',
    style: containerStyle
  }, status === 'ready' && secureSrc
    ? createElement('img', {
      src: secureSrc,
      alt,
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none'
      },
      draggable: false,
      onContextMenu: event => event?.preventDefault?.(),
      onDragStart: event => event?.preventDefault?.()
    })
    : createElement('div', {
      role: 'status',
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: '#C29C27',
        backgroundColor: '#163B3A',
        fontSize: '15.4px',
        fontWeight: status === 'error' ? 600 : 400
      }
    }, status === 'error'
      ? 'Изображение недоступно'
      : createElement('span', { className: 'sr-only' }, 'Загрузка изображения'))));

  return frame;
}

export default function VoiceModeScreen({
  questionNumber,
  options,
  onAnswer,
  gameState,
  currentPlant
}) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before rendering VoiceModeScreen.');
  }

  const { createElement, useEffect, useMemo, useState } = ReactGlobal;
  const { repeatOptions } = useVoiceAnnouncements({ questionNumber, options, gameState });
  const isInteractionLocked = gameState !== 'playing';

  useVoiceCommands({
    enabled: !isInteractionLocked,
    options,
    onAnswer,
    onRepeat: repeatOptions
  });

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(max-width: 767px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = event => {
      setIsMobile(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const buttonMeasurements = useMemo(() => {
    const fontSize = (isMobile ? BASE_MOBILE_BUTTON_FONT_SIZE : BASE_DESKTOP_BUTTON_FONT_SIZE) * UPSCALE_FACTOR * BUTTON_SCALE_ADJUSTMENT;
    const paddingY = (isMobile ? BASE_MOBILE_PADDING_Y : BASE_DESKTOP_PADDING_Y) * UPSCALE_FACTOR * BUTTON_SCALE_ADJUSTMENT;
    const paddingX = (isMobile ? BASE_MOBILE_PADDING_X : BASE_DESKTOP_PADDING_X) * UPSCALE_FACTOR * BUTTON_SCALE_ADJUSTMENT;

    return {
      fontSize: `${fontSize}px`,
      padding: `${paddingY}px ${paddingX}px`
    };
  }, [isMobile]);

  const optionsContainerStyle = useMemo(() => ({
    gap: isMobile ? '6.6px' : '1.1rem',
    width: '100%',
    maxWidth: isMobile ? '100%' : '844.8px',
    padding: isMobile ? '28px 16px 44px' : '0px'
  }), [isMobile]);

  const imageContainerStyle = useMemo(() => {
    if (isMobile) {
      return {
        width: '100%',
        maxWidth: '100%',
        height: '100%',
        maxHeight: '100vh',
        backgroundColor: '#163B3A',
        border: 'none',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        borderRadius: '0px'
      };
    }

    return {
      width: '100%',
      maxWidth: `${DESKTOP_IMAGE_WIDTH}px`,
      aspectRatio: '3 / 2',
      backgroundColor: '#163B3A',
      border: '6px solid #C29C27',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      overflow: 'hidden',
      borderRadius: '0px'
    };
  }, [isMobile]);

  const imageSectionStyle = useMemo(() => ({
    width: '100%',
    marginBottom: isMobile ? '0px' : '35.2px',
    minHeight: isMobile ? '100vh' : 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }), [isMobile]);

  const rootLayoutStyle = useMemo(() => ({
    width: '100%',
    rowGap: isMobile ? '0px' : '2.5rem'
  }), [isMobile]);

  return createElement('div', {
    className: 'w-full max-w-6xl mx-auto flex flex-col items-center',
    style: rootLayoutStyle
  }, [
    currentPlant && currentPlant.image && createElement(VoicePlantImage, {
      key: 'image',
      src: currentPlant.image,
      alt: currentPlant?.ru ? `Растение: ${currentPlant.ru}` : 'Фотография растения',
      containerStyle: imageContainerStyle,
      sectionStyle: imageSectionStyle
    }),
    createElement('section', {
      key: 'options',
      className: 'grid grid-cols-1 md:grid-cols-2 w-full',
      role: 'group',
      'aria-label': 'Варианты ответов',
      style: optionsContainerStyle
    }, options.map((option, index) => createElement('button', {
      key: option.id,
      onClick: () => onAnswer(option.id),
      disabled: isInteractionLocked,
      className: 'font-semibold transition-all duration-200 hover:opacity-80 hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed',
      style: {
        backgroundColor: '#163B3A',
        border: '4px solid #C29C27',
        color: '#C29C27',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        width: '100%',
        fontSize: buttonMeasurements.fontSize,
        lineHeight: 1.2,
        padding: buttonMeasurements.padding,
        borderRadius: '0px'
      }
    }, `${index + 1}. ${option.label}`)))
  ]);
}
