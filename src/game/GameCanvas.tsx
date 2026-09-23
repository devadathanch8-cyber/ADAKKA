import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { ArenaConfig, BotDifficulty, CameraMode, CharacterConfig, GameMode, PlayerControls } from '../types/game';
import { Character3D } from './character3D';
import { Arena3D } from './arena3D';
import { Ball3D } from './ball3D';
import { PhysicsEngine } from './physicsEngine';
import { soundManager } from '../audio/soundManager';

interface GameCanvasProps {
  p1Config: CharacterConfig;
  p2Config: CharacterConfig;
  arenaConfig: ArenaConfig;
  mode: GameMode;
  botDifficulty: BotDifficulty;
  cameraMode: CameraMode;
  isPaused: boolean;
  onGoalScored: (scorer: 'p1' | 'p2', p1Score: number, p2Score: number) => void;
  onMatchTick: (p1Score: number, p2Score: number, p1SpecialPct: number, p2SpecialPct: number, ballSpeedKmh: number) => void;
  physicsRef: React.MutableRefObject<PhysicsEngine | null>;
  virtualControlsP1?: PlayerControls;
  virtualControlsP2?: PlayerControls;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  p1Config,
  p2Config,
  arenaConfig,
  mode,
  botDifficulty,
  cameraMode,
  isPaused,
  onGoalScored,
  onMatchTick,
  physicsRef,
  virtualControlsP1,
  virtualControlsP2,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard controls map
  const keysDown = useRef<{ [code: string]: boolean }>({});

