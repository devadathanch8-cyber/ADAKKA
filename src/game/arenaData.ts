import { ArenaConfig } from '../types/game';

export const ARENAS: ArenaConfig[] = [
  {
    id: 'neo_olympus',
    name: 'Neo-Olympus Sky Stadium',
    tagline: '10,000 Feet Above the Megacity',
    gravityMultiplier: 1.0,
    ballBounciness: 0.82,
    ballFriction: 0.985,
    skyGradient: ['#0f172a', '#1e1b4b'],
    fieldBaseColor: '#042f2e',
    fieldGlowColor: '#06b6d4',
    hologramColor: '#38bdf8',
    description: 'Suspended in the clouds by twin anti-gravity turbines above the neon metropolis. Crisp standard tournament physics with high visibility.'
  },
  {
    id: 'solaris_sunset',
    name: 'Solaris Sunset Deck',
    tagline: 'Floating Orbital Horizon',
    gravityMultiplier: 0.96,
    ballBounciness: 0.85,
    ballFriction: 0.99,
    skyGradient: ['#450a0a', '#78350f'],
    fieldBaseColor: '#1c1917',
    fieldGlowColor: '#f59e0b',
    hologramColor: '#fbbf24',
    description: 'Basked in the radiant warmth of a perpetual cyber sunset with orbital light rings. Smoother turf with faster ball rollout.'
  },
  {
    id: 'cyber_grid',
    name: 'Cyber-Grid Colosseum',
    tagline: 'High-Voltage Zero-G Apex',
    gravityMultiplier: 0.90,
    ballBounciness: 0.92,
    ballFriction: 0.995,
    skyGradient: ['#1e1035', '#0f051d'],
    fieldBaseColor: '#090514',
    fieldGlowColor: '#d946ef',
    hologramColor: '#ec4899',
    description: 'Electrified magnetic boundary fields with low-gravity boost. High-flying headers and acrobatic aerial bounces guaranteed.'
  }
];

export function getArenaById(id: string): ArenaConfig {
  return ARENAS.find(a => a.id === id) || ARENAS[0];
}
