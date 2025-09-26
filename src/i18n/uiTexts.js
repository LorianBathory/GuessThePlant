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
    interfaceLanguageLabel: "Язык интерфейса"
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
    interfaceLanguageLabel: "Interface language"
  },
  sci: {
    question: "Quae planta est?",
    score: "Score",
    correct: "Recte!",
    incorrect: "Perperam!",
    result: "Score",
    resultPoints: "points",
    playAgain: "Ludere iterum",
    instruction: "Elige nomen scientificum rectum",
    interfaceLanguageLabel: "Lingua interfaciei"
  }
};

export const defaultLang = 'ru';

export function t(lang) {
  return uiTexts[lang] ?? uiTexts[defaultLang];
}

