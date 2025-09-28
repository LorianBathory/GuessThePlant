export const difficultyLevels = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
});

export const questionIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze([6, 27, 29, 31, 33, 35, 41, 51, 55]),
  [difficultyLevels.MEDIUM]: Object.freeze([2, 3, 4, 5, 17, 26, 30, 47, 54, 69, 73]),
  [difficultyLevels.HARD]: Object.freeze([1, 32, 34, 50, 53, 52, 77])
});

const difficultyByQuestionId = Object.freeze(
  Object.entries(questionIdsByDifficulty).reduce((acc, [difficulty, ids]) => {
    ids.forEach(id => {
      acc[id] = difficulty;
    });
    return acc;
  }, {})
);

export function getDifficultyByQuestionId(questionId) {
  return difficultyByQuestionId[questionId] || null;
}
