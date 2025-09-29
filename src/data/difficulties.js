export const difficultyLevels = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
});

export const questionIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze([6, 13, 22, 26, 27, 29, 31, 33, 35, 41, 51, 55, 58, 75, 82, 88, 91, 93, 94, 95, 97, 100]),
  [difficultyLevels.MEDIUM]: Object.freeze([2, 3, 5, 17, 19, 21, 26, 30, 46, 47, 54, 62, 68, 69, 72, 73, 81, 83, 85, 86, 90, 92, 96, 98, 101]),
  [difficultyLevels.HARD]: Object.freeze([1, 4, 32, 34, 50, 53, 52, 77, 78, 79, 80, 84, 89])
});

export const imageIdsByDifficulty = Object.freeze({
    [difficultyLevels.EASY]: Object.freeze(['p092']),
    [difficultyLevels.MEDIUM]: Object.freeze(['p011', 'p014', 'p021', 'p035', 'p044', 'p060', 'p050', 'p078','p082', 'p097', 'p104']),
    [difficultyLevels.HARD]: Object.freeze(['p018', 'p067', 'p072', 'p074', 'p046', 'p047', 'p054', 'p063', 'p064', 'p073', 'p095','p096', 'p100'])
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
