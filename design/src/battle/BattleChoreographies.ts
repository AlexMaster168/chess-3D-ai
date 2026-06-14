import * as THREE from 'three';
import { gsap } from 'gsap';
import type { PieceType } from '../types.js';
import type { BattleParts } from './BattleParts.js';
import { findPart, showParts, hideAllParts } from './BattleParts.js';

export interface BattleContext {
  attackerParts: BattleParts;
  defenderParts: BattleParts;
  attackerGroup: THREE.Group;
  defenderGroup: THREE.Group;
  attackerPos: { x: number; z: number };
  defenderPos: { x: number; z: number };
  speedMul: number;
  spawnBurst: (x: number, y: number, z: number, count: number, opts?: Record<string, unknown>) => void;
  spawnShockwave: (x: number, y: number, z: number, opts?: Record<string, unknown>) => void;
}

type BattleFn = (ctx: BattleContext) => gsap.core.Timeline;

function hideDefender(ctx: BattleContext): void {
  ctx.defenderGroup.visible = false;
}

function showDefender(ctx: BattleContext): void {
  ctx.defenderGroup.visible = true;
}

function spawnDeathParticles(ctx: BattleContext, color: number = 0xffd28a): void {
  const dp = ctx.defenderGroup.position;
  ctx.spawnBurst(dp.x, dp.y + 0.4, dp.z, 120, { color, speed: 1.2, size: 0.12, maxLife: 0.7 });
  ctx.spawnBurst(dp.x, dp.y + 0.4, dp.z, 40, { color: 0xffffff, speed: 1.8, size: 0.06, maxLife: 0.4 });
  ctx.spawnShockwave(dp.x, 0.03, dp.z, { color: 0xffe4a8, finalScale: 5 });
}

function spawnMagicParticles(ctx: BattleContext, color: number = 0x44aaff): void {
  const ap = ctx.attackerGroup.position;
  ctx.spawnBurst(ap.x, ap.y + 0.8, ap.z, 80, { color, speed: 1.5, size: 0.08, maxLife: 0.9 });
}

function spawnBloodParticles(ctx: BattleContext): void {
  const dp = ctx.defenderGroup.position;
  ctx.spawnBurst(dp.x, dp.y + 0.3, dp.z, 60, { color: 0xff2222, speed: 0.8, size: 0.06, maxLife: 0.5 });
}

function defenderFall(ctx: BattleContext, tl: gsap.core.Timeline, style: 'forward' | 'back' | 'spin' | 'crumble' = 'forward'): void {
  const d = ctx.defenderGroup;
  const dur = 0.5;
  switch (style) {
    case 'forward':
      tl.to(d.rotation, { x: Math.PI / 2, duration: dur, ease: 'power2.in' }, '<');
      tl.to(d.position, { y: -0.2, duration: dur, ease: 'power2.in' }, '<');
      break;
    case 'back':
      tl.to(d.rotation, { x: -Math.PI / 2, duration: dur, ease: 'power2.in' }, '<');
      tl.to(d.position, { y: -0.2, duration: dur, ease: 'power2.in' }, '<');
      break;
    case 'spin':
      tl.to(d.rotation, { y: Math.PI * 3, duration: dur * 1.2, ease: 'power1.out' }, '<');
      tl.to(d.rotation, { x: Math.PI / 2, duration: dur, ease: 'power2.in' }, '<');
      tl.to(d.position, { y: -0.3, duration: dur, ease: 'power2.in' }, '<');
      break;
    case 'crumble':
      tl.to(d.scale, { x: 0.3, y: 0.1, z: 0.3, duration: dur, ease: 'power3.in' }, '<');
      tl.to(d.position, { y: -0.15, duration: dur, ease: 'power3.in' }, '<');
      break;
  }
}

function approachAndFace(
  tl: gsap.core.Timeline,
  ctx: BattleContext,
  attackerOffset: { x: number; z: number },
  defenderOffset: { x: number; z: number },
  duration: number = 0.4
): void {
  const a = ctx.attackerGroup;
  const d = ctx.defenderGroup;
  const ax = ctx.attackerPos.x;
  const az = ctx.attackerPos.z;
  const dx = ctx.defenderPos.x;
  const dz = ctx.defenderPos.z;

  tl.to(a.position, { x: ax + attackerOffset.x, z: az + attackerOffset.z, duration, ease: 'power2.inOut' });
  tl.to(d.position, { x: dx + defenderOffset.x, z: dz + defenderOffset.z, duration, ease: 'power2.inOut' }, '<');

  const angle = Math.atan2(dz - az, dx - ax);
  tl.to(a.rotation, { y: angle, duration: duration * 0.5, ease: 'power1.out' }, '<');
  tl.to(d.rotation, { y: angle + Math.PI, duration: duration * 0.5, ease: 'power1.out' }, '<');
}

