// VELVET VAULT — the simulation. One world, fixed 1/60 s steps, fully deterministic
// for a given input: guards patrol fixed routes, cameras sweep on a clock, and the
// only randomness is the seed at creation. The thief sneaks, grabs loot, throws
// tools; guards watch cones and chase when alerted; cameras feed the alarm; the
// alarm at 100 means lockdown and every guard converges.
import { ALARM, CAMERA, FIELD, GUARD, LOOT, THIEF, TOOLS } from './config.js';
import { CAMERAS, GALLERY, GUARD_PATROLS, LOOT as LOOT_DEFS, PILLARS, WALLS } from './levels.js';

export const EVENT_CAUGHT = 1;
export const EVENT_WIN = 2;
export const EVENT_STAR = 4;

const SOLIDS = [...WALLS, ...PILLARS];

/** True when the circle (x, y, r) overlaps the rectangle. */
function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

/** True when the segment crosses the rectangle (either end inside, or an edge crossed). */
function segmentHitsRect(x1, y1, x2, y2, rect) {
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const edges = [
    [rect.x, rect.y, rect.x + rect.w, rect.y],
    [rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h],
    [rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h],
    [rect.x, rect.y + rect.h, rect.x, rect.y],
  ];
  for (const [ax, ay, bx, by] of edges) {
    const d = (x2 - x1) * (by - ay) - (y2 - y1) * (bx - ax);
    if (d === 0) continue;
    const t = ((ax - x1) * (by - ay) - (ay - y1) * (bx - ax)) / d;
    const u = ((ax - x1) * (y2 - y1) - (ay - y1) * (x2 - x1)) / d;
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
  }
  return false;
}

/** True when the segment passes through the circle. */
function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  const ex = px - cx;
  const ey = py - cy;
  return ex * ex + ey * ey < r * r;
}

/** Clear line of sight between two points: no wall or pillar in the way. */
function lineOfSight(x1, y1, x2, y2) {
  for (const rect of SOLIDS) {
    if (segmentHitsRect(x1, y1, x2, y2, rect)) return false;
  }
  return true;
}

/** Move a circle by (dx, dy), sliding along walls instead of sticking. */
function moveCircle(body, dx, dy) {
  const nx = body.x + dx;
  let blocked = false;
  for (const rect of SOLIDS) {
    if (circleHitsRect(nx, body.y, body.radius, rect)) { blocked = true; break; }
  }
  if (!blocked) body.x = nx;
  const ny = body.y + dy;
  blocked = false;
  for (const rect of SOLIDS) {
    if (circleHitsRect(body.x, ny, body.radius, rect)) { blocked = true; break; }
  }
  if (!blocked) body.y = ny;
  body.x = Math.max(GALLERY.bounds.x + body.radius, Math.min(GALLERY.bounds.x + GALLERY.bounds.w - body.radius, body.x));
  body.y = Math.max(GALLERY.bounds.y + body.radius, Math.min(GALLERY.bounds.y + GALLERY.bounds.h - body.radius, body.y));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

/** True when the viewer can see the thief: in range, in the cone, line of sight, no smoke. */
function canSee(viewer, coneHalf, coneRange, thief, smoke) {
  const dx = thief.x - viewer.x;
  const dy = thief.y - viewer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > coneRange) return false;
  if (Math.abs(angleDiff(angleTo(viewer.x, viewer.y, thief.x, thief.y), viewer.angle)) > coneHalf) return false;
  if (!lineOfSight(viewer.x, viewer.y, thief.x, thief.y)) return false;
  for (const puff of smoke) {
    if (segmentHitsCircle(viewer.x, viewer.y, thief.x, thief.y, puff.x, puff.y, puff.radius)) return false;
  }
  return true;
}

export function createWorld() {
  const state = {
    time: 0,
    alarm: 0,
    lootValue: 0,
    hasStar: false,
    score: 0,
    won: false,
    lost: false,
    lockdown: false,
    spotted: false,
    spottedBy: '',
    thief: {
      x: GALLERY.thiefStart.x, y: GALLERY.thiefStart.y, radius: THIEF.radius,
      angle: -Math.PI / 2, sneaking: false, moving: false,
      pickProgress: 0, grabProgress: 0, grabbing: null,
      coins: TOOLS.startCoins, smoke: 1, loops: 1,
    },
    guards: GUARD_PATROLS.map((patrol) => ({
      x: patrol.waypoints[patrol.start][0], y: patrol.waypoints[patrol.start][1],
      radius: GUARD.radius, angle: 0, waypoint: (patrol.start + 1) % patrol.waypoints.length,
      waypoints: patrol.waypoints, suspicion: 0, state: 'patrol',
      targetX: 0, targetY: 0, searchTimer: 0, alerted: false,
    })),
    cameras: CAMERAS.map((cam) => ({
      x: cam.x, y: cam.y, angle: cam.baseAngle, baseAngle: cam.baseAngle,
      sweepDir: 1, looped: 0, sees: false,
    })),
    loot: LOOT_DEFS.map((item) => ({ ...item, taken: false })),
    smoke: [],
    thrownCoins: [],
  };
  return { state };
}

