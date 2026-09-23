import React from 'react';
import { Volume2, VolumeX, Play, Users, Bot, Gamepad2, Settings, ShieldAlert, Sparkles, Flame, Zap } from 'lucide-react';
import { ArenaConfig, BotDifficulty, GameMode, MatchSettings } from '../types/game';
import { ARENAS } from '../game/arenaData';
import { soundManager } from '../audio/soundManager';

interface StartScreenProps {
  settings: MatchSettings;
  onUpdateSettings: (newSettings: Partial<MatchSettings>) => void;
  onStartCharacterSelect: () => void;
  onOpenControls: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  settings,
  onUpdateSettings,
  onStartCharacterSelect,
  onOpenControls,
  isMuted,
  onToggleMute,
}) => {
  const currentArena = ARENAS.find(a => a.id === settings.arenaId) || ARENAS[0];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-10 z-20 text-white select-none overflow-y-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 font-black text-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            A
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold block">
              Antigravity Football League
            </span>
            <span className="text-sm text-slate-400 font-medium">Sky Stadium Series</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onOpenControls();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-sm font-semibold transition-all hover:border-cyan-500/50"
          >
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <span>Controls</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onToggleMute();
            }}
            className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Center Hero Section */}
      <div className="max-w-3xl mx-auto text-center my-auto py-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Next-Gen 3D Arcade Head Soccer
        </div>

        <h1 className="text-5xl sm:text-7xl font-black font-chakra tracking-tight uppercase leading-none drop-shadow-2xl">
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
            Aether Striker
          </span>
          <br />
          <span className="text-white text-4xl sm:text-5xl font-extrabold tracking-normal">
            3D Sky Stadium
          </span>
        </h1>

        <p className="mt-4 text-slate-300 text-base sm:text-lg max-w-xl mx-auto font-medium">
          Battle in a floating arena 10,000 feet above the megacity. Curve laser shots with high-spin physics, deliver aerial headers, and unleash devastating special abilities!
        </p>

        {/* Game Mode Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-xl mx-auto">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onUpdateSettings({ mode: 'two_player' });
            }}
            className={`p-5 rounded-2xl border text-left transition-all ${
              settings.mode === 'two_player'
                ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.35)] scale-[1.02]'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                <Users className="w-6 h-6" />
              </div>
              {settings.mode === 'two_player' && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/30 text-cyan-300">
                  Selected
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-white">2-Player Versus</h3>
            <p className="text-xs text-slate-400 mt-1">
              Local duel on the same keyboard or dual controllers.
            </p>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onUpdateSettings({ mode: 'vs_ai' });
            }}
            className={`p-5 rounded-2xl border text-left transition-all ${
              settings.mode === 'vs_ai'
                ? 'bg-purple-950/80 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.02]'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                <Bot className="w-6 h-6" />
              </div>
              {settings.mode === 'vs_ai' && (
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-purple-500/30 text-purple-300">
                  Selected
                </span>
              )}
            </div>
            <h3 className="font-bold text-lg text-white">Solo vs AI Bot</h3>
            <p className="text-xs text-slate-400 mt-1">
              Test your skills against smart tactical AI opponents.
            </p>
          </button>
        </div>

        {/* Match Settings Configurator */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 max-w-xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Match Duration */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Timer:</span>
            {[60, 90, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => {
                  soundManager.playMenuClick();
                  onUpdateSettings({ durationSeconds: sec });
                }}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  settings.durationSeconds === sec
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* AI Difficulty (if vs_ai) */}
          {settings.mode === 'vs_ai' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Bot:</span>
              {(['rookie', 'pro', 'legend'] as BotDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    soundManager.playMenuClick();
                    onUpdateSettings({ botDifficulty: diff });
                  }}
                  className={`px-2.5 py-1 rounded font-bold capitalize transition-all ${
                    settings.botDifficulty === diff
                      ? 'bg-purple-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          )}

          {/* Arena Choice */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">Arena:</span>
            <select
              value={settings.arenaId}
              onChange={(e) => {
                soundManager.playMenuClick();
                onUpdateSettings({ arenaId: e.target.value });
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 font-bold px-2 py-1 rounded outline-none cursor-pointer hover:border-cyan-500"
            >
              {ARENAS.map((arena) => (
                <option key={arena.id} value={arena.id}>
                  {arena.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Game Action Button */}
        <div className="mt-8">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onStartCharacterSelect();
            }}
            className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 text-slate-950 font-black text-xl font-chakra tracking-wide uppercase shadow-[0_0_35px_rgba(6,182,212,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-6 h-6 fill-slate-950" />
            <span>Select Superstars</span>
          </button>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 font-semibold">
        <span>Arena: {currentArena.name} ({currentArena.tagline})</span>
        <span>Keyboard P1: WASD + J/K/L • P2: Arrows + 1/2/3 or Gamepad</span>
      </div>
    </div>
  );
};