const battles: Record<string, BattleFn> = {};

// ═══════════════════════════════════════════════════════════════════
// PAWN ATTACKS (p) - Small footman with sword
// ═══════════════════════════════════════════════════════════════════

// Pawn vs Pawn: Quick sword slash
battles['pvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.25 }, { x: 0, z: 0.25 });
  tl.to(ctx.attackerGroup.rotation, { z: -0.8, duration: 0.1, ease: 'power2.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.2, duration: 0.1, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.8, duration: 0.12, ease: 'power3.out' }, 0.5);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// Pawn vs Knight: Sword slash from below
battles['pvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 });
  tl.to(ctx.attackerGroup.rotation, { z: -1.0, duration: 0.12, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0.15, duration: 0.1, ease: 'power2.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 1.0, duration: 0.15, ease: 'power3.out' }, 0.52);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.1 }, 0.52);
  tl.call(() => spawnBloodParticles(ctx), [], 0.58);
  tl.call(() => spawnDeathParticles(ctx), [], 0.58);
  tl.call(() => hideDefender(ctx), [], 0.63);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Pawn vs Bishop: Stab through the robe
battles['pvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.25 }, { x: 0, z: 0.25 });
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.3, duration: 0.12, ease: 'power3.out' }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.45);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Pawn vs Rook: Bold slash at the golem
battles['pvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 });
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.15, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.1, ease: 'power2.out' }, 0.4);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Pawn vs Queen: Quick stab
battles['pvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 });
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.1, ease: 'power3.out' }, 0.45);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Pawn vs King: Desperate slash
battles['pvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 });
  tl.to(ctx.attackerGroup.rotation, { z: -0.9, duration: 0.1, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.2, duration: 0.08, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.7, duration: 0.12, ease: 'power3.out' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// KNIGHT ATTACKS (n) - Mounted warrior with lance
// ═══════════════════════════════════════════════════════════════════

// Knight vs Pawn: Lance charge
battles['nvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.3);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.5, duration: 0.2, ease: 'power3.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0.15, duration: 0.1, ease: 'power2.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.15, ease: 'power4.in' }, 0.5);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// Knight vs Knight: Epic lance duel
battles['nvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.2 }, { x: 0, z: 0.2 }, 0.3);
  tl.call(() => showDefender(ctx), [], 0);
  // First clash
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.3, duration: 0.15, ease: 'power3.out' }, 0.35);
  tl.call(() => ctx.spawnBurst(ctx.defenderPos.x, 0.5, ctx.defenderPos.z, 30, { color: 0xffffff, speed: 1.0, size: 0.05, maxLife: 0.3 }), [], 0.4);
  // Second clash
  tl.to(ctx.attackerGroup.rotation, { z: -0.6, duration: 0.1, ease: 'power2.out' }, 0.55);
  tl.to(ctx.attackerGroup.rotation, { z: 0.8, duration: 0.15, ease: 'power3.out' }, 0.65);
  tl.call(() => spawnBloodParticles(ctx), [], 0.7);
  tl.call(() => spawnDeathParticles(ctx), [], 0.7);
  tl.call(() => hideDefender(ctx), [], 0.75);
  defenderFall(ctx, tl, 'spin');
  tl.to(ctx.attackerGroup.rotation, { z: 0, duration: 0.2, ease: 'power2.out' }, 0.9);
  return tl;
};

// Knight vs Bishop: Lance thrust
battles['nvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.3);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.4, duration: 0.18, ease: 'power3.out' }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.4);
  tl.call(() => spawnBloodParticles(ctx), [], 0.5);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.5);
  tl.call(() => hideDefender(ctx), [], 0.55);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Knight vs Rook: Charging lance vs golem
battles['nvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.4 }, { x: 0, z: 0.4 }, 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.6, duration: 0.25, ease: 'power2.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0.2, duration: 0.12, ease: 'power2.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.18, ease: 'power4.in' }, 0.52);
  tl.call(() => spawnBloodParticles(ctx), [], 0.6);
  tl.call(() => spawnDeathParticles(ctx), [], 0.6);
  tl.call(() => hideDefender(ctx), [], 0.65);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Knight vs Queen: Swift lance strike
battles['nvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.3);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.3);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.45, duration: 0.2, ease: 'power3.out' }, 0.35);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Knight vs King: Bold charge
battles['nvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.3);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.4, duration: 0.18, ease: 'power3.out' }, 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: -0.5, duration: 0.1 }, 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: 0.7, duration: 0.15, ease: 'power3.out' }, 0.5);
  tl.call(() => spawnBloodParticles(ctx), [], 0.58);
  tl.call(() => spawnDeathParticles(ctx), [], 0.58);
  tl.call(() => hideDefender(ctx), [], 0.63);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// BISHOP ATTACKS (b) - Robed mage with staff
// ═══════════════════════════════════════════════════════════════════

// Bishop vs Pawn: Magic blast
battles['bvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.4 }, { x: 0, z: 0.4 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.15, duration: 0.12 }, 0.4);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.5);
  tl.call(() => hideDefender(ctx), [], 0.55);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Bishop vs Knight: Magic bolt
battles['bvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.3);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.4);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.2, duration: 0.18 }, 0.35);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Bishop vs Bishop: Magic duel
battles['bvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: -0.3, z: 0 }, { x: 0.3, z: 0 }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0xff6644), [], 0.5);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.1 }, 0.45);
  tl.to(ctx.attackerGroup.rotation, { z: 0, duration: 0.15 }, 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0x8844ff), [], 0.65);
  tl.call(() => hideDefender(ctx), [], 0.7);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Bishop vs Rook: Disintegration spell
battles['bvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.5 }, { x: 0, z: 0.5 }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.45);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0x696969), [], 0.7);
  tl.call(() => hideDefender(ctx), [], 0.75);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Bishop vs Queen: Arcane duel
battles['bvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: -0.3, z: 0 }, { x: 0.3, z: 0 }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.5);
  tl.to(ctx.attackerGroup.position, { x: ctx.attackerGroup.position.x + 0.15, duration: 0.12 }, 0.5);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.6);
  tl.call(() => hideDefender(ctx), [], 0.65);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Bishop vs King: Holy smite
battles['bvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.4 }, { x: 0, z: 0.4 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.2, duration: 0.18 }, 0.4);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// ROOK ATTACKS (r) - Stone golem with fists
// ═══════════════════════════════════════════════════════════════════

// Rook vs Pawn: Golem smash
battles['rvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.3);
  tl.to(ctx.attackerGroup.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.15 }, 0.25);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.3, duration: 0.1, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0.15, duration: 0.08, ease: 'power2.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.12, ease: 'power4.in' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.5);
  tl.call(() => spawnDeathParticles(ctx), [], 0.5);
  tl.call(() => hideDefender(ctx), [], 0.55);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// Rook vs Knight: Double fist slam
battles['rvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.3);
  tl.to(ctx.attackerGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.18 }, 0.25);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.12 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.3, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.1 }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Rook vs Bishop: Crushing blow
battles['rvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.3);
  tl.to(ctx.attackerGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.18 }, 0.25);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.35, duration: 0.12, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0.2, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.1, ease: 'power4.in' }, 0.48);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.45);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Rook vs Rook: Golem vs Golem - triple punch
battles['rvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: -0.2, z: 0 }, { x: 0.2, z: 0 }, 0.35);
  tl.to(ctx.attackerGroup.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.2 }, 0.3);
  tl.to(ctx.attackerGroup.rotation, { z: 0.3, duration: 0.1 }, 0.45);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.1 }, 0.55);
  tl.to(ctx.attackerGroup.rotation, { z: 0.3, duration: 0.1 }, 0.65);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnBloodParticles(ctx), [], 0.65);
  tl.call(() => spawnDeathParticles(ctx, 0x696969), [], 0.75);
  tl.call(() => hideDefender(ctx), [], 0.8);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Rook vs Queen: Devastating slam
battles['rvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.3);
  tl.to(ctx.attackerGroup.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.18 }, 0.25);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.3, duration: 0.12 }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0.18, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.1 }, 0.48);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.45);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Rook vs King: Earthquake slam
battles['rvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.3);
  tl.to(ctx.attackerGroup.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.2 }, 0.25);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.1 }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0.12, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.12, ease: 'power4.in' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// QUEEN ATTACKS (q) - Armored sorceress with magic
