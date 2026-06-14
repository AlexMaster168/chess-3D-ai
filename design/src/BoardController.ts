import * as THREE from 'three';
import { gsap } from 'gsap';
import type {
  ChessBoard3D,
  ThemeName,
  AnimationSpeed,
  HighlightKind,
  EffectKind,
  BoardEvents,
  PieceSpec,
  BattleMode,
  MoveValidator
} from './types.js';
import { Emitter } from './util/events.js';
import { parseFen } from './util/fen.js';
import { isValidSquare } from './util/notation.js';
import { createScene, type SceneHandles } from './scene/Scene.js';
import { Board } from './board/Board.js';
import { Piece } from './pieces/Piece.js';
import { buildTheme, pieceMaterialFor, type ThemeMaterials } from './themes/themes.js';
import { ParticleSystem } from './effects/Particles.js';
import { Animator } from './animations/Animator.js';
import { BattleSystem, type BattleSystemDeps } from './battle/BattleSystem.js';
import { getAudioEngine, type AudioEngine } from './audio/AudioEngine.js';

/**
 * Concrete ChessBoard3D implementation. Public surface matches SHARED_CONTRACTS.md §1.
 */
export class BoardController implements ChessBoard3D {
  private container?: HTMLElement;
  private handles?: SceneHandles;
  private board?: Board;
  private theme: ThemeMaterials = buildTheme('classic');
  private themeName: ThemeName = 'classic';
  private animator?: Animator;
  private battleSystem?: BattleSystem;
  private particles?: ParticleSystem;
  private audio?: AudioEngine;
  private emitter = new Emitter<BoardEvents>();
  private pieces: Map<string, Piece> = new Map(); // square -> piece
  private animationSpeed: AnimationSpeed = 'normal';
  private battleMode: BattleMode = 'classic';
  private moveValidator: MoveValidator | null = null;
  private rafId: number | null = null;
  private clock = new THREE.Clock();
  private resizeObs?: ResizeObserver;
  private domPointerDownHandler?: (e: PointerEvent) => void;
  private domPointerUpHandler?: (e: PointerEvent) => void;
  private pointerDownPos: { x: number; y: number; id: number } | null = null;
  // Selection state for emitting `move` from two consecutive squareClicks.
  private selectedSquare: string | null = null;
  // Track the king for check pulses.
  private whiteKingSquare: string | null = null;
  private blackKingSquare: string | null = null;
  private lastSideInCheck: 'w' | 'b' = 'w';

  async mount(container: HTMLElement): Promise<void> {
    if (this.handles) {
      throw new Error('[chess-ai/design] mount() called twice; call unmount() first.');
    }
    this.container = container;

    const handles = createScene(container);
    handles.scene.background = this.theme.background;
    this.handles = handles;

    const board = new Board(this.theme);
    handles.scene.add(board.group);
    this.board = board;

    const particles = new ParticleSystem(handles.scene);
    this.particles = particles;

    // Initialize audio engine
    this.audio = getAudioEngine();
    await this.audio.init();

    this.animator = new Animator({
      camera: handles.camera,
      cameraTarget: handles.controls.target,
      renderer: handles.renderer,
      particles,
      background: this.theme.background
    });
    this.animator.setSpeed(this.animationSpeed);

    this.battleSystem = new BattleSystem({
      scene: handles.scene,
      camera: handles.camera,
      cameraTarget: handles.controls.target,
      renderer: handles.renderer,
      spawnBurst: (x, y, z, count, opts) => this.particles?.spawnBurst(x, y, z, count, opts),
      spawnShockwave: (x, y, z, opts) => this.particles?.spawnShockwave(x, y, z, opts),
      audio: this.audio
    });

    this.bindDomEvents();
    this.installResizeObserver();
    this.startLoop();
  }

