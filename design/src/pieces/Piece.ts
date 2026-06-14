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

    // Apply the piece color material to body/torso parts only
    // Keep weapons, armor, skin etc. with their own materials
    this.applyColorMaterial(material);

    if (color === 'b') {
      this.group.rotation.y = Math.PI;
    }

    this.snapToSquare(square);
  }

  private applyColorMaterial(material: THREE.Material): void {
    // Apply material to meshes that look like clothing/armor/body
    // but NOT to weapons, shields, accessories, glowing parts
    const skipPatterns = [
      'weapon', 'sword', 'shield', 'staff', 'orb', 'blast', 'ring', 'crown',
      'arm_', 'fist', 'boss', 'prong', 'gem', 'eye', 'mouth', 'plume',
      'sash', 'beard', 'hair', 'emblem', 'cross', 'pommel', 'grip',
      'edge', 'guard', 'tip', 'lance', 'tail', 'ear', 'mane'
    ];

    for (const mesh of this.shadedMeshes) {
      const name = mesh.name.toLowerCase();
      const isSkip = skipPatterns.some(p => name.includes(p));

      // Also skip if it's a glowing material (emissive > 0)
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isGlowing = mat?.emissiveIntensity && mat.emissiveIntensity > 0.2;

      if (!isSkip && !isGlowing) {
        // Check if it looks like a body part (not metal, not glowing)
        const isMetal = mat?.metalness && mat.metalness > 0.5;
        if (!isMetal) {
          mesh.material = material;
        }
      }
    }
  }

  setMaterial(material: THREE.Material): void {
    this.applyColorMaterial(material);
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
