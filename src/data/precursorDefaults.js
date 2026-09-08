/**
 * precursorDefaults.js — Precursor question options and dimension defaults
 *
 * Used in /choose-quests PATH_DEF screen 1 to quickly assess where
 * the user is on a path, and pre-fill current dimension levels.
 *
 * Related: src/data/domeDimensions.js (dimension definitions)
 */

export const PRECURSOR_LEVELS = [
  { id: 'not_yet', label: 'Not yet', description: "I haven't started" },
  { id: 'tried_it', label: "I've tried it", description: "I've had a go at least once" },
  { id: 'do_it_for_fun', label: 'I do it for fun', description: 'I do this sometimes, just for me' },
  { id: 'been_paid', label: "I've been paid", description: 'Someone has actually paid me for this' },
  { id: 'its_my_job', label: "It's my job", description: 'This is what I do for work right now' },
]

/**
 * Maps precursor level → default current dimension levels.
 * These are starting points, not gospel. The user can adjust later.
 *
 * Identity is inverted: "not yet" = L4 (first time ever),
 * "it's my job" = L1 (done this many times). This matches the existing
 * tier direction where L1 = most familiar.
 */
export const PRECURSOR_DEFAULTS = {
  not_yet: {
    people: 1, money: 1, vulnerability: 1, stakes: 1,
    rarity: 1, identity: 4, context: 1, business_commitment: 1,
  },
  tried_it: {
    people: 1, money: 1, vulnerability: 2, stakes: 1,
    rarity: 1, identity: 3, context: 2, business_commitment: 1,
  },
  do_it_for_fun: {
    people: 2, money: 1, vulnerability: 2, stakes: 1,
    rarity: 2, identity: 2, context: 2, business_commitment: 1,
  },
  been_paid: {
    people: 3, money: 3, vulnerability: 3, stakes: 2,
    rarity: 2, identity: 2, context: 3, business_commitment: 2,
  },
  its_my_job: {
    people: 4, money: 4, vulnerability: 3, stakes: 3,
    rarity: 3, identity: 1, context: 3, business_commitment: 4,
  },
}
