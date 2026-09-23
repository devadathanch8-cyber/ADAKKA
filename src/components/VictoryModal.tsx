import React from 'react';
import { Trophy, RotateCcw, Users, Home, Flame, Zap, Award } from 'lucide-react';
import { CharacterConfig, PlayerStatsTracking } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface VictoryModalProps {
  winner: 'p1' | 'p2' | 'draw';
  p1Score: number;
  p2Score: number;
  p1Config: CharacterConfig;
  p2Config: CharacterConfig;
  p1Stats: PlayerStatsTracking;
  p2Stats: PlayerStatsTracking;
  onRematch: () => void;
  onSelectCharacters: () => void;
  onMainMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  p1Score,
  p2Score,
  p1Config,
  p2Config,
  p1Stats,
  p2Stats,
  onRematch,
  onSelectCharacters,
  onMainMenu,
}) => {
  const winnerChar = winner === 'p1' ? p1Config : winner === 'p2' ? p2Config : null;

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(251,191,36,0.3)] text-white my-auto">
        {/* Header Winner Announcement */}
        <div className="text-center">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 mb-3 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.5)] animate-bounce">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-chakra uppercase tracking-wider text-glow-gold text-amber-300">
            {winner === 'draw'
              ? 'HONORABLE DRAW'
              : `${winner === 'p1' ? 'PLAYER 1' : 'PLAYER 2'} VICTORY!`}
          </h2>

          {winnerChar && (
            <div className="mt-1 text-slate-300 text-sm font-semibold">
              <span className="font-bold text-white text-base">{winnerChar.name}</span> leads{' '}
              <span className="text-amber-400 font-bold">{winnerChar.fictionalTeam}</span> to Sky Stadium Glory!
            </div>
          )}
        </div>

        {/* Final Big Score Display */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-around text-center">
          <div className="flex-1">
            <div className="text-xs uppercase font-bold text-cyan-400">Player 1</div>
            <div className="text-lg font-black font-chakra">{p1Config.name.split(' ')[0]}</div>
            <div className="text-5xl font-black font-chakra text-cyan-400 mt-1">{p1Score}</div>
          </div>

          <div className="text-slate-600 font-black text-2xl font-chakra px-4">VS</div>

          <div className="flex-1">
            <div className="text-xs uppercase font-bold text-red-400">Player 2</div>
            <div className="text-lg font-black font-chakra">{p2Config.name.split(' ')[0]}</div>
            <div className="text-5xl font-black font-chakra text-red-400 mt-1">{p2Score}</div>
          </div>
        </div>

        {/* Head-to-Head Statistics Table */}
        <div className="space-y-2.5 text-xs font-semibold">
          <h4 className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">
            Match Telemetry & Performance
          </h4>

          <StatRow
            label="Total Shots"
            val1={p1Stats.shots}
            val2={p2Stats.shots}
          />
          <StatRow
            label="Aerial Headers"
            val1={p1Stats.headers}
            val2={p2Stats.headers}
          />
          <StatRow
            label="Power Kicks"
            val1={p1Stats.powerShots}
            val2={p2Stats.powerShots}
          />
          <StatRow
            label="Special Abilities"
            val1={p1Stats.specialUses}
            val2={p2Stats.specialUses}
          />
          <StatRow
            label="Top Shot Speed"
            val1={`${p1Stats.topShotSpeed} km/h`}
            val2={`${p2Stats.topShotSpeed} km/h`}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onRematch();
            }}
            className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black font-chakra text-base uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(251,191,36,0.4)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>Rematch</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onSelectCharacters();
            }}
            className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Superstars</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onMainMenu();
            }}
            className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; val1: string | number; val2: string | number }> = ({
  label,
  val1,
  val2,
}) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/80">
      <span className="w-16 font-mono font-bold text-cyan-400">{val1}</span>
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="w-16 font-mono font-bold text-red-400 text-right">{val2}</span>
    </div>
  );
};
