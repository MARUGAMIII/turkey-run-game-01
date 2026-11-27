// Keyboard and mouse input. Jump is an edge (one press, one jump, even
// held), slide is a hold. Clicking or tapping the canvas jumps too, so the
// game plays with a mouse alone as well as with keys.
export class Input {
  constructor(canvas) {
    this.jumpQueued = false;
    this.slideHeld = false;
    this.anyKey = null;
    this.onKey = null;
    this.onPointer = null;
    window.addEventListener('keydown', (event) => {
      if (event.repeat) return;
      const key = event.key;
      if (key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W') {
        this.jumpQueued = true;
        event.preventDefault();
      } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
        this.slideHeld = true;
        event.preventDefault();
      }
      if (this.onKey) this.onKey(key);
    });
    window.addEventListener('keyup', (event) => {
      const key = event.key;
      if (key === 'ArrowDown' || key === 's' || key === 'S') this.slideHeld = false;
    });
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (this.onPointer) this.onPointer(event);
      else this.jumpQueued = true;
    });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  /** Take the queued jump, if any, and clear it. */
  takeJump() {
    const jumped = this.jumpQueued;
    this.jumpQueued = false;
    return jumped;
  }

  clear() {
    this.jumpQueued = false;
    this.slideHeld = false;
  }
}
