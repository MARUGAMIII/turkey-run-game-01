// Gobble Dash: the great turkey escape. Wires the world, the renderer, the
// sound bank and the input together, runs the frame loop, and stages the
// deterministic screenshot scenes behind ?shot=.
import {
  EVENT_CAUGHT,
  EVENT_ESCAPED,
  EVENT_HIT,
  EVENT_PICKUP,
  EVENT_SHIELD,
  EVENT_STAGE,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  STEP,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';
import { TurkeyWorld } from './world.js';
import { Renderer } from './render.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const world = new TurkeyWorld(seed);
const renderer = new Renderer(canvas);
const sounds = new SoundBank();
const input = new Input(canvas);

let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem('gobble-dash-best') || '0') || 0;
} catch {
  best = 0;
}

function saveBest() {
  if (world.score > best) {
    best = Math.floor(world.score);
    try {
      window.localStorage.setItem('gobble-dash-best', String(best));
    } catch {
      // Storage may be off; the score still shows this run.
    }
  }
}

function startRun() {
  world.reset();
  screen = SCREEN_PLAY;
  input.clear();
  sounds.ensure();
  sounds.gobble();
  sounds.startMusic();
}

function endRun(escaped) {
  saveBest();
  screen = escaped ? SCREEN_ESCAPED : SCREEN_CAUGHT;
  sounds.stopMusic();
  if (escaped) sounds.escaped();
  else sounds.caught();
}

function handleEvents(events) {
  if (events & EVENT_PICKUP) {
    const last = world.pickups.find((p) => p.taken);
    if (last && last.kind === 'pie') sounds.pie();
    else sounds.coin();
  }
  if (events & EVENT_SHIELD) sounds.shield();
  if (events & EVENT_HIT) {
    sounds.hit();
    sounds.farmerYell();
  }
  if (events & EVENT_STAGE) sounds.stageUp();
  if (events & EVENT_CAUGHT) endRun(false);
  if (events & EVENT_ESCAPED) endRun(true);
}

input.onKey = (key) => {
  if (key === 'p' || key === 'P' || key === 'Escape') {
    if (screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      sounds.stopMusic();
    } else if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      sounds.startMusic();
    }
    return;
  }
  if (key === 'm' || key === 'M') {
    sounds.toggleMute();
    return;
  }
  if (key === 'r' || key === 'R') {
    if (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) startRun();
    return;
  }
  if ((key === ' ' || key === 'Enter') && screen === SCREEN_TITLE) startRun();
};

input.onPointer = () => {
  if (screen === SCREEN_TITLE) startRun();
  else if (screen === SCREEN_CAUGHT || screen === SCREEN_ESCAPED) startRun();
};

// A staged screenshot: play the real rules forward once, then hold the
// frame still so the capture shows exactly that moment.
if (shotName) {
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  if (staged.best) best = Math.max(best, staged.best);
  const drawShot = () => {
    renderer.draw({ world }, screen, { best, muted: false });
    window.requestAnimationFrame(drawShot);
  };
  drawShot();
} else {
  let last = performance.now();
  let accumulator = 0;
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const jumped = input.takeJump();
        const events = world.step(STEP, { jump: jumped, slide: input.slideHeld });
        handleEvents(events);
        if (screen !== SCREEN_PLAY) {
          accumulator = 0;
          break;
        }
      }
    } else {
      input.takeJump();
      // The title screen keeps the farm scrolling gently behind the menu.
      if (screen === SCREEN_TITLE) {
        world.time += dt;
        world.distancePx += 40 * dt;
        world.turkey.runPhase += dt * 12;
      }
    }
    renderer.draw({ world }, screen, { best, muted: sounds.muted });
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

// Keep the canvas crisp on hidpi screens without changing the game size.
function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW_WIDTH, window.innerHeight / VIEW_HEIGHT, 1.6);
  canvas.style.width = `${Math.floor(VIEW_WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_HEIGHT * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();
