import React from 'react';
import { Pause, Camera, Volume2, VolumeX, Sparkles, Flame, Zap, Shield, HelpCircle, Activity } from 'lucide-react';
import { CameraMode, CharacterConfig } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface MatchHUDProps {
  p1Config: CharacterConfig;
  p2Config: CharacterConfig;
  p1Score: number;
  p2Score: number;
  remainingSeconds: number;
  isOvertime: boolean;
  p1SpecialPct: number; // 0 to 1
  p2SpecialPct: number; // 0 to 1
  ballSpeedKmh: number;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
  onPause: () => void;
  onOpenControls: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  goalAlert: { active: boolean; scorerText: string } | null;
}

export const MatchHUD: React.FC<MatchHUDProps> = ({
  p1Config,
  p2Config,
  p1Score,
  p2Score,
  remainingSeconds,
  isOvertime,
  p1SpecialPct,
  p2SpecialPct,
  ballSpeedKmh,
  cameraMode,
  onCycleCamera,
  onPause,
  onOpenControls,
  isMuted,
  onToggleMute,
  goalAlert,
}) => {
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLowTime = remainingSeconds <= 10 && remainingSeconds > 0 && !isOvertime;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between p-4 sm:p-6 text-white font-rajdhani">
      {/* 1. TOP SCOREBOARD */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto pointer-events-auto">
        {/* P1 Card */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black font-chakra text-lg text-slate-950 shadow-inner"
            style={{ backgroundColor: p1Config.kitColorPrimary }}
          >
            {p1Config.number}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">P1</span>
              <span className="text-xs text-slate-400 font-semibold">• {p1Config.fictionalTeam}</span>
            </div>
            <h3 className="text-base sm:text-lg font-black font-chakra leading-tight text-white">
              {p1Config.name.split(' ')[0]}
            </h3>
          </div>
          <div className="pl-4 border-l border-slate-700/80">
            <span className="text-3xl sm:text-4xl font-black font-chakra text-cyan-400">
              {p1Score}
            </span>
          </div>
        </div>

        {/* Center Timer & Match Status */}
        <div className="flex flex-col items-center">
          <div
            className={`px-5 py-1.5 rounded-2xl backdrop-blur-md border flex items-center gap-2 ${
              isLowTime
                ? 'bg-red-950/80 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse'
                : isOvertime
                ? 'bg-amber-950/80 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                : 'bg-slate-900/85 border-slate-700/80 shadow-lg'
            }`}
          >
            <span
              className={`text-2xl sm:text-3xl font-black font-chakra tracking-wider ${
                isLowTime ? 'text-red-400' : isOvertime ? 'text-amber-400' : 'text-amber-300'
              }`}
            >
              {isOvertime ? 'GOLDEN GOAL' : formatTime(remainingSeconds)}
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {isOvertime ? (
              <span className="text-amber-400">NEXT GOAL WINS</span>
            ) : (
              <span>SKY STADIUM REGULAR TIME</span>
            )}
          </div>
        </div>

        {/* P2 Card */}
        <div className="flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-red-500/40 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.25)]">
          <div className="pr-4 border-r border-slate-700/80 text-right">
            <span className="text-3xl sm:text-4xl font-black font-chakra text-red-400">
              {p2Score}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-xs text-slate-400 font-semibold">{p2Config.fictionalTeam} •</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">P2</span>
            </div>
            <h3 className="text-base sm:text-lg font-black font-chakra leading-tight text-white">
              {p2Config.name.split(' ')[0]}
            </h3>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black font-chakra text-lg text-white shadow-inner"
            style={{ backgroundColor: p2Config.kitColorPrimary }}
          >
            {p2Config.number}
          </div>
        </div>
      </div>

      {/* 2. CENTER ACTION / GOAL ANNOUNCEMENT BANNER */}
      {goalAlert?.active && (
        <div className="my-auto text-center transform scale-up animate-bounce">
          <div className="inline-block p-6 rounded-3xl bg-slate-950/90 border-4 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.8)] backdrop-blur-xl">
            <div className="text-5xl sm:text-7xl font-black font-chakra text-amber-300 uppercase tracking-wider text-glow-gold">
              GOOOOOAL!
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-chakra text-white uppercase tracking-widest">
              {goalAlert.scorerText} Scores!
            </div>
          </div>
        </div>
      )}

      {/* 3. BOTTOM UTILITY & SPECIAL MOVE GAUGES */}
      <div className="w-full max-w-5xl mx-auto flex items-end justify-between pointer-events-auto">
        {/* P1 Special Move Gauge */}
        <div className="w-64 sm:w-72 bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {p1Config.specialAbility.name}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round(p1SpecialPct * 100)}%
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 p-0.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                p1SpecialPct >= 1.0
                  ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(100, p1SpecialPct * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            {p1SpecialPct >= 1.0 ? (
              <span className="font-black text-amber-300 uppercase tracking-widest animate-pulse">
                SUPER READY! Press [ L ]
              </span>
            ) : (
              <span className="text-slate-400">Kick & Header to Charge</span>
            )}
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300">
              L / E
            </span>
          </div>
        </div>

        {/* Center Live Metrics & Action Controls */}
        <div className="flex flex-col items-center gap-2">
          {/* Live Ball Velocity */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-mono text-cyan-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHOT SPEED: </span>
            <span className="font-bold text-white">{ballSpeedKmh} km/h</span>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playMenuClick();
                onCycleCamera();
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title={`Camera: ${cameraMode.toUpperCase()}`}
            >
              <Camera className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => {
                soundManager.playMenuClick();
                onOpenControls();
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Controls Guide"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>

            <button
              onClick={() => {
                soundManager.playMenuClick();
                onToggleMute();
              }}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => {
                soundManager.playMenuClick();
                onPause();
              }}
              className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>PAUSE</span>
            </button>
          </div>
        </div>

        {/* P2 Special Move Gauge */}
        <div className="w-64 sm:w-72 bg-slate-900/85 backdrop-blur-md border border-red-500/30 p-3.5 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.2)] text-right">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round(p2SpecialPct * 100)}%
            </span>
            <span className="text-red-400 uppercase tracking-wider flex items-center gap-1">
              {p2Config.specialAbility.name}
              <Flame className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-800 p-0.5 overflow-hidden border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-150 ml-auto ${
                p2SpecialPct >= 1.0
                  ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, p2SpecialPct * 100)}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-red-300">
              3 / P
            </span>
            {p2SpecialPct >= 1.0 ? (
              <span className="font-black text-amber-300 uppercase tracking-widest animate-pulse">
                SUPER READY! Press [ 3 ]
              </span>
            ) : (
              <span className="text-slate-400">Kick & Header to Charge</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
