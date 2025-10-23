import { questionSetsByType } from '../game/dataLoader.js';
import { questionTypes } from './questionTypes.js';

const EMPTY_QUESTION_LIST = Object.freeze([]);

export const questionsByType = Object.freeze({
  [questionTypes.PLANT]: questionSetsByType?.[questionTypes.PLANT] || EMPTY_QUESTION_LIST,
  [questionTypes.BOUQUET]: questionSetsByType?.[questionTypes.BOUQUET] || EMPTY_QUESTION_LIST
});

export const plantQuestions = questionsByType[questionTypes.PLANT];
export const bouquetQuestions = questionsByType[questionTypes.BOUQUET];

export const allQuestions = Object.freeze([].concat(...Object.values(questionsByType)));
