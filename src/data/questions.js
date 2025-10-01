import { bouquetQuestions } from './catalogBouquets.js';
import { plants } from './catalog.js';

export const allQuestions = Object.freeze([
  ...plants,
  ...bouquetQuestions
]);
