// Shared constants for Gobble Dash, the great turkey escape.
// One place for every number the world, the renderer and the screenshot
// stager agree on, so a tune in one file never drifts from the others.
export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 540;
export const GROUND_Y = 452;
export const GRAVITY = 2500;
export const JUMP_VELOCITY = 860;
export const DOUBLE_JUMP_VELOCITY = 740;
export const BASE_SPEED = 255;
export const MAX_SPEED = 560;
export const TURKEY_X = 205;
export const ESCAPE_METERS = 1500;
export const PIXELS_PER_METER = 10;
export const STEP = 1 / 60;

// The run crosses three places, each harder than the last: the farmyard at
// dawn, the cornfield at sunset, and at last the farmer's kitchen itself.
export const STAGES = [
  {
    name: 'FARMYARD',
    until: 400,
    skyTop: '#7ec8f2',
    skyMid: '#cfeefb',
    skyBottom: '#ffe9b8',
    sun: '#ffd94d',
    hillFar: '#9ccb7e',
    hillNear: '#6faf4e',
    ground: '#c98f4e',
    groundDark: '#a9743a',
    grass: '#5da244',
    label: 'the farmyard',
  },
  {
    name: 'CORNFIELD',
    until: 900,
    skyTop: '#e8804a',
    skyMid: '#f7a85c',
    skyBottom: '#ffd98a',
    sun: '#ff9d3c',
    hillFar: '#b97a3e',
    hillNear: '#8f5f2e',
    ground: '#b57a35',
    groundDark: '#8f5f26',
    grass: '#d9a83c',
    label: 'the cornfield',
  },
  {
    name: 'KITCHEN',
    until: ESCAPE_METERS,
    skyTop: '#5a3a52',
    skyMid: '#7a4a3a',
    skyBottom: '#c97a4a',
    sun: '#ffe9a8',
    hillFar: '#4a2f3e',
    hillNear: '#3a2530',
    ground: '#8a5a3c',
    groundDark: '#6e452c',
    grass: '#c98a5a',
    label: "the farmer's kitchen",
  },
];

// Obstacles. `tall` ones must be jumped, `low` ones must be slid under.
export const OBSTACLES = {
  fence: { kind: 'fence', tall: true, w: 34, h: 62 },
  hay: { kind: 'hay', tall: true, w: 64, h: 52 },
  pumpkin: { kind: 'pumpkin', tall: true, w: 46, h: 40 },
  puddle: { kind: 'puddle', tall: true, w: 74, h: 12 },
  branch: { kind: 'branch', tall: false, w: 70, h: 26, hang: 72 },
  stalk: { kind: 'stalk', tall: true, w: 30, h: 74 },
  scarecrow: { kind: 'scarecrow', tall: true, w: 44, h: 96 },
  barrow: { kind: 'barrow', tall: true, w: 66, h: 48 },
  oven: { kind: 'oven', tall: true, w: 78, h: 88 },
  knife: { kind: 'knife', tall: true, w: 26, h: 108 },
  pot: { kind: 'pot', tall: true, w: 56, h: 46 },
  pin: { kind: 'pin', tall: true, w: 60, h: 22 },
  beam: { kind: 'beam', tall: false, w: 84, h: 24, hang: 68 },
};

// Which obstacles each stage throws, with weights.
export const STAGE_TABLES = [
  ['fence', 'fence', 'hay', 'pumpkin', 'puddle', 'branch'],
  ['stalk', 'scarecrow', 'barrow', 'hay', 'pumpkin', 'branch', 'fence'],
  ['oven', 'knife', 'pot', 'pin', 'beam', 'oven', 'knife'],
];

export const PICKUPS = {
  corn: { score: 10 },
  pie: { score: 50 },
  feather: { score: 25 },
};

export const EVENT_NONE = 0;
export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ESCAPED = 8;
export const EVENT_STAGE = 16;
export const EVENT_SHIELD = 32;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_ESCAPED = 'escaped';
