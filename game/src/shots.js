// The screenshot scenes behind ?shot=title|farm|kitchen|caught|escaped.
// Each one plays the real rules forward from a fresh world with a simple
// autopilot (jump the tall things, slide under the low ones, chase corn),
// so every frame is what a short game really looks like and the same seed
// always gives the same frame.
import { SCREEN_CAUGHT, SCREEN_ESCAPED, SCREEN_PLAY, SCREEN_TITLE, STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_ESCAPED } from './config.js';

const SAMPLE = 1 / 30;

/** What the autopilot would do in the next few moments. It acts on timing,
 * not on distance alone: a jump fired too early lands on the obstacle, and
 * a slide started too early ends before the branch arrives. A careless
 * pilot reacts late and never double-jumps, the way a hurried player does. */
function autopilot(world, careless = false) {
  const t = world.turkey;
  const boxX = t.x + 4;
  const boxW = 44;
  let nearest = null;
  let nearestTime = Infinity;
  for (const o of world.obstacles) {
    if (o.x + o.w < boxX) continue;
    const gap = o.x - (boxX + boxW);
    const timeToReach = gap / Math.max(1, world.speed);
    if (timeToReach < nearestTime) {
      nearestTime = timeToReach;
      nearest = o;
    }
  }
  const jumpAt = careless ? 0.19 : 0.44;
  const slideAt = careless ? 0.09 : 0.38;
  if (nearest !== null) {
    if (nearest.tall) {
      // Jump late enough to clear it, early enough to be up in time; a
      // second jump saves a landing that falls short.
      if (nearestTime < jumpAt && nearestTime > 0.02 && t.grounded) return { jump: true, slide: false };
      if (!careless && nearestTime < 0.2 && !t.grounded && t.jumps < 2) return { jump: true, slide: false };
      return { jump: false, slide: false };
    }
    // Low: hold the slide from just before it arrives until it has passed.
    // A careless pilot never slides: every branch and beam catches it out.
    if (careless) return { jump: false, slide: false };
    if (nearestTime < slideAt) return { jump: false, slide: true };
    return { jump: false, slide: false };
  }
  // No danger: hop for a low corn arc when one is right ahead.
  for (const p of world.pickups) {
    if (p.kind === 'corn' && p.x > boxX + 40 && p.x < boxX + 170 && p.y < 452 - 120 && t.grounded) {
      return { jump: true, slide: false };
    }
  }
  return { jump: false, slide: false };
}

function runForward(world, seconds, careless = false) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const input = autopilot(world, careless);
    const events = world.step(STEP, input);
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Names: title, farm, kitchen, caught, escaped; anything else is title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'farm') {
    runForward(world, 7);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'kitchen') {
    // Play well into the kitchen, then a few more seconds of action there.
    // A run that gets caught on the way does not count: retry with a fresh
    // roll until one reaches the kitchen.
    for (let attempt = 0; attempt < 4; attempt += 1) {
      world.reset();
      let guard = 0;
      while (world.distanceMeters < 980 && guard < 60 * 150) {
        world.step(STEP, autopilot(world));
        guard += 1;
        if (world.over) break;
      }
      if (!world.over && world.distanceMeters >= 900) break;
    }
    runForward(world, 4);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'caught') {
    // A hurried pilot that reacts late: it is caught out once things speed up.
    let guard = 0;
    while (guard < 60 * 240) {
      const events = world.step(STEP, autopilot(world, true));
      guard += 1;
      if (events & EVENT_CAUGHT) break;
    }
    return { screen: SCREEN_CAUGHT, best: Math.floor(world.score) };
  }
  if (name === 'escaped') {
    let guard = 0;
    while (guard < 60 * 400) {
      const events = world.step(STEP, autopilot(world));
      guard += 1;
      if (events & EVENT_ESCAPED) break;
      if (events & EVENT_CAUGHT) break;
    }
    return { screen: world.escaped ? SCREEN_ESCAPED : SCREEN_CAUGHT, best: Math.floor(world.score) };
  }
  // Title: a few seconds of the farm scrolling behind the menu.
  runForward(world, 3);
  world.reset();
  runForward(world, 2.5);
  return { screen: SCREEN_TITLE, best: 0 };
}

export { SAMPLE };
