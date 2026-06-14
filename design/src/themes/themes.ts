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
  background: THREE.Color;
  bloomStrength: number;
}

function makeStoneNormal(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const n = Math.random();
    const nx = 0.5 + (Math.random() - 0.5) * 0.4;
    const ny = 0.5 + (Math.random() - 0.5) * 0.4;
    data[i * 4 + 0] = Math.floor(nx * 255);
    data[i * 4 + 1] = Math.floor(ny * 255);
    data[i * 4 + 2] = Math.floor((0.6 + n * 0.4) * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function makeMetalNormal(size = 256): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    data[i * 4 + 0] = 128 + Math.floor((Math.random() - 0.5) * 30);
    data[i * 4 + 1] = 128 + Math.floor((Math.random() - 0.5) * 30);
    data[i * 4 + 2] = 200 + Math.floor(Math.random() * 55);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

const stoneNormal = makeStoneNormal();
const metalNormal = makeMetalNormal();

// ── CLASSIC: Battle Chess medieval stone theme ───────────────────

function classicTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshStandardMaterial({
      color: 0xc8a96e,
      roughness: 0.65,
      metalness: 0.05,
      normalMap: stoneNormal,
      normalScale: new THREE.Vector2(0.3, 0.3)
    }),
    darkSquare: new THREE.MeshStandardMaterial({
      color: 0x5a3520,
      roughness: 0.7,
      metalness: 0.05,
      normalMap: stoneNormal,
      normalScale: new THREE.Vector2(0.4, 0.4)
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x44ff44,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    }),
    highlightCheck: new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    }),
    whitePiece: new THREE.MeshStandardMaterial({
      color: 0xd4b896,
      roughness: 0.5,
      metalness: 0.15,
      normalMap: metalNormal,
      normalScale: new THREE.Vector2(0.15, 0.15)
    }),
    blackPiece: new THREE.MeshStandardMaterial({
      color: 0x1a1008,
      roughness: 0.45,
      metalness: 0.2,
      normalMap: metalNormal,
      normalScale: new THREE.Vector2(0.15, 0.15)
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x2a1a0a,
      roughness: 0.55,
      metalness: 0.15,
      normalMap: stoneNormal,
      normalScale: new THREE.Vector2(0.2, 0.2)
    }),
    background: new THREE.Color(0x0a0808),
    bloomStrength: 0.4
  };
}

// ── NEON: Cyberpunk theme ────────────────────────────────────────

function neonTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshStandardMaterial({
      color: 0x334488,
      emissive: 0x2233aa,
      emissiveIntensity: 0.15,
      roughness: 0.4,
      metalness: 0.5
    }),
    darkSquare: new THREE.MeshStandardMaterial({
      color: 0x151830,
      emissive: 0x441166,
      emissiveIntensity: 0.12,
      roughness: 0.5,
      metalness: 0.5
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x00ffaa,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({ color: 0xffe333, transparent: true, opacity: 0.8, depthWrite: false }),
    highlightCheck: new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.9, depthWrite: false }),
    whitePiece: new THREE.MeshStandardMaterial({
      color: 0xe0f0ff,
      emissive: 0x2244aa,
      emissiveIntensity: 0.1,
      roughness: 0.3,
      metalness: 0.5
    }),
    blackPiece: new THREE.MeshStandardMaterial({
      color: 0x3a0a40,
      emissive: 0xcc2288,
      emissiveIntensity: 0.3,
      roughness: 0.3,
      metalness: 0.5
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x080818,
      emissive: 0x2222aa,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.9
    }),
    background: new THREE.Color(0x060612),
    bloomStrength: 0.9
  };
}

// ── GLASS: Elegant transparent theme ─────────────────────────────

function glassTheme(): ThemeMaterials {
  return {
    lightSquare: new THREE.MeshPhysicalMaterial({
      color: 0xd0e0f0,
      transmission: 0.5,
      thickness: 0.4,
      roughness: 0.1,
      metalness: 0.0,
      ior: 1.45,
      transparent: true,
      opacity: 0.92
    }),
    darkSquare: new THREE.MeshPhysicalMaterial({
      color: 0x1a2838,
      transmission: 0.25,
      thickness: 0.4,
      roughness: 0.2,
      metalness: 0.0,
      ior: 1.45,
      transparent: true,
      opacity: 0.95
    }),
    highlightLegal: new THREE.MeshBasicMaterial({
      color: 0x88ffcc,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    highlightLastMove: new THREE.MeshBasicMaterial({ color: 0xffe388, transparent: true, opacity: 0.65, depthWrite: false }),
    highlightCheck: new THREE.MeshBasicMaterial({ color: 0xff6666, transparent: true, opacity: 0.75, depthWrite: false }),
    whitePiece: new THREE.MeshPhysicalMaterial({
      color: 0xf0ece4,
      roughness: 0.2,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    }),
    blackPiece: new THREE.MeshPhysicalMaterial({
      color: 0x0a1018,
      roughness: 0.25,
      metalness: 0.2,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    }),
    boardFrame: new THREE.MeshStandardMaterial({
      color: 0x0c1420,
      roughness: 0.25,
      metalness: 0.85
    }),
    background: new THREE.Color(0x0c1828),
    bloomStrength: 0.5
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
