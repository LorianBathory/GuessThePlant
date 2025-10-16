import { helianthusGenus } from './helianthus.js';

const genusList = Object.freeze([helianthusGenus]);

export const genusById = Object.freeze(
  Object.fromEntries(genusList.map(genus => [genus.id, genus]))
);

export const genusBySlug = Object.freeze(
  Object.fromEntries(genusList.map(genus => [genus.slug, genus]))
);

export const allGenusEntries = genusList;
