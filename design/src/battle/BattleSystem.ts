import * as THREE from 'three';
import { gsap } from 'gsap';
import type { PieceType, PieceColor } from '../types.js';
import { Piece } from '../pieces/Piece.js';
import { createBattleParts, attachBattleParts, detachBattleParts, hideAllParts, type BattleParts } from './BattleParts.js';
import { getBattleTimeline, type BattleContext } from './BattleChoreographies.js';
import { squareToWorld } from '../util/notation.js';
import { getAudioEngine, type AudioEngine } from '../audio/AudioEngine.js';
import { getBattleSounds } from '../audio/BattleSoundMap.js';

export interface BattleSystemDeps {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  cameraTarget: THREE.Vector3;
  renderer: THREE.WebGLRenderer;
  spawnBurst: (x: number, y: number, z: number, count: number, opts?: Record<string, unknown>) => void;
  spawnShockwave: (x: number, y: number, z: number, opts?: Record<string, unknown>) => void;
  audio?: AudioEngine;
}

export interface BattleRequest {
  attacker: Piece;
  defender: Piece;
  speedMul: number;
  onCaptureComplete: () => void;
}

export class BattleSystem {
  private deps: BattleSystemDeps;
  private isBattleActive = false;
  private battleQueue: BattleRequest[] = [];
  private attackerPartsMap = new Map<string, BattleParts>();
  private defenderPartsMap = new Map<string, BattleParts>();
  private savedCameraPos: THREE.Vector3 | null = null;
  private savedCameraTarget: THREE.Vector3 | null = null;

  constructor(deps: BattleSystemDeps) {
    this.deps = deps;
  }

  get active(): boolean {
    return this.isBattleActive;
  }

  private getOrCreateParts(piece: Piece, map: Map<string, BattleParts>): BattleParts {
    let parts = map.get(piece.id);
    if (!parts) {
      parts = createBattleParts(piece.type);
      attachBattleParts(piece.group, parts);
      map.set(piece.id, parts);
    }
    return parts;
  }

  private cleanupParts(piece: Piece, map: Map<string, BattleParts>): void {
    const parts = map.get(piece.id);
    if (parts) {
      detachBattleParts(piece.group, parts);
      map.delete(piece.id);
    }
  }

  removePieceParts(piece: Piece): void {
    this.cleanupParts(piece, this.attackerPartsMap);
    this.cleanupParts(piece, this.defenderPartsMap);
  }

  async playBattle(request: BattleRequest): Promise<void> {
    this.battleQueue.push(request);
    if (!this.isBattleActive) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    if (this.battleQueue.length === 0) return;
    this.isBattleActive = true;

    const request = this.battleQueue.shift()!;
    await this.executeBattle(request);

    this.isBattleActive = false;
    if (this.battleQueue.length > 0) {
      await this.processQueue();
    }
  }

