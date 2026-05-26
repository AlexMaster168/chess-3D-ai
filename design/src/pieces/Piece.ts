import * as THREE from 'three';
import type { PieceColor, PieceType } from '../types.js';
import { buildPieceMesh, type PieceMeshBundle } from './geometry.js';
import { squareToWorld } from '../util/notation.js';

let _id = 0;
function nextId(): string {
  _id += 1;
  return `p${_id}`;
}

export class Piece {
  readonly id: string;
  readonly type: PieceType;
  readonly color: PieceColor;
  square: string;
  readonly group: THREE.Group;
  readonly shadedMeshes: THREE.Mesh[];
  readonly approxHeight: number;
  /** Rim emissive ring used by check animation. Lazy-built. */
  rimMesh?: THREE.Mesh;

  constructor(type: PieceType, color: PieceColor, square: string, material: THREE.Material) {
    this.id = nextId();
    this.type = type;
    this.color = color;
    this.square = square;

    const bundle: PieceMeshBundle = buildPieceMesh(type, material);
    this.group = bundle.group;
    this.shadedMeshes = bundle.shadedMeshes;
    this.approxHeight = bundle.height;

    // Black pieces face the white side (rotated 180 deg) so knights look right.
    if (color === 'b') {
      this.group.rotation.y = Math.PI;
    }

    this.snapToSquare(square);
  }

  setMaterial(material: THREE.Material): void {
    for (const mesh of this.shadedMeshes) {
      mesh.material = material;
    }
  }

  snapToSquare(square: string): void {
    this.square = square;
    const { x, z } = squareToWorld(square);
    this.group.position.set(x, 0, z);
  }

  getWorldXZ(): { x: number; z: number } {
    return { x: this.group.position.x, z: this.group.position.z };
  }

  ensureRimMesh(): THREE.Mesh {
    if (this.rimMesh) return this.rimMesh;
    const geo = new THREE.RingGeometry(0.42, 0.5, 48);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff2244,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.02;
    this.group.add(mesh);
    this.rimMesh = mesh;
    return mesh;
  }
}