// ═══════════════════════════════════════════════════════════════════

// Queen vs Pawn: Levitate and crush
battles['qvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.45 }, { x: 0, z: 0.45 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff88ff), [], 0.45);
  tl.to(ctx.attackerGroup.position, { y: 0.3, duration: 0.2, ease: 'power2.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.25, ease: 'power2.in' }, 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.65);
  tl.call(() => hideDefender(ctx), [], 0.7);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Queen vs Knight: Arcane blast
battles['qvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.4 }, { x: 0, z: 0.4 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0.25, duration: 0.18 }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.2 }, 0.53);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.6);
  tl.call(() => hideDefender(ctx), [], 0.65);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Queen vs Bishop: Superior magic
battles['qvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: -0.3, z: 0 }, { x: 0.3, z: 0 }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.5);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.1 }, 0.45);
  tl.to(ctx.attackerGroup.rotation, { z: 0, duration: 0.15 }, 0.55);
  tl.call(() => spawnDeathParticles(ctx, 0x8844ff), [], 0.65);
  tl.call(() => hideDefender(ctx), [], 0.7);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// Queen vs Rook: Levitation + slam
battles['qvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.45 }, { x: 0, z: 0.45 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff88ff), [], 0.45);
  tl.to(ctx.attackerGroup.position, { y: 0.35, duration: 0.25, ease: 'power2.out' }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.25, ease: 'power2.in' }, 0.6);
  tl.call(() => spawnDeathParticles(ctx, 0x696969), [], 0.7);
  tl.call(() => hideDefender(ctx), [], 0.75);
  defenderFall(ctx, tl, 'crumble');
  return tl;
};

// Queen vs Queen: Epic magic duel
battles['qvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: -0.4, z: 0 }, { x: 0.4, z: 0 }, 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.4);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.5);
  tl.to(ctx.attackerGroup.position, { y: 0.35, duration: 0.2, ease: 'power2.out' }, 0.4);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.25 }, 0.6);
  tl.call(() => spawnMagicParticles(ctx, 0xff88ff), [], 0.7);
  tl.to(ctx.attackerGroup.position, { y: 0.3, duration: 0.18 }, 0.75);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.2 }, 0.93);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 1.0);
  tl.call(() => hideDefender(ctx), [], 1.05);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// Queen vs King: Final arcane strike
