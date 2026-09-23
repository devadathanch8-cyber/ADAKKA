import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Camera, Gamepad2, X } from 'lucide-react';
import { CameraMode } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onOpenControls: () => void;
  cameraMode: CameraMode;
  onCycleCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onQuit,
  onOpenControls,
  cameraMode,
  onCycleCamera,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <h2 className="text-2xl font-black font-chakra uppercase tracking-wider text-cyan-400">
            Match Paused
          </h2>
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onResume();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              onResume();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 font-black font-chakra text-lg uppercase tracking-wide flex items-center justify-center gap-2 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>Resume Match</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Restart Match</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onCycleCamera();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Camera: <span className="text-cyan-300 font-black ml-1">{cameraMode.toUpperCase()}</span></span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onOpenControls();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-purple-400" />
            <span>Controls & Keybindings</span>
          </button>

          <button
            onClick={() => {
              soundManager.playMenuClick();
              onToggleMute();
            }}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-slate-200 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-red-400" />
                <span>Audio: <span className="text-red-400 font-black ml-1">MUTED</span></span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>Audio: <span className="text-emerald-400 font-black ml-1">ENABLED</span></span>
              </>
            )}
          </button>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                soundManager.playMenuClick();
                onQuit();
              }}
              className="w-full py-3 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 text-red-300 hover:text-white transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Quit to Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
