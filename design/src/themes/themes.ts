import * as THREE from 'three';
import type { ThemeName, PieceColor } from '../types.js';

export interface ThemeMaterials {
  lightSquare: THREE.Material;
  darkSquare: THREE.Material;
  highlightLegal: THREE.Material;
  highlightLastMove: THREE.Material;
  highlightCheck: THREE.Material;
  whitePiece: THREE.Material;
  blackPiece: THREE.Material;
  boardFrame: THREE.Material;
  /** Background color applied to renderer. */
  background: THREE.Color;
  /** Bloom strength multiplier. */
  bloomStrength: number;
}

function makeProceduralNormalTexture(size = 256, intensity = 0.5): THREE.DataTexture {
  // Simple stochastic bump map. Self-contained so the package has no asset deps.
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const n = Math.random();
    const nx = 0.5 + (Math.random() - 0.5) * intensity;
    const ny = 0.5 + (Math.random() - 0.5) * intensity;
    data[i * 4 + 0] = Math.floor(nx * 255);
    data[i * 4 + 1] = Math.floor(ny * 255);
    data[i * 4 + 2] = Math.floor((0.7 + n * 0.3) * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

const woodNormal = makeProceduralNormalTexture(256, 0.25);
const grainNormal = makeProceduralNormalTexture(256, 0.6);

function classicTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshStandardMaterial({
      color: 0xe8c98a,
      roughness: 0.55,
      metalness: 0.05,
      normalMap: woodNormal,
      normalScale: new THREE.Vector2(0.25, 0.25)
    }),
    darkSquare: new THREE.MeshStandardMaterial({
      color: 0x6b3a1a,
      roughness: 0.6,
      metalness: 0.05,
      normalMap: woodNormal,
      normalScale: new THREE.Vector2(0.35, 0.35)
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x6cff5a,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({
      color: 0xffd34d,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    }),
    highlightCheck: new THREE.MeshBasicMaterial({
      color: 0xff3030,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    }),
    whitePiece: new THREE.MeshStandardMaterial({
      color: 0xd9c08e,
      roughness: 0.65,
      metalness: 0.05,
      normalMap: grainNormal,
      normalScale: new THREE.Vector2(0.2, 0.2)
    }),
    blackPiece: new THREE.MeshStandardMaterial({
      color: 0x2a1a10,
      roughness: 0.55,
      metalness: 0.1,
      normalMap: grainNormal,
      normalScale: new THREE.Vector2(0.2, 0.2)
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x2a1607,
      roughness: 0.5,
      metalness: 0.1
    }),
    background: new THREE.Color(0x101418),
    bloomStrength: 0.35
  };
}

function neonTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshStandardMaterial({
      color: 0x4555a8,
      emissive: 0x2233aa,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.4
    }),
    darkSquare: new THREE.MeshStandardMaterial({
      color: 0x1a1d3a,
      emissive: 0x551a44,
      emissiveIntensity: 0.1,
      roughness: 0.55,
      metalness: 0.4
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x33ffaa,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({ color: 0xffe333, transparent: true, opacity: 0.75, depthWrite: false }),
    highlightCheck: new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.85, depthWrite: false }),
    whitePiece: new THREE.MeshStandardMaterial({
      color: 0xe8f4ff,
      emissive: 0x1a3a66,
      emissiveIntensity: 0.08,
      roughness: 0.35,
      metalness: 0.45
    }),
    blackPiece: new THREE.MeshStandardMaterial({
      color: 0x4a1850,
      emissive: 0xcc2288,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.45
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x0a0a18,
      emissive: 0x222266,
      emissiveIntensity: 0.35,
      roughness: 0.25,
      metalness: 0.85
    }),
    background: new THREE.Color(0x0a0a18),
    bloomStrength: 0.8
  };
}

function glassTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshPhysicalMaterial({
      color: 0xdfeaff,
      transmission: 0.55,
      thickness: 0.5,
      roughness: 0.15,
      metalness: 0.0,
      ior: 1.45,
      transparent: true,
      opacity: 0.9
    }),
    darkSquare: new THREE.MeshPhysicalMaterial({
      color: 0x2a3a4d,
      transmission: 0.3,
      thickness: 0.5,
      roughness: 0.25,
      metalness: 0.0,
      ior: 1.45,
      transparent: true,
      opacity: 0.95
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x88ffcc,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({ color: 0xffe388, transparent: true, opacity: 0.6, depthWrite: false }),
    highlightCheck: new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.7, depthWrite: false }),
    whitePiece: new THREE.MeshPhysicalMaterial({
      color: 0xf6f2ea,
      roughness: 0.25,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    }),
    blackPiece: new THREE.MeshPhysicalMaterial({
      color: 0x161c26,
      roughness: 0.3,
      metalness: 0.15,
      clearcoat: 0.7,
      clearcoatRoughness: 0.2
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x101820,
      roughness: 0.3,
      metalness: 0.8
    }),
    background: new THREE.Color(0x1c2638),
    bloomStrength: 0.45
  };
}

export function buildTheme(name: ThemeName): ThemeMaterials {
  switch (name) {
    case 'classic':
      return classicTheme();
    case 'neon':
      return neonTheme();
    case 'glass':
      return glassTheme();
  }
}

export function pieceMaterialFor(theme: ThemeMaterials, color: PieceColor): THREE.Material {
  return color === 'w' ? theme.whitePiece : theme.blackPiece;
}
