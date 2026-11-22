// The Marlowe Gallery — one floor, three rooms, three ways in.
// The whole gallery fits the 1280x720 field, so the thief, the guards, the cameras,
// the loot and the alarm meter are all visible in a single frame. Walls are
// axis-aligned rectangles; doors are simply gaps between wall segments.
//
// Rooms (top to bottom):
//   Vault room   y 56-200   — the Crimson Star, one guard, one camera.
//   Main hall    y 210-520  — pillars for cover, paintings, gold, two guards, two cameras.
//   Entrance     y 530-712  — where the thief enters and where the getaway is.
// Three routes join the rooms: the main doors (centre, watched), the vent (left,
// narrow, unwatched) and the garden arch (right, watched by a camera only).

export const GALLERY = {
  // Playable bounds inside the outer walls.
  bounds: { x: 18, y: 66, w: 1244, h: 636 },
  thiefStart: { x: 640, y: 660 },
  // The getaway doorway, bottom centre. Reach it with the Crimson Star to win.
  exit: { x: 600, y: 696, w: 80, h: 16 },
};

export const WALLS = [
  // Outer border.
  { x: 8, y: 56, w: 1264, h: 10 },
  { x: 8, y: 702, w: 1264, h: 10 },
  { x: 8, y: 56, w: 10, h: 656 },
  { x: 1262, y: 56, w: 10, h: 656 },
  // Vault room / main hall wall (y 200), gaps: vent 50-130, main 600-680, garden 1150-1210.
  { x: 8, y: 200, w: 42, h: 10 },
  { x: 130, y: 200, w: 470, h: 10 },
  { x: 680, y: 200, w: 470, h: 10 },
  { x: 1210, y: 200, w: 62, h: 10 },
  // Main hall / entrance wall (y 520), same three gaps.
  { x: 8, y: 520, w: 42, h: 10 },
  { x: 130, y: 520, w: 470, h: 10 },
  { x: 680, y: 520, w: 470, h: 10 },
  { x: 1210, y: 520, w: 62, h: 10 },
];

/** Pillars and plinths: solid cover that blocks movement and sight. */
export const PILLARS = [
  { x: 280, y: 300, w: 60, h: 60, kind: 'pillar' },
  { x: 940, y: 300, w: 60, h: 60, kind: 'pillar' },
  { x: 760, y: 430, w: 60, h: 60, kind: 'pillar' },
  // The vault display case: the Crimson Star sits on it.
  { x: 600, y: 100, w: 80, h: 56, kind: 'case' },
];

/** The three doorways, drawn distinctly so the routes read at a glance. */
export const DOORS = [
  { x: 50, y: 200, w: 80, h: 10, kind: 'vent', label: 'VENT' },
  { x: 50, y: 520, w: 80, h: 10, kind: 'vent', label: 'VENT' },
  { x: 1150, y: 200, w: 60, h: 10, kind: 'garden', label: 'GARDEN' },
  { x: 1150, y: 520, w: 60, h: 10, kind: 'garden', label: 'GARDEN' },
  { x: 600, y: 200, w: 80, h: 10, kind: 'main', label: '' },
  { x: 600, y: 520, w: 80, h: 10, kind: 'main', label: '' },
];

/** Guards: a patrol loop of waypoints and the waypoint they start at. */
export const GUARD_PATROLS = [
  { waypoints: [[520, 160], [760, 160]], start: 0 }, // vault room
  { waypoints: [[250, 290], [250, 470], [450, 470], [450, 290]], start: 0 }, // main hall, left
  { waypoints: [[1030, 290], [1030, 470], [830, 470], [830, 290]], start: 2 }, // main hall, right
  { waypoints: [[500, 620], [780, 620]], start: 1 }, // entrance hall
];

/** Cameras: fixed on a wall, sweeping a cone around a base angle (radians). */
export const CAMERAS = [
  { x: 640, y: 72, baseAngle: Math.PI / 2 }, // vault room, looks down
  { x: 200, y: 222, baseAngle: Math.PI / 2 }, // main hall, left
  { x: 1080, y: 222, baseAngle: Math.PI / 2 }, // main hall, right
  { x: 1080, y: 688, baseAngle: -Math.PI * 0.75 }, // entrance hall, looks up-left
];

/** Loot: the star (required), paintings and gold (bonus), coins (tool currency). */
export const LOOT = [
  { kind: 'star', x: 640, y: 128, value: 1000, label: 'CRIMSON STAR' },
  { kind: 'painting', x: 44, y: 300, value: 150, label: 'PORTRAIT' },
  { kind: 'painting', x: 1236, y: 300, value: 150, label: 'LANDSCAPE' },
  { kind: 'painting', x: 900, y: 232, value: 150, label: 'STILL LIFE' },
  { kind: 'gold', x: 200, y: 470, value: 100, label: 'GOLD BARS' },
  { kind: 'gold', x: 1080, y: 470, value: 100, label: 'GOLD BARS' },
  { kind: 'coins', x: 150, y: 350, value: 2, label: '+2 COINS' },
  { kind: 'coins', x: 1130, y: 350, value: 2, label: '+2 COINS' },
];

/** Decorative plants in the garden corners and by the entrance. */
export const PLANTS = [
  { x: 1180, y: 250 },
  { x: 1180, y: 470 },
  { x: 1180, y: 580 },
  { x: 90, y: 250 },
  { x: 90, y: 470 },
];
