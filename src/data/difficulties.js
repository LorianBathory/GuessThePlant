import { questionTypes } from './questionTypes.js';

export const difficultyLevels = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard'
});

const plantQuestionIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze([6, 12, 13, 18, 22, 24, 26, 27, 29, 31, 33, 35, 41, 44, 51, 55, 58, 63, 66, 74, 75, 76, 82, 88, 91,
                                          93, 94, 95, 97, 100, 102, 104, 105, 106, 107, 108, 114, 116, 117, 119, 124, 126, 130, 139, 142, 146, 152, 156, 157, 165, 167, 168, 174, 180, 181, 182, 183, 184, 188, 189,
  191, 194, 195, 200]),
  [difficultyLevels.MEDIUM]: Object.freeze([2, 3, 5, 8, 15, 16, 17, 19, 21, 23, 25, 26, 30, 36, 39, 40, 46, 47, 54, 59, 62, 64, 68, 69, 72, 73, 81, 83, 85, 86, 90, 92, 96, 98, 101, 
                                            109, 110, 112, 113, 118, 120, 121, 122, 123, 125, 127, 131, 150, 153, 159, 160, 163, 164, 166, 169, 170, 171, 172, 173, 176, 177, 178, 179, 185, 186, 190, 192, 198, 199,
  201]),
  [difficultyLevels.HARD]: Object.freeze([1, 4, 14, 28, 32, 34, 50, 53, 52, 77, 78, 79, 80, 84, 89, 155, 158, 161, 162, 175, 177, 187, 193, 196, 197])
});

const bouquetQuestionIdsByDifficulty = Object.freeze({
  [difficultyLevels.MEDIUM]: Object.freeze(['b1', 'b2'])
});

export const questionIdsByDifficulty = Object.freeze({
  [questionTypes.PLANT]: plantQuestionIdsByDifficulty,
  [questionTypes.BOUQUET]: bouquetQuestionIdsByDifficulty
});

const plantImageIdsByDifficulty = Object.freeze({
  [difficultyLevels.EASY]: Object.freeze(['p092']),
  [difficultyLevels.MEDIUM]: Object.freeze(['p011', 'p014', 'p021', 'p035', 'p044', 'p050', 'p060', 'p078', 'p082', 'p097', 'p104', 'p133', 'p135']),
  [difficultyLevels.HARD]: Object.freeze(['p15', 'p018', 'p046', 'p047', 'p054', 'p063', 'p064', 'p067', 'p072', 'p073', 'p074', 'p095', 'p096', 'p100', 'p109', 'p110', 'p111', 'p112',
      'p141', 'p278'])
});

const bouquetImageIdsByDifficulty = Object.freeze({
  [difficultyLevels.MEDIUM]: Object.freeze(['bq001', 'bq002'])
});

export const imageIdsByDifficulty = Object.freeze({
  [questionTypes.PLANT]: plantImageIdsByDifficulty,
  [questionTypes.BOUQUET]: bouquetImageIdsByDifficulty
});

function buildDifficultyLookup(source) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(source).flatMap(([questionType, difficultyMap]) =>
        Object.entries(difficultyMap).flatMap(([difficulty, ids]) =>
          ids.map(id => [`${questionType}::${id}`, difficulty])
        )
      )
    )
  );
}

const questionDifficultyLookup = buildDifficultyLookup(questionIdsByDifficulty);
const imageDifficultyLookup = buildDifficultyLookup(imageIdsByDifficulty);

export const imageDifficultyOverrides = imageDifficultyLookup;

export function getDifficultyByQuestionId(questionId, questionType = questionTypes.PLANT) {
  if (questionId == null) {
    return null;
  }

  return questionDifficultyLookup[`${questionType}::${questionId}`] || null;
}

export function getDifficultyByImageId(imageId, questionType = questionTypes.PLANT) {
  if (typeof imageId !== 'string') {
    return null;
  }

  return imageDifficultyLookup[`${questionType}::${imageId}`] || null;
}
