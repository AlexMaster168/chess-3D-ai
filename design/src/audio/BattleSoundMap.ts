/**
 * Maps battle choreographies (attacker_type x defender_type) to sound effect sequences.
 * Each entry defines ordered { time, sound, volume } triggers that sync with the GSAP timeline.
 */

import type { PieceType } from '../types.js';
import type { SoundEffect } from './AudioEngine.js';

export interface SoundCue {
  time: number;   // seconds into the battle timeline
  sound: SoundEffect;
  volume?: number;
}

type SoundFn = (ctx: { attackerX: number; defenderX: number; distance: number }) => SoundCue[];

const swordVsAny: SoundFn = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.5 },
  { time: 0.45, sound: 'sword_swing', volume: 0.7 },
  { time: 0.55, sound: 'sword_clash', volume: 1 },
  { time: 0.6, sound: 'death_scream', volume: 0.5 },
  { time: 0.65, sound: 'death_fall', volume: 0.4 },
];

const spearVsAny: SoundFn = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.4 },
  { time: 0.45, sound: 'spear_thrust', volume: 0.8 },
  { time: 0.55, sound: 'impact_light', volume: 0.6 },
  { time: 0.6, sound: 'death_scream', volume: 0.4 },
  { time: 0.65, sound: 'death_fall', volume: 0.3 },
];

const magicVsAny: SoundFn = (c) => [
  { time: 0, sound: 'magic_charge', volume: 0.6 },
  { time: 0.4, sound: 'magic_blast', volume: 1 },
  { time: 0.55, sound: 'sparkle', volume: 0.5 },
  { time: 0.6, sound: 'death_scream', volume: 0.4 },
  { time: 0.65, sound: 'death_fall', volume: 0.3 },
];

const golemSmash: SoundFn = (c) => [
  { time: 0, sound: 'rumble', volume: 0.5 },
  { time: 0.35, sound: 'rock_smash', volume: 1 },
  { time: 0.45, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.55, sound: 'death_scream', volume: 0.5 },
  { time: 0.6, sound: 'death_fall', volume: 0.5 },
];

const punchCombo: SoundFn = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.4 },
  { time: 0.45, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.55, sound: 'impact_light', volume: 0.6 },
  { time: 0.6, sound: 'death_scream', volume: 0.5 },
  { time: 0.65, sound: 'death_fall', volume: 0.4 },
];

const magicDuel: SoundFn = (c) => [
  { time: 0, sound: 'magic_charge', volume: 0.7 },
  { time: 0.4, sound: 'magic_blast', volume: 1 },
  { time: 0.5, sound: 'magic_blast', volume: 0.8 },
  { time: 0.6, sound: 'sparkle', volume: 0.6 },
  { time: 0.7, sound: 'death_scream', volume: 0.5 },
  { time: 0.75, sound: 'death_fall', volume: 0.4 },
];

const queenVsQueen: SoundFn = (c) => [
  { time: 0, sound: 'magic_charge', volume: 0.8 },
  { time: 0.4, sound: 'magic_blast', volume: 1 },
  { time: 0.5, sound: 'magic_blast', volume: 0.9 },
  { time: 0.6, sound: 'sparkle', volume: 0.7 },
  { time: 0.7, sound: 'sword_clash', volume: 0.5 },
  { time: 0.75, sound: 'death_scream', volume: 0.6 },
  { time: 0.8, sound: 'death_fall', volume: 0.5 },
];

const kingVsKing: SoundFn = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.5 },
  { time: 0.4, sound: 'sword_clash', volume: 1 },
  { time: 0.5, sound: 'shield_block', volume: 0.7 },
  { time: 0.55, sound: 'sword_clash', volume: 0.9 },
  { time: 0.65, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.7, sound: 'death_scream', volume: 0.6 },
  { time: 0.75, sound: 'death_fall', volume: 0.5 },
];

const kingVsRook: SoundFn = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.5 },
  { time: 0.4, sound: 'sword_clash', volume: 0.8 },
  { time: 0.5, sound: 'shield_block', volume: 0.6 },
  { time: 0.55, sound: 'sword_clash', volume: 0.7 },
  { time: 0.65, sound: 'rock_smash', volume: 0.5 },
  { time: 0.75, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.85, sound: 'death_fall', volume: 0.6 },
];

