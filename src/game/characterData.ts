import { CharacterConfig } from '../types/game';

export const CHARACTERS: CharacterConfig[] = [
  {
    id: 'valente',
    name: 'Leo "Aether" Valente',
    nickname: 'The Sky Magician',
    archetype: 'Creative Football Magician',
    tagline: 'Left-Footed Maestro of Gravity and Curve',
    number: 10,
    fictionalTeam: 'Aetherion Dynamo',
    kitColorPrimary: '#06b6d4', // Cyan
    kitColorSecondary: '#fbbf24', // Gold
    hairColor: '#3b2314', // Dark wavy brunette
    hairStyle: 'curly_tousled',
    skinTone: '#e0a97a',
    stats: {
      speed: 96,
      agility: 98,
      jump: 85,
      power: 82,
      curve: 99,
    },
    specialAbility: {
      name: 'Quantum Warp Curve',
      description: 'Strikes the ball with severe vortex spin that loops unpredictably around defenders into the top corner, while granting a temporary speed burst.',
      cooldownSeconds: 14,
      color: '#06b6d4',
      icon: 'sparkles'
    },
    signatureQuote: 'Football is pure geometry in zero gravity.'
  },
  {
    id: 'rex',
    name: 'Kaelen "Rex" Vance',
    nickname: 'The Apex Striker',
    archetype: 'Powerful Athletic Striker',
    tagline: 'Explosive Kinetic Force & Dominant Aerial Headers',
    number: 7,
    fictionalTeam: 'Vortex Apex',
    kitColorPrimary: '#dc2626', // Crimson Red
    kitColorSecondary: '#f1f5f9', // Platinum White
    hairColor: '#171717', // Jet black sharp fade
    hairStyle: 'fade_undercut',
    skinTone: '#c68652',
    stats: {
      speed: 91,
      agility: 84,
      jump: 99,
      power: 98,
      curve: 80,
    },
    specialAbility: {
      name: 'Meteor Hammer Slam',
      description: 'Vaults with rocket thrusters into a thunderous bicycle strike, launching a blazing fireball shot that knocks back anyone in its path.',
      cooldownSeconds: 14,
      color: '#ef4444',
      icon: 'flame'
    },
    signatureQuote: 'Power, elevation, victory. Nothing stops the strike.'
  },
  {
    id: 'ghost',
    name: 'Sora "Ghost" Takahashi',
    nickname: 'The Phantom Wing',
    archetype: 'Hypersonic Acrobat',
    tagline: 'Lightning Fast Teleport Steps & Flash Volleys',
    number: 11,
    fictionalTeam: 'Neon Ronin',
    kitColorPrimary: '#8b5cf6', // Violet
    kitColorSecondary: '#10b981', // Emerald
    hairColor: '#475569', // Ash slate with spiked fringe
    hairStyle: 'spiked_fringe',
    skinTone: '#f5d0b5',
    stats: {
      speed: 100,
      agility: 96,
      jump: 90,
      power: 78,
      curve: 89,
    },
    specialAbility: {
      name: 'Phantom Shift Drive',
      description: 'Phases forward instantly through opponent lines, converting any near ball into a high-speed sonic drive.',
      cooldownSeconds: 13,
      color: '#8b5cf6',
      icon: 'zap'
    },
    signatureQuote: 'Blink, and the goal is already conceded.'
  },
  {
    id: 'titan',
    name: 'Zane "Titan" Sterling',
    nickname: 'The Iron Colossus',
    archetype: 'Heavyweight Defensive Target Man',
    tagline: 'Unshakable Anchor with Heavy Artillery Headers',
    number: 4,
    fictionalTeam: 'Titan Bastion',
    kitColorPrimary: '#059669', // Emerald Green
    kitColorSecondary: '#f59e0b', // Amber
    hairColor: '#0f172a',
    hairStyle: 'buzz_fade',
    skinTone: '#7c4f32',
    stats: {
      speed: 80,
      agility: 76,
      jump: 94,
      power: 100,
      curve: 75,
    },
    specialAbility: {
      name: 'Graviton Shockwave',
      description: 'Slams the pitch floor, emitting a graviton pulse that repels rival strikers and elevates the ball for an unstoppable power volley.',
      cooldownSeconds: 15,
      color: '#10b981',
      icon: 'shield'
    },
    signatureQuote: 'You cannot pass the Bastion.'
  }
];

export function getCharacterById(id: string): CharacterConfig {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
