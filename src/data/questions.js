import { bouquetQuestions, plants } from '../game/dataLoader.js';

export const allQuestions = Object.freeze([
  ...plants,
  ...bouquetQuestions
]);
