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
    patterns: ['1', 'один', 'первый', 'вариант один', 'номер один', 'ответ один']
  },
  {
    index: 1,
    patterns: ['2', 'два', 'второй', 'вариант два', 'номер два', 'ответ два']
  },
  {
    index: 2,
    patterns: ['3', 'три', 'третий', 'вариант три', 'номер три', 'ответ три']
  },
  {
    index: 3,
    patterns: ['4', 'четыре', 'четвертый', 'четвёртый', 'вариант четыре', 'номер четыре', 'ответ четыре']
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

export default function useVoiceCommands({ enabled, options, onAnswer, onRepeat }) {
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
        if (error?.name !== 'InvalidStateError') {
          console.error('Ошибка запуска распознавания речи:', error);
        }
      }
    };

    const stopRecognition = () => {
      try {
        recognition.stop();
      } catch (error) {
        if (error?.name !== 'InvalidStateError') {
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
        if (result && result[0] && typeof result[0].transcript === 'string') {
          transcripts.push(result[0].transcript);
        }
      }

      const normalized = normalizeTranscript(transcripts.join(' '));
      if (!normalized) {
        return;
      }

      if (detectRepeatCommand(normalized)) {
        if (typeof repeatHandlerRef.current === 'function') {
          repeatHandlerRef.current();
        }
        return;
      }

      const optionIndex = detectOptionIndex(normalized, latestOptionsRef.current?.length || 0);
      if (optionIndex === null) {
        return;
      }

      const currentOptions = Array.isArray(latestOptionsRef.current)
        ? latestOptionsRef.current
        : [];
      const selectedOption = currentOptions[optionIndex];

      if (!selectedOption || typeof answerHandlerRef.current !== 'function') {
        return;
      }

      answerHandlerRef.current(selectedOption.id);
    };

    recognition.onerror = event => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        stopRecognition();
        return;
      }

      if (event?.error === 'no-speech') {
        startRecognition();
        return;
      }

      console.warn('Ошибка распознавания речи:', event?.error);
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
