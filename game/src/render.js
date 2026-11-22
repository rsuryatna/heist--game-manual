// VELVET VAULT — the renderer. One canvas, top-down: dark marble floor, gold-trimmed
// walls, red guard cones and amber camera cones raycast against the walls so they hug
// the corners, warm loot glow, green cover and a glowing getaway door. The HUD (alarm
// meter, loot, tools, objective) is painted on the canvas so it is in every screenshot.
import { ALARM, CAMERA, COLORS, FIELD, GUARD, LOOT, THIEF } from './config.js';
import { DOORS, GALLERY, PILLARS, PLANTS, WALLS } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const HUD_H = 46;

/** Nearest distance along the ray before it hits a wall, a pillar or the range cap. */
function rayDistance(x, y, dx, dy, maxDist) {
  let best = maxDist;
  for (const rect of [...WALLS, ...PILLARS]) {
    const minX = rect.x;
    const maxX = rect.x + rect.w;
    const minY = rect.y;
    const maxY = rect.y + rect.h;
    let tmin = 0;
    let tmax = best;
    if (Math.abs(dx) < 1e-9) {
      if (x < minX || x > maxX) continue;
    } else {
      const inv = 1 / dx;
      let t1 = (minX - x) * inv;
      let t2 = (maxX - x) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (Math.abs(dy) < 1e-9) {
      if (y < minY || y > maxY) continue;
    } else {
      const inv = 1 / dy;
      let t1 = (minY - y) * inv;
      let t2 = (maxY - y) * inv;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (tmin > 0 && tmin < best) best = tmin;
  }
  return best;
}

/** The cone as a fan of ray endpoints, so walls cut it off instead of it bleeding through. */
function conePolygon(ctx, x, y, angle, halfAngle, range, rays = 26) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const d = rayDistance(x, y, Math.cos(a), Math.sin(a), range);
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFloor() {
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Subtle marble checker so the floor reads as tiles, not a void.
    const tile = 64;
    for (let ty = HUD_H; ty < FIELD.height; ty += tile) {
      for (let tx = 0; tx < FIELD.width; tx += tile) {
        if (((tx / tile) + (ty / tile)) % 2 === 0) {
          ctx.fillStyle = COLORS.floorAlt;
          ctx.fillRect(tx, ty, tile, tile);
        }
      }
    }
    // Room tints: the vault room reads colder, the entrance warmer.
    ctx.fillStyle = 'rgba(90, 120, 200, 0.05)';
    ctx.fillRect(18, 66, 1244, 134);
    ctx.fillStyle = 'rgba(240, 200, 90, 0.04)';
    ctx.fillRect(18, 530, 1244, 172);
  }

  function drawWalls() {
    for (const wall of WALLS) {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = COLORS.wallTop;
      ctx.fillRect(wall.x, wall.y, wall.w, 3);
    }
    for (const door of DOORS) {
      if (door.kind === 'vent') {
        ctx.fillStyle = COLORS.vent;
        ctx.fillRect(door.x, door.y - 4, door.w, door.h + 8);
        ctx.fillStyle = '#3a3f4d';
        const slats = Math.max(2, Math.floor((door.w - 8) / 11));
        for (let i = 0; i < slats; i += 1) ctx.fillRect(door.x + 4 + i * 11, door.y - 2, 5, door.h + 4);
        ctx.fillStyle = COLORS.hudDim;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(door.label, door.x + door.w / 2, door.y + 22);
      } else if (door.kind === 'garden') {
        ctx.fillStyle = COLORS.cover;
        ctx.fillRect(door.x, door.y - 4, door.w, door.h + 8);
        ctx.fillStyle = COLORS.coverEdge;
        ctx.fillRect(door.x, door.y - 4, door.w, 3);
        ctx.fillStyle = COLORS.hudDim;
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(door.label, door.x + door.w / 2, door.y + 22);
      }
    }
    for (const pillar of PILLARS) {
      if (pillar.kind === 'case') {
        ctx.fillStyle = '#2a2e3a';
        ctx.fillRect(pillar.x, pillar.y, pillar.w, pillar.h);
        ctx.strokeStyle = COLORS.goldDim;
        ctx.lineWidth = 2;
        ctx.strokeRect(pillar.x + 2, pillar.y + 2, pillar.w - 4, pillar.h - 4);
      } else {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(pillar.x, pillar.y, pillar.w, pillar.h);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(pillar.x, pillar.y, pillar.w, 4);
        ctx.fillRect(pillar.x, pillar.y, 4, pillar.h);
      }
    }
    for (const plant of PLANTS) {
      ctx.fillStyle = COLORS.cover;
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.coverEdge;
      ctx.beginPath();
      ctx.arc(plant.x - 5, plant.y - 4, 8, 0, Math.PI * 2);
      ctx.arc(plant.x + 6, plant.y + 3, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // The getaway door: green and glowing, impossible to miss.
    const exit = GALLERY.exit;
    ctx.fillStyle = COLORS.exit;
    ctx.fillRect(exit.x - 6, exit.y - 6, exit.w + 12, exit.h + 12);
    ctx.fillStyle = COLORS.exitGlow;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#0c2b18';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y - 10);
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.taken) continue;
      if (item.kind === 'star') {
        const pulse = 0.7 + 0.3 * Math.sin(state.time * 3);
        ctx.save();
        ctx.shadowColor = COLORS.gold;
        ctx.shadowBlur = 26 * pulse;
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(item.x - 3, item.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRIMSON STAR', item.x, item.y - 52);
      } else if (item.kind === 'painting') {
        ctx.fillStyle = '#6b4f2a';
        ctx.fillRect(item.x - 16, item.y - 12, 32, 24);
        ctx.fillStyle = '#c9a86a';
        ctx.fillRect(item.x - 12, item.y - 8, 24, 16);
        ctx.fillStyle = '#7a5a2e';
        ctx.fillRect(item.x - 6, item.y - 4, 12, 8);
      } else if (item.kind === 'gold') {
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(item.x - 12, item.y - 6, 24, 12);
        ctx.fillStyle = '#fff3c4';
        ctx.fillRect(item.x - 12, item.y - 6, 24, 4);
      } else if (item.kind === 'coins') {
        ctx.fillStyle = COLORS.gold;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(item.x, item.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawCones(state) {
    for (const cam of state.cameras) {
      if (cam.looped > 0) {
        ctx.fillStyle = 'rgba(120, 120, 120, 0.10)';
        conePolygon(ctx, cam.x, cam.y, cam.angle, CAMERA.coneHalfAngle, CAMERA.coneRange);
        ctx.fill();
        continue;
      }
      ctx.fillStyle = COLORS.cameraCone;
      conePolygon(ctx, cam.x, cam.y, cam.angle, CAMERA.coneHalfAngle, CAMERA.coneRange);
      ctx.fill();
      ctx.strokeStyle = COLORS.cameraConeEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    for (const guard of state.guards) {
      ctx.fillStyle = guard.alerted ? 'rgba(255, 40, 40, 0.30)' : COLORS.cone;
      conePolygon(ctx, guard.x, guard.y, guard.angle, GUARD.coneHalfAngle, GUARD.coneRange);
      ctx.fill();
      ctx.strokeStyle = guard.alerted ? 'rgba(255, 80, 80, 0.8)' : COLORS.coneEdge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawActors(state) {
    // Thrown coins ping on the floor.
    for (const coin of state.thrownCoins) {
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 197, 66, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, 10 + (2.5 - coin.timer) * 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Smoke puffs.
    for (const puff of state.smoke) {
      ctx.fillStyle = COLORS.smoke;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cameras: a small wall mount with a lens.
    for (const cam of state.cameras) {
      ctx.fillStyle = cam.looped > 0 ? '#555' : '#c9a86a';
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = cam.looped > 0 ? '#333' : '#ff5a5a';
      ctx.beginPath();
      ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Guards: dark red, with a cap and a suspicion ring that fills as they notice you.
    for (const guard of state.guards) {
      ctx.fillStyle = guard.alerted ? '#ff3b30' : COLORS.guard;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, guard.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.guardDark;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, guard.radius - 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8e4d8';
      ctx.beginPath();
      ctx.arc(guard.x + Math.cos(guard.angle) * 6, guard.y + Math.sin(guard.angle) * 6, 4, 0, Math.PI * 2);
      ctx.fill();
      if (guard.suspicion > 0.05) {
        ctx.strokeStyle = guard.alerted ? '#ff3b30' : COLORS.gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(guard.x, guard.y, guard.radius + 6, -Math.PI / 2, -Math.PI / 2 + guard.suspicion * Math.PI * 2);
        ctx.stroke();
      }
      if (guard.alerted) {
        ctx.fillStyle = '#ff3b30';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - guard.radius - 8);
      }
    }
    // The thief: pale, dark coat, a cap, and a facing tick. Sneaking crouches them.
    // A bright ring keeps the thief readable against the dark floor at a glance.
    const thief = state.thief;
    const r = thief.sneaking ? thief.radius - 2 : thief.radius;
    ctx.strokeStyle = '#f5f0e0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, r + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = COLORS.thiefCoat;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.thief;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, r - 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.thiefCoat;
    ctx.beginPath();
    ctx.arc(thief.x + Math.cos(thief.angle) * 7, thief.y + Math.sin(thief.angle) * 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    if (thief.grabbing) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(thief.x, thief.y, r + 8, -Math.PI / 2, -Math.PI / 2 + thief.grabProgress * Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawHud(state, screen) {
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, FIELD.width, HUD_H);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VELVET VAULT', 14, 29);
    // Alarm meter.
    const ax = 230;
    const aw = 300;
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ALARM', ax, 18);
    ctx.fillStyle = '#22262f';
    roundRect(ctx, ax, 22, aw, 14, 7);
    ctx.fill();
    const alarmColor = state.alarm < ALARM.warnAt ? COLORS.alarmLow : state.alarm < 70 ? COLORS.alarmMid : COLORS.alarmHigh;
    if (state.alarm > 0) {
      ctx.fillStyle = alarmColor;
      roundRect(ctx, ax, 22, (aw * state.alarm) / 100, 14, 7);
      ctx.fill();
    }
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${Math.round(state.alarm)}%`, ax + aw + 10, 34);
    if (state.lockdown) {
      ctx.fillStyle = COLORS.spotted;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('LOCKDOWN', ax + aw + 52, 34);
    }
    // Loot, tools, time.
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`$${state.lootValue}`, 640, 29);
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '13px sans-serif';
    ctx.fillText(`Coins ${state.thief.coins}   Smoke ${state.thief.smoke}   Loop ${state.thief.loops}`, 760, 29);
    const mm = Math.floor(state.time / 60);
    const ss = Math.floor(state.time % 60).toString().padStart(2, '0');
    ctx.fillText(`${mm}:${ss}`, 1080, 29);
    // Objective.
    ctx.fillStyle = state.hasStar ? COLORS.exitGlow : COLORS.gold;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(state.hasStar ? 'ESCAPE!' : 'STEAL THE STAR', 1266, 29);
    ctx.textAlign = 'left';
    // SPOTTED warning.
    if (state.spotted && screen === SCREEN_PLAY) {
      ctx.fillStyle = COLORS.spotted;
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.spottedBy === 'camera' ? 'CAMERA SPOTTED YOU!' : 'SPOTTED!', FIELD.width / 2, 96);
      ctx.textAlign = 'left';
    }
  }

  function drawOverlay(title, lines, hint) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, FIELD.width / 2, 250);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '20px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 300 + i * 32));
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '16px sans-serif';
    ctx.fillText(hint, FIELD.width / 2, 300 + lines.length * 32 + 30);
    ctx.textAlign = 'left';
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawFloor();
    drawLoot(state);
    drawCones(state);
    drawWalls();
    drawActors(state);
    drawHud(state, screen);
    if (screen === SCREEN_TITLE) {
      drawOverlay('VELVET VAULT', [
        'The Marlowe Gallery, after dark. Steal the Crimson Star',
        'and slip out the exit — past the guards, the cameras,',
        'and the alarm that never forgets.',
      ], 'WASD / arrows move · Shift sneak · E grab & pick · 1 coin · 2 smoke · 3 loop cameras · Enter to play');
      if (best > 0) {
        ctx.fillStyle = COLORS.hudDim;
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Best score: $${best}`, FIELD.width / 2, 500);
        ctx.textAlign = 'left';
      }
    } else if (screen === SCREEN_PAUSED) {
      drawOverlay('PAUSED', ['The gallery waits. The guards do not.'], 'P / Esc resume · R restart');
    } else if (screen === SCREEN_OVER) {
      drawOverlay('CAUGHT', [
        `The guards closed in. Loot kept: $${state.lootValue}.`,
        state.score > 0 ? `Score: $${state.score}.` : 'No score — the Star never left the gallery.',
      ], 'Enter / R to try again');
    } else if (screen === SCREEN_WIN) {
      drawOverlay('CLEAN GETAWAY', [
        `The Crimson Star is yours. Loot: $${state.lootValue}.`,
        `Score: $${state.score}   (best $${Math.max(best, state.score)})`,
      ], 'Enter / R to play again');
    }
  }

  return { draw };
}
