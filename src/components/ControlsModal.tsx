import React from 'react';
import { X, Gamepad2, Keyboard, Sparkles } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto">
      <div className="w-full max-w-3xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black font-chakra uppercase tracking-wide text-cyan-400">
                Controls & Keybindings
              </h2>
              <p className="text-xs text-slate-400">
                Supports Keyboard (Same Device) and standard USB / Bluetooth Gamepads
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dual Keyboard Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player 1 Card */}
          <div className="p-5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black font-chakra text-cyan-400 uppercase tracking-widest">
                Player 1 (Home)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                Left Side
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <KeyRow label="Move Left / Right" keys={['A', 'D']} />
              <KeyRow label="Jump / Aerial Header" keys={['W']} />
              <KeyRow label="Normal Kick" keys={['J', 'Space']} />
              <KeyRow label="Power Kick" keys={['K', 'F']} />
              <KeyRow label="Special Ability" keys={['L', 'E']} isSpecial />
            </div>
          </div>

          {/* Player 2 Card */}
          <div className="p-5 rounded-2xl bg-red-950/30 border border-red-500/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-black font-chakra text-red-400 uppercase tracking-widest">
                Player 2 (Away / AI)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                Right Side
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <KeyRow label="Move Left / Right" keys={['←', '→']} />
              <KeyRow label="Jump / Aerial Header" keys={['↑']} />
              <KeyRow label="Normal Kick" keys={['Num 1', '.', ']']} />
              <KeyRow label="Power Kick" keys={['Num 2', '/', '\\']} />
              <KeyRow label="Special Ability" keys={['Num 3', 'Shift', 'P']} isSpecial />
            </div>
          </div>
        </div>

        {/* Gamepad Controller Section */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white block">Gamepad Support Enabled</span>
              <span className="text-slate-400 text-[11px]">
                Stick / D-Pad: Move • (A): Jump • (X): Kick • (B): Power Kick • (Y / RB): Special
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded bg-slate-800 text-slate-300">
            Plug & Play
          </span>
        </div>

        {/* Pro Tips */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Pro Flight Tactics:
          </div>
          <p>• <strong>Aerial Headers:</strong> Jump towards an incoming ball to snap headers with forward velocity into top corners!</p>
          <p>• <strong>Magnus Curve Shots:</strong> Kicking while moving applies rotational spin, bending the ball around defenders.</p>
          <p>• <strong>Rebounds:</strong> Use the glowing goal crossbar and perimeter sky barriers for trick ricochet goals!</p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onClose();
            }}
            className="px-8 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

const KeyRow: React.FC<{ label: string; keys: string[]; isSpecial?: boolean }> = ({
  label,
  keys,
  isSpecial,
}) => {
  return (
    <div className="flex items-center justify-between">
      <span className={`font-semibold ${isSpecial ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {keys.map((k) => (
          <kbd
            key={k}
            className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold shadow ${
              isSpecial
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                : 'bg-slate-800 border border-slate-700 text-slate-200'
            }`}
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
};
