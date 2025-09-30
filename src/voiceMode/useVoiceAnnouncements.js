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

  const { useEffect, useMemo } = ReactGlobal;

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

  useEffect(() => {
    if (!checkSpeechSupport()) {
      return;
    }

    if (gameState !== 'playing') {
      return;
    }

    if (spokenOptions.length === 0) {
      return;
    }

    const questionIntro = Number.isFinite(questionNumber)
      ? [`Вопрос ${questionNumber}. Выберите правильное название растения.`]
      : ['Выберите правильное название растения.'];

    speakQueue([...questionIntro, ...spokenOptions]);
  }, [questionNumber, spokenOptions, gameState]);

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

  return { isSpeechSupported: checkSpeechSupport() };
}

export function isSpeechSynthesisSupported() {
  return checkSpeechSupport();
}
