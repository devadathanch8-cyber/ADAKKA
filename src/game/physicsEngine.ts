import * as THREE from 'three';
import { ArenaConfig, BotDifficulty, CharacterConfig, PlayerControls, PlayerStatsTracking } from '../types/game';
import { GAME_CONSTANTS } from './constants';
import { soundManager } from '../audio/soundManager';

export interface PlayerPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  facing: number; // 1 = right, -1 = left
  isGrounded: boolean;
  canDoubleJump?: boolean;
  kickCooldown: number;
  powerKickCooldown: number;
  specialCharge: number; // 0 - 100
  isSpecialActive: boolean;
  specialTimer: number;
  speedBoostTimer: number;
  score: number;
  stats: PlayerStatsTracking;
}

export interface BallPhysicsState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  spinX: number;
  spinY: number;
  spinZ: number;
  lastHitter: 'p1' | 'p2' | null;
  isSpecialShot: boolean;
  specialColor: string;
}

export class PhysicsEngine {
  public p1: PlayerPhysicsState;
  public p2: PlayerPhysicsState;
  public ball: BallPhysicsState;
  public arena: ArenaConfig;
  public p1Config: CharacterConfig;
  public p2Config: CharacterConfig;

  // Match state
  public isGoalScored: boolean = false;
  public goalScorer: 'p1' | 'p2' | null = null;
  public goalFreezeTimer: number = 0;
  public onGoalScoredCallback?: (scorer: 'p1' | 'p2') => void;
  public onCameraShakeCallback?: (intensity: number) => void;

  constructor(p1Config: CharacterConfig, p2Config: CharacterConfig, arena: ArenaConfig) {
    this.p1Config = p1Config;
    this.p2Config = p2Config;
    this.arena = arena;

    this.p1 = this.createDefaultPlayer(-6, 1);
    this.p2 = this.createDefaultPlayer(6, -1);
    this.ball = this.createDefaultBall();
  }

  private createDefaultPlayer(startX: number, facing: number): PlayerPhysicsState {
    return {
      x: startX,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing,
      isGrounded: true,
      kickCooldown: 0,
      powerKickCooldown: 0,
      specialCharge: 20, // Start with a little charge
      isSpecialActive: false,
      specialTimer: 0,
      speedBoostTimer: 0,
      score: 0,
      stats: {
        goals: 0,
        shots: 0,
        headers: 0,
        powerShots: 0,
        specialUses: 0,
        possessionTime: 0,
        topShotSpeed: 0,
      }
    };
  }

  private createDefaultBall(): BallPhysicsState {
    return {
      x: 0,
      y: 4.5, // Drops from air for dramatic kickoff
      z: 0,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 0.5,
      vz: 0,
      spinX: 0,
      spinY: 0,
      spinZ: 0,
      lastHitter: null,
      isSpecialShot: false,
      specialColor: '#38bdf8',
    };
  }

  public resetPositionsForKickoff() {
    this.p1.x = -6.0;
    this.p1.y = 0;
    this.p1.vx = 0;
    this.p1.vy = 0;
    this.p1.facing = 1;

    this.p2.x = 6.0;
    this.p2.y = 0;
    this.p2.vx = 0;
    this.p2.vy = 0;
    this.p2.facing = -1;

    this.ball.x = 0;
    this.ball.y = 5.0;
    this.ball.z = 0;
    this.ball.vx = (Math.random() - 0.5) * 1.0;
    this.ball.vy = 0.5;
    this.ball.vz = 0;
    this.ball.spinX = 0;
    this.ball.spinY = 0;
    this.ball.spinZ = 0;
    this.ball.isSpecialShot = false;
    this.ball.lastHitter = null;

    this.isGoalScored = false;
    this.goalScorer = null;
    this.goalFreezeTimer = 0;
  }