// Map: "attackerType+defenderType" → sound function
const soundMap: Record<string, SoundFn> = {};

// Pawn captures
for (const d of ['p', 'n', 'b', 'r', 'q', 'k'] as PieceType[]) {
  soundMap[`p${d}`] = swordVsAny;
}

// Knight captures
soundMap['np'] = spearVsAny;
soundMap['nn'] = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.5 },
  { time: 0.4, sound: 'sword_swing', volume: 0.7 },
  { time: 0.5, sound: 'sword_clash', volume: 0.9 },
  { time: 0.55, sound: 'impact_light', volume: 0.6 },
  { time: 0.65, sound: 'sword_swing', volume: 0.8 },
  { time: 0.75, sound: 'sword_clash', volume: 1 },
  { time: 0.8, sound: 'death_scream', volume: 0.5 },
  { time: 0.85, sound: 'death_fall', volume: 0.4 },
];
soundMap['nb'] = spearVsAny;
soundMap['nr'] = (c) => [
  { time: 0, sound: 'whoosh', volume: 0.5 },
  { time: 0.35, sound: 'spear_thrust', volume: 0.8 },
  { time: 0.45, sound: 'impact_heavy', volume: 0.7 },
  { time: 0.55, sound: 'rock_smash', volume: 0.5 },
  { time: 0.65, sound: 'death_fall', volume: 0.5 },
];
soundMap['nq'] = spearVsAny;
soundMap['nk'] = spearVsAny;

// Bishop captures
for (const d of ['p', 'n', 'b', 'r', 'q', 'k'] as PieceType[]) {
  soundMap[`b${d}`] = magicVsAny;
}

// Rook (golem) captures
soundMap['rp'] = golemSmash;
soundMap['rn'] = punchCombo;
soundMap['rb'] = (c) => [
  { time: 0, sound: 'rumble', volume: 0.4 },
  { time: 0.35, sound: 'magic_blast', volume: 0.6 },
  { time: 0.5, sound: 'rock_smash', volume: 0.8 },
  { time: 0.6, sound: 'impact_heavy', volume: 0.7 },
  { time: 0.7, sound: 'death_fall', volume: 0.5 },
];
soundMap['rr'] = (c) => [
  { time: 0, sound: 'rumble', volume: 0.5 },
  { time: 0.45, sound: 'rock_smash', volume: 1 },
  { time: 0.55, sound: 'rock_smash', volume: 0.8 },
  { time: 0.65, sound: 'rock_smash', volume: 0.9 },
  { time: 0.75, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.85, sound: 'death_fall', volume: 0.6 },
];
soundMap['rq'] = golemSmash;
soundMap['rk'] = golemSmash;

// Queen captures
for (const d of ['p', 'n'] as PieceType[]) {
  soundMap[`q${d}`] = magicVsAny;
}
soundMap['qb'] = magicDuel;
soundMap['qr'] = magicVsAny;
soundMap['qq'] = queenVsQueen;
soundMap['qk'] = magicVsAny;

// King captures
soundMap['kp'] = swordVsAny;
soundMap['kn'] = swordVsAny;
soundMap['kb'] = swordVsAny;
soundMap['kr'] = kingVsRook;
soundMap['kq'] = (c) => [
  { time: 0, sound: 'magic_charge', volume: 0.6 },
  { time: 0.35, sound: 'whoosh', volume: 0.5 },
  { time: 0.45, sound: 'sword_clash', volume: 0.9 },
  { time: 0.55, sound: 'magic_blast', volume: 0.7 },
  { time: 0.65, sound: 'impact_heavy', volume: 0.8 },
  { time: 0.7, sound: 'death_scream', volume: 0.6 },
  { time: 0.75, sound: 'death_fall', volume: 0.5 },
];
soundMap['kk'] = kingVsKing;

export function getBattleSounds(
  attackerType: PieceType,
  defenderType: PieceType,
): SoundCue[] {
  const key = `${attackerType}${defenderType}`;
  const fn = soundMap[key] ?? swordVsAny;
  return fn({ attackerX: 0, defenderX: 1, distance: 1 });
}
