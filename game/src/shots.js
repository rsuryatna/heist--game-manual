// The screenshot scenes behind ?shot=cover|stealth|vault|getaway. Each one plays the
// real rules forward from a fresh world for a fixed script of moves, so the frame is
// what a short game really looks like and the same seed always gives the same frame.
// The script is a list of steps: { t (seconds), dir, sneak, interact, tool, coinX, coinY }.
import { STEP } from './config.js';
import { resetWorld, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SCRIPTS = {
  // The cover: cross the entrance hall into the main hall and pause mid-room, a guard's
  // cone sweeping past, the cameras turning, the Crimson Star glowing in the vault above.
  cover: [
    { t: 1.6, dir: 'up' },
    { t: 0.9, dir: 'left' },
    { t: 1.2, dir: 'none' },
  ],
  // Stealth: slip right along the main hall and hold behind the centre pillar while a
  // guard's cone sweeps the floor where the thief just stood.
  stealth: [
    { t: 1.6, dir: 'up' },
    { t: 1.1, dir: 'right' },
    { t: 0.6, dir: 'up' },
    { t: 1.4, dir: 'none' },
  ],
  // The vault: vent route up the left side, a coin to lure the vault guard away, the
  // cameras looped, then sneak in low under the guard's cone and pick the lock.
  vault: [
    { t: 2.4, dir: 'left' },
    { t: 2.3, dir: 'up' },
    { t: 0.1, dir: 'none', tool: 'coin', coinX: 450, coinY: 130 },
    { t: 1.0, dir: 'none' },
    { t: 0.1, dir: 'none', tool: 'loop' },
    { t: 1.0, dir: 'right', sneak: true },
    { t: 0.3, dir: 'down' },
    { t: 1.9, dir: 'right' },
    { t: 0.15, dir: 'up' },
    { t: 2.2, dir: 'none', interact: true },
  ],
  // The getaway: take the Star (as in vault), drop smoke, then run for the exit —
  // the frame catches the thief in the entrance hall, Star in hand, alarm climbing.
  getaway: [
    { t: 2.4, dir: 'left' },
    { t: 2.3, dir: 'up' },
    { t: 0.1, dir: 'none', tool: 'coin', coinX: 450, coinY: 130 },
    { t: 1.0, dir: 'none' },
    { t: 0.1, dir: 'none', tool: 'loop' },
    { t: 1.0, dir: 'right', sneak: true },
    { t: 0.3, dir: 'down' },
    { t: 1.9, dir: 'right' },
    { t: 0.15, dir: 'up' },
    { t: 2.2, dir: 'none', interact: true },
    { t: 0.1, dir: 'none', tool: 'smoke' },
    { t: 1.7, dir: 'down' },
  ],
};

function inputFor(step, firstFrame) {
  const input = {
    up: false, down: false, left: false, right: false,
    sneak: !!step.sneak, interact: !!step.interact,
    coin: false, smoke: false, loop: false,
    coinX: 0, coinY: 0,
  };
  if (step.dir === 'up') input.up = true;
  if (step.dir === 'down') input.down = true;
  if (step.dir === 'left') input.left = true;
  if (step.dir === 'right') input.right = true;
  if (firstFrame && step.tool === 'coin') { input.coin = true; input.coinX = step.coinX; input.coinY = step.coinY; }
  if (firstFrame && step.tool === 'smoke') input.smoke = true;
  if (firstFrame && step.tool === 'loop') input.loop = true;
  return input;
}

/**
 * Set `world` to the named scene (cover, stealth, vault or getaway; any other name
 * is cover) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  const script = SCRIPTS[name] || SCRIPTS.cover;
  resetWorld(world);
  for (const step of script) {
    const frames = Math.round(step.t / STEP);
    for (let i = 0; i < frames; i += 1) {
      // A tool fires once, on the step's first frame; holding it would spend it every frame.
      const input = inputFor(step, i === 0);
      stepWorld(world, STEP, input);
      if (world.state.won || world.state.lost) return { screen: world.state.won ? SCREEN_WIN : SCREEN_OVER, best: 0 };
    }
  }
  return { screen: SCREEN_PLAY, best: 0 };
}

export function stageTitle(world) {
  resetWorld(world);
  return { screen: SCREEN_TITLE, best: 0 };
}