  unmount(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObs?.disconnect();
    this.resizeObs = undefined;
    if (this.handles) {
      const dom = this.handles.renderer.domElement;
      if (this.domPointerDownHandler) dom.removeEventListener('pointerdown', this.domPointerDownHandler);
      if (this.domPointerUpHandler) dom.removeEventListener('pointerup', this.domPointerUpHandler);
    }
    this.domPointerDownHandler = undefined;
    this.domPointerUpHandler = undefined;
    this.pointerDownPos = null;

    for (const piece of this.pieces.values()) {
      this.battleSystem?.removePieceParts(piece);
      this.handles?.scene.remove(piece.group);
    }
    this.pieces.clear();
    this.particles?.dispose();
    this.particles = undefined;
    this.audio?.dispose();
    this.audio = undefined;
    this.handles?.dispose();
    this.handles = undefined;
    this.board = undefined;
    this.animator = undefined;
    this.battleSystem = undefined;
    this.container = undefined;
    this.emitter.clear();
    this.selectedSquare = null;
  }

  setBoardState(fen: string, animated: boolean = false): void {
    if (!this.handles || !this.board) return;
    const specs = parseFen(fen);
    this.applyPieceSpecs(specs, animated);
    this.updateKingTracking();
  }

  setAnimationSpeed(speed: AnimationSpeed): void {
    this.animationSpeed = speed;
    this.animator?.setSpeed(speed);
  }

  highlightSquares(squares: string[], kind: HighlightKind = 'legal'): void {
    if (!this.board) return;
    const filtered = squares.filter(isValidSquare);
    // Capture targets (highlighted squares occupied by *any* piece) get a ring
    // around the piece instead of a dot under it.
    const occupied = new Set<string>();
    for (const sq of filtered) {
      if (this.pieces.has(sq)) occupied.add(sq);
    }
    this.board.highlight(filtered, kind, occupied);
  }

  setTheme(theme: ThemeName): void {
    this.themeName = theme;
    this.theme = buildTheme(theme);
    if (this.handles) {
      this.handles.scene.background = this.theme.background;
      this.handles.bloom.strength = this.theme.bloomStrength;
    }
    if (this.board) this.board.setTheme(this.theme);
    for (const piece of this.pieces.values()) {
      piece.setMaterial(pieceMaterialFor(this.theme, piece.color));
    }
  }

  setBattleMode(mode: BattleMode): void {
    this.battleMode = mode;
  }

  setMoveValidator(validator: MoveValidator | null): void {
    this.moveValidator = validator;
  }

  flipBoard(): void {
    this.board?.flipBoard();
    this.selectedSquare = null;
  }

  isFlipped(): boolean {
    return this.board?.['flipped'] ?? false;
  }

  on<E extends keyof BoardEvents>(event: E, cb: BoardEvents[E]): void {
    this.emitter.on(event, cb);
  }

  playEffect(kind: EffectKind): void {
    if (!this.animator) return;
    switch (kind) {
      case 'capture': {
        // Burst at board centre if caller has no spatial context.
        this.particles?.spawnBurst(0, 0.4, 0, 50);
        this.audio?.play('impact_heavy');
        this.emitter.emit('animationEnd', 'capture');
        return;
      }
      case 'check': {
        this.audio?.play('check');
        const sq = this.lastSideInCheck === 'w' ? this.whiteKingSquare : this.blackKingSquare;
        if (sq) {
          const king = this.pieces.get(sq);
          if (king) {
            this.animator.checkPulse(king).then(() => this.emitter.emit('animationEnd', 'check'));
            return;
          }
        }
        this.emitter.emit('animationEnd', 'check');
        return;
      }
      case 'checkmate': {
        this.audio?.play('checkmate');
        this.animator.checkmate().then(() => this.emitter.emit('animationEnd', 'checkmate'));
        return;
      }
      case 'castle': {
        this.audio?.play('castle');
        // Without explicit squares we can only emit completion; setBoardState will handle visuals.
        this.emitter.emit('animationEnd', 'castle');
        return;
      }
    }
  }

