import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Zap, Flame } from 'lucide-react';
import { PlayerControls } from '../types/game';

interface TouchControlsProps {
  onControlChange: (controls: PlayerControls) => void;
  controlsState: PlayerControls;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onControlChange,
  controlsState,
}) => {
  const setKey = (key: keyof PlayerControls, value: boolean) => {
    onControlChange({
      ...controlsState,
      [key]: value,
    });
  };

  return (
    <div className="absolute inset-x-0 bottom-3 px-4 flex items-end justify-between pointer-events-none z-20 select-none md:hidden">
      {/* D-Pad Left / Right */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onTouchStart={() => setKey('left', true)}
          onTouchEnd={() => setKey('left', false)}
          onMouseDown={() => setKey('left', true)}
          onMouseUp={() => setKey('left', false)}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-white transition-all active:scale-90 ${
            controlsState.left
              ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 backdrop-blur-md'
          }`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => setKey('right', true)}
          onTouchEnd={() => setKey('right', false)}
          onMouseDown={() => setKey('right', true)}
          onMouseUp={() => setKey('right', false)}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-bold text-white transition-all active:scale-90 ${
            controlsState.right
              ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 backdrop-blur-md'
          }`}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Action Buttons Right */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Jump */}
        <button
          onTouchStart={() => setKey('jump', true)}
          onTouchEnd={() => setKey('jump', false)}
          onMouseDown={() => setKey('jump', true)}
          onMouseUp={() => setKey('jump', false)}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-white text-xs transition-all active:scale-90 ${
            controlsState.jump
              ? 'bg-sky-500 border-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.6)]'
              : 'bg-slate-900/80 border-slate-700/80 backdrop-blur-md'
          }`}
        >
          <ArrowUp className="w-6 h-6" />
        </button>

        {/* Kick */}
        <button
          onTouchStart={() => setKey('kick', true)}
          onTouchEnd={() => setKey('kick', false)}
          onMouseDown={() => setKey('kick', true)}
          onMouseUp={() => setKey('kick', false)}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-slate-950 font-chakra text-sm transition-all active:scale-90 ${
            controlsState.kick
              ? 'bg-amber-400 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.6)]'
              : 'bg-amber-400/90 border-amber-300 backdrop-blur-md'
          }`}
        >
          KICK
        </button>

        {/* Power Kick */}
        <button
          onTouchStart={() => setKey('powerKick', true)}
          onTouchEnd={() => setKey('powerKick', false)}
          onMouseDown={() => setKey('powerKick', true)}
          onMouseUp={() => setKey('powerKick', false)}
          className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center font-black text-white font-chakra text-xs transition-all active:scale-90 ${
            controlsState.powerKick
              ? 'bg-red-500 border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
              : 'bg-red-600/80 border-red-500 backdrop-blur-md'
          }`}
        >
          PWR
        </button>

        {/* Special */}
        <button
          onTouchStart={() => setKey('special', true)}
          onTouchEnd={() => setKey('special', false)}
          onMouseDown={() => setKey('special', true)}
          onMouseUp={() => setKey('special', false)}
          className="w-14 h-14 rounded-2xl border-2 border-cyan-400 bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center font-black text-white text-xs shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-90 transition-all"
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
        </button>
      </div>
    </div>
  );
};
