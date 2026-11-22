// VELVET VAULT — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size. The whole gallery fits on
// one screen, so the thief, the guards, the cameras, the loot and the alarm meter
// are all visible in a single frame.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const BEST_KEY = 'velvet-vault-best';

/** The thief: a circle that moves, sneaks, grabs loot and throws tools. */
export const THIEF = {
  radius: 13,
  speed: 235,
  sneakSpeed: 125,
  /** How fast a guard's suspicion rises when the thief is seen walking vs sneaking. */
  seenWalk: 1.0,
  seenSneak: 0.45,
  /** How long (seconds) holding E near the vault case takes to pick its lock. */
  pickSeconds: 2.0,
  /** How long (seconds) holding E near a painting or gold takes to pocket it. */
  grabSeconds: 0.7,
};

/** A guard: patrols waypoints, watches a cone, investigates sounds, chases when alerted. */
export const GUARD = {
  radius: 14,
  patrolSpeed: 72,
  chaseSpeed: 165,
  investigateSpeed: 120,
  /** Vision cone: half-angle and range, in radians and pixels. */
  coneHalfAngle: 0.52,
  coneRange: 235,
  /** Suspicion rises this much per second while the thief is seen (scaled by THIEF.seen*). */
  suspicionRate: 0.9,
  /** Suspicion falls this much per second while the thief is out of sight. */
  suspicionDecay: 0.55,
  /** How close (pixels) a guard must get to the thief to catch them while alerted. */
  catchRadius: 26,
  /** After losing sight of the thief, a chasing guard searches this long before resuming patrol. */
  searchSeconds: 4,
};

/** A wall camera: fixed, sweeps its cone back and forth, feeds the alarm directly. */
export const CAMERA = {
  coneHalfAngle: 0.5,
  coneRange: 260,
  /** Degrees per second the cone sweeps, one way. */
  sweepSpeed: 0.55,
  /** How far (radians) either side of its base angle the cone sweeps. */
  sweepArc: 0.9,
};

/** The alarm meter: 0 quiet, 100 lockdown. */
export const ALARM = {
  /** Per second while any guard is alerted. */
  guardRate: 7,
  /** Per second while any camera sees the thief. */
  cameraRate: 11,
  /** Per second it falls while nothing sees the thief. */
  decayRate: 3.5,
  /** At this level the "SPOTTED!" warning shows and the alarm starts climbing fast. */
  warnAt: 35,
};

/** Tools. Coins are the currency: the thief starts with some and finds more. */
export const TOOLS = {
  startCoins: 4,
  coinCost: 1,
  smokeCost: 2,
  loopCost: 2,
  /** How far a thrown coin flies and how far its sound carries. */
  coinRange: 320,
  coinHearRadius: 260,
  /** Smoke: radius and how long it blocks vision. */
  smokeRadius: 95,
  smokeSeconds: 6,
  /** Camera loop: how long every camera is blind. */
  loopSeconds: 8,
};

/** Loot values, in dollars. */
export const LOOT = {
  star: 1000,
  painting: 150,
  gold: 100,
  /** Bonus for escaping with the alarm low: up to this much, scaled by (100 - alarm). */
  cleanBonus: 400,
  /** Time bonus: up to this much, scaled by how fast the escape was (par 150 s). */
  timePar: 150,
  timeBonus: 300,
};

/** Colours: dark marble, warm gold loot, red danger, green safe cover. */
export const COLORS = {
  floor: '#1b1e26',
  floorAlt: '#20242e',
  wall: '#3a3f4d',
  wallTop: '#565d70',
  gold: '#f5c542',
  goldDim: '#a8842a',
  thief: '#e8e4d8',
  thiefCoat: '#2b3a55',
  guard: '#8c2f2f',
  guardDark: '#5e1f1f',
  cone: 'rgba(255, 64, 64, 0.20)',
  coneEdge: 'rgba(255, 96, 96, 0.55)',
  cameraCone: 'rgba(255, 170, 40, 0.16)',
  cameraConeEdge: 'rgba(255, 190, 80, 0.5)',
  smoke: 'rgba(200, 205, 215, 0.45)',
  cover: '#2c4a34',
  coverEdge: '#4a7a58',
  vent: '#14161c',
  exit: '#2e6b46',
  exitGlow: '#57d977',
  hudBg: 'rgba(10, 12, 18, 0.82)',
  hudText: '#e8e4d8',
  hudDim: '#9aa0b0',
  alarmLow: '#57d977',
  alarmMid: '#f5c542',
  alarmHigh: '#ff4d4d',
  spotted: '#ff5a5a',
};
