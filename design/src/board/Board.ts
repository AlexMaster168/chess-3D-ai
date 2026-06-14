import * as THREE from 'three';
import { FILES, RANKS, SQUARE_SIZE, indexToSquare, squareToWorld, isLightSquare } from '../util/notation.js';
import type { HighlightKind } from '../types.js';
import type { ThemeMaterials } from '../themes/themes.js';

const LABEL_SIZE = 0.22;

function makeTextSprite(text: string, color = '#c8a96e'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = color;
  ctx.font = 'bold 40px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(LABEL_SIZE, LABEL_SIZE, 1);
  return sprite;
}

export class Board {
  readonly group: THREE.Group;
  readonly squareMeshes: Map<string, THREE.Mesh> = new Map();
  readonly highlightMeshes: Map<string, THREE.Mesh> = new Map();
  private active: Map<HighlightKind, Set<string>> = new Map([
    ['legal', new Set()],
    ['last-move', new Set()],
    ['check', new Set()]
  ]);
  private theme: ThemeMaterials;
  private frame?: THREE.Group;
  private labels: THREE.Sprite[] = [];
  private flipped = false;

  constructor(theme: ThemeMaterials) {
    this.theme = theme;
    this.group = new THREE.Group();
    this.buildBoard();
    this.buildFrame();
    this.buildDecorations();
    this.buildLabels();
  }