  // Camera Shake
  const shakeIntensity = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Renderer setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(arenaConfig.skyGradient[0]);
    scene.fog = new THREE.FogExp2(new THREE.Color(arenaConfig.skyGradient[0]).getHex(), 0.012);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 300);
    camera.position.set(0, 9, 21);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 2. Instantiate Arena 3D
    const arena3D = new Arena3D(arenaConfig);
    scene.add(arena3D.root);

    // 3. Instantiate Characters 3D
    const p13D = new Character3D(p1Config, true);
    scene.add(p13D.root);

    const p23D = new Character3D(p2Config, false);
    scene.add(p23D.root);

    // 4. Instantiate Ball 3D
    const ball3D = new Ball3D();
    scene.add(ball3D.root);
    scene.add(ball3D.trailMesh);

    // 5. Physics Engine
    const physics = new PhysicsEngine(p1Config, p2Config, arenaConfig);
    physicsRef.current = physics;

    physics.onCameraShakeCallback = (intensity) => {
      shakeIntensity.current = Math.max(shakeIntensity.current, intensity);
    };

    physics.onGoalScoredCallback = (scorer) => {
      // Fire confetti celebration
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6, x: scorer === 'p1' ? 0.8 : 0.2 },
        colors: [p1Config.kitColorPrimary, p2Config.kitColorPrimary, '#fbbf24', '#ffffff'],
      });

      arena3D.flashJumbotronGoal(
        scorer === 'p1' ? p1Config.name : p2Config.name,
        physics.p1.score,
        physics.p2.score
      );

      onGoalScored(scorer, physics.p1.score, physics.p2.score);
    };

    // 6. Keyboard input event listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.current[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // 7. Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 8. Animation & Game Loop
    let lastTime = performance.now();
    let animFrameId: number;

    const gameLoop = (currentTime: number) => {
      animFrameId = requestAnimationFrame(gameLoop);

      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isPaused) {
        // Collect Gamepad inputs
        const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
        const gp1 = gamepads[0];
        const gp2 = gamepads[1];

        // Player 1 input mapping (WASD + J/K/L or Gamepad 1)
        const p1Input: PlayerControls = {
          left: Boolean(keysDown.current['KeyA'] || (gp1 && (gp1.axes[0] < -0.3 || gp1.buttons[14]?.pressed)) || virtualControlsP1?.left),
          right: Boolean(keysDown.current['KeyD'] || (gp1 && (gp1.axes[0] > 0.3 || gp1.buttons[15]?.pressed)) || virtualControlsP1?.right),
          jump: Boolean(keysDown.current['KeyW'] || (gp1 && gp1.buttons[0]?.pressed) || virtualControlsP1?.jump),
          kick: Boolean(keysDown.current['KeyJ'] || keysDown.current['Space'] || (gp1 && gp1.buttons[2]?.pressed) || virtualControlsP1?.kick),
          powerKick: Boolean(keysDown.current['KeyK'] || keysDown.current['KeyF'] || (gp1 && gp1.buttons[1]?.pressed) || virtualControlsP1?.powerKick),
          special: Boolean(keysDown.current['KeyL'] || keysDown.current['KeyE'] || (gp1 && (gp1.buttons[3]?.pressed || gp1.buttons[5]?.pressed)) || virtualControlsP1?.special),
        };

        // Player 2 input mapping (Arrows + Numpad / Period / Slash or Gamepad 2)
        const p2Input: PlayerControls = {
          left: Boolean(keysDown.current['ArrowLeft'] || (gp2 && (gp2.axes[0] < -0.3 || gp2.buttons[14]?.pressed)) || virtualControlsP2?.left),
          right: Boolean(keysDown.current['ArrowRight'] || (gp2 && (gp2.axes[0] > 0.3 || gp2.buttons[15]?.pressed)) || virtualControlsP2?.right),
          jump: Boolean(keysDown.current['ArrowUp'] || (gp2 && gp2.buttons[0]?.pressed) || virtualControlsP2?.jump),
          kick: Boolean(keysDown.current['Numpad1'] || keysDown.current['Period'] || keysDown.current['BracketRight'] || (gp2 && gp2.buttons[2]?.pressed) || virtualControlsP2?.kick),
          powerKick: Boolean(keysDown.current['Numpad2'] || keysDown.current['Slash'] || keysDown.current['Backslash'] || (gp2 && gp2.buttons[1]?.pressed) || virtualControlsP2?.powerKick),
          special: Boolean(keysDown.current['Numpad3'] || keysDown.current['ShiftRight'] || keysDown.current['KeyP'] || (gp2 && (gp2.buttons[3]?.pressed || gp2.buttons[5]?.pressed)) || virtualControlsP2?.special),
        };

        // Update Physics Simulation
        physics.update(
          delta,
          p1Input,
          p2Input,
          mode === 'vs_ai',
          botDifficulty,
          (type) => p13D.triggerKick(type),
          (type) => p23D.triggerKick(type),
          () => p13D.triggerHeaderTilt(),
          () => p23D.triggerHeaderTilt()
        );

        // Update 3D Character Visual Positions & Animations
        p13D.root.position.set(physics.p1.x, physics.p1.y, physics.p1.z);
        p13D.updateFacing(physics.p1.facing);
        p13D.updateAnimation(delta, physics.p1.vx, physics.p1.vy, physics.p1.isGrounded, physics.p1.specialCharge / 100);

        p23D.root.position.set(physics.p2.x, physics.p2.y, physics.p2.z);
        p23D.updateFacing(physics.p2.facing);
        p23D.updateAnimation(delta, physics.p2.vx, physics.p2.vy, physics.p2.isGrounded, physics.p2.specialCharge / 100);

        // Update 3D Ball
        const ballPos = new THREE.Vector3(physics.ball.x, physics.ball.y, physics.ball.z);
        const ballVel = new THREE.Vector3(physics.ball.vx, physics.ball.vy, physics.ball.vz);
        ball3D.update(ballPos, ballVel, physics.ball.isSpecialShot, physics.ball.specialColor);

        // Update Arena animation (jumbotron, crowd, clouds, thrusters)
        arena3D.update(delta);

        // Report HUD stats
        const ballSpeedKmh = Math.round(ballVel.length() * 3.6);
        onMatchTick(
          physics.p1.score,
          physics.p2.score,
          physics.p1.specialCharge / 100,
          physics.p2.specialCharge / 100,
          ballSpeedKmh
        );
      }

      // Camera choreograph
      updateCamera(camera, cameraMode, physics, delta);

      // Render Scene
      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [p1Config, p2Config, arenaConfig, mode, botDifficulty, cameraMode]);

  // Dynamic Camera tracking function
  const updateCamera = (
    cam: THREE.PerspectiveCamera,
    mode: CameraMode,
    physics: PhysicsEngine,
    delta: number
  ) => {
    // Apply camera shake if any
    let shakeOffset = new THREE.Vector3();
    if (shakeIntensity.current > 0) {
      shakeOffset.set(
        (Math.random() - 0.5) * shakeIntensity.current,
        (Math.random() - 0.5) * shakeIntensity.current,
        0
      );
      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * 2.5);
    }

    if (mode === 'broadcast') {
      // Classic wide stadium television view
      const targetPos = new THREE.Vector3(0, 11, 23).add(shakeOffset);
      cam.position.lerp(targetPos, 0.05);
      cam.lookAt(0, 2.5, 0);
    } else if (mode === 'action') {
      // Close pitch action view
      const focusX = (physics.ball.x * 0.7 + (physics.p1.x + physics.p2.x) * 0.15);
      const targetPos = new THREE.Vector3(focusX, 4.5, 14).add(shakeOffset);
      cam.position.lerp(targetPos, 0.08);
      cam.lookAt(focusX, 2.2, 0);
    } else {
      // Dynamic Orbit: Tracks action midpoint, adjusts zoom based on player distance
      const midX = (physics.p1.x + physics.p2.x + physics.ball.x * 1.5) / 3.5;
      const playerDistance = Math.abs(physics.p1.x - physics.p2.x);
      const targetZ = 18 + Math.max(0, playerDistance - 10) * 0.5;
      const targetY = 7.5 + Math.max(0, physics.ball.y - 4) * 0.35;

      const targetPos = new THREE.Vector3(midX * 0.6, targetY, targetZ).add(shakeOffset);
      cam.position.lerp(targetPos, 0.07);
      cam.lookAt(midX * 0.7, 2.2, 0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950"
    />
  );
};