battles['qvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.4 }, { x: 0, z: 0.4 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff88ff), [], 0.45);
  tl.to(ctx.attackerGroup.position, { y: 0.3, duration: 0.2 }, 0.35);
  tl.to(ctx.attackerGroup.position, { y: 0, duration: 0.25 }, 0.55);
  tl.call(() => spawnBloodParticles(ctx), [], 0.65);
  tl.call(() => spawnDeathParticles(ctx), [], 0.65);
  tl.call(() => hideDefender(ctx), [], 0.7);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// KING ATTACKS (k) - Armored warrior king with sword
// ═══════════════════════════════════════════════════════════════════

// King vs Pawn: Decisive sword blow
battles['kvp'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: -0.5, duration: 0.1 }, 0.4);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.2, duration: 0.08, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.12, ease: 'power3.out' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

// King vs Knight: Shield bash + sword
battles['kvn'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: -0.4, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.15, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.12, ease: 'power3.out' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.55);
  tl.call(() => spawnDeathParticles(ctx), [], 0.55);
  tl.call(() => hideDefender(ctx), [], 0.6);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// King vs Bishop: Sword slash through mage
battles['kvb'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.12, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.5, duration: 0.12, ease: 'power3.out' }, 0.45);
  tl.call(() => spawnMagicParticles(ctx, 0x44aaff), [], 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx, 0x44aaff), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'back');
  return tl;
};