  private buildBoard(): void {
    const squareGeo = new THREE.BoxGeometry(SQUARE_SIZE, 0.14, SQUARE_SIZE);
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const sq = indexToSquare(f, r);
        const mat = isLightSquare(sq) ? this.theme.lightSquare : this.theme.darkSquare;
        const mesh = new THREE.Mesh(squareGeo, mat);
        const { x, z } = squareToWorld(sq);
        mesh.position.set(x, -0.07, z);
        mesh.receiveShadow = true;
        mesh.userData.square = sq;
        this.group.add(mesh);
        this.squareMeshes.set(sq, mesh);
      }
    }
  }

  private buildFrame(): void {
    this.frame = new THREE.Group();
    const boardSize = 8 * SQUARE_SIZE;
    const frameWidth = 0.35;
    const frameHeight = 0.25;

    // Inner bevel
    const innerFrameGeo = new THREE.BoxGeometry(boardSize + 0.3, frameHeight, boardSize + 0.3);
    const innerFrame = new THREE.Mesh(innerFrameGeo, this.theme.boardFrame);
    innerFrame.position.set(0, -0.2, 0);
    innerFrame.receiveShadow = true;
    innerFrame.castShadow = true;
    this.frame.add(innerFrame);

    // Outer ornate frame
    const outerSize = boardSize + frameWidth * 2;
    const outerGeo = new THREE.BoxGeometry(outerSize, frameHeight + 0.08, outerSize);
    const outerFrame = new THREE.Mesh(outerGeo, this.theme.boardFrame);
    outerFrame.position.set(0, -0.28, 0);
    outerFrame.receiveShadow = true;
    outerFrame.castShadow = true;
    this.frame.add(outerFrame);

    // Corner pillars
    const pillarGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 8);
    const halfBoard = boardSize / 2 + frameWidth * 0.5;
    for (const [x, z] of [[-halfBoard, -halfBoard], [halfBoard, -halfBoard], [-halfBoard, halfBoard], [halfBoard, halfBoard]]) {
      const pillar = new THREE.Mesh(pillarGeo, this.theme.boardFrame);
      pillar.position.set(x, -0.12, z);
      pillar.castShadow = true;
      this.frame.add(pillar);

      // Pillar cap
      const capGeo = new THREE.SphereGeometry(0.1, 12, 8);
      const cap = new THREE.Mesh(capGeo, this.theme.boardFrame);
      cap.position.set(x, 0.08, z);
      cap.castShadow = true;
      this.frame.add(cap);
    }

    // Side railings
    for (const side of [-1, 1]) {
      const railGeo = new THREE.BoxGeometry(boardSize + frameWidth * 2, 0.06, 0.06);
      const rail = new THREE.Mesh(railGeo, this.theme.boardFrame);
      rail.position.set(0, 0.02, side * (halfBoard + 0.1));
      this.frame.add(rail);

      const rail2 = rail.clone();
      rail2.position.set(side * (halfBoard + 0.1), 0.02, 0);
      rail2.rotation.y = Math.PI / 2;
      this.frame.add(rail2);
    }

    this.group.add(this.frame);
  }

  private buildDecorations(): void {
    // Add subtle grid lines between squares for Battle Chess look
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.15 });
    const boardSize = 8 * SQUARE_SIZE;

    for (let i = 0; i <= 8; i++) {
      const pos = -boardSize / 2 + i * SQUARE_SIZE;

      // Vertical lines
      const vLine = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.01, boardSize),
        lineMat
      );
      vLine.position.set(pos, 0.01, 0);
      this.group.add(vLine);

      // Horizontal lines
      const hLine = new THREE.Mesh(
        new THREE.BoxGeometry(boardSize, 0.01, 0.01),
        lineMat
      );
      hLine.position.set(0, 0.01, pos);
      this.group.add(hLine);
    }
  }

  setTheme(theme: ThemeMaterials): void {
    this.theme = theme;
    for (const [sq, mesh] of this.squareMeshes) {
      mesh.material = isLightSquare(sq) ? theme.lightSquare : theme.darkSquare;
    }
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

    const yOffset = kind === 'legal' ? 0.05 : kind === 'last-move' ? 0.04 : 0.06;
    const material = this.materialForKind(kind);
    for (const sq of squares) {
      if (!this.squareMeshes.has(sq)) continue;
      let geo: THREE.BufferGeometry;
      if (kind === 'legal') {
        geo = occupied?.has(sq)
          ? new THREE.RingGeometry(SQUARE_SIZE * 0.42, SQUARE_SIZE * 0.48, 36)
          : new THREE.CircleGeometry(SQUARE_SIZE * 0.22, 32);
      } else {
        geo = new THREE.PlaneGeometry(SQUARE_SIZE * 0.94, SQUARE_SIZE * 0.94);
      }
      geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, material);
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

  private buildLabels(): void {
    const halfBoard = 8 * SQUARE_SIZE / 2;
    for (let i = 0; i < 8; i++) {
      // File labels (a-h) along bottom
      const fileLabel = makeTextSprite(FILES[i]);
      fileLabel.position.set(-halfBoard + i * SQUARE_SIZE + SQUARE_SIZE / 2, 0.02, halfBoard + 0.15);
      this.group.add(fileLabel);
      this.labels.push(fileLabel);

      // Rank labels (1-8) along left
      const rankLabel = makeTextSprite(String(8 - i));
      rankLabel.position.set(-halfBoard - 0.15, 0.02, -halfBoard + i * SQUARE_SIZE + SQUARE_SIZE / 2);
      this.group.add(rankLabel);
      this.labels.push(rankLabel);
    }
  }

  flipBoard(): void {
    this.flipped = !this.flipped;
    this.group.rotation.y = this.flipped ? Math.PI : 0;
    // Reposition labels
    const halfBoard = 8 * SQUARE_SIZE / 2;
    let labelIdx = 0;
    for (let i = 0; i < 8; i++) {
      const file = this.flipped ? FILES[7 - i] : FILES[i];
      const rank = this.flipped ? String(i + 1) : String(8 - i);
      if (this.labels[labelIdx]) {
        this.labels[labelIdx].position.set(
          -halfBoard + i * SQUARE_SIZE + SQUARE_SIZE / 2,
          0.02,
          halfBoard + 0.15
        );
        // Update text
        this.updateLabel(this.labels[labelIdx], file);
      }
      labelIdx++;
      if (this.labels[labelIdx]) {
        this.labels[labelIdx].position.set(
          -halfBoard - 0.15,
          0.02,
          -halfBoard + i * SQUARE_SIZE + SQUARE_SIZE / 2
        );
        this.updateLabel(this.labels[labelIdx], rank);
      }
      labelIdx++;
    }
  }

  private updateLabel(sprite: THREE.Sprite, text: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#c8a96e';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    (sprite.material as THREE.SpriteMaterial).map = tex;
    (sprite.material as THREE.SpriteMaterial).needsUpdate = true;
  }

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