/** The nearest loot the thief can interact with (within reach), or null. */
function nearestLoot(state) {
  const thief = state.thief;
  let best = null;
  let bestDist = 68;
  for (const item of state.loot) {
    if (item.taken || item.kind === 'coins') continue;
    const d = Math.hypot(item.x - thief.x, item.y - thief.y);
    if (d < bestDist) { bestDist = d; best = item; }
  }
  return best;
}

/**
 * Advance the world one fixed step. `input` is { up, down, left, right, sneak,
 * interact, coin, smoke, loop, coinX, coinY }. Returns an event bitmask.
 */
export function stepWorld(world, dt, input) {
  const state = world.state;
  if (state.won || state.lost) return 0;
  state.time += dt;
  const thief = state.thief;
  let events = 0;

  // --- The thief moves. ---
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const moving = mx !== 0 || my !== 0;
  thief.moving = moving;
  thief.sneaking = !!input.sneak;
  if (moving) {
    const len = Math.hypot(mx, my);
    mx /= len; my /= len;
    thief.angle = Math.atan2(my, mx);
    const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.speed;
    moveCircle(thief, mx * speed * dt, my * speed * dt);
  }

  // --- Tools. ---
  if (input.coin && thief.coins >= TOOLS.coinCost) {
    thief.coins -= TOOLS.coinCost;
    const tx = input.coinX ?? thief.x;
    const ty = input.coinY ?? thief.y;
    const dist = Math.hypot(tx - thief.x, ty - thief.y);
    const cl = Math.min(dist, TOOLS.coinRange);
    const a = Math.atan2(ty - thief.y, tx - thief.x);
    state.thrownCoins.push({ x: thief.x + Math.cos(a) * cl, y: thief.y + Math.sin(a) * cl, timer: 2.5 });
    for (const guard of state.guards) {
      const gd = Math.hypot(guard.x - (thief.x + Math.cos(a) * cl), guard.y - (thief.y + Math.sin(a) * cl));
      if (gd < TOOLS.coinHearRadius && !guard.alerted) {
        guard.state = 'investigate';
        guard.targetX = thief.x + Math.cos(a) * cl;
        guard.targetY = thief.y + Math.sin(a) * cl;
      }
    }
  }
  if (input.smoke && thief.smoke > 0) {
    thief.smoke -= 1;
    state.smoke.push({ x: thief.x, y: thief.y, radius: TOOLS.smokeRadius, timer: TOOLS.smokeSeconds });
  }
  if (input.loop && thief.loops > 0) {
    thief.loops -= 1;
    for (const cam of state.cameras) cam.looped = TOOLS.loopSeconds;
  }
  for (const puff of state.smoke) puff.timer -= dt;
  state.smoke = state.smoke.filter((puff) => puff.timer > 0);
  for (const coin of state.thrownCoins) coin.timer -= dt;
  state.thrownCoins = state.thrownCoins.filter((coin) => coin.timer > 0);

  // --- Loot: coins are pocketed on touch; the rest needs holding E. ---
  for (const item of state.loot) {
    if (item.taken) continue;
    if (item.kind === 'coins' && Math.hypot(item.x - thief.x, item.y - thief.y) < thief.radius + 18) {
      item.taken = true;
      thief.coins += item.value;
    }
  }
  const target = nearestLoot(state);
  if (input.interact && target) {
    const need = target.kind === 'star' ? THIEF.pickSeconds : THIEF.grabSeconds;
    thief.grabbing = target;
    thief.grabProgress += dt / need;
    if (thief.grabProgress >= 1) {
      target.taken = true;
      thief.grabProgress = 0;
      thief.grabbing = null;
      state.lootValue += target.value;
      if (target.kind === 'star') {
        state.hasStar = true;
        events |= EVENT_STAR;
      }
    }
  } else {
    thief.grabbing = null;
    thief.grabProgress = 0;
  }

  // --- Cameras sweep; a camera that sees the thief feeds the alarm. ---
  let cameraSees = false;
  for (const cam of state.cameras) {
    if (cam.looped > 0) {
      cam.looped -= dt;
      cam.sees = false;
      continue;
    }
    cam.angle += CAMERA.sweepSpeed * cam.sweepDir * dt;
    if (cam.angle > cam.baseAngle + CAMERA.sweepArc) { cam.angle = cam.baseAngle + CAMERA.sweepArc; cam.sweepDir = -1; }
    if (cam.angle < cam.baseAngle - CAMERA.sweepArc) { cam.angle = cam.baseAngle - CAMERA.sweepArc; cam.sweepDir = 1; }
    cam.sees = canSee(cam, CAMERA.coneHalfAngle, CAMERA.coneRange, thief, state.smoke);
    if (cam.sees) cameraSees = true;
  }

  // --- Guards: patrol, investigate sounds, chase when alerted. ---
  let guardAlerted = false;
  let anySees = cameraSees;
  for (const guard of state.guards) {
    const sees = canSee(guard, GUARD.coneHalfAngle, GUARD.coneRange, thief, state.smoke);
    if (sees) {
      anySees = true;
      const rate = thief.sneaking ? THIEF.seenSneak : THIEF.seenWalk;
      guard.suspicion = Math.min(1, guard.suspicion + GUARD.suspicionRate * rate * dt);
      if (guard.suspicion >= 1 && !guard.alerted) {
        guard.alerted = true;
        guard.state = 'chase';
      }
      if (guard.alerted) {
        guard.targetX = thief.x;
        guard.targetY = thief.y;
        guard.searchTimer = GUARD.searchSeconds;
      }
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
    }
    if (guard.alerted) guardAlerted = true;

    if (guard.state === 'patrol') {
      const wp = guard.waypoints[guard.waypoint];
      const d = Math.hypot(wp[0] - guard.x, wp[1] - guard.y);
      if (d < 6) {
        guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
      } else {
        const a = angleTo(guard.x, guard.y, wp[0], wp[1]);
        guard.angle = a;
        moveCircle(guard, Math.cos(a) * GUARD.patrolSpeed * dt, Math.sin(a) * GUARD.patrolSpeed * dt);
      }
    } else if (guard.state === 'investigate') {
      const d = Math.hypot(guard.targetX - guard.x, guard.targetY - guard.y);
      if (d < 10) {
        // Arrived: stand and stare at where the noise came from, swaying only a
        // little, for a while before resuming the patrol. This is the thief's
        // window — a distracted guard is a beaten guard.
        guard.state = 'look';
        guard.lookTimer = 4;
        guard.lookBase = guard.angle;
      } else {
        const a = angleTo(guard.x, guard.y, guard.targetX, guard.targetY);
        guard.angle = a;
        moveCircle(guard, Math.cos(a) * GUARD.investigateSpeed * dt, Math.sin(a) * GUARD.investigateSpeed * dt);
      }
    } else if (guard.state === 'look') {
      // Stare at where the noise came from, swaying only a little: the guard is
      // distracted, not scanning the whole room. This is the thief's window.
      guard.lookTimer -= dt;
      guard.angle = guard.lookBase + Math.sin((3 - guard.lookTimer) * 1.4) * 0.4;
      if (guard.lookTimer <= 0) guard.state = 'patrol';
    } else if (guard.state === 'chase') {
      const d = Math.hypot(guard.targetX - guard.x, guard.targetY - guard.y);
      if (!sees) {
        guard.searchTimer -= dt;
        if (guard.searchTimer <= 0) {
          guard.alerted = false;
          guard.suspicion = 0.4;
          guard.state = 'patrol';
        }
      }
      if (d > 8) {
        const a = angleTo(guard.x, guard.y, guard.targetX, guard.targetY);
        guard.angle = a;
        moveCircle(guard, Math.cos(a) * GUARD.chaseSpeed * dt, Math.sin(a) * GUARD.chaseSpeed * dt);
      }
      if (Math.hypot(thief.x - guard.x, thief.y - guard.y) < GUARD.catchRadius) {
        state.lost = true;
        events |= EVENT_CAUGHT;
        return events;
      }
    }
  }

  // --- The alarm: climbs while seen, falls while hidden. At 100, lockdown. ---
  if (guardAlerted) state.alarm = Math.min(100, state.alarm + ALARM.guardRate * dt);
  if (cameraSees) state.alarm = Math.min(100, state.alarm + ALARM.cameraRate * dt);
  if (!guardAlerted && !cameraSees) state.alarm = Math.max(0, state.alarm - ALARM.decayRate * dt);
  state.spotted = anySees;
  state.spottedBy = cameraSees ? 'camera' : guardAlerted ? 'guard' : anySees ? 'guard' : '';
  if (state.alarm >= 100 && !state.lockdown) {
    state.lockdown = true;
    for (const guard of state.guards) {
      guard.alerted = true;
      guard.state = 'chase';
      guard.targetX = thief.x;
      guard.targetY = thief.y;
      guard.searchTimer = GUARD.searchSeconds;
    }
  }

  // --- Win: the star in hand and the thief out the getaway door. ---
  if (state.hasStar) {
    const exit = GALLERY.exit;
    if (thief.x > exit.x - 10 && thief.x < exit.x + exit.w + 10 && thief.y > exit.y - 24 && thief.y < exit.y + exit.h + 10) {
      state.won = true;
      const clean = LOOT.cleanBonus * (1 - state.alarm / 100);
      const timeBonus = LOOT.timeBonus * Math.max(0, 1 - state.time / LOOT.timePar);
      state.score = Math.round(state.lootValue + clean + timeBonus);
      events |= EVENT_WIN;
    }
  }
  return events;
}

export function resetWorld(world) {
  const fresh = createWorld();
  world.state = fresh.state;
}
