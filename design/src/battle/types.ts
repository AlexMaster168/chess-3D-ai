import * as THREE from 'three';
import type { PieceType, PieceColor } from '../types.js';

export type AttackerType = PieceType;
export type DefenderType = PieceType;

export interface BattleKey {
  attacker: PieceType;
  defender: PieceType;
  attackerColor: PieceColor;
  defenderColor: PieceColor;
}

export type BattlePhase = 'intro' | 'approach' | 'attack' | 'impact' | 'death' | 'victory' | 'outro';

export interface BattleContext {
  attackerGroup: THREE.Group;
  defenderGroup: THREE.Group;
  attackerWorldPos: { x: number; z: number };
  defenderWorldPos: { x: number; z: number };
  speedMul: number;
  onComplete: () => void;
}

export const BATTLE_DURATION_BASE = 2.8;
