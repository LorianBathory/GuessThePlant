export const uiTexts = {
  ru: {
    question: "Что это за растение?",
    score: "Баллы",
    correct: "Верно!",
    incorrect: "Неверно!",
    result: "Вы получили",
    resultPoints: "баллов",
    playAgain: "Играть снова",
    instruction: "Выберите правильное название растения",
    interfaceLanguageLabel: "Язык интерфейса",
    roundLabel: "Раунд",
    roundCompleted: "Раунд {{round}} завершён!",
    startRoundButton: "Начать раунд {{round}}",
    gameCompletedTitle: "Вы прошли игру! Ваши баллы: {{score}}",
    restart: "Начать заново"
  },
  en: {
    question: "What plant is this?",
    score: "Score",
    correct: "Correct!",
    incorrect: "Incorrect!",
    result: "You scored",
    resultPoints: "points",
    playAgain: "Play Again",
    instruction: "Choose the correct plant name",
    interfaceLanguageLabel: "Interface language",
    roundLabel: "Round",
    roundCompleted: "Round {{round}} completed!",
    startRoundButton: "Start Round {{round}}",
    gameCompletedTitle: "You completed the game! Your score: {{score}}",
    restart: "Restart"
  }
};

export const defaultLang = 'ru';

export function t(lang) {
  return uiTexts[lang] ?? uiTexts[defaultLang];
}

