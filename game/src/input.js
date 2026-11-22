// VELVET VAULT — keyboard and mouse input. WASD or arrows move, Shift sneaks, E
// interacts, 1 throws a coin at the mouse, 2 drops smoke, 3 loops the cameras.
// Edge-triggered actions (coin, smoke, loop, confirm, pause) fire once per press;
// held keys (movement, sneak, interact) read every frame.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';

const MOVE_KEYS = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
};

export function createInput(canvas) {
  const held = { up: false, down: false, left: false, right: false, sneak: false, interact: false };
  const pressed = new Set();
  const mouse = { x: FIELD.width / 2, y: FIELD.height / 2, clicked: false };

  function onKeyDown(event) {
    if (MOVE_KEYS[event.code]) {
      held[MOVE_KEYS[event.code]] = true;
      event.preventDefault();
      return;
    }
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') { held.sneak = true; return; }
    if (event.code === 'KeyE') { held.interact = true; return; }
    if (event.code === 'Enter' || event.code === 'Space') { pressed.add(ACTION_CONFIRM); event.preventDefault(); return; }
    if (event.code === 'KeyP' || event.code === 'Escape') { pressed.add(ACTION_PAUSE); return; }
    if (event.code === 'KeyR') { pressed.add(ACTION_RESTART); return; }
    if (event.code === 'Digit1') { pressed.add('coin'); return; }
    if (event.code === 'Digit2') { pressed.add('smoke'); return; }
    if (event.code === 'Digit3') { pressed.add('loop'); return; }
  }

  function onKeyUp(event) {
    if (MOVE_KEYS[event.code]) held[MOVE_KEYS[event.code]] = false;
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = false;
    if (event.code === 'KeyE') held.interact = false;
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
    mouse.y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
  }

  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    /** The held state for this frame, plus one-shot actions consumed on read. */
    read() {
      const actions = {
        up: held.up, down: held.down, left: held.left, right: held.right,
        sneak: held.sneak, interact: held.interact,
        coin: pressed.has('coin') || mouse.clicked,
        smoke: pressed.has('smoke'),
        loop: pressed.has('loop'),
        confirm: pressed.has(ACTION_CONFIRM),
        pause: pressed.has(ACTION_PAUSE),
        restart: pressed.has(ACTION_RESTART),
        coinX: mouse.x, coinY: mouse.y,
      };
      pressed.clear();
      mouse.clicked = false;
      return actions;
    },
  };
}
