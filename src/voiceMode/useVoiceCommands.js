const REPEAT_PATTERNS = [
  'повтори',
  'повторить',
  'повтор',
  'еще раз',
  'ещё раз',
  'снова'
];

const NUMBER_PATTERNS = [
  {
    index: 0,
    patterns: [
      '1',
      'один',
      'одна',
      'одно',
      'первый',
      'первое',
      'первая',
      'вариант один',
      'вариант 1',
      'номер один',
      'номер 1',
      'ответ один',
      'ответ 1',
      'первый вариант',
      'первый ответ'
    ]
  },
  {
    index: 1,
    patterns: [
      '2',
      'два',
      'две',
      'второй',
      'второе',
      'вторая',
      'вариант два',
      'вариант 2',
      'номер два',
      'номер 2',
      'ответ два',
      'ответ 2',
      'второй вариант',
      'второй ответ'
    ]
  },
  {
    index: 2,
    patterns: [
      '3',
      'три',
      'третья',
      'третье',
      'третий',
      'вариант три',
      'вариант 3',
      'номер три',
      'номер 3',
      'ответ три',
      'ответ 3',
      'третий вариант',
      'третий ответ'
    ]
  },
  {
    index: 3,
    patterns: [
      '4',
      'четыре',
      'четвертая',
      'четвертое',
      'четвертый',
      'четвёртый',
      'четвёртая',
      'вариант четыре',
      'вариант 4',
      'номер четыре',
      'номер 4',
      'ответ четыре',
      'ответ 4',
      'четвертый вариант',
      'четвёртый вариант',
      'четвертый ответ',
      'четвёртый ответ'
    ]
  }
];

function normalizeTranscript(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesPattern(text, pattern) {
  if (!pattern) {
    return false;
  }

  const normalizedPattern = pattern.toLowerCase().replace(/ё/g, 'е');

  if (normalizedPattern.includes(' ')) {
    return text.includes(normalizedPattern);
  }

  const escaped = normalizedPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

function detectRepeatCommand(text) {
  return REPEAT_PATTERNS.some(pattern => matchesPattern(text, pattern));
}

function detectOptionIndex(text, optionCount) {
  for (const { index, patterns } of NUMBER_PATTERNS) {
    if (index >= optionCount) {
      continue;
    }

    if (patterns.some(pattern => matchesPattern(text, pattern))) {
      return index;
    }
  }

  return null;
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function useVoiceCommands({ enabled, options, onAnswer, onRepeat, questionId }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before using useVoiceCommands.');
  }

  const { useEffect, useRef } = ReactGlobal;

  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const latestOptionsRef = useRef(options);
  const answerHandlerRef = useRef(onAnswer);
  const repeatHandlerRef = useRef(onRepeat);
  const enabledRef = useRef(Boolean(enabled));
  const startListeningRef = useRef(() => {});
  const stopListeningRef = useRef(() => {});
  const questionIdRef = useRef(questionId);

  useEffect(() => {
    latestOptionsRef.current = options;
  }, [options]);

  useEffect(() => {
    answerHandlerRef.current = onAnswer;
  }, [onAnswer]);

  useEffect(() => {
    repeatHandlerRef.current = onRepeat;
  }, [onRepeat]);

  useEffect(() => {
    enabledRef.current = Boolean(enabled);
  }, [enabled]);

  useEffect(() => {
    if (questionId === questionIdRef.current) {
      return;
    }

    questionIdRef.current = questionId;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (error) {
        if (!error || error.name !== 'InvalidStateError') {
          console.warn('Не удалось перезапустить распознавание речи при смене вопроса:', error);
        }
      }
    }

    if (enabledRef.current && shouldListenRef.current) {
      startListeningRef.current();
    }
  }, [questionId]);

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    const startRecognition = () => {
      if (!shouldListenRef.current) {
        return;
      }

      try {
        recognition.start();
      } catch (error) {
        // Thrown if recognition is already running; safe to ignore.
        if (!error || error.name !== 'InvalidStateError') {
          console.error('Ошибка запуска распознавания речи:', error);
        }
      }
    };

    const stopRecognition = () => {
      try {
        recognition.stop();
      } catch (error) {
        if (!error || error.name !== 'InvalidStateError') {
          console.error('Ошибка остановки распознавания речи:', error);
        }
      }
    };

    recognition.onresult = event => {
      if (!enabledRef.current) {
        return;
      }

      const transcripts = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) {
          continue;
        }

        for (let j = 0; j < result.length; j += 1) {
          const alternative = result[j];
          if (alternative && typeof alternative.transcript === 'string') {
            transcripts.push(alternative.transcript);
          }
        }
      }

      if (transcripts.length === 0) {
        return;
      }

      const normalizedVariants = transcripts
        .map(normalizeTranscript)
        .filter(Boolean);

      if (normalizedVariants.length === 0) {
        return;
      }

      let handled = false;

      for (const normalized of normalizedVariants) {
        if (!normalized) {
          continue;
        }

        if (detectRepeatCommand(normalized)) {
          if (typeof repeatHandlerRef.current === 'function') {
            repeatHandlerRef.current();
          }
          handled = true;
          break;
        }
      }

      if (handled) {
        return;
      }

      for (const normalized of normalizedVariants) {
        const currentOptions = Array.isArray(latestOptionsRef.current)
          ? latestOptionsRef.current
          : [];
        const optionIndex = detectOptionIndex(normalized, currentOptions.length || 0);
        if (optionIndex === null || optionIndex === undefined) {
          continue;
        }

        const selectedOption = currentOptions[optionIndex];

        if (!selectedOption || typeof answerHandlerRef.current !== 'function') {
          continue;
        }

        enabledRef.current = false;
        shouldListenRef.current = false;
        stopRecognition();
        answerHandlerRef.current(selectedOption.id);
        handled = true;
        break;
      }

      if (handled) {
        return;
      }

      const combined = normalizeTranscript(transcripts.join(' '));
      if (!combined) {
        return;
      }

      if (detectRepeatCommand(combined)) {
        if (typeof repeatHandlerRef.current === 'function') {
          repeatHandlerRef.current();
        }
        return;
      }

      const currentOptions = Array.isArray(latestOptionsRef.current)
        ? latestOptionsRef.current
        : [];
      const optionIndex = detectOptionIndex(combined, currentOptions.length || 0);
      if (optionIndex === null || optionIndex === undefined) {
        return;
      }

      const selectedOption = currentOptions[optionIndex];

      if (!selectedOption || typeof answerHandlerRef.current !== 'function') {
        return;
      }

      enabledRef.current = false;
      shouldListenRef.current = false;
      stopRecognition();
      answerHandlerRef.current(selectedOption.id);
    };

    recognition.onerror = event => {
      const eventError = event && event.error;
      if (eventError === 'not-allowed' || eventError === 'service-not-allowed') {
        shouldListenRef.current = false;
        stopRecognition();
        return;
      }

      if (eventError === 'no-speech') {
        startRecognition();
        return;
      }

      console.warn('Ошибка распознавания речи:', eventError);
      startRecognition();
    };

    recognition.onend = () => {
      startRecognition();
    };

    recognitionRef.current = recognition;
    startListeningRef.current = startRecognition;
    stopListeningRef.current = stopRecognition;

    if (shouldListenRef.current) {
      startRecognition();
    }

    return () => {
      shouldListenRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      stopRecognition();
      recognitionRef.current = null;
      startListeningRef.current = () => {};
      stopListeningRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    shouldListenRef.current = Boolean(enabled);

    if (shouldListenRef.current) {
      startListeningRef.current();
    } else {
      stopListeningRef.current();
    }
  }, [enabled]);
}