  /** Force which side is "in check" for the next playEffect('check') call. */
  setSideInCheck(side: 'w' | 'b'): void {
    this.lastSideInCheck = side;
  }

  // ----- internals ---------------------------------------------------

  private applyPieceSpecs(specs: PieceSpec[], animated: boolean): void {
    if (!this.handles || !this.animator) return;

    const wanted = new Map<string, PieceSpec>();
    for (const s of specs) wanted.set(s.square, s);

    // Build pools of current pieces by signature (color+type) for reuse / move detection.
    const pool: Piece[] = Array.from(this.pieces.values());
    const usedExisting = new Set<string>();
    /** Pieces we've already begun capturing (inline) so step 3 doesn't double-remove. */
    const capturedInline = new Set<string>();

    const finalPieces: Map<string, Piece> = new Map();

    // 1) Identical-square keeps.
    for (const [sq, spec] of wanted) {
      const existing = this.pieces.get(sq);
      if (existing && existing.color === spec.color && existing.type === spec.type) {
        finalPieces.set(sq, existing);
        usedExisting.add(existing.id);
      }
    }

    // 2) Re-locate matching existing pieces to their new square (animation: glide).
    //
    // Picking the right candidate matters: with multiple identical pieces (pawns,
    // knights, rooks), grabbing the *first* match would arbitrarily make some piece
    // "the one that moved", which leaves the actually-moved piece sitting in place
    // and can also leave a captured piece visually intact — looking like it "came back".
    //
    // Two heuristics restore the truth: (a) prefer candidates whose current square is
    // NOT in the new position (i.e. they had to move somewhere), and (b) among ties,
    // pick the closest one. This matches the typical chess move (short distance, one
    // piece leaves a square, another lands on it).
    const squareDistance = (a: string, b: string): number => {
      const fa = a.charCodeAt(0) - 97;
      const ra = parseInt(a[1], 10) - 1;
      const fb = b.charCodeAt(0) - 97;
      const rb = parseInt(b[1], 10) - 1;
      return Math.hypot(fa - fb, ra - rb);
    };

    for (const [sq, spec] of wanted) {
      if (finalPieces.has(sq)) continue;
      const candidates = pool.filter(
        p => !usedExisting.has(p.id) && p.color === spec.color && p.type === spec.type
      );
      if (candidates.length === 0) continue;

      // Score: orphaned (its old square is empty in new position) is strongly preferred,
      // then closer is better.
      const scored = candidates.map(p => {
        const orphan = !wanted.has(p.square) || wanted.get(p.square)?.color !== p.color
          || wanted.get(p.square)?.type !== p.type ? 0 : 1000;
        const dist = squareDistance(p.square, sq);
        return { p, score: orphan + dist };
      });
      scored.sort((a, b) => a.score - b.score);
      const candidate = scored[0].p;

      usedExisting.add(candidate.id);
      finalPieces.set(sq, candidate);
      if (animated) {
        const victim = this.pieces.get(sq);
        const isCapture = !!victim && victim.id !== candidate.id && !usedExisting.has(victim.id);
        if (isCapture && victim) {
          capturedInline.add(victim.id);
          if (this.battleMode === 'battle-chess' && this.battleSystem) {
            // In battle mode: wait for battle to complete, then glide attacker to target
            this.battleSystem.playBattle({
              attacker: candidate,
              defender: victim,
              speedMul: this.animator?.getSpeedMul() ?? 1,
              onCaptureComplete: () => {
                this.handles?.scene.remove(victim.group);
                // Now glide attacker to the captured piece's square
                this.animator?.glide(candidate, sq).then(() => {
                  this.emitter.emit('animationEnd', 'move');
                  this.emitter.emit('animationEnd', 'capture');
                });
              }
            });
          } else {
            this.animator.capture(victim, () => this.handles?.scene.remove(victim.group)).then(() =>
              this.emitter.emit('animationEnd', 'capture')
            );
            this.animator.glide(candidate, sq).then(() => this.emitter.emit('animationEnd', 'move'));
          }
        } else {
          this.animator.glide(candidate, sq).then(() => this.emitter.emit('animationEnd', 'move'));
        }
      } else {
        candidate.snapToSquare(sq);
      }
    }

    // 3) Remove pieces no longer referenced (and not already animated as captures).
    for (const p of pool) {
      if (usedExisting.has(p.id) || capturedInline.has(p.id)) continue;
      if (animated) {
        this.animator.capture(p, () => this.handles?.scene.remove(p.group));
      } else {
        this.handles.scene.remove(p.group);
      }
    }

    // 4) Create newly-introduced pieces (no matching existing).
    for (const [sq, spec] of wanted) {
      if (finalPieces.has(sq)) continue;
      const mat = pieceMaterialFor(this.theme, spec.color);
      const piece = new Piece(spec.type, spec.color, sq, mat);
      this.handles.scene.add(piece.group);
      finalPieces.set(sq, piece);
      if (animated) {
        piece.group.scale.set(0.001, 0.001, 0.001);
        gsap.to(piece.group.scale, { x: 1, y: 1, z: 1, duration: 0.35, ease: 'back.out(2)' });
      }
    }

    this.pieces = finalPieces;
  }

