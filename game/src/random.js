// A tiny seeded random source, so a screenshot staged from a seed always
// shows the same run, and the live game can still roll fresh dice.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry from `table` with the seeded roll. */
export function pickWeighted(rng, table) {
  return table[Math.floor(rng() * table.length)];
}
