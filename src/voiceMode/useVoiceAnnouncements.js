const NUMBER_WORDS = ['Один', 'Два', 'Три', 'Четыре'];

function checkSpeechSupport() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
}

function speakQueue(lines) {
  if (!checkSpeechSupport()) {
    return;
  }

  const { speechSynthesis, SpeechSynthesisUtterance } = window;
  speechSynthesis.cancel();

  lines.forEach(line => {
    if (typeof line !== 'string' || line.trim() === '') {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(line);
    utterance.lang = 'ru-RU';
    speechSynthesis.speak(utterance);
  });
}

export function useVoiceAnnouncements({ questionNumber, options, gameState }) {
  const ReactGlobal = globalThis.React;
  if (!ReactGlobal) {
    throw new Error('React global was not found. Make sure the React bundle is loaded before using useVoiceAnnouncements.');
  }

  const { useEffect, useMemo, useCallback } = ReactGlobal;

  useEffect(() => () => {
    if (checkSpeechSupport()) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const spokenOptions = useMemo(() => {
    if (!Array.isArray(options) || options.length === 0) {
      return [];
    }

    return options.map((option, index) => {
      const numberWord = NUMBER_WORDS[index] || String(index + 1);
      return `${numberWord}. ${option.label}`;
    });
  }, [options]);

  const speakOptions = useCallback(() => {
    if (!checkSpeechSupport()) {
      return;
    }

    if (spokenOptions.length === 0) {
      return;
    }

    speakQueue(spokenOptions);
  }, [spokenOptions]);

  const repeatOptions = useCallback(() => {
    if (gameState !== 'playing') {
      return;
    }

    speakOptions();
  }, [gameState, speakOptions]);

  useEffect(() => {
    if (gameState !== 'playing') {
      return;
    }

    speakOptions();
  }, [questionNumber, gameState, speakOptions]);

  useEffect(() => {
    if (!checkSpeechSupport()) {
      return;
    }

    if (gameState === 'correct') {
      speakQueue(['Верно.']);
      return;
    }

    if (gameState === 'incorrect') {
      speakQueue(['Неверно.']);
    }
  }, [gameState]);

  return { isSpeechSupported: checkSpeechSupport(), repeatOptions };
}

export function isSpeechSynthesisSupported() {
  return checkSpeechSupport();
}