  private async executeBattle(request: BattleRequest): Promise<void> {
    const { attacker, defender, speedMul, onCaptureComplete } = request;
    const attackerParts = this.getOrCreateParts(attacker, this.attackerPartsMap);
    const defenderParts = this.getOrCreateParts(defender, this.defenderPartsMap);

    hideAllParts(attackerParts);
    hideAllParts(defenderParts);
    defender.group.visible = true;

    const savedAttackerPos = attacker.group.position.clone();
    const savedDefenderPos = defender.group.position.clone();
    const savedAttackerRot = attacker.group.rotation.clone();
    const savedDefenderRot = defender.group.rotation.clone();
    const savedAttackerScale = attacker.group.scale.clone();
    const savedDefenderScale = defender.group.scale.clone();

    // Dramatic camera: zoom in on the battle
    const midpoint = new THREE.Vector3().addVectors(savedAttackerPos, savedDefenderPos).multiplyScalar(0.5);
    this.zoomCameraToBattle(midpoint, speedMul);

    const battleCtx: BattleContext = {
      attackerParts,
      defenderParts,
      attackerGroup: attacker.group,
      defenderGroup: defender.group,
      attackerPos: { x: savedAttackerPos.x, z: savedAttackerPos.z },
      defenderPos: { x: savedDefenderPos.x, z: savedDefenderPos.z },
      speedMul,
      spawnBurst: this.deps.spawnBurst,
      spawnShockwave: this.deps.spawnShockwave
    };

    const tl = getBattleTimeline(
      attacker.type,
      defender.type,
      attacker.color,
      defender.color,
      battleCtx
    );

    const battleDuration = tl.duration();
    const audio = this.deps.audio ?? getAudioEngine();
    const sounds = getBattleSounds(attacker.type, defender.type);

    // Schedule sound effects at the right moments
    for (const cue of sounds) {
      const adjustedTime = cue.time / speedMul;
      if (adjustedTime < battleDuration) {
        gsap.delayedCall(adjustedTime, () => {
          audio.play(cue.sound, cue.volume ?? 1);
        });
      }
    }

    // Camera shake on impact (around 0.5-0.6s into battle)
    const shakeTime = 0.5 / speedMul;
    if (shakeTime < battleDuration) {
      gsap.delayedCall(shakeTime, () => {
        this.shakeCamera(0.3, 0.12);
      });
    }

    await new Promise<void>((resolve) => {
      tl.eventCallback('onComplete', () => {
        // Move attacker to defender's position (the capture)
        attacker.group.position.set(
          savedDefenderPos.x,
          0,
          savedDefenderPos.z
        );
        attacker.group.rotation.copy(savedAttackerRot);
        attacker.group.scale.copy(savedAttackerScale);

        hideAllParts(attackerParts);
        hideAllParts(defenderParts);

        this.deps.scene.remove(defender.group);

        // Restore camera after battle
        this.restoreCamera();

        onCaptureComplete();
        resolve();
      });
    });
  }

  private zoomCameraToBattle(midpoint: THREE.Vector3, speedMul: number): void {
    const cam = this.deps.camera;
    const target = this.deps.cameraTarget;

    // Save current camera state
    this.savedCameraPos = cam.position.clone();
    this.savedCameraTarget = target.clone();

    // Calculate zoom position: closer to the battle, slightly elevated
    const dir = new THREE.Vector3().subVectors(cam.position, target).normalize();
    const distance = cam.position.distanceTo(target);
    const zoomDistance = distance * 0.65; // 35% closer

    const zoomPos = midpoint.clone().add(dir.multiplyScalar(zoomDistance));
    zoomPos.y = Math.max(zoomPos.y, 1.5); // Keep above board

    // Animate camera zoom
    const duration = 0.4 / speedMul;
    gsap.to(cam.position, {
      x: zoomPos.x,
      y: zoomPos.y,
      z: zoomPos.z,
      duration,
      ease: 'power2.out',
      onUpdate: () => cam.lookAt(midpoint)
    });

    gsap.to(target, {
      x: midpoint.x,
      y: midpoint.y,
      z: midpoint.z,
      duration,
      ease: 'power2.out'
    });
  }

  private restoreCamera(): void {
    if (!this.savedCameraPos || !this.savedCameraTarget) return;

    const cam = this.deps.camera;
    const target = this.deps.cameraTarget;
    const duration = 0.5;

    gsap.to(cam.position, {
      x: this.savedCameraPos.x,
      y: this.savedCameraPos.y,
      z: this.savedCameraPos.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => cam.lookAt(target)
    });

    gsap.to(target, {
      x: this.savedCameraTarget.x,
      y: this.savedCameraTarget.y,
      z: this.savedCameraTarget.z,
      duration,
      ease: 'power2.inOut',
      onComplete: () => {
        this.savedCameraPos = null;
        this.savedCameraTarget = null;
      }
    });
  }

  private shakeCamera(duration: number, amplitude: number): void {
    const cam = this.deps.camera;
    const origPos = cam.position.clone();
    const state = { t: 1 };

    gsap.to(state, {
      t: 0,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        const amp = amplitude * state.t;
        cam.position.x = origPos.x + (Math.random() - 0.5) * amp;
        cam.position.y = origPos.y + (Math.random() - 0.5) * amp;
        cam.position.z = origPos.z + (Math.random() - 0.5) * amp;
      },
      onComplete: () => {
        cam.position.copy(origPos);
      }
    });
  }
}
