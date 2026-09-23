import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraMode, GameMode, GameStatus, MatchSettings, PlayerControls } from './types/game';
import { CHARACTERS, getCharacterById } from './game/characterData';
import { ARENAS, getArenaById } from './game/arenaData';
import { GameCanvas } from './game/GameCanvas';
import { StartScreen } from './components/StartScreen';
import { CharacterSelect } from './components/CharacterSelect';
import { MatchHUD } from './components/MatchHUD';
import { PauseMenu } from './components/PauseMenu';
import { VictoryModal } from './components/VictoryModal';
import { ControlsModal } from './components/ControlsModal';
import { TouchControls } from './components/TouchControls';
import { PhysicsEngine } from './game/physicsEngine';
import { soundManager } from './audio/soundManager';

export default function App() {
  // Game lifecycle status
  const [status, setStatus] = useState<GameStatus>('menu');

  // Match configuration settings
  const [settings, setSettings] = useState<MatchSettings>({
    mode: 'two_player',
    botDifficulty: 'pro',
    durationSeconds: 90,
    overtimeEnabled: true,
    arenaId: 'neo_olympus',
    p1CharacterId: 'valente',
    p2CharacterId: 'rex',
  });

  // Camera mode: 'dynamic' | 'broadcast' | 'action'
  const [cameraMode, setCameraMode] = useState<CameraMode>('dynamic');

  // Audio mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getIsMuted());

  // Controls Modal
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);

  // Match runtime state
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(90);
  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [p1SpecialPct, setP1SpecialPct] = useState<number>(0.2);
  const [p2SpecialPct, setP2SpecialPct] = useState<number>(0.2);
  const [ballSpeedKmh, setBallSpeedKmh] = useState<number>(0);
  const [goalAlert, setGoalAlert] = useState<{ active: boolean; scorerText: string } | null>(null);
  const [winner, setWinner] = useState<'p1' | 'p2' | 'draw'>('draw');

  // Touch controls state for mobile/tablets
  const [virtualControlsP1, setVirtualControlsP1] = useState<PlayerControls>({
    left: false,
    right: false,
    jump: false,
    kick: false,
    powerKick: false,
    special: false,
  });

  // Reference to current physics engine
  const physicsRef = useRef<PhysicsEngine | null>(null);

  // Character & Arena data lookup
  const p1Config = getCharacterById(settings.p1CharacterId);
  const p2Config = getCharacterById(settings.p2CharacterId);
  const arenaConfig = getArenaById(settings.arenaId);

  // Sound mute toggle handler
  const handleToggleMute = useCallback(() => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  // Update settings helper
  const handleUpdateSettings = useCallback((newSettings: Partial<MatchSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Camera cycle
  const handleCycleCamera = useCallback(() => {
    setCameraMode(prev => {
      if (prev === 'dynamic') return 'broadcast';
      if (prev === 'broadcast') return 'action';
      return 'dynamic';
    });
  }, []);

  // Start match after character selection
  const handleStartMatch = useCallback((p1CharId: string, p2CharId: string) => {
    setSettings(prev => ({
      ...prev,
      p1CharacterId: p1CharId,
      p2CharacterId: p2CharId,
    }));
    setP1Score(0);
    setP2Score(0);
    setRemainingSeconds(settings.durationSeconds);
    setIsOvertime(false);
    setP1SpecialPct(0.2);
    setP2SpecialPct(0.2);
    setGoalAlert(null);
    setStatus('playing');

    if (physicsRef.current) {
      physicsRef.current.resetPositionsForKickoff();
    }
  }, [settings.durationSeconds]);

  // Restart match from pause or victory
  const handleRestartMatch = useCallback(() => {
    setP1Score(0);
    setP2Score(0);
    setRemainingSeconds(settings.durationSeconds);
    setIsOvertime(false);
    setP1SpecialPct(0.2);
    setP2SpecialPct(0.2);
    setGoalAlert(null);
    setStatus('playing');

    if (physicsRef.current) {
      physicsRef.current.p1.score = 0;
      physicsRef.current.p2.score = 0;
      physicsRef.current.resetPositionsForKickoff();
    }
  }, [settings.durationSeconds]);

  // Handle Goal Detection from Canvas
  const handleGoalScored = useCallback((scorer: 'p1' | 'p2', newP1Score: number, newP2Score: number) => {
    setP1Score(newP1Score);
    setP2Score(newP2Score);

    const scorerName = scorer === 'p1' ? p1Config.name : p2Config.name;
    setGoalAlert({ active: true, scorerText: scorerName });

    // If overtime golden goal, end match!
    if (isOvertime) {
      setTimeout(() => {
        setWinner(scorer);
        setStatus('game_over');
        soundManager.playWhistle(true);
      }, 1800);
      return;
    }

    // Reset after celebration
    setTimeout(() => {
      setGoalAlert(null);
      if (physicsRef.current) {
        physicsRef.current.resetPositionsForKickoff();
      }
      soundManager.playCountdown(true);
    }, 2200);
  }, [p1Config.name, p2Config.name, isOvertime]);

  // Live match telemetry tick
  const handleMatchTick = useCallback((
    score1: number,
    score2: number,
    p1Spec: number,
    p2Spec: number,
    ballSpd: number
  ) => {
    setP1Score(score1);
    setP2Score(score2);
    setP1SpecialPct(p1Spec);
    setP2SpecialPct(p2Spec);
    setBallSpeedKmh(ballSpd);
  }, []);

  // Match countdown timer
  useEffect(() => {
    if (status !== 'playing' || goalAlert?.active) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          // Check if tied for overtime
          if (settings.overtimeEnabled && p1Score === p2Score) {
            setIsOvertime(true);
            soundManager.playWhistle(false);
            return 0;
          } else {
            // Match Finished
            clearInterval(interval);
            soundManager.playWhistle(true);
            if (p1Score > p2Score) {
              setWinner('p1');
            } else if (p2Score > p1Score) {
              setWinner('p2');
            } else {
              setWinner('draw');
            }
            setStatus('game_over');
            return 0;
          }
        }

        // Countdown audio cue for last 5 seconds
        if (prev <= 5 && prev > 1) {
          soundManager.playCountdown(false);
        } else if (prev === 1) {
          soundManager.playCountdown(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, goalAlert, settings.overtimeEnabled, p1Score, p2Score]);

  // Global ESC key listener for Pause Menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (status === 'playing') {
          setStatus('paused');
        } else if (status === 'paused') {
          setStatus('playing');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-rajdhani select-none">
      {/* 3D Game World Canvas (Mounted permanently or during gameplay) */}
      <GameCanvas
        p1Config={p1Config}
        p2Config={p2Config}
        arenaConfig={arenaConfig}
        mode={settings.mode}
        botDifficulty={settings.botDifficulty}
        cameraMode={cameraMode}
        isPaused={status === 'paused' || status === 'menu' || status === 'character_select'}
        onGoalScored={handleGoalScored}
        onMatchTick={handleMatchTick}
        physicsRef={physicsRef}
        virtualControlsP1={virtualControlsP1}
      />

      {/* Cyber Scanlines Overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines z-10 opacity-30" />

      {/* State 1: Title Start Screen */}
      {status === 'menu' && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20">
          <StartScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onStartCharacterSelect={() => setStatus('character_select')}
            onOpenControls={() => setShowControlsModal(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* State 2: Character Selection Screen */}
      {status === 'character_select' && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-md z-20">
          <CharacterSelect
            settings={settings}
            onConfirm={handleStartMatch}
            onBack={() => setStatus('menu')}
          />
        </div>
      )}

      {/* State 3: Active Match In-Game HUD */}
      {(status === 'playing' || status === 'paused' || goalAlert?.active) && (
        <>
          <MatchHUD
            p1Config={p1Config}
            p2Config={p2Config}
            p1Score={p1Score}
            p2Score={p2Score}
            remainingSeconds={remainingSeconds}
            isOvertime={isOvertime}
            p1SpecialPct={p1SpecialPct}
            p2SpecialPct={p2SpecialPct}
            ballSpeedKmh={ballSpeedKmh}
            cameraMode={cameraMode}
            onCycleCamera={handleCycleCamera}
            onPause={() => setStatus('paused')}
            onOpenControls={() => setShowControlsModal(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            goalAlert={goalAlert}
          />

          {/* Virtual on-screen touch buttons for mobile view */}
          <TouchControls
            controlsState={virtualControlsP1}
            onControlChange={setVirtualControlsP1}
          />
        </>
      )}

      {/* State 4: Pause Menu Modal */}
      {status === 'paused' && (
        <PauseMenu
          onResume={() => setStatus('playing')}
          onRestart={handleRestartMatch}
          onQuit={() => setStatus('menu')}
          onOpenControls={() => setShowControlsModal(true)}
          cameraMode={cameraMode}
          onCycleCamera={handleCycleCamera}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* State 5: Victory Modal */}
      {status === 'game_over' && (
        <VictoryModal
          winner={winner}
          p1Score={p1Score}
          p2Score={p2Score}
          p1Config={p1Config}
          p2Config={p2Config}
          p1Stats={physicsRef.current?.p1.stats || {
            goals: p1Score,
            shots: 8,
            headers: 4,
            powerShots: 3,
            specialUses: 2,
            possessionTime: 45,
            topShotSpeed: 96,
          }}
          p2Stats={physicsRef.current?.p2.stats || {
            goals: p2Score,
            shots: 7,
            headers: 5,
            powerShots: 2,
            specialUses: 2,
            possessionTime: 42,
            topShotSpeed: 104,
          }}
          onRematch={handleRestartMatch}
          onSelectCharacters={() => setStatus('character_select')}
          onMainMenu={() => setStatus('menu')}
        />
      )}

      {/* Floating Controls & Keybindings Modal */}
      {showControlsModal && (
        <ControlsModal onClose={() => setShowControlsModal(false)} />
      )}
    </div>
  );
}