  public update(
    delta: number,
    p1Input: PlayerControls,
    p2Input: PlayerControls,
    isBot: boolean,
    botDifficulty: BotDifficulty,
    onKickP1?: (type: 'normal' | 'power' | 'special') => void,
    onKickP2?: (type: 'normal' | 'power' | 'special') => void,
    onHeaderP1?: () => void,
    onHeaderP2?: () => void
  ) {
    // If goal freeze frame is active
    if (this.isGoalScored) {
      this.goalFreezeTimer += delta;
      // Allow ball to settle in net gently
      this.updateBallPhysics(delta * 0.4);
      return;
    }

    // Limit delta to prevent tunneling during lag spikes
    const dt = Math.min(delta, 0.033);

    // Charge special meters passively over time
    this.p1.specialCharge = Math.min(100, this.p1.specialCharge + GAME_CONSTANTS.SPECIAL_CHARGE_PER_SEC * dt);
    this.p2.specialCharge = Math.min(100, this.p2.specialCharge + GAME_CONSTANTS.SPECIAL_CHARGE_PER_SEC * dt);

    // Substepping for precision arcade collisions (2 substeps)
    const substeps = 2;
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      // 1. Process Bot AI if enabled
      let effectiveP2Input = p2Input;
      if (isBot) {
        effectiveP2Input = this.computeBotInput(botDifficulty);
      }

      // 2. Update Players movement
      this.updatePlayer(this.p1, p1Input, this.p1Config, subDt, onKickP1, true);
      this.updatePlayer(this.p2, effectiveP2Input, this.p2Config, subDt, onKickP2, false);

      // 3. Resolve Player vs Player collision
      this.resolvePlayerVsPlayer();

      // 4. Update Ball physics & trajectory (including curve / spin)
      this.updateBallPhysics(subDt);

      // 5. Ball collisions with players (Head, Body, Foot Kick)
      this.resolveBallPlayerCollision(this.p1, this.p1Config, 'p1', onHeaderP1);
      this.resolveBallPlayerCollision(this.p2, this.p2Config, 'p2', onHeaderP2);

      // 6. Ball collisions with Pitch, Crossbars & Posts
      this.resolveBallArenaCollisions();

      // 7. Check Goal detection
      this.checkGoalDetection();
    }
  }

  private updatePlayer(
    p: PlayerPhysicsState,
    input: PlayerControls,
    cfg: CharacterConfig,
    dt: number,
    onKickAnim?: (type: 'normal' | 'power' | 'special') => void,
    isP1: boolean = true
  ) {
    // Cooldown timers
    if (p.kickCooldown > 0) p.kickCooldown -= dt;
    if (p.powerKickCooldown > 0) p.powerKickCooldown -= dt;
    if (p.speedBoostTimer > 0) p.speedBoostTimer -= dt;
    if (p.specialTimer > 0) {
      p.specialTimer -= dt;
      if (p.specialTimer <= 0) p.isSpecialActive = false;
    }

    // Horizontal Movement
    const statSpeedMult = cfg.stats.speed / 90;
    let baseSpeed = GAME_CONSTANTS.PLAYER_BASE_SPEED * statSpeedMult;
    if (p.speedBoostTimer > 0) baseSpeed *= 1.35; // Speed burst

    let moveX = 0;
    if (input.left) moveX -= 1;
    if (input.right) moveX += 1;

    // Apply acceleration / agility
    const agility = cfg.stats.agility / 90;
    const accel = 80 * agility;
    const targetVx = moveX * baseSpeed;

    p.vx += (targetVx - p.vx) * Math.min(1.0, accel * dt);
    p.x += p.vx * dt;

    // Auto update facing direction towards ball or opponent
    if (moveX !== 0) {
      p.facing = moveX;
    } else {
      // Look towards opponent goal or ball
      p.facing = isP1 ? 1 : -1;
    }

    // Jump Physics
    const statJumpMult = cfg.stats.jump / 90;
    const jumpForce = GAME_CONSTANTS.PLAYER_BASE_JUMP * statJumpMult;
    const gravity = GAME_CONSTANTS.GRAVITY * this.arena.gravityMultiplier;

    if (input.jump && p.isGrounded) {
      p.vy = jumpForce;
      p.isGrounded = false;
      soundManager.playBounce(0.3);
    }

    // Apply gravity
    if (!p.isGrounded) {
      p.vy += gravity * dt;
      p.y += p.vy * dt;

      // Landing on floor
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.isGrounded = true;
      }
    }

    // Boundary clamping (cannot run beyond goal lines)
    const minX = -GAME_CONSTANTS.GOAL_LINE_X + 0.8;
    const maxX = GAME_CONSTANTS.GOAL_LINE_X - 0.8;
    if (p.x < minX) {
      p.x = minX;
      p.vx = 0;
    } else if (p.x > maxX) {
      p.x = maxX;
      p.vx = 0;
    }

    // Kicking Actions
    const distToBall = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
    const inKickRange = distToBall < GAME_CONSTANTS.KICK_RANGE;

    // Normal Kick
    if (input.kick && p.kickCooldown <= 0) {
      p.kickCooldown = GAME_CONSTANTS.KICK_COOLDOWN_MS / 1000;
      onKickAnim?.('normal');
      soundManager.playKick(false);

      if (inKickRange) {
        this.executeKick(p, cfg, 'normal', isP1);
      }
    }

    // Power Kick
    if (input.powerKick && p.powerKickCooldown <= 0) {
      p.powerKickCooldown = GAME_CONSTANTS.POWER_KICK_COOLDOWN_MS / 1000;
      onKickAnim?.('power');
      soundManager.playKick(true);

      if (inKickRange) {
        this.executeKick(p, cfg, 'power', isP1);
      }
    }

    // Special Ability
    if (input.special && p.specialCharge >= 100) {
      p.specialCharge = 0;
      p.isSpecialActive = true;
      p.specialTimer = 2.5;
      p.stats.specialUses++;
      soundManager.playSpecialCharge();
      onKickAnim?.('special');
      this.onCameraShakeCallback?.(0.6);

      this.executeSpecialAbility(p, cfg, isP1);
    }
  }

  private executeKick(p: PlayerPhysicsState, cfg: CharacterConfig, type: 'normal' | 'power', isP1: boolean) {
    p.stats.shots++;
    p.specialCharge = Math.min(100, p.specialCharge + GAME_CONSTANTS.SPECIAL_CHARGE_PER_HIT);

    // Shot direction towards opponent goal
    const dirX = isP1 ? 1 : -1;
    const statPowerMult = cfg.stats.power / 90;
    const baseShotSpeed = (type === 'power' ? 26.0 : 17.5) * statPowerMult;

    // Angle: elevated arc for chip / header setup, or flat bullet
    const angleY = (type === 'power' ? 0.38 : 0.62) + (Math.random() - 0.5) * 0.15;
    const angleX = Math.sqrt(Math.max(0.1, 1 - angleY * angleY)) * dirX;

    this.ball.vx = angleX * baseShotSpeed + p.vx * 0.35;
    this.ball.vy = angleY * baseShotSpeed + Math.max(0, p.vy * 0.4);
    this.ball.vz = (Math.random() - 0.5) * 0.5;

    // Record top speed km/h (1 unit/s approx 3.6 km/h)
    const speedKmh = Math.round(Math.hypot(this.ball.vx, this.ball.vy) * 3.6);
    if (speedKmh > p.stats.topShotSpeed) {
      p.stats.topShotSpeed = speedKmh;
    }

    // Apply spin for curve shots
    const curveStat = cfg.stats.curve / 100;
    this.ball.spinY = (isP1 ? -1 : 1) * curveStat * (type === 'power' ? 14 : 22);

    this.ball.lastHitter = isP1 ? 'p1' : 'p2';
    this.ball.isSpecialShot = type === 'power';
    this.ball.specialColor = cfg.kitColorPrimary;

    if (type === 'power') {
      p.stats.powerShots++;
      this.onCameraShakeCallback?.(0.4);
    }
  }

  private executeSpecialAbility(p: PlayerPhysicsState, cfg: CharacterConfig, isP1: boolean) {
    const dirX = isP1 ? 1 : -1;

    if (cfg.id === 'valente') {
      // Quantum Warp Curve: Extreme curving Magnus vortex shot + 3s speed boost
      p.speedBoostTimer = 3.0;

      // Teleport ball near player if nearby, or launch whatever ball is present
      const dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
      if (dist < 4.5) {
        // Bend shot with dynamic spiral spin
        this.ball.vx = dirX * 28.0;
        this.ball.vy = 12.0;
        this.ball.spinY = dirX * -45; // Super curve
        this.ball.spinZ = 20;
        this.ball.isSpecialShot = true;
        this.ball.specialColor = '#06b6d4';
        this.ball.lastHitter = isP1 ? 'p1' : 'p2';
      }
    } else if (cfg.id === 'rex') {
      // Meteor Hammer Slam: Rocket jump + blazing fireball blast
      p.vy = 17.0; // Rocket launch
      p.isGrounded = false;

      // Rocket shot towards target corner
      this.ball.vx = dirX * 33.0;
      this.ball.vy = 8.0;
      this.ball.isSpecialShot = true;
      this.ball.specialColor = '#ef4444';
      this.ball.lastHitter = isP1 ? 'p1' : 'p2';

      // Push opponent backwards if close
      const other = isP1 ? this.p2 : this.p1;
      const d = Math.abs(other.x - p.x);
      if (d < 5.0) {
        other.vx = dirX * 16.0;
        other.vy = 6.0;
      }
    } else if (cfg.id === 'ghost') {
      // Phantom Shift Drive: Teleport 4 meters forward
      p.x += dirX * 4.2;
      this.ball.vx = dirX * 30.0;
      this.ball.vy = 9.0;
      this.ball.isSpecialShot = true;
      this.ball.specialColor = '#8b5cf6';
      this.ball.lastHitter = isP1 ? 'p1' : 'p2';
    } else {
      // Titan: Graviton Shockwave
      p.vy = 6.0;
      this.ball.vx = dirX * 24.0;
      this.ball.vy = 18.0; // Launches sky high
      this.ball.isSpecialShot = true;
      this.ball.specialColor = '#10b981';
      this.ball.lastHitter = isP1 ? 'p1' : 'p2';

      const other = isP1 ? this.p2 : this.p1;
      other.vx = dirX * 18.0;
    }
  }

  private resolvePlayerVsPlayer() {
    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.hypot(dx, dy);
    const minDist = GAME_CONSTANTS.PLAYER_RADIUS * 1.8;

    if (dist < minDist && dist > 0.001) {
      const overlap = (minDist - dist) * 0.5;
      const nx = dx / dist;

      this.p1.x -= nx * overlap;
      this.p2.x += nx * overlap;

      // Elastic rebound
      const relVx = this.p2.vx - this.p1.vx;
      if (relVx * nx < 0) {
        const impulse = relVx * 0.5;
        this.p1.vx += impulse * nx;
        this.p2.vx -= impulse * nx;
      }
    }
  }

  private updateBallPhysics(dt: number) {
    const b = this.ball;
    const gravity = GAME_CONSTANTS.GRAVITY * this.arena.gravityMultiplier;

    // Apply gravity
    b.vy += gravity * dt;

    // Apply Magnus effect (curve bending force based on spin)
    if (Math.abs(b.spinY) > 0.1) {
      // Magnus acceleration in X and Y
      const magnusForceY = -b.spinY * b.vx * 0.018;
      const magnusForceX = b.spinY * b.vy * 0.018;
      b.vy += magnusForceY * dt;
      b.vx += magnusForceX * dt;

      // Decay spin
      b.spinY *= 0.97;
    }

    // Air resistance
    b.vx *= GAME_CONSTANTS.BALL_FRICTION_AIR;
    b.vy *= GAME_CONSTANTS.BALL_FRICTION_AIR;
    b.vz *= GAME_CONSTANTS.BALL_FRICTION_AIR;

    // Clamp max velocity
    const speed = Math.hypot(b.vx, b.vy, b.vz);
    if (speed > GAME_CONSTANTS.BALL_MAX_SPEED) {
      const scale = GAME_CONSTANTS.BALL_MAX_SPEED / speed;
      b.vx *= scale;
      b.vy *= scale;
      b.vz *= scale;
    }

    // Integrate position
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.z += b.vz * dt;

    // Keep ball within action depth lane (Z bounds)
    const maxZ = GAME_CONSTANTS.FIELD_HALF_DEPTH - 0.4;
    if (b.z > maxZ) {
      b.z = maxZ;
      b.vz *= -0.7;
    } else if (b.z < -maxZ) {
      b.z = -maxZ;
      b.vz *= -0.7;
    }
  }

  private resolveBallPlayerCollision(
    p: PlayerPhysicsState,
    cfg: CharacterConfig,
    playerId: 'p1' | 'p2',
    onHeaderAnim?: () => void
  ) {
    const b = this.ball;
    const headX = p.x;
    const headY = p.y + GAME_CONSTANTS.HEAD_OFFSET_Y;
    const headRadius = GAME_CONSTANTS.HEAD_RADIUS;
    const ballRadius = GAME_CONSTANTS.BALL_RADIUS;

    // 1. Header Collision (Spherical head)
    const dx = b.x - headX;
    const dy = b.y - headY;
    const distHead = Math.hypot(dx, dy);
    const combinedRadius = headRadius + ballRadius;

    if (distHead < combinedRadius && distHead > 0.001) {
      // Calculate normal vector from head center to ball center
      let nx = dx / distHead;
      let ny = dy / distHead;

      // Ensure headers bounce forward & upwards for exciting gameplay
      const forwardDir = playerId === 'p1' ? 1 : -1;
      if (nx * forwardDir < 0.2) {
        nx = 0.65 * forwardDir;
      }
      if (ny < 0.35) {
        ny = 0.55;
      }
      const normLen = Math.hypot(nx, ny);
      nx /= normLen;
      ny /= normLen;

      // Position pushout
      b.x = headX + nx * combinedRadius;
      b.y = headY + ny * combinedRadius;

      // Header force incorporates character jump & power stats + player vertical velocity
      const statPower = cfg.stats.power / 90;
      const headerSpeed = 19.5 * statPower + Math.max(0, p.vy * 0.5);

      b.vx = nx * headerSpeed + p.vx * 0.4;
      b.vy = ny * headerSpeed;
      b.lastHitter = playerId;

      // Trigger animations and sounds
      onHeaderAnim?.();
      soundManager.playHeader();
      p.stats.headers++;
      p.specialCharge = Math.min(100, p.specialCharge + GAME_CONSTANTS.SPECIAL_CHARGE_PER_HIT * 1.2);
      this.onCameraShakeCallback?.(0.25);
      return;
    }

    // 2. Torso / Body Collision
    const bodyX = p.x;
    const bodyY = p.y + 0.9;
    const bodyRadius = GAME_CONSTANTS.PLAYER_RADIUS * 0.8;
    const distBody = Math.hypot(b.x - bodyX, b.y - bodyY);
    const combinedBodyRadius = bodyRadius + ballRadius;

    if (distBody < combinedBodyRadius && distBody > 0.001) {
      const nx = (b.x - bodyX) / distBody;
      const ny = (b.y - bodyY) / distBody;

      b.x = bodyX + nx * combinedBodyRadius;
      b.y = bodyY + ny * combinedBodyRadius;

      // Rebound gently off chest/body
      b.vx = nx * 10.0 + p.vx * 0.8;
      b.vy = Math.max(3.0, ny * 8.0);
      b.lastHitter = playerId;
      soundManager.playBounce(0.5);
    }
  }

  private resolveBallArenaCollisions() {
    const b = this.ball;
    const ballRadius = GAME_CONSTANTS.BALL_RADIUS;
    const restitution = this.arena.ballBounciness;

    // 1. Pitch floor bounce
    if (b.y - ballRadius <= 0) {
      b.y = ballRadius;
      // Bounce upward
      if (Math.abs(b.vy) > 0.8) {
        b.vy = -b.vy * restitution;
        soundManager.playBounce(Math.abs(b.vy) / 15);
      } else {
        b.vy = 0;
      }
      // Ground friction
      b.vx *= this.arena.ballFriction;
      b.vz *= this.arena.ballFriction;
    }

    // 2. Goal Posts & Crossbar collisions
    const goalLineX = GAME_CONSTANTS.GOAL_LINE_X;
    const crossbarY = GAME_CONSTANTS.GOAL_HEIGHT;
    const postRadius = GAME_CONSTANTS.POST_RADIUS;

    // Check Crossbars (at X = -13.5 and X = +13.5, height Y = 4.4)
    [-goalLineX, goalLineX].forEach((postX) => {
      const dX = b.x - postX;
      const dY = b.y - crossbarY;
      const dist = Math.hypot(dX, dY);
      const combined = postRadius + ballRadius;

      if (dist < combined && dist > 0.001) {
        // Metallic ricochet!
        const nx = dX / dist;
        const ny = dY / dist;
        b.x = postX + nx * combined;
        b.y = crossbarY + ny * combined;

        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 1.85 * dot * nx;
        b.vy -= 1.85 * dot * ny;

        soundManager.playPostHit();
        this.onCameraShakeCallback?.(0.45);
      }
    });

    // 3. Sky boundary ceiling (prevent ball from getting lost in space)
    if (b.y > 14.0) {
      b.y = 14.0;
      b.vy = -Math.abs(b.vy) * 0.8;
    }

    // 4. Back net collision when inside the goal
    const goalBackX = goalLineX + GAME_CONSTANTS.GOAL_DEPTH;
    if (b.x < -goalBackX) {
      b.x = -goalBackX;
      b.vx *= -0.3; // Net absorbs kinetic energy
    } else if (b.x > goalBackX) {
      b.x = goalBackX;
      b.vx *= -0.3;
    }
  }

  private checkGoalDetection() {
    if (this.isGoalScored) return;

    const b = this.ball;
    const goalLineX = GAME_CONSTANTS.GOAL_LINE_X;
    const goalHeight = GAME_CONSTANTS.GOAL_HEIGHT;

    // Goal on Left Portal (Player 2 scores)
    if (b.x < -goalLineX && b.y < goalHeight && b.y > 0) {
      this.isGoalScored = true;
      this.goalScorer = 'p2';
      this.p2.score++;
      this.p2.stats.goals++;
      soundManager.playGoalCelebration();
      this.onCameraShakeCallback?.(0.8);
      this.onGoalScoredCallback?.('p2');
    }
    // Goal on Right Portal (Player 1 scores)
    else if (b.x > goalLineX && b.y < goalHeight && b.y > 0) {
      this.isGoalScored = true;
      this.goalScorer = 'p1';
      this.p1.score++;
      this.p1.stats.goals++;
      soundManager.playGoalCelebration();
      this.onCameraShakeCallback?.(0.8);
      this.onGoalScoredCallback?.('p1');
    }
  }

  private computeBotInput(difficulty: BotDifficulty): PlayerControls {
    const bot = this.p2;
    const b = this.ball;
    const controls: PlayerControls = {
      left: false,
      right: false,
      jump: false,
      kick: false,
      powerKick: false,
      special: false,
    };

    // Calculate ball intercept point
    const targetX = b.x + (b.vx * (difficulty === 'legend' ? 0.35 : difficulty === 'pro' ? 0.2 : 0.1));
    const distToBall = Math.hypot(b.x - bot.x, b.y - bot.y);
    const dx = targetX - bot.x;

    // Defend goal threshold: stay between ball and right goal line
    const goalDefendX = GAME_CONSTANTS.GOAL_LINE_X - 2.5;

    if (b.x > bot.x && bot.x < goalDefendX) {
      // Ball is behind bot, rush back to protect goal!
      controls.right = true;
    } else if (dx < -0.4) {
      controls.left = true;
    } else if (dx > 0.4) {
      controls.right = true;
    }

    // Jumping for headers
    const shouldHeader = b.y > 2.0 && b.y < 4.2 && Math.abs(b.x - bot.x) < 1.4;
    if (shouldHeader && bot.isGrounded) {
      if (difficulty !== 'rookie' || Math.random() < 0.6) {
        controls.jump = true;
      }
    }

    // Kicking
    if (distToBall < GAME_CONSTANTS.KICK_RANGE + 0.3) {
      if (difficulty === 'legend') {
        if (Math.random() < 0.4 && bot.powerKickCooldown <= 0) {
          controls.powerKick = true;
        } else {
          controls.kick = true;
        }
      } else if (difficulty === 'pro') {
        if (Math.random() < 0.25 && bot.powerKickCooldown <= 0) {
          controls.powerKick = true;
        } else {
          controls.kick = true;
        }
      } else {
        // Rookie: casual kick
        controls.kick = Math.random() < 0.7;
      }
    }

    // Special move activation
    if (bot.specialCharge >= 100) {
      if (difficulty === 'legend' && distToBall < 5.0) {
        controls.special = true;
      } else if (difficulty === 'pro' && Math.random() < 0.05) {
        controls.special = true;
      }
    }

    return controls;
  }
}