// King vs Rook: Epic multi-hit vs golem
battles['kvr'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.3 }, { x: 0, z: 0.3 }, 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.5, duration: 0.12 }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.5);
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.08 }, 0.6);
  tl.to(ctx.attackerGroup.rotation, { z: 0.5, duration: 0.12 }, 0.68);
  tl.call(() => spawnBloodParticles(ctx), [], 0.7);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.35, duration: 0.12 }, 0.8);
  tl.to(ctx.attackerGroup.rotation, { z: 0.7, duration: 0.12, ease: 'power3.out' }, 0.85);
  tl.call(() => spawnDeathParticles(ctx, 0x696969), [], 0.95);
  tl.call(() => hideDefender(ctx), [], 1.0);
  defenderFall(ctx, tl, 'crumble');
  tl.to(ctx.attackerGroup.rotation, { z: 0, duration: 0.25, ease: 'power2.out' }, 1.15);
  return tl;
};

// King vs Queen: Desperate sword duel
battles['kvq'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.35 }, { x: 0, z: 0.35 }, 0.35);
  tl.call(() => spawnMagicParticles(ctx, 0xff44ff), [], 0.35);
  tl.to(ctx.attackerGroup.rotation, { z: -0.4, duration: 0.08 }, 0.45);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.12, ease: 'power3.out' }, 0.53);
  tl.call(() => spawnBloodParticles(ctx), [], 0.6);
  tl.call(() => spawnDeathParticles(ctx, 0xff44ff), [], 0.6);
  tl.call(() => hideDefender(ctx), [], 0.65);
  defenderFall(ctx, tl, 'spin');
  return tl;
};

// King vs King: Ultimate duel
battles['kvk'] = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.25 }, { x: 0, z: 0.25 }, 0.35);
  // First clash
  tl.to(ctx.attackerGroup.rotation, { z: -0.3, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.5, duration: 0.12, ease: 'power3.out' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  // Second clash
  tl.to(ctx.attackerGroup.rotation, { z: -0.4, duration: 0.08 }, 0.65);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.12, ease: 'power3.out' }, 0.73);
  tl.call(() => spawnBloodParticles(ctx), [], 0.77);
  // Final blow
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.25, duration: 0.1 }, 0.9);
  tl.to(ctx.attackerGroup.rotation, { z: -0.5, duration: 0.06 }, 0.9);
  tl.to(ctx.attackerGroup.rotation, { z: 0.8, duration: 0.15, ease: 'power3.out' }, 0.96);
  tl.call(() => spawnDeathParticles(ctx), [], 1.08);
  tl.call(() => hideDefender(ctx), [], 1.13);
  defenderFall(ctx, tl, 'forward');
  tl.to(ctx.attackerGroup.rotation, { z: 0, duration: 0.25, ease: 'power2.out' }, 1.3);
  return tl;
};

// ═══════════════════════════════════════════════════════════════════
// BLACK PIECE ATTACKS (mirror with color prefix)
// ═══════════════════════════════════════════════════════════════════

const allBattles: Record<string, BattleFn> = {};

// Add all base battles
for (const [key, fn] of Object.entries(battles)) {
  allBattles[key] = fn;
  // Also add color-prefixed versions
  allBattles[`w${key}`] = fn;
  allBattles[`b${key}`] = fn;
}

const defaultBattle: BattleFn = (ctx) => {
  const tl = gsap.timeline();
  approachAndFace(tl, ctx, { x: 0, z: -0.25 }, { x: 0, z: 0.25 }, 0.35);
  tl.to(ctx.attackerGroup.position, { z: ctx.attackerGroup.position.z + 0.3, duration: 0.12, ease: 'power3.out' }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: -0.4, duration: 0.08 }, 0.4);
  tl.to(ctx.attackerGroup.rotation, { z: 0.6, duration: 0.12, ease: 'power3.out' }, 0.48);
  tl.call(() => spawnBloodParticles(ctx), [], 0.52);
  tl.call(() => spawnDeathParticles(ctx), [], 0.52);
  tl.call(() => hideDefender(ctx), [], 0.57);
  defenderFall(ctx, tl, 'forward');
  return tl;
};

export function getBattleTimeline(
  attackerType: PieceType,
  defenderType: PieceType,
  attackerColor: string,
  defenderColor: string,
  ctx: BattleContext
): gsap.core.Timeline {
  const key1 = `${attackerColor}${attackerType}v${defenderColor}${defenderType}`;
  const key2 = `${attackerType}v${defenderType}`;
  const fn = allBattles[key1] ?? allBattles[key2] ?? defaultBattle;
  return fn(ctx);
}
