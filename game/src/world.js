// The run itself: the turkey, the chasing farmer, the obstacles and
// pickups the road throws, and the rules that end a run caught or escaped.
// Pure logic, no drawing and no sound, so the screenshot stager can play
// the real rules forward without a browser frame.
import {
  BASE_SPEED,
  ESCAPE_METERS,
  EVENT_CAUGHT,
  EVENT_ESCAPED,
  EVENT_HIT,
  EVENT_NONE,
  EVENT_PICKUP,
  EVENT_SHIELD,
  EVENT_STAGE,
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  DOUBLE_JUMP_VELOCITY,
  MAX_SPEED,
  OBSTACLES,
  PICKUPS,
  PIXELS_PER_METER,
  STAGE_TABLES,
  STAGES,
  STEP,
  TURKEY_X,
  VIEW_WIDTH,
} from './config.js';
import { mulberry32, pickWeighted } from './random.js';

const TURKEY_STAND_W = 52;
const TURKEY_STAND_H = 66;
const TURKEY_SLIDE_H = 34;
const SLIDE_TIME = 0.55;
const START_FARMER_GAP = 130;
const FARMER_CLOSE_STEP = 52;
const FARMER_RECOVER = 5;

export class TurkeyWorld {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.reset();
  }

  reset() {
    this.time = 0;
    this.distancePx = 0;
    this.score = 0;
    this.corn = 0;
    this.hearts = 3;
    this.speed = BASE_SPEED;
    this.stageIndex = 0;
    this.over = false;
    this.escaped = false;
    this.shield = false;
    this.turkey = {
      x: TURKEY_X,
      y: GROUND_Y - TURKEY_STAND_H,
      vy: 0,
      grounded: true,
      jumps: 0,
      sliding: false,
      slideTimer: 0,
      runPhase: 0,
      hurtTimer: 0,
    };
    this.farmerGap = START_FARMER_GAP;
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];
    this.spawnIn = 0.9;
    this.pickupIn = 1.6;
    this.cornStreak = 0;
    this.bestCombo = 0;
  }

  get distanceMeters() {
    return Math.floor(this.distancePx / PIXELS_PER_METER);
  }

  get stage() {
    return STAGES[this.stageIndex];
  }

  turkeyBox() {
    const t = this.turkey;
    const h = t.sliding ? TURKEY_SLIDE_H : TURKEY_STAND_H;
    return { x: t.x + 4, y: t.y + (TURKEY_STAND_H - h), w: TURKEY_STAND_W - 8, h };
  }

  spawnObstacle() {
    const table = STAGE_TABLES[this.stageIndex];
    const def = OBSTACLES[pickWeighted(this.rng, table)];
    const gap = 190 + this.rng() * 130;
    const last = this.obstacles[this.obstacles.length - 1];
    const x = Math.max(VIEW_WIDTH + 40, last ? last.x + last.w + gap : VIEW_WIDTH + 40);
    this.obstacles.push({
      kind: def.kind,
      tall: def.tall,
      x,
      // Low obstacles hang in the air with room to slide beneath them;
      // tall ones sit on the ground and must be jumped.
      y: def.hang ? GROUND_Y - def.hang : GROUND_Y - def.h,
      w: def.w,
      h: def.h,
      passed: false,
      seed: this.rng(),
    });
  }

  spawnPickupArc() {
    const kind = this.rng() < 0.12 ? 'feather' : this.rng() < 0.22 ? 'pie' : 'corn';
    const baseX = VIEW_WIDTH + 60 + this.rng() * 80;
    const count = kind === 'corn' ? 5 : 1;
    for (let i = 0; i < count; i += 1) {
      const arc = Math.sin((i / Math.max(1, count - 1)) * Math.PI);
      this.pickups.push({
        kind,
        x: baseX + i * 34,
        y: GROUND_Y - 46 - arc * 96 - (kind === 'corn' ? 0 : 30),
        taken: false,
        bob: this.rng() * Math.PI * 2,
      });
    }
  }

  burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i += 1) {
      this.particles.push({
        x,
        y,
        vx: (this.rng() - 0.5) * 320,
        vy: -60 - this.rng() * 220,
        life: 0.5 + this.rng() * 0.4,
        age: 0,
        color,
        size: 2 + this.rng() * 4,
      });
    }
  }

  doJump() {
    const t = this.turkey;
    if (t.grounded) {
      t.vy = -JUMP_VELOCITY;
      t.grounded = false;
      t.jumps = 1;
      t.sliding = false;
      return true;
    }
    if (t.jumps < 2) {
      t.vy = -DOUBLE_JUMP_VELOCITY;
      t.jumps = 2;
      t.sliding = false;
      this.burst(t.x + 26, t.y + TURKEY_STAND_H, '#ffffff', 6);
      return true;
    }
    return false;
  }

  /** Advance the world one fixed step. `input` is {jump, slide}. */
  step(dt, input) {
    if (this.over) return EVENT_NONE;
    let events = EVENT_NONE;
    this.time += dt;
    const t = this.turkey;

    if (input.jump) this.doJump();
    // Holding slide keeps the turkey low; releasing it lets the slide run
    // out on its timer, so a long branch cannot catch the turkey standing up.
    if (input.slide && t.grounded) {
      t.sliding = true;
      t.slideTimer = SLIDE_TIME;
    } else if (t.sliding) {
      t.slideTimer -= dt;
      if (t.slideTimer <= 0) t.sliding = false;
    }

    // Speed grows with distance, and the farmer keeps the pressure on.
    this.speed = Math.min(MAX_SPEED, BASE_SPEED + this.distanceMeters * 0.36);
    const move = this.speed * dt;
    this.distancePx += move;
    this.score += move / PIXELS_PER_METER;

    const stageIndex = this.distanceMeters < STAGES[0].until
      ? 0
      : this.distanceMeters < STAGES[1].until ? 1 : 2;
    if (stageIndex !== this.stageIndex) {
      this.stageIndex = stageIndex;
      events |= EVENT_STAGE;
    }

    // Turkey physics.
    if (!t.grounded) {
      t.vy += GRAVITY * dt;
      t.y += t.vy * dt;
      if (t.y >= GROUND_Y - TURKEY_STAND_H) {
        t.y = GROUND_Y - TURKEY_STAND_H;
        t.vy = 0;
        t.grounded = true;
        t.jumps = 0;
      }
    }
    if (t.sliding) {
      t.slideTimer -= dt;
      if (t.slideTimer <= 0) t.sliding = false;
    }
    t.runPhase += dt * (this.speed / 22);
    if (t.hurtTimer > 0) t.hurtTimer -= dt;

    // The farmer gains on every stumble, then slowly falls back.
    this.farmerGap = Math.min(START_FARMER_GAP, this.farmerGap + FARMER_RECOVER * dt);

    // Spawning.
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnObstacle();
      const interval = Math.max(0.58, 1.15 - this.distanceMeters * 0.00045);
      // The first stretch is gentle: a new player learns the jump first.
      const grace = this.distanceMeters < 200 ? 1.4 : 1;
      this.spawnIn = interval * (0.85 + this.rng() * 0.4) * grace;
    }
    this.pickupIn -= dt;
    if (this.pickupIn <= 0) {
      this.spawnPickupArc();
      this.pickupIn = 2.2 + this.rng() * 2.4;
    }

    // Move the road.
    for (const o of this.obstacles) o.x -= move;
    for (const p of this.pickups) {
      p.x -= move;
      p.bob += dt * 4;
    }
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -80);
    this.pickups = this.pickups.filter((p) => p.x > -40 && !p.taken);
    for (const pt of this.particles) {
      pt.age += dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 500 * dt;
    }
    this.particles = this.particles.filter((pt) => pt.age < pt.life);

    // Pickups.
    const box = this.turkeyBox();
    for (const p of this.pickups) {
      if (p.taken) continue;
      const py = p.y + Math.sin(p.bob) * 4;
      if (p.x > box.x - 18 && p.x < box.x + box.w + 18 && py > box.y - 18 && py < box.y + box.h + 18) {
        p.taken = true;
        this.score += PICKUPS[p.kind].score;
        if (p.kind === 'corn') {
          this.corn += 1;
          this.cornStreak += 1;
          this.bestCombo = Math.max(this.bestCombo, this.cornStreak);
          if (this.cornStreak > 0 && this.cornStreak % 8 === 0) {
            this.farmerGap = Math.min(START_FARMER_GAP, this.farmerGap + 26);
          }
        } else if (p.kind === 'feather') {
          this.shield = true;
          events |= EVENT_SHIELD;
        }
        this.burst(p.x, py, p.kind === 'corn' ? '#ffd94d' : p.kind === 'pie' ? '#ff8a5c' : '#fff3b0', 8);
        events |= EVENT_PICKUP;
      }
    }

    // Obstacles: a clean jump over one is worth a little, a hit costs a heart.
    for (const o of this.obstacles) {
      if (!o.passed && o.x + o.w < box.x) {
        o.passed = true;
        this.score += 5;
      }
      if (o.x + o.w < box.x || o.x > box.x + box.w) continue;
      const oTop = o.y;
      const oBottom = o.y + o.h;
      const bTop = box.y;
      const bBottom = box.y + box.h;
      if (oBottom <= bTop + 6 || oTop >= bBottom - 6) continue;
      if (t.hurtTimer > 0) continue;
      if (this.shield) {
        this.shield = false;
        t.hurtTimer = 0.9;
        this.burst(box.x + 26, box.y + 20, '#fff3b0', 16);
        o.x = -9999;
        events |= EVENT_HIT;
        continue;
      }
      this.hearts -= 1;
      this.cornStreak = 0;
      t.hurtTimer = 0.9;
      this.farmerGap = Math.max(34, this.farmerGap - FARMER_CLOSE_STEP);
      this.burst(box.x + 26, box.y + 30, '#c65a2e', 14);
      events |= EVENT_HIT;
      if (this.hearts <= 0) {
        this.over = true;
        events |= EVENT_CAUGHT;
        return events;
      }
    }

    if (this.distanceMeters >= ESCAPE_METERS) {
      this.over = true;
      this.escaped = true;
      events |= EVENT_ESCAPED;
    }
    return events;
  }
}

export { STEP };
