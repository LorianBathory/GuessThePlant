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

const NUMBER_COMMAND_PATTERNS = [
  { index: 0, patterns: [/\bодин\b/, /\b1\b/] },
  { index: 1, patterns: [/\bдва\b/, /\b2\b/] },
  { index: 2, patterns: [/\bтри\b/, /\b3\b/] },
  { index: 3, patterns: [/\bчетыре\b/, /\b4\b/] }
];
const REPEAT_PATTERNS = [/\bповтори\b/, /\bповторить\b/, /\bповтор\b/];

const DESKTOP_IMAGE_WIDTH = BASE_DESKTOP_IMAGE_WIDTH * UPSCALE_FACTOR;
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
      onContextMenu: event => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      },
      onDragStart: event => {
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
      }
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const RecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (typeof RecognitionConstructor !== 'function') {
      return undefined;
    }

    const recognition = new RecognitionConstructor();
    let isDisposed = false;

    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    const startRecognition = () => {
      if (isDisposed || gameState !== 'playing') {
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        if (!error || error.name !== 'InvalidStateError') {
          console.error('Не удалось запустить распознавание речи.', error);
        }
      }
    };

    recognition.onresult = event => {
      if (!event || !event.results || event.results.length === 0) {
        return;
      }

      const lastResult = event.results[event.results.length - 1];
      const alternative = lastResult && lastResult[0];
      const transcript = alternative && typeof alternative.transcript === 'string'
        ? alternative.transcript
        : '';
      const normalized = transcript.trim().toLowerCase();

      if (!normalized) {
        return;
      }

      const sanitized = normalized
        .replace(/[.,!?]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!sanitized) {
        return;
      }

      if (REPEAT_PATTERNS.some(pattern => pattern.test(sanitized))) {
        repeatOptions();
        return;
      }

      for (const command of NUMBER_COMMAND_PATTERNS) {
        if (!Array.isArray(command.patterns)) {
          continue;
        }

        const isMatch = command.patterns.some(pattern => pattern.test(sanitized));
        if (!isMatch) {
          continue;
        }

        const option = options && options.length > command.index ? options[command.index] : undefined;
        if (option && typeof onAnswer === 'function') {
          onAnswer(option.id);
        }
        return;
      }
    };

    recognition.onerror = event => {
      if (event && event.error === 'no-speech') {
        return;
      }

      console.error('Ошибка распознавания речи.', event);
    };

    recognition.onend = () => {
      if (isDisposed) {
        return;
      }

      if (gameState === 'playing') {
        startRecognition();
      }
    };

    if (gameState === 'playing') {
      startRecognition();
    }

    return () => {
      isDisposed = true;
      try {
        recognition.stop();
      } catch (error) {
        if (!error || error.name !== 'InvalidStateError') {
          console.error('Не удалось остановить распознавание речи.', error);
        }
      }
    };
  }, [gameState, options, onAnswer, repeatOptions]);
  useVoiceCommands({
    enabled: !isInteractionLocked,
    options,
    onAnswer,
    onRepeat: repeatOptions,
    questionId: currentPlant && currentPlant.id ? currentPlant.id : `${questionNumber}`
  });

  const feedbackState = useMemo(() => {
    if (gameState === 'correct') {
      return {
        icon: '✔',
        label: 'Ответ засчитан',
        description: 'Верный ответ',
        accentColor: '#34d399'
      };
    }

    if (gameState === 'incorrect') {
      return {
        icon: '✖',
        label: 'Ответ засчитан',
        description: 'Неверный ответ',
        accentColor: '#f87171'
      };
    }

    return null;
  }, [gameState]);

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
    className: 'w-full max-w-6xl mx-auto flex flex-col items-center relative',
    style: rootLayoutStyle
  }, [
    currentPlant && currentPlant.image && createElement(VoicePlantImage, {
      key: 'image',
      src: currentPlant.image,
      alt: currentPlant && currentPlant.ru ? `Растение: ${currentPlant.ru}` : 'Фотография растения',
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
    }, `${index + 1}. ${option.label}`))),
    feedbackState && createElement('div', {
      key: 'feedback-overlay',
      role: 'status',
      'aria-live': 'assertive',
      className: 'absolute inset-0 flex items-center justify-center px-4',
      style: {
        backgroundColor: 'rgba(15, 31, 30, 0.86)',
        pointerEvents: 'none'
      }
    }, createElement('div', {
      className: 'flex flex-col items-center text-center gap-4',
      style: {
        backgroundColor: '#102926',
        border: `4px solid ${feedbackState.accentColor}`,
        boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
        padding: isMobile ? '36px 24px' : '48px 56px',
        maxWidth: 'min(480px, 90vw)'
      }
    }, [
      createElement('span', {
        key: 'icon',
        'aria-hidden': 'true',
        style: {
          fontSize: isMobile ? '48px' : '64px',
          color: feedbackState.accentColor
        }
      }, feedbackState.icon),
      createElement('p', {
        key: 'label',
        style: {
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: 700
        }
      }, feedbackState.label),
      createElement('p', {
        key: 'description',
        style: {
          fontSize: isMobile ? '20px' : '22px',
          color: '#e5f3f0'
        }
      }, feedbackState.description)
    ]))
  ]);
}
