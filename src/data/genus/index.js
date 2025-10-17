import { alliumGenus } from './allium.js';
import { amaranthusGenus } from './amaranthus.js';
import { anemoneGenus } from './anemone.js';
import { campanulaGenus } from './campanula.js';
import { centaureaGenus } from './centaurea.js';
import { dianthusGenus } from './dianthus.js';
import { hemerocallisGenus } from './hemerocallis.js';
import { hebeGenus } from './hebe.js';
import { helianthusGenus } from './helianthus.js';
import { lupinusGenus } from './lupinus.js';
import { rosaGenus } from './rosa.js';
import { salviaGenus } from './salvia.js';
import { veronicaGenus } from './veronica.js';

const genusList = Object.freeze([
  alliumGenus,
  amaranthusGenus,
  anemoneGenus,
  campanulaGenus,
  centaureaGenus,
  dianthusGenus,
  hemerocallisGenus,
  hebeGenus,
  helianthusGenus,
  lupinusGenus,
  rosaGenus,
  salviaGenus,
  veronicaGenus
]);

export const genusById = Object.freeze(
  Object.fromEntries(genusList.map(genus => [genus.id, genus]))
);

export const genusBySlug = Object.freeze(
  Object.fromEntries(genusList.map(genus => [genus.slug, genus]))
);

export const allGenusEntries = genusList;
