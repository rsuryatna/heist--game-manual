// VELVET VAULT — boot and the one loop: input is read every frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between five screens: title, play, paused,
// game over and win.
//
// ?seed=N fixes the random pattern. ?shot=cover|stealth|vault|getaway (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createWorld, EVENT_CAUGHT, EVENT_WIN, resetWorld, stepWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot, stageTitle } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
// The backing store must match the logical field, or the browser stretches a
// 300x150 default and the drawing comes out zoomed and cropped.
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

let best = readBest();
let screen = SCREEN_TITLE;
let accumulator = 0;
let lastTime = 0;

function setStatus(text) {
  status.textContent = text;
}

function startGame() {
  resetWorld(world);
  screen = SCREEN_PLAY;
  setStatus('Steal the Crimson Star, then escape through the exit.');
}

function frame(time) {
  requestAnimationFrame(frame);
  const dt = Math.min(MAX_FRAME, (time - lastTime) / 1000 || 0);
  lastTime = time;
  const actions = input.read();

  if (screen === SCREEN_TITLE) {
    if (actions.confirm) startGame();
  } else if (screen === SCREEN_PLAY) {
    if (actions.pause) {
      screen = SCREEN_PAUSED;
      setStatus('Paused.');
    } else if (actions.restart) {
      startGame();
    } else {
      accumulator += dt;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = stepWorld(world, STEP, actions);
        if (events & EVENT_WIN) {
          screen = SCREEN_WIN;
          if (world.state.score > best) { best = world.state.score; saveBest(best); }
          setStatus(`Clean getaway! Score $${world.state.score}.`);
        } else if (events & EVENT_CAUGHT) {
          screen = SCREEN_OVER;
          setStatus('Caught by the guards.');
        }
        if (screen !== SCREEN_PLAY) break;
      }
    }
  } else if (screen === SCREEN_PAUSED) {
    if (actions.pause || actions.confirm) screen = SCREEN_PLAY;
    else if (actions.restart) startGame();
  } else if (screen === SCREEN_OVER || screen === SCREEN_WIN) {
    if (actions.confirm || actions.restart) startGame();
  }

  renderer.draw(world.state, screen, best);
}

// A staged shot: run the script, paint twice, and signal the screenshot runner.
if (shot) {
  const staged = stageShot(shot, world);
  screen = staged.screen;
  renderer.draw(world.state, screen, best);
  renderer.draw(world.state, screen, best);
  window.__shotReady = true;
} else {
  stageTitle(world);
  screen = SCREEN_TITLE;
  setStatus('VELVET VAULT — steal the Crimson Star and escape.');
  requestAnimationFrame(frame);
}

// Test hook: lets a Playwright run read the live state (position, alarm, loot, screen).
window.__velvet = {
  world,
  screen: () => screen,
  best: () => best,
  state: () => ({
    x: world.state.thief.x,
    y: world.state.thief.y,
    alarm: world.state.alarm,
    loot: world.state.lootValue,
    hasStar: world.state.hasStar,
    won: world.state.won,
    lost: world.state.lost,
    coins: world.state.thief.coins,
    guards: world.state.guards.map((g) => ({ x: Math.round(g.x), y: Math.round(g.y), suspicion: +g.suspicion.toFixed(2), state: g.state })),
    cameras: world.state.cameras.map((c) => ({ sees: c.sees, looped: +(c.looped).toFixed(1) })),
  }),
};
