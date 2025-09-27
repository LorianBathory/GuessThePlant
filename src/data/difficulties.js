export const difficultyLevels = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
});

export const questionIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze([6, 31, 33, 35, 51, 55, 41]),
  [difficultyLevels.MEDIUM]: Object.freeze([2, 30, 3, 54, 4, 5, 69, 26]),
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
