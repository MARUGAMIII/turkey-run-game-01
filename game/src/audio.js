// All sound is synthesized with WebAudio: no audio files, no network.
// A gobble, a jump boop, a coin ding, a thud, a farmer's yell, and a small
// plucky banjo-style loop that keeps the run cheerful.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return true;
  }

  tone(freq, dur, type = 'sine', vol = 0.16, slideTo = null, delay = 0) {
    if (this.muted || !this.ensure()) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  jump() {
    this.tone(320, 0.16, 'sine', 0.14, 640);
  }

  doubleJump() {
    this.tone(420, 0.14, 'triangle', 0.13, 880);
  }

  coin() {
    this.tone(988, 0.09, 'sine', 0.14);
    this.tone(1319, 0.16, 'sine', 0.12, null, 0.07);
  }

  pie() {
    this.tone(523, 0.1, 'triangle', 0.14);
    this.tone(659, 0.1, 'triangle', 0.14, null, 0.08);
    this.tone(784, 0.2, 'triangle', 0.14, null, 0.16);
  }

  hit() {
    this.tone(160, 0.22, 'sawtooth', 0.18, 70);
    this.tone(90, 0.25, 'square', 0.1, 50, 0.02);
  }

  shield() {
    this.tone(740, 0.12, 'sine', 0.12, 1180);
  }

  stageUp() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.12, null, i * 0.09));
  }

  gobble() {
    // A turkey's gobble: four quick descending blips.
    [420, 360, 320, 280].forEach((f, i) => this.tone(f, 0.09, 'square', 0.09, f * 0.7, i * 0.09));
  }

  farmerYell() {
    this.tone(220, 0.3, 'sawtooth', 0.12, 330);
    this.tone(180, 0.28, 'sawtooth', 0.1, 260, 0.05);
  }

  caught() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, null, i * 0.16));
  }

  escaped() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.13, null, i * 0.11));
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopMusic();
    return this.muted;
  }

  startMusic() {
    if (this.musicTimer || this.muted) return;
    if (!this.ensure()) return;
    // A sunny I-V-vi-IV pluck, one eighth-note step at a time.
    const melody = [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 784, 659, 523, 587, 392];
    const bass = [131, 131, 196, 175, 131, 131, 196, 175, 165, 165, 220, 196, 175, 175, 196, 196];
    this.musicTimer = window.setInterval(() => {
      if (this.muted) return;
      const i = this.musicStep % 16;
      this.tone(melody[i], 0.16, 'triangle', 0.05);
      if (i % 2 === 0) this.tone(bass[i], 0.22, 'sine', 0.07);
      this.musicStep += 1;
    }, 190);
  }

  stopMusic() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
