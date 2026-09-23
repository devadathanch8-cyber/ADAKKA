import React, { useState } from 'react';
import { ArrowLeft, Play, Sparkles, Flame, Zap, Shield, ChevronRight, Award } from 'lucide-react';
import { CharacterConfig, MatchSettings } from '../types/game';
import { CHARACTERS, getCharacterById } from '../game/characterData';
import { soundManager } from '../audio/soundManager';

interface CharacterSelectProps {
  settings: MatchSettings;
  onConfirm: (p1CharId: string, p2CharId: string) => void;
  onBack: () => void;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  settings,
  onConfirm,
  onBack,
}) => {
  const [p1SelectedId, setP1SelectedId] = useState<string>(settings.p1CharacterId || 'valente');
  const [p2SelectedId, setP2SelectedId] = useState<string>(settings.p2CharacterId || 'rex');
  const [activeSide, setActiveSide] = useState<'p1' | 'p2'>('p1');

  const p1Char = getCharacterById(p1SelectedId);
  const p2Char = getCharacterById(p2SelectedId);

  const getAbilityIcon = (name: string) => {
    switch (name) {
      case 'sparkles':
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
      case 'flame':
        return <Flame className="w-5 h-5 text-red-400" />;
      case 'zap':
        return <Zap className="w-5 h-5 text-purple-400" />;
      default:
        return <Shield className="w-5 h-5 text-emerald-400" />;
    }
  };

  const handleSelectCharacter = (charId: string) => {
    soundManager.playMenuClick();
    if (activeSide === 'p1') {
      setP1SelectedId(charId);
      if (settings.mode === 'two_player') {
        setActiveSide('p2');
      }
    } else {
      setP2SelectedId(charId);
    }
  };

  const handleStartMatch = () => {
    soundManager.playWhistle(false);
    onConfirm(p1SelectedId, p2SelectedId);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-8 z-20 text-white select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            soundManager.playMenuClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-sm font-semibold transition-all hover:text-cyan-400"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-black font-chakra uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-amber-300 bg-clip-text text-transparent">
            Select Your Superstar
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            {settings.mode === 'two_player' ? 'Player 1 & Player 2 Roster' : 'Player 1 vs Bot Roster'}
          </p>
        </div>

        {/* Tab switcher on small screens */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              soundManager.playMenuClick();
              setActiveSide('p1');
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeSide === 'p1' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            P1
          </button>
          <button
            onClick={() => {
              soundManager.playMenuClick();
              setActiveSide('p2');
            }}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
              activeSide === 'p2' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {settings.mode === 'two_player' ? 'P2' : 'BOT'}
          </button>
        </div>
      </div>

      {/* Main Roster Grid */}
      <div className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch py-4">
        {/* Left Column: Player 1 Profile Card */}
        <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-cyan-500/40 p-5 flex flex-col justify-between shadow-[0_0_25px_rgba(6,182,212,0.2)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                PLAYER 1 (HOME)
              </span>
              <span className="text-xl font-black font-chakra text-cyan-400">#{p1Char.number}</span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-black font-chakra text-white leading-tight">{p1Char.name}</h3>
              <p className="text-xs text-cyan-300 font-bold tracking-wide mt-0.5">{p1Char.nickname}</p>
              <div className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-medium border border-slate-700">
                {p1Char.fictionalTeam} • {p1Char.archetype}
              </div>
            </div>

            {/* Quote */}
            <p className="text-xs italic text-slate-400 mt-3 border-l-2 border-cyan-500 pl-2">
              "{p1Char.signatureQuote}"
            </p>

            {/* Stats Breakdown */}
            <div className="mt-5 space-y-2 text-xs">
              <StatBar label="Speed" value={p1Char.stats.speed} color="bg-cyan-400" />
              <StatBar label="Agility" value={p1Char.stats.agility} color="bg-cyan-400" />
              <StatBar label="Aerial Jump" value={p1Char.stats.jump} color="bg-sky-400" />
              <StatBar label="Shot Power" value={p1Char.stats.power} color="bg-amber-400" />
              <StatBar label="Curve / Spin" value={p1Char.stats.curve} color="bg-purple-400" />
            </div>
          </div>

          {/* Special Move Card */}
          <div className="mt-5 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
            <div className="flex items-center gap-2">
              {getAbilityIcon(p1Char.specialAbility.icon)}
              <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                Special: {p1Char.specialAbility.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              {p1Char.specialAbility.description}
            </p>
          </div>
        </div>

        {/* Center Column: Character Selection Cards */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3">
          <div className="text-center mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Assigning to: <span className={activeSide === 'p1' ? 'text-cyan-400' : 'text-red-400'}>{activeSide.toUpperCase()}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CHARACTERS.map((char) => {
              const isP1 = p1SelectedId === char.id;
              const isP2 = p2SelectedId === char.id;

              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectCharacter(char.id)}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    (activeSide === 'p1' && isP1) || (activeSide === 'p2' && isP2)
                      ? 'bg-slate-800/90 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.03]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Badges for selected */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-black font-chakra" style={{ color: char.kitColorPrimary }}>
                      #{char.number}
                    </span>
                    <div className="flex gap-1">
                      {isP1 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950">
                          P1
                        </span>
                      )}
                      {isP2 && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-500 text-white">
                          P2
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-white line-clamp-1">{char.name}</h4>
                  <p className="text-[10px] text-slate-400">{char.archetype}</p>

                  {/* Kit color swatch */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: char.kitColorPrimary }} />
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: char.kitColorSecondary }} />
                    <span className="text-[10px] text-slate-400 ml-1">{char.fictionalTeam}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Match Confirm Button */}
          <div className="pt-4">
            <button
              onClick={handleStartMatch}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 text-slate-950 font-black font-chakra text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Kick Off Match</span>
            </button>
          </div>
        </div>

        {/* Right Column: Player 2 Profile Card */}
        <div className="lg:col-span-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border-2 border-red-500/40 p-5 flex flex-col justify-between shadow-[0_0_25px_rgba(239,68,68,0.2)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black tracking-widest uppercase px-2.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                {settings.mode === 'two_player' ? 'PLAYER 2 (AWAY)' : 'AI BOT (AWAY)'}
              </span>
              <span className="text-xl font-black font-chakra text-red-400">#{p2Char.number}</span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-black font-chakra text-white leading-tight">{p2Char.name}</h3>
              <p className="text-xs text-red-300 font-bold tracking-wide mt-0.5">{p2Char.nickname}</p>
              <div className="inline-block mt-2 px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 font-medium border border-slate-700">
                {p2Char.fictionalTeam} • {p2Char.archetype}
              </div>
            </div>

            {/* Quote */}
            <p className="text-xs italic text-slate-400 mt-3 border-l-2 border-red-500 pl-2">
              "{p2Char.signatureQuote}"
            </p>

            {/* Stats Breakdown */}
            <div className="mt-5 space-y-2 text-xs">
              <StatBar label="Speed" value={p2Char.stats.speed} color="bg-red-400" />
              <StatBar label="Agility" value={p2Char.stats.agility} color="bg-red-400" />
              <StatBar label="Aerial Jump" value={p2Char.stats.jump} color="bg-amber-400" />
              <StatBar label="Shot Power" value={p2Char.stats.power} color="bg-rose-400" />
              <StatBar label="Curve / Spin" value={p2Char.stats.curve} color="bg-purple-400" />
            </div>
          </div>

          {/* Special Move Card */}
          <div className="mt-5 p-3 rounded-xl bg-red-950/40 border border-red-500/30">
            <div className="flex items-center gap-2">
              {getAbilityIcon(p2Char.specialAbility.icon)}
              <span className="text-xs font-bold text-red-300 uppercase tracking-wide">
                Special: {p2Char.specialAbility.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-snug">
              {p2Char.specialAbility.description}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-xs text-slate-500 font-semibold">
        Click a character or change assignment tab to select. Both players can choose the same superstar for a mirror match!
      </div>
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};
