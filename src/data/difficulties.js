export const difficultyLevels = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
});

export const questionIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze([6, 22, 26, 27, 29, 31, 33, 35, 41, 51, 55, 75]),
  [difficultyLevels.MEDIUM]: Object.freeze([2, 3, 5, 17, 19, 26, 30, 46, 47, 54, 68, 69, 73]),
  [difficultyLevels.HARD]: Object.freeze([1, 4, 32, 34, 50, 53, 52, 77, 78, 79])
});

export const imageIdsByDifficulty = Object.freeze({
  [difficultyLevels.MEDIUM]: Object.freeze(['p011', 'p014', 'p021', 'p035']),
  [difficultyLevels.HARD]: Object.freeze(['p018'])
});

export const imageDifficultyOverrides = Object.freeze(
  Object.entries(imageIdsByDifficulty).reduce((acc, [difficulty, ids]) => {
    ids.forEach(id => {
      acc[id] = difficulty;
    });
    return acc;
  }, {})
);

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

export function getDifficultyByImageId(imageId) {
  return imageDifficultyOverrides[imageId] || null;
}
