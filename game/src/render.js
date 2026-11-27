// Every pixel of Gobble Dash: the autumn sky and parallax farm, the kitchen
// at night, the turkey and the farmer who chases it, the HUD and the menus.
// All art is drawn with canvas shapes, so the game needs no image files.
import {
  GROUND_Y,
  SCREEN_CAUGHT,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  VIEW_HEIGHT,
  VIEW_WIDTH,
} from './config.js';

const CLOUDS = [
  { x: 80, y: 70, s: 1.1 }, { x: 340, y: 46, s: 0.8 }, { x: 600, y: 88, s: 1.3 },
  { x: 820, y: 54, s: 0.9 }, { x: 1060, y: 76, s: 1.0 }, { x: 1300, y: 60, s: 0.8 },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(state, screen, ui) {
    const ctx = this.ctx;
    const world = state.world;
    const stage = world.stage;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    this.drawSky(ctx, stage, world.distancePx);
    this.drawHills(ctx, stage, world.distancePx);
    this.drawGround(ctx, stage, world.distancePx);
    this.drawPickups(ctx, world);
    this.drawObstacles(ctx, world);
    this.drawParticles(ctx, world);
    this.drawFarmer(ctx, world);
    this.drawTurkey(ctx, world);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) this.drawHud(ctx, world, ui);
    if (screen === SCREEN_TITLE) this.drawTitle(ctx, world, ui);
    if (screen === SCREEN_PAUSED) this.drawPaused(ctx, ui);
    if (screen === SCREEN_CAUGHT) this.drawCaught(ctx, world, ui);
    if (screen === SCREEN_ESCAPED) this.drawEscaped(ctx, world, ui);
    ctx.restore();
  }

  drawSky(ctx, stage, dist) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, stage.skyTop);
    g.addColorStop(0.55, stage.skyMid);
    g.addColorStop(1, stage.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_WIDTH, GROUND_Y + 2);
    // Sun or kitchen lamp glow, kept below the HUD bar.
    const sunX = 800 - (dist * 0.01) % 120;
    const sunY = stage.name === 'KITCHEN' ? 108 : 122;
    ctx.fillStyle = stage.sun;
    ctx.globalAlpha = 0.22;
    ellipse(ctx, sunX, sunY, 52, 52, stage.sun);
    ctx.globalAlpha = 1;
    ellipse(ctx, sunX, sunY, 32, 32, stage.sun);
    // Clouds drift slowly.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const c of CLOUDS) {
      const x = ((c.x - dist * 0.08) % 1440 + 1440) % 1440 - 240;
      ellipse(ctx, x, c.y, 42 * c.s, 15 * c.s, 'rgba(255,255,255,0.85)');
      ellipse(ctx, x + 30 * c.s, c.y + 4, 30 * c.s, 12 * c.s, 'rgba(255,255,255,0.85)');
      ellipse(ctx, x - 32 * c.s, c.y + 5, 26 * c.s, 11 * c.s, 'rgba(255,255,255,0.85)');
    }
    // Stage flavour in the sky: birds over the farm, a window in the kitchen.
    if (stage.name !== 'KITCHEN') {
      ctx.strokeStyle = 'rgba(60,50,40,0.7)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i += 1) {
        const bx = 200 + i * 180 - ((dist * 0.12) % 540);
        const by = 120 + i * 26;
        ctx.beginPath();
        ctx.moveTo(bx - 10, by);
        ctx.quadraticCurveTo(bx - 4, by - 7, bx, by);
        ctx.quadraticCurveTo(bx + 4, by - 7, bx + 10, by);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#2c1c26';
      roundRect(ctx, 120, 60, 150, 120, 10);
      ctx.fill();
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(132, 72, 126, 96);
      ctx.strokeStyle = '#2c1c26';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(195, 72);
      ctx.lineTo(195, 168);
      ctx.moveTo(132, 120);
      ctx.lineTo(258, 120);
      ctx.stroke();
    }
  }

  drawHills(ctx, stage, dist) {
    // Far hill, slow; near hill, faster: the parallax that sells the run.
    ctx.fillStyle = stage.hillFar;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_WIDTH; x += 40) {
      const wx = x + dist * 0.15;
      ctx.lineTo(x, GROUND_Y - 70 - Math.sin(wx * 0.004) * 34 - Math.sin(wx * 0.011) * 14);
    }
    ctx.lineTo(VIEW_WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = stage.hillNear;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= VIEW_WIDTH; x += 40) {
      const wx = x + dist * 0.35;
      ctx.lineTo(x, GROUND_Y - 26 - Math.sin(wx * 0.006) * 18);
    }
    ctx.lineTo(VIEW_WIDTH, GROUND_Y);
    ctx.closePath();
    ctx.fill();
    // Round trees on the near hill, one every few hundred pixels.
    if (stage.name !== 'KITCHEN') {
      for (let i = 0; i < 5; i += 1) {
        const wx = i * 320 + 90;
        const x = ((wx - dist * 0.35) % 1600 + 1600) % 1600 - 320;
        const gy = GROUND_Y - 26 - Math.sin((x + dist * 0.35) * 0.006) * 18;
        ctx.fillStyle = '#5a3a26';
        ctx.fillRect(x - 3, gy - 34, 6, 34);
        ellipse(ctx, x, gy - 48, 26, 22, stage.name === 'CORNFIELD' ? '#c97a2e' : '#4a8a3c');
        ellipse(ctx, x - 16, gy - 38, 14, 11, stage.name === 'CORNFIELD' ? '#d98a3a' : '#5da244');
        ellipse(ctx, x + 16, gy - 38, 14, 11, stage.name === 'CORNFIELD' ? '#d98a3a' : '#5da244');
      }
    }
    if (stage.name === 'FARMYARD') this.drawBarn(ctx, 640 - (dist * 0.35) % 1400);
    if (stage.name === 'CORNFIELD') this.drawCornRows(ctx, dist);
    if (stage.name === 'KITCHEN') this.drawKitchenWall(ctx, dist);
  }

  drawBarn(ctx, x) {
    if (x < -160 || x > VIEW_WIDTH + 40) return;
    ctx.fillStyle = '#a83c2a';
    ctx.fillRect(x, GROUND_Y - 118, 150, 118);
    ctx.fillStyle = '#7e2a1d';
    ctx.beginPath();
    ctx.moveTo(x - 8, GROUND_Y - 118);
    ctx.lineTo(x + 75, GROUND_Y - 168);
    ctx.lineTo(x + 158, GROUND_Y - 118);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3e2c2';
    ctx.fillRect(x + 55, GROUND_Y - 78, 40, 78);
    ctx.strokeStyle = '#f3e2c2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 55, GROUND_Y - 78);
    ctx.lineTo(x + 95, GROUND_Y);
    ctx.moveTo(x + 95, GROUND_Y - 78);
    ctx.lineTo(x + 55, GROUND_Y);
    ctx.stroke();
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(x + 16, GROUND_Y - 100, 24, 24);
    ctx.fillRect(x + 110, GROUND_Y - 100, 24, 24);
  }

  drawCornRows(ctx, dist) {
    ctx.strokeStyle = '#8f5f2e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 9; i += 1) {
      const x = ((i * 130 - dist * 0.5) % 1200 + 1200) % 1200 - 120;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + 8, GROUND_Y - 92);
      ctx.moveTo(x + 14, GROUND_Y - 30);
      ctx.lineTo(x + 34, GROUND_Y - 62);
      ctx.moveTo(x + 14, GROUND_Y - 52);
      ctx.lineTo(x - 6, GROUND_Y - 84);
      ctx.stroke();
      ellipse(ctx, x + 10, GROUND_Y - 66, 7, 16, '#e8b93c');
    }
  }

  drawKitchenWall(ctx, dist) {
    ctx.fillStyle = '#5a3a30';
    ctx.fillRect(0, 190, VIEW_WIDTH, 8);
    for (let i = 0; i < 5; i += 1) {
      const x = ((i * 210 - dist * 0.2) % 1100 + 1100) % 1100 - 80;
      ctx.fillStyle = '#3a2530';
      ctx.fillRect(x, 120, 64, 70);
      ctx.fillStyle = '#c9c9c9';
      ctx.beginPath();
      ctx.arc(x + 32, 196, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a8a8a';
      ctx.beginPath();
      ctx.arc(x + 32, 198, 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGround(ctx, stage, dist) {
    ctx.fillStyle = stage.ground;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, VIEW_HEIGHT - GROUND_Y);
    ctx.fillStyle = stage.groundDark;
    ctx.fillRect(0, GROUND_Y, VIEW_WIDTH, 6);
    // Scrub marks rushing past.
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 14; i += 1) {
      const x = ((i * 97 - dist * 1.0) % 1100 + 1100) % 1100 - 70;
      const y = GROUND_Y + 22 + ((i * 53) % 56);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 34, y);
      ctx.stroke();
    }
    if (stage.name !== 'KITCHEN') {
      ctx.fillStyle = stage.grass;
      for (let i = 0; i < 18; i += 1) {
        const x = ((i * 89 - dist) % 1050 + 1050) % 1050 - 45;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 2);
        ctx.lineTo(x + 4, GROUND_Y - 10);
        ctx.lineTo(x + 8, GROUND_Y + 2);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      for (let x = 0; x < VIEW_WIDTH; x += 76) {
        ctx.fillRect(((x - dist) % 76 + 76) % 76 - 38, GROUND_Y + 30, 2, VIEW_HEIGHT - GROUND_Y - 30);
      }
    }
  }

  drawPickups(ctx, world) {
    for (const p of world.pickups) {
      if (p.taken) continue;
      const y = p.y + Math.sin(p.bob) * 4;
      if (p.kind === 'corn') {
        ctx.save();
        ctx.translate(p.x, y);
        ctx.rotate(0.5);
        ellipse(ctx, 0, 0, 9, 14, '#f7b731');
        ctx.strokeStyle = '#d98a1d';
        ctx.lineWidth = 2;
        for (let r = -1; r <= 1; r += 1) {
          ctx.beginPath();
          ctx.moveTo(r * 5, -10);
          ctx.lineTo(r * 5, 10);
          ctx.stroke();
        }
        ctx.restore();
      } else if (p.kind === 'pie') {
        ctx.save();
        ctx.translate(p.x, y);
        ctx.fillStyle = '#d97b2e';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff8a5c';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.arc(-4, -4, 3, 0, Math.PI * 2);
        ctx.arc(5, 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Golden feather: the shield.
        ctx.save();
        ctx.translate(p.x, y);
        ctx.rotate(Math.sin(p.bob) * 0.2);
        ctx.fillStyle = '#ffd94d';
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 18, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, 12);
        ctx.lineTo(4, -14);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawObstacles(ctx, world) {
    for (const o of world.obstacles) {
      if (o.x < -120 || o.x > VIEW_WIDTH + 120) continue;
      switch (o.kind) {
        case 'fence': this.drawFence(ctx, o); break;
        case 'hay': this.drawHay(ctx, o); break;
        case 'pumpkin': this.drawPumpkin(ctx, o); break;
        case 'puddle': this.drawPuddle(ctx, o); break;
        case 'branch': this.drawBranch(ctx, o); break;
        case 'stalk': this.drawStalk(ctx, o); break;
        case 'scarecrow': this.drawScarecrow(ctx, o); break;
        case 'barrow': this.drawBarrow(ctx, o); break;
        case 'oven': this.drawOven(ctx, o); break;
        case 'knife': this.drawKnife(ctx, o); break;
        case 'pot': this.drawPot(ctx, o); break;
        case 'pin': this.drawPin(ctx, o); break;
        case 'beam': this.drawBeam(ctx, o); break;
        default: break;
      }
    }
  }

  drawFence(ctx, o) {
    ctx.fillStyle = '#8a5a2e';
    ctx.fillRect(o.x, o.y + 8, o.w, 8);
    ctx.fillRect(o.x, o.y + 30, o.w, 8);
    ctx.fillStyle = '#a9743a';
    ctx.fillRect(o.x + 2, o.y, 8, o.h);
    ctx.fillRect(o.x + o.w - 10, o.y, 8, o.h);
  }

  drawHay(ctx, o) {
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath();
    ctx.ellipse(o.x + o.w / 2, o.y + o.h / 2 + 8, o.w / 2, o.h / 2, 0, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#b57f1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2 + 8, o.w / 2 - 6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }

  drawPumpkin(ctx, o) {
    ellipse(ctx, o.x + o.w / 2, o.y + o.h / 2 + 6, o.w / 2, o.h / 2, '#e8802e');
    ctx.strokeStyle = '#b85c14';
    ctx.lineWidth = 2;
    for (const dx of [-12, 0, 12]) {
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2 + dx * 0.5, o.y + o.h / 2 + 6, 5, o.h / 2 - 4, 0, -Math.PI / 2.4, Math.PI / 2.4);
      ctx.stroke();
    }
    ctx.fillStyle = '#5da244';
    ctx.fillRect(o.x + o.w / 2 - 3, o.y - 2, 6, 10);
  }

  drawPuddle(ctx, o) {
    ellipse(ctx, o.x + o.w / 2, o.y + o.h / 2 + 4, o.w / 2, 8, '#4a90c2');
    ellipse(ctx, o.x + o.w / 2 - 12, o.y + 4, 14, 4, 'rgba(255,255,255,0.5)');
  }

  drawBranch(ctx, o) {
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(o.x, o.y, o.w, 12);
    ctx.fillStyle = '#5da244';
    for (let i = 0; i < 4; i += 1) ellipse(ctx, o.x + 8 + i * 18, o.y + 4, 10, 7, '#5da244');
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(o.x + 4, o.y + 12, 6, GROUND_Y - o.y - 12);
    ctx.fillRect(o.x + o.w - 10, o.y + 12, 6, GROUND_Y - o.y - 12);
  }

  drawStalk(ctx, o) {
    ctx.strokeStyle = '#5da244';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(o.x + 15, GROUND_Y);
    ctx.lineTo(o.x + 15, o.y);
    ctx.stroke();
    ellipse(ctx, o.x + 15, o.y + 22, 8, 20, '#e8b93c');
    ellipse(ctx, o.x + 4, o.y + 34, 8, 4, '#6faf4e');
    ellipse(ctx, o.x + 26, o.y + 48, 8, 4, '#6faf4e');
  }

  drawScarecrow(ctx, o) {
    ctx.strokeStyle = '#6e4526';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(o.x + 8, GROUND_Y);
    ctx.lineTo(o.x + 8, o.y + 10);
    ctx.moveTo(o.x - 2, o.y + 34);
    ctx.lineTo(o.x + 34, o.y + 34);
    ctx.stroke();
    ctx.fillStyle = '#7a4a8a';
    ctx.fillRect(o.x + 2, o.y + 26, 28, 34);
    ellipse(ctx, o.x + 16, o.y + 12, 11, 11, '#f3d9a8');
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath();
    ctx.moveTo(o.x - 2, o.y + 8);
    ctx.lineTo(o.x + 34, o.y + 8);
    ctx.lineTo(o.x + 16, o.y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2c1c26';
    ctx.fillRect(o.x + 11, o.y + 9, 3, 3);
    ctx.fillRect(o.x + 19, o.y + 9, 3, 3);
  }

  drawBarrow(ctx, o) {
    ctx.fillStyle = '#8a5a2e';
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + 10);
    ctx.lineTo(o.x + o.w, o.y + 10);
    ctx.lineTo(o.x + o.w - 10, o.y + o.h);
    ctx.lineTo(o.x + 10, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5da244';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x + 6, o.y + 12);
    ctx.lineTo(o.x + o.w - 6, o.y + 12);
    ctx.stroke();
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h + 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c9c9c9';
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h + 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOven(ctx, o) {
    ctx.fillStyle = '#4a4a55';
    roundRect(ctx, o.x, o.y, o.w, o.h, 6);
    ctx.fill();
    ctx.fillStyle = '#1c1c22';
    ctx.fillRect(o.x + 8, o.y + 14, o.w - 16, 34);
    const flick = 0.7 + Math.sin(o.seed * 40 + Date.now() * 0.012) * 0.3;
    ctx.fillStyle = `rgba(255,${Math.floor(120 + 80 * flick)},40,0.95)`;
    ctx.beginPath();
    ctx.moveTo(o.x + 16, o.y + 44);
    ctx.quadraticCurveTo(o.x + 26, o.y + 18 + 10 * flick, o.x + 34, o.y + 44);
    ctx.quadraticCurveTo(o.x + 44, o.y + 22, o.x + 54, o.y + 44);
    ctx.quadraticCurveTo(o.x + 62, o.y + 30, o.x + o.w - 14, o.y + 44);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c9c9c9';
    ctx.fillRect(o.x + 8, o.y + 56, o.w - 16, 5);
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(o.x + 12, o.y + 66, 14, 10);
    ctx.fillRect(o.x + o.w - 26, o.y + 66, 14, 10);
  }

  drawKnife(ctx, o) {
    const swing = Math.sin(o.seed * 20 + Date.now() * 0.006) * 0.5;
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y);
    ctx.rotate(swing);
    // The knife hangs from a short rail mount, so it reads as a kitchen
    // knife swinging from its hook rather than a blade floating in air.
    ctx.fillStyle = '#3a2530';
    ctx.fillRect(-16, -22, 32, 7);
    ctx.fillRect(-2, -22, 4, 10);
    ctx.fillStyle = '#5a3a2e';
    ctx.fillRect(-4, -14, 8, 22);
    ctx.fillStyle = '#e8ecf2';
    ctx.beginPath();
    ctx.moveTo(-11, 8);
    ctx.lineTo(11, 8);
    ctx.lineTo(0, o.h + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#9aa2b0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.lineTo(0, o.h - 4);
    ctx.stroke();
    ctx.restore();
  }

  drawPot(ctx, o) {
    ctx.fillStyle = '#3a3f4a';
    roundRect(ctx, o.x, o.y + 8, o.w, o.h - 8, 8);
    ctx.fill();
    ctx.fillStyle = '#6a707c';
    ctx.fillRect(o.x - 4, o.y + 12, 8, 10);
    ctx.fillRect(o.x + o.w - 4, o.y + 12, 8, 10);
    ctx.fillStyle = '#e8b93c';
    ellipse(ctx, o.x + o.w / 2, o.y + 8, o.w / 2 - 4, 6, '#e8b93c');
  }

  drawPin(ctx, o) {
    const roll = (o.x * 0.05) % (Math.PI * 2);
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2 + 6);
    ctx.rotate(roll);
    ctx.fillStyle = '#d9b98a';
    roundRect(ctx, -o.w / 2, -8, o.w, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#b59a6e';
    ctx.fillRect(-o.w / 2 - 6, -5, 8, 10);
    ctx.fillRect(o.w / 2 - 2, -5, 8, 10);
    ctx.restore();
  }

  drawBeam(ctx, o) {
    ctx.fillStyle = '#8a5a3c';
    ctx.fillRect(o.x, o.y, o.w, 12);
    ctx.fillStyle = '#6e452c';
    ctx.fillRect(o.x, o.y + 12, o.w, 4);
    ctx.fillStyle = '#5a3a30';
    ctx.fillRect(o.x + 6, o.y + 16, 5, GROUND_Y - o.y - 16);
    ctx.fillRect(o.x + o.w - 11, o.y + 16, 5, GROUND_Y - o.y - 16);
  }

  drawParticles(ctx, world) {
    for (const p of world.particles) {
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  drawTurkey(ctx, world) {
    const t = world.turkey;
    const x = t.x;
    const y = t.y;
    const phase = t.runPhase;
    const blink = (world.time % 3.4) < 0.12;
    const scared = world.farmerGap < 80 || t.hurtTimer > 0;
    const legSwing = t.grounded ? Math.sin(phase) * 12 : 6;
    ctx.save();
    if (t.hurtTimer > 0 && Math.floor(world.time * 12) % 2 === 0) ctx.globalAlpha = 0.45;

    if (t.sliding) {
      // Low slide: body flattened and stretched, tail swept back, head low
      // and forward, legs tucked — a turkey limboing under the branch.
      ctx.translate(x + 26, y + 50);
      ctx.rotate(-0.1);
      const tailColors = ['#c65a2e', '#e8802e', '#d9a83c', '#a83c2a'];
      for (let i = 0; i < 4; i += 1) {
        ctx.save();
        ctx.rotate(Math.PI + (i - 1.5) * 0.28);
        ctx.fillStyle = tailColors[i];
        ctx.beginPath();
        ctx.ellipse(-26, 0, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ellipse(ctx, 0, 0, 34, 14, '#8a5a2e');
      ellipse(ctx, -2, 4, 24, 9, '#a9743a');
      ellipse(ctx, 28, -6, 13, 12, '#a9743a');
      ctx.fillStyle = '#f08a1d';
      ctx.beginPath();
      ctx.moveTo(38, -10);
      ctx.lineTo(50, -4);
      ctx.lineTo(38, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#d93a2e';
      ctx.beginPath();
      ctx.ellipse(36, 2, 3, 5, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(30, -10, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c1c26';
      ctx.beginPath();
      ctx.arc(31.5, -10, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e8a33c';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8, 10);
      ctx.lineTo(4, 12);
      ctx.moveTo(6, 10);
      ctx.lineTo(16, 12);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const air = !t.grounded;
    const bob = t.grounded ? Math.sin(phase * 2) * 2 : 0;
    ctx.translate(x + 26, y + 34 + bob);

    // Tail fan, fanned wide and swaying with the run.
    const fanSway = Math.sin(phase * 0.7) * 0.06;
    const featherColors = ['#c65a2e', '#e8802e', '#d9a83c', '#a83c2a', '#e8802e', '#c65a2e', '#d9a83c'];
    for (let i = 0; i < 7; i += 1) {
      const a = -Math.PI / 2 + (i - 3) * 0.3 + fanSway;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = featherColors[i];
      ctx.beginPath();
      ctx.ellipse(-34, 0, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3e2c2';
      ctx.beginPath();
      ctx.ellipse(-46, 0, 5, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Legs, pumping.
    ctx.strokeStyle = '#e8a33c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, 26);
    ctx.lineTo(-6 + legSwing, 34);
    ctx.moveTo(8, 26);
    ctx.lineTo(8 - legSwing, 34);
    ctx.stroke();
    ctx.fillStyle = '#e8a33c';
    ctx.beginPath();
    ctx.moveTo(-6 + legSwing - 5, 34);
    ctx.lineTo(-6 + legSwing + 6, 34);
    ctx.lineTo(-6 + legSwing, 30);
    ctx.closePath();
    ctx.moveTo(8 - legSwing - 5, 34);
    ctx.lineTo(8 - legSwing + 6, 34);
    ctx.lineTo(8 - legSwing, 30);
    ctx.closePath();
    ctx.fill();

    // Body.
    ellipse(ctx, 0, 4, 26, 24, '#8a5a2e');
    ellipse(ctx, -2, 10, 20, 16, '#a9743a');

    // Wing, flapping hard in the air, tucked while running.
    ctx.save();
    ctx.translate(-4, 0);
    ctx.rotate(air ? -0.9 + Math.sin(world.time * 14) * 0.35 : Math.sin(phase) * 0.18);
    ellipse(ctx, -12, -2, 16, 9, '#6e4526');
    ctx.restore();

    // Head, neck, beak, wattle and one very worried eye.
    ellipse(ctx, 16, -26, 8, 16, '#8a5a2e');
    ellipse(ctx, 22, -36, 13, 12, '#a9743a');
    ctx.fillStyle = '#f08a1d';
    ctx.beginPath();
    ctx.moveTo(32, -40);
    ctx.lineTo(44, -35);
    ctx.lineTo(32, -30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#d93a2e';
    ctx.beginPath();
    ctx.ellipse(30, -28, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(24, -39, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2c1c26';
      ctx.beginPath();
      ctx.arc(25.5, -39, scared ? 2.6 : 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#2c1c26';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, -39);
      ctx.lineTo(28, -39);
      ctx.stroke();
    }
    // Little red snood over the beak.
    ctx.fillStyle = '#d93a2e';
    ctx.beginPath();
    ctx.ellipse(33, -44, 3, 5, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Shield shimmer.
    if (world.shield) {
      ctx.strokeStyle = 'rgba(255,243,176,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -2, 46 + Math.sin(world.time * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFarmer(ctx, world) {
    const t = world.turkey;
    const gap = world.farmerGap;
    const x = t.x - gap;
    if (x < -90) return;
    const y = GROUND_Y - 92;
    const phase = t.runPhase * 1.15;
    const legSwing = Math.sin(phase) * 13;
    ctx.save();
    ctx.translate(x, y);
    // Legs in overalls.
    ctx.strokeStyle = '#2e4a7a';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, 58);
    ctx.lineTo(8 + legSwing, 90);
    ctx.moveTo(24, 58);
    ctx.lineTo(24 - legSwing, 90);
    ctx.stroke();
    // Red shirt and overalls.
    ctx.fillStyle = '#c93a2e';
    roundRect(ctx, 0, 22, 34, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#2e4a7a';
    ctx.fillRect(4, 44, 26, 20);
    ctx.fillRect(8, 22, 5, 24);
    ctx.fillRect(21, 22, 5, 24);
    // Arm reaching forward with the pitchfork.
    ctx.strokeStyle = '#c93a2e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(30, 30);
    ctx.lineTo(48, 18);
    ctx.stroke();
    ctx.strokeStyle = '#8a8a8a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(46, 6);
    ctx.lineTo(58, 44);
    ctx.moveTo(52, 2);
    ctx.lineTo(58, 18);
    ctx.moveTo(58, 2);
    ctx.lineTo(62, 18);
    ctx.moveTo(64, 4);
    ctx.lineTo(66, 20);
    ctx.stroke();
    // Head: angry, moustached, straw-hatted.
    ellipse(ctx, 17, 10, 13, 13, '#f3c9a0');
    ctx.fillStyle = '#f3c9a0';
    ctx.beginPath();
    ctx.arc(17, 10, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d9a83c';
    ctx.beginPath();
    ctx.ellipse(17, -2, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(7, -14, 20, 12);
    ctx.fillStyle = '#2c1c26';
    ctx.beginPath();
    ctx.arc(13, 8, 2, 0, Math.PI * 2);
    ctx.arc(22, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c1c26';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, 3);
    ctx.lineTo(16, 5);
    ctx.moveTo(26, 5);
    ctx.lineTo(20, 3);
    ctx.stroke();
    ctx.fillStyle = '#6e4526';
    ctx.fillRect(11, 16, 12, 4);
    // "HEY!" when he is close enough to smell the turkey.
    if (gap < 95) {
      ctx.fillStyle = '#fff';
      roundRect(ctx, 30, -34, 58, 26, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(36, -10);
      ctx.lineTo(30, 0);
      ctx.lineTo(44, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c93a2e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HEY!', 59, -16);
    }
    ctx.restore();
  }

  drawHud(ctx, world, ui) {
    ctx.save();
    // Top bar.
    ctx.fillStyle = 'rgba(44,28,38,0.55)';
    roundRect(ctx, 12, 10, VIEW_WIDTH - 24, 54, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${Math.floor(world.score)}`, 26, 34);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`🌽 ${world.corn}`, 26, 54);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`${world.distanceMeters} m`, VIEW_WIDTH / 2, 32);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`${world.stage.name}  ·  ${ESCAPE_LABEL}`, VIEW_WIDTH / 2, 52);
    // Hearts, drawn as proper hearts.
    ctx.textAlign = 'right';
    for (let i = 0; i < 3; i += 1) {
      const hx = VIEW_WIDTH - 30 - i * 32;
      const hy = 36;
      ctx.fillStyle = i < world.hearts ? '#ff4d6d' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(hx, hy + 8);
      ctx.bezierCurveTo(hx - 13, hy - 3, hx - 7, hy - 12, hx, hy - 5);
      ctx.bezierCurveTo(hx + 7, hy - 12, hx + 13, hy - 3, hx, hy + 8);
      ctx.fill();
    }
    // Farmer proximity: how close the farmer is, label inside its own pill.
    const gapFrac = Math.max(0, Math.min(1, world.farmerGap / 130));
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, VIEW_WIDTH - 268, 70, 254, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('FARMER', VIEW_WIDTH - 260, 82);
    ctx.fillStyle = gapFrac > 0.5 ? '#7ed957' : gapFrac > 0.25 ? '#ffb03a' : '#ff4d4d';
    roundRect(ctx, VIEW_WIDTH - 196, 73, 168 * gapFrac, 10, 5);
    ctx.fill();
    if (world.shield) {
      ctx.fillStyle = '#fff3b0';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🛡 SHIELD!', 26, 88);
    }
    if (ui.muted) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🔇 MUTED (M)', VIEW_WIDTH - 16, 104);
    }
    ctx.restore();
  }

  drawTitle(ctx, world, ui) {
    ctx.save();
    ctx.fillStyle = 'rgba(44,28,38,0.45)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('🦃  THE GREAT TURKEY ESCAPE  🦃', VIEW_WIDTH / 2, 112);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 74px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 12;
    ctx.fillText('GOBBLE DASH', VIEW_WIDTH / 2, 188);
    ctx.shadowBlur = 0;
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', VIEW_WIDTH / 2, 224);
    ctx.fillText('Run 1,500 m through the farmyard, the cornfield and the kitchen —', VIEW_WIDTH / 2, 248);
    ctx.fillText('and make it to the wild woods alive.', VIEW_WIDTH / 2, 272);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PRESS SPACE OR CLICK TO RUN', VIEW_WIDTH / 2, 330);
    if (ui.best > 0) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(`BEST ESCAPE: ${Math.floor(ui.best)} points`, VIEW_WIDTH / 2, 428);
    }
    // Controls sit below the turkey's feet, clear of the bird.
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText('SPACE / ↑ — jump (twice for a double jump)      ↓ / S — slide', VIEW_WIDTH / 2, 466);
    ctx.fillText('🌽 corn +10 · 🥧 pie +50 · 🪶 golden feather = shield ·  P pause ·  M mute', VIEW_WIDTH / 2, 490);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Dodge fences, hay bales, ovens and carving knives. Three hits and you are dinner.', VIEW_WIDTH / 2, 518);
    ctx.restore();
  }

  drawPaused(ctx, ui) {
    ctx.save();
    ctx.fillStyle = 'rgba(44,28,38,0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px sans-serif';
    ctx.fillText('PAUSED', VIEW_WIDTH / 2, 250);
    ctx.font = '18px sans-serif';
    ctx.fillText('Press P or Esc to keep running', VIEW_WIDTH / 2, 292);
    ctx.restore();
  }

  drawCaught(ctx, world, ui) {
    ctx.save();
    ctx.fillStyle = 'rgba(60,10,10,0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6b5e';
    ctx.font = 'bold 64px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('CAUGHT!', VIEW_WIDTH / 2, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText('The farmer got you. Thanksgiving dinner awaits…', VIEW_WIDTH / 2, 196);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`SCORE ${Math.floor(world.score)}    ·    ${world.distanceMeters} m    ·    🌽 ${world.corn}`, VIEW_WIDTH / 2, 252);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText(`Best escape so far: ${Math.floor(ui.best)} points`, VIEW_WIDTH / 2, 288);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_WIDTH / 2, 350);
    ctx.font = '15px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Tip: slide under low branches, double-jump the tall ovens, grab corn to push the farmer back.', VIEW_WIDTH / 2, 500);
    ctx.restore();
  }

  drawEscaped(ctx, world, ui) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,60,30,0.5)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7ed957';
    ctx.font = 'bold 64px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('ESCAPED!', VIEW_WIDTH / 2, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '22px sans-serif';
    ctx.fillText('You made it to the wild woods — free at last, and no longer dinner.', VIEW_WIDTH / 2, 196);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`SCORE ${Math.floor(world.score)}    ·    1,500 m    ·    🌽 ${world.corn}`, VIEW_WIDTH / 2, 252);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#ffe9b8';
    ctx.fillText(`Best escape so far: ${Math.floor(ui.best)} points`, VIEW_WIDTH / 2, 288);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('PRESS R OR CLICK TO RUN AGAIN', VIEW_WIDTH / 2, 350);
    ctx.restore();
  }
}

const ESCAPE_LABEL = 'escape to the wild woods!';
