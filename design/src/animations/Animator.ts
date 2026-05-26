import * as THREE from 'three';
import { gsap } from 'gsap';
import { Piece } from '../pieces/Piece.js';
import { squareToWorld } from '../util/notation.js';
import type { AnimationSpeed } from '../types.js';
import type { ParticleSystem } from '../effects/Particles.js';

export const SPEED_TABLE: Record<AnimationSpeed, number> = {
  slow: 1.4,
  normal: 1.0,
  fast: 0.55
};

export interface AnimatorDeps {
  camera: THREE.PerspectiveCamera;
  cameraTarget: THREE.Vector3; // OrbitControls target
  renderer: THREE.WebGLRenderer;
  particles: ParticleSystem;
  /** Background color (mutable Color object the renderer reads). */
  background: THREE.Color;
}

export class Animator {
  private deps: AnimatorDeps;
  private speedMul: number = SPEED_TABLE.normal;

  constructor(deps: AnimatorDeps) {
    this.deps = deps;
  }

  setSpeed(speed: AnimationSpeed): void {
    this.speedMul = SPEED_TABLE[speed];
  }

  /** Glide a piece along an arc to the destination square. */
  glide(piece: Piece, toSquare: string): Promise<void> {
    const to = squareToWorld(toSquare);
    const from = { x: piece.group.position.x, z: piece.group.position.z };
    const dist = Math.hypot(to.x - from.x, to.z - from.z);
    const arcHeight = Math.min(0.35 + dist * 0.18, 1.4);
    const duration = 0.45 * this.speedMul;

    piece.square = toSquare;

    return new Promise<void>(resolve => {
      const obj = { t: 0 };
      gsap.to(obj, {
        t: 1,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => {
          const t = obj.t;
          piece.group.position.x = from.x + (to.x - from.x) * t;
          piece.group.position.z = from.z + (to.z - from.z) * t;
          piece.group.position.y = Math.sin(Math.PI * t) * arcHeight;
          // Slight banking rotation for character.
          piece.group.rotation.z = Math.sin(Math.PI * t) * 0.08 * ((to.x - from.x) > 0 ? -1 : 1);
        },
        onComplete: () => {
          piece.group.position.set(to.x, 0, to.z);
          piece.group.rotation.z = 0;
          resolve();
        }
      });
    });
  }

