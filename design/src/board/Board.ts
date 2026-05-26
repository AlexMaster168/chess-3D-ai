import * as THREE from 'three';
import { FILES, RANKS, SQUARE_SIZE, indexToSquare, squareToWorld, isLightSquare } from '../util/notation.js';
import type { HighlightKind } from '../types.js';
import type { ThemeMaterials } from '../themes/themes.js';

export class Board {
  readonly group: THREE.Group;
  readonly squareMeshes: Map<string, THREE.Mesh> = new Map();
  readonly highlightMeshes: Map<string, THREE.Mesh> = new Map();
  /** Set of currently highlighted squares per kind, for clean removal. */
  private active: Map<HighlightKind, Set<string>> = new Map([
    ['legal', new Set()],
    ['last-move', new Set()],
    ['check', new Set()]
  ]);
  private theme: ThemeMaterials;
  private frame?: THREE.Mesh;

  constructor(theme: ThemeMaterials) {
    this.theme = theme;
    this.group = new THREE.Group();
    this.buildBoard();
    this.buildFrame();
  }

  private buildBoard(): void {
    const squareGeo = new THREE.BoxGeometry(SQUARE_SIZE, 0.12, SQUARE_SIZE);
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = indexToSquare(f, r);
        const mat = isLightSquare(sq) ? this.theme.lightSquare : this.theme.darkSquare;
        const mesh = new THREE.Mesh(squareGeo, mat);
        const { x, z } = squareToWorld(sq);
        mesh.position.set(x, -0.06, z);
        mesh.receiveShadow = true;
        mesh.userData.square = sq;
        this.group.add(mesh);
        this.squareMeshes.set(sq, mesh);
      }
    }
  }

  private buildFrame(): void {
    const frameSize = 8 * SQUARE_SIZE + 0.6;
    const geo = new THREE.BoxGeometry(frameSize, 0.18, frameSize);
    const frame = new THREE.Mesh(geo, this.theme.boardFrame);
    frame.position.set(0, -0.15, 0);
    frame.receiveShadow = true;
    frame.castShadow = true;
    this.group.add(frame);
    this.frame = frame;
  }

  setTheme(theme: ThemeMaterials): void {
    this.theme = theme;
    for (const [sq, mesh] of this.squareMeshes) {
      mesh.material = isLightSquare(sq) ? theme.lightSquare : theme.darkSquare;
    }
    if (this.frame) this.frame.material = theme.boardFrame;
    // Rebuild highlight materials for any currently-active highlights.
    for (const [kind, set] of this.active) {
      for (const sq of set) {
        const hl = this.highlightMeshes.get(`${kind}:${sq}`);
        if (hl) {
          hl.material = this.materialForKind(kind);
        }
      }
    }
  }

  private materialForKind(kind: HighlightKind): THREE.Material {
    switch (kind) {
      case 'legal':
        return this.theme.highlightLegal;
      case 'last-move':
        return this.theme.highlightLastMove;
      case 'check':
        return this.theme.highlightCheck;
    }
  }

  highlight(squares: string[], kind: HighlightKind, occupied?: ReadonlySet<string>): void {
    // Clear previous highlights of this kind.
    const prev = this.active.get(kind);
    if (prev) {
      for (const sq of prev) {
        const key = `${kind}:${sq}`;
        const mesh = this.highlightMeshes.get(key);
        if (mesh) {
          this.group.remove(mesh);
          (mesh.geometry as THREE.BufferGeometry).dispose();
          this.highlightMeshes.delete(key);
        }
      }
      prev.clear();
    }

    // Sit above piece bases (piece group y=0, geometry extends upward) so the
    // mark stays visible even on a capture target. Layered slightly so kinds
    // don't z-fight when overlapping.
    const yOffset = kind === 'legal' ? 0.05 : kind === 'last-move' ? 0.04 : 0.06;
    const material = this.materialForKind(kind);
    for (const sq of squares) {
      if (!this.squareMeshes.has(sq)) continue;
      let geo: THREE.BufferGeometry;
      if (kind === 'legal') {
        // Empty square -> filled dot. Occupied square (capture target) ->
        // ring around the piece so the mark isn't hidden under it.
        geo = occupied?.has(sq)
          ? new THREE.RingGeometry(SQUARE_SIZE * 0.42, SQUARE_SIZE * 0.48, 36)
          : new THREE.CircleGeometry(SQUARE_SIZE * 0.22, 32);
      } else {
        geo = new THREE.PlaneGeometry(SQUARE_SIZE * 0.94, SQUARE_SIZE * 0.94);
      }
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, material);
      // Don't write to depth buffer — keeps the mark visible through piece
      // bases when a capture target sits on it.
      mesh.renderOrder = 1;
      const { x, z } = squareToWorld(sq);
      mesh.position.set(x, yOffset, z);
      this.group.add(mesh);
      this.highlightMeshes.set(`${kind}:${sq}`, mesh);
      prev?.add(sq);
    }
  }

  clearAllHighlights(): void {
    for (const kind of ['legal', 'last-move', 'check'] as HighlightKind[]) {
      this.highlight([], kind);
    }
  }

  /** Returns the algebraic square under the given pointer ray, or null. */
  pick(raycaster: THREE.Raycaster): string | null {
    const hits = raycaster.intersectObjects(Array.from(this.squareMeshes.values()), false);
    if (hits.length === 0) return null;
    const sq = hits[0].object.userData.square;
    return typeof sq === 'string' ? sq : null;
  }
}

export const ALL_SQUARES: string[] = (() => {
  const out: string[] = [];
  for (const f of FILES) for (const r of RANKS) out.push(`${f}${r}`);
  return out;
})();