  private updateKingTracking(): void {
    this.whiteKingSquare = null;
    this.blackKingSquare = null;
    for (const [sq, p] of this.pieces) {
      if (p.type === 'k') {
        if (p.color === 'w') this.whiteKingSquare = sq;
        else this.blackKingSquare = sq;
      }
    }
  }

  private bindDomEvents(): void {
    if (!this.handles) return;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const dom = this.handles.renderer.domElement;
    // Drag threshold (px) — beyond this, the gesture is OrbitControls rotate, not a click.
    const DRAG_THRESHOLD = 6;

    const onDown = (e: PointerEvent): void => {
      // Only track primary button presses; let multi-touch / right-click pass to OrbitControls.
      if (e.button !== 0) {
        this.pointerDownPos = null;
        return;
      }
      this.pointerDownPos = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };

    const onUp = (e: PointerEvent): void => {
      const start = this.pointerDownPos;
      this.pointerDownPos = null;
      if (!start || start.id !== e.pointerId) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) return; // it was a drag, not a click
      if (!this.handles || !this.board) return;

      const rect = dom.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, this.handles.camera);
      const sq = this.board.pick(raycaster);
      if (!sq) return;
      this.emitter.emit('squareClick', sq);
      if (this.selectedSquare === null) {
        this.selectedSquare = sq;
      } else if (this.selectedSquare === sq) {
        this.selectedSquare = null;
      } else {
        const from = this.selectedSquare;
        this.selectedSquare = null;
        // Validate move if validator is set
        if (this.moveValidator) {
          if (!this.moveValidator.isLegal(from, sq)) {
            // Illegal move - don't emit, clear selection
            return;
          }
        }
        this.emitter.emit('move', { from, to: sq });
      }
    };

    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointerup', onUp);
    this.domPointerDownHandler = onDown;
    this.domPointerUpHandler = onUp;
  }

  private installResizeObserver(): void {
    if (!this.container || !this.handles) return;
    const obs = new ResizeObserver(() => {
      if (!this.container || !this.handles) return;
      this.handles.resize(this.container.clientWidth, this.container.clientHeight);
    });
    obs.observe(this.container);
    this.resizeObs = obs;
  }

  private startLoop(): void {
    const tick = (): void => {
      this.rafId = requestAnimationFrame(tick);
      if (!this.handles) return;
      const dt = Math.min(this.clock.getDelta(), 0.1);
      this.handles.controls.update();
      this.particles?.update(dt);
      this.handles.composer.render();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  // Exposed for the demo / tests
  getThemeName(): ThemeName {
    return this.themeName;
  }
}
