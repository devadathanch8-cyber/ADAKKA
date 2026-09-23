/**
 * Types and interfaces for Aether Striker 3D
 */

export type GameMode = 'two_player' | 'vs_ai';
export type BotDifficulty = 'rookie' | 'pro' | 'legend';
export type CameraMode = 'dynamic' | 'broadcast' | 'action';

export type GameStatus = 
  | 'menu' 
  | 'character_select' 
  | 'countdown' 
  | 'playing' 
  | 'goal_scored' 
  | 'paused' 
  | 'game_over';

export interface CharacterStats {
  speed: number;        // 1-100
  agility: number;      // 1-100 (acceleration and turn rate)
  jump: number;         // 1-100 (vertical header reach)
  power: number;        // 1-100 (shot velocity)
  curve: number;        // 1-100 (Magnus spin effect)
}

export interface CharacterConfig {
  id: string;
  name: string;
  nickname: string;
  archetype: string;
  tagline: string;
  number: number;
  fictionalTeam: string;
  kitColorPrimary: string;
  kitColorSecondary: string;
  hairColor: string;
  hairStyle: 'curly_tousled' | 'fade_undercut' | 'spiked_fringe' | 'buzz_fade';
  skinTone: string;
  stats: CharacterStats;
  specialAbility: {
    name: string;
    description: string;
    cooldownSeconds: number;
    color: string;
    icon: string;
  };
  signatureQuote: string;
  avatarUrl?: string;
}

export interface ArenaConfig {
  id: string;
  name: string;
  tagline: string;
  gravityMultiplier: number;
  ballBounciness: number;
  ballFriction: number;
  skyGradient: [string, string];
  fieldBaseColor: string;
  fieldGlowColor: string;
  hologramColor: string;
  description: string;
}

export interface PlayerStatsTracking {
  goals: number;
  shots: number;
  headers: number;
  powerShots: number;
  specialUses: number;
  possessionTime: number; // in seconds
  topShotSpeed: number;   // in km/h
}

export interface PlayerControls {
  left: boolean;
  right: boolean;
  jump: boolean;
  kick: boolean;
  powerKick: boolean;
  special: boolean;
}

export interface MatchSettings {
  mode: GameMode;
  botDifficulty: BotDifficulty;
  durationSeconds: number; // 60, 90, 120
  overtimeEnabled: boolean;
  arenaId: string;
  p1CharacterId: string;
  p2CharacterId: string;
}
