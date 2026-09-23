/**
 * Global game constants and configuration parameters
 */

export const GAME_CONSTANTS = {
  // Pitch dimensions (X: length, Y: height, Z: depth)
  FIELD_HALF_WIDTH: 14.5,   // Field length goes from -14.5 to +14.5 (total 29.0m)
  FIELD_HALF_DEPTH: 2.2,    // Field depth bounds -2.2 to +2.2 (head soccer action lane)
  GOAL_LINE_X: 13.5,        // Goal line threshold
  GOAL_DEPTH: 2.8,          // Extends backwards to 16.3
  GOAL_HALF_WIDTH: 1.8,     // Net opening in Z: -1.8 to +1.8
  GOAL_HEIGHT: 4.4,         // Crossbar height Y
  POST_RADIUS: 0.16,

  // Player dimensions & physics
  PLAYER_BASE_SPEED: 11.5,
  PLAYER_BASE_JUMP: 16.5,
  PLAYER_RADIUS: 0.88,
  HEAD_RADIUS: 0.72,
  HEAD_OFFSET_Y: 1.65,
  BODY_HEIGHT: 2.15,

  // Ball dimensions & physics
  BALL_RADIUS: 0.52,
  BALL_MASS: 0.45,
  GRAVITY: -26.0,
  BALL_RESTITUTION: 0.82,    // Bounciness on turf
  BALL_FRICTION_AIR: 0.992,
  BALL_FRICTION_GROUND: 0.965,
  BALL_MAX_SPEED: 42.0,

  // Kicking parameters
  KICK_RANGE: 1.75,
  KICK_COOLDOWN_MS: 240,
  POWER_KICK_COOLDOWN_MS: 600,
  SPECIAL_CHARGE_MAX: 100,
  SPECIAL_CHARGE_PER_SEC: 3.5,
  SPECIAL_CHARGE_PER_HIT: 12,

  // Controls mappings default
  CONTROLS: {
    P1: {
      left: ['KeyA'],
      right: ['KeyD'],
      jump: ['KeyW'],
      kick: ['KeyJ', 'Space'],
      powerKick: ['KeyK', 'KeyF'],
      special: ['KeyL', 'KeyE'],
    },
    P2: {
      left: ['ArrowLeft'],
      right: ['ArrowRight'],
      jump: ['ArrowUp'],
      kick: ['Numpad1', 'Period', 'BracketRight'],
      powerKick: ['Numpad2', 'Slash', 'Backslash'],
      special: ['Numpad3', 'ShiftRight', 'KeyP'],
    }
  }
};
