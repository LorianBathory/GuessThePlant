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
    restart: "Начать заново",
    menuTitle: "Угадай растение",
    menuSubtitle: "Выберите язык интерфейса и начните игру.",
    startGame: "Начать игру",
    postGameSubtitle: "Посмотрите результат и попробуйте ещё раз!"
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
    restart: "Restart",
    menuTitle: "Guess the Plant",
    menuSubtitle: "Select the interface language and start your game.",
    startGame: "Start Game",
    postGameSubtitle: "Check your result and play again!"
  },
  nl: {
    question: "Wat is deze plant?",
    score: "Score",
    correct: "Goed!",
    incorrect: "Fout!",
    result: "Je hebt",
    resultPoints: "punten",
    playAgain: "Speel opnieuw",
    instruction: "Kies de juiste naam van de plant",
    interfaceLanguageLabel: "Interfacetaal",
    roundLabel: "Ronde",
    roundCompleted: "Ronde {{round}} voltooid!",
    startRoundButton: "Start ronde {{round}}",
    gameCompletedTitle: "Je hebt het spel uitgespeeld! Je score: {{score}}",
    restart: "Opnieuw starten",
    menuTitle: "Raad de plant",
    menuSubtitle: "Kies de interfacetaal en begin met spelen.",
    startGame: "Start spel",
    postGameSubtitle: "Bekijk je resultaat en speel nog eens!"
  }
};

export const defaultLang = 'ru';

export function t(lang) {
  return uiTexts[lang] ?? uiTexts[defaultLang];
}