  /**
   * Epic capture: shockwave ring on the board, two-layer particle burst,
   * camera shake, exposure flash, and the target piece launches up in a
   * tumble before shrinking out. Tuned to read as a real "hit".
   */
  capture(target: Piece, onComplete?: () => void): Promise<void> {
    const duration = 0.55 * this.speedMul;
    const px = target.group.position.x;
    const pz = target.group.position.z;
    const py = target.approxHeight * 0.5;

    // Impact effects fire immediately so the visual hit lands on contact.
    this.deps.particles.spawnShockwave(px, 0.04, pz, { color: 0xffe4a8, finalScale: 7 });
    this.deps.particles.spawnBurst(px, py, pz, 140, {
      color: 0xffd28a,
      speed: 1.4,
      size: 0.14,
      maxLife: 0.85
    });
    // Bright white sparks layered on top for the "impact flash" feel.
    this.deps.particles.spawnBurst(px, py, pz, 60, {
      color: 0xffffff,
      speed: 2.1,
      size: 0.07,
      maxLife: 0.5
    });
    this.shakeCamera(0.45 * this.speedMul, 0.16);
    this.flash(0.55, 0.09 * this.speedMul);

    // Direction the victim flies — biased away from board centre so kings/
    // central pieces don't all explode upward in the same boring axis.
    const len = Math.hypot(px, pz) || 1;
    const outX = (px / len) * 0.6 + (Math.random() - 0.5) * 0.4;
    const outZ = (pz / len) * 0.6 + (Math.random() - 0.5) * 0.4;
    const spinDir = Math.random() < 0.5 ? -1 : 1;

    return new Promise<void>(resolve => {
      gsap.to(target.group.rotation, {
        x: target.group.rotation.x + Math.PI * 1.4 * spinDir,
        y: target.group.rotation.y + Math.PI * 2,
        z: target.group.rotation.z + Math.PI * 0.9 * -spinDir,
        duration,
        ease: 'power1.out'
      });
      gsap.to(target.group.position, {
        x: px + outX,
        y: 2.6,
        z: pz + outZ,
        duration,
        ease: 'power2.out'
      });
      gsap.to(target.group.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: duration * 0.8,
        delay: duration * 0.2,
        ease: 'power3.in',
        onComplete: () => {
          onComplete?.();
          resolve();
        }
      });
    });
  }

  /** Quick camera-target jitter that reads as a screen shake. */
  private shakeCamera(duration: number, amplitude: number): void {
    const tgt = this.deps.cameraTarget;
    const orig = tgt.clone();
    const state = { t: 1 };
    gsap.to(state, {
      t: 0,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        const amp = amplitude * state.t;
        tgt.x = orig.x + (Math.random() - 0.5) * amp;
        tgt.y = orig.y + (Math.random() - 0.5) * amp;
        tgt.z = orig.z + (Math.random() - 0.5) * amp;
      },
      onComplete: () => tgt.copy(orig)
    });
  }

  /** Brief exposure spike — feels like the impact pops the highlights. */
  private flash(intensity: number, duration: number): void {
    const r = this.deps.renderer;
    const orig = r.toneMappingExposure;
    gsap.to(r, {
      toneMappingExposure: orig + intensity,
      duration: duration / 2,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        r.toneMappingExposure = orig;
      }
    });
  }

  /** Check pulse: ring rim under king pulses red. */
  checkPulse(king: Piece): Promise<void> {
    const rim = king.ensureRimMesh();
    const mat = rim.material as THREE.MeshBasicMaterial;
    const duration = 0.7 * this.speedMul;
    return new Promise<void>(resolve => {
      gsap.fromTo(
        mat,
        { opacity: 0 },
        {
          opacity: 0.9,
          duration: duration / 2,
          yoyo: true,
          repeat: 3,
          ease: 'sine.inOut',
          onComplete: () => {
            mat.opacity = 0;
            resolve();
          }
        }
      );
      gsap.fromTo(
        rim.scale,
        { x: 1, y: 1, z: 1 },
        { x: 1.4, y: 1.4, z: 1.4, duration: duration / 2, yoyo: true, repeat: 3, ease: 'sine.inOut' }
      );
    });
  }

  /** Checkmate cinematic: camera dolly + slow zoom + desaturation. */
  checkmate(): Promise<void> {
    const cam = this.deps.camera;
    const start = cam.position.clone();
    const target = cam.position.clone().multiplyScalar(0.62);
    target.y *= 0.85;
    const duration = 2.0 * this.speedMul;
    const renderer = this.deps.renderer;
    const startExposure = renderer.toneMappingExposure;
    return new Promise<void>(resolve => {
      gsap.to(cam.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration,
        ease: 'power2.inOut',
        onUpdate: () => cam.lookAt(this.deps.cameraTarget)
      });
      gsap.to(renderer, {
        toneMappingExposure: startExposure * 0.55,
        duration,
        ease: 'power2.inOut',
        onComplete: () => {
          // Slight camera shake at the end.
          const shake = { v: 0 };
          gsap.to(shake, {
            v: 1,
            duration: 0.5 * this.speedMul,
            ease: 'sine.out',
            onUpdate: () => {
              cam.position.x = target.x + (Math.random() - 0.5) * 0.08 * (1 - shake.v);
              cam.position.y = target.y + (Math.random() - 0.5) * 0.08 * (1 - shake.v);
              cam.lookAt(this.deps.cameraTarget);
            },
            onComplete: () => {
              // Hold a beat then restore exposure & position.
              gsap.to(renderer, {
                toneMappingExposure: startExposure,
                duration: 0.6,
                delay: 0.4,
                ease: 'power1.inOut'
              });
              gsap.to(cam.position, {
                x: start.x,
                y: start.y,
                z: start.z,
                duration: 0.9,
                delay: 0.4,
                ease: 'power2.inOut',
                onUpdate: () => cam.lookAt(this.deps.cameraTarget),
                onComplete: () => resolve()
              });
            }
          });
        }
      });
    });
  }

  /** Castling: synchronized king + rook glide (already 2 calls; helper for timing). */
  async castle(king: Piece, kingTo: string, rook: Piece, rookTo: string): Promise<void> {
    await Promise.all([this.glide(king, kingTo), this.glide(rook, rookTo)]);
  }

  /** Promotion: lift the pawn, flash, then return. Caller usually replaces piece geometry after. */
  promotion(piece: Piece): Promise<void> {
    const liftDuration = 0.35 * this.speedMul;
    const flashDuration = 0.25 * this.speedMul;
    return new Promise<void>(resolve => {
      const tl = gsap.timeline({ onComplete: () => resolve() });
      tl.to(piece.group.position, { y: 1.2, duration: liftDuration, ease: 'power2.out' });
      const rim = piece.ensureRimMesh();
      const mat = rim.material as THREE.MeshBasicMaterial;
      mat.color.set(0xffffaa);
      tl.fromTo(
        mat,
        { opacity: 0 },
        { opacity: 1, duration: flashDuration / 2, yoyo: true, repeat: 1, ease: 'sine.inOut' },
        '-=0.1'
      );
      tl.to(piece.group.position, { y: 0, duration: liftDuration, ease: 'power2.in' });
    });
  }
}
