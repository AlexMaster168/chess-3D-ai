import * as THREE from 'three';
import type { PieceType } from '../types.js';

/**
 * Build procedural chess piece geometries with LatheGeometry + accents.
 * Each piece returns a single THREE.Group ready to be cloned/parented.
 */

const LATHE_SEGMENTS = 48;

function lathe(profile: Array<[number, number]>): THREE.BufferGeometry {
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(points, LATHE_SEGMENTS);
  geo.computeVertexNormals();
  return geo;
}

function basePawn(): THREE.BufferGeometry {
  return lathe([
    [0.0, 0.0],
    [0.32, 0.0],
    [0.32, 0.04],
    [0.28, 0.06],
    [0.22, 0.1],
    [0.16, 0.2],
    [0.14, 0.45],
    [0.18, 0.55],
    [0.13, 0.58],
    [0.18, 0.62],
    [0.22, 0.74],
    [0.0, 0.78]
  ]);
}

function baseRook(): THREE.BufferGeometry {
  return lathe([
    [0.0, 0.0],
    [0.36, 0.0],
    [0.36, 0.05],
    [0.3, 0.08],
    [0.24, 0.18],
    [0.22, 0.7],
    [0.28, 0.78],
    [0.3, 0.86],
    [0.3, 0.95],
    [0.0, 0.95]
  ]);
}

function rookCrown(): THREE.Group {
  const g = new THREE.Group();
  const crenelGeo = new THREE.BoxGeometry(0.1, 0.12, 0.1);
  // Push the geometry up so we just position the placeholder.
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const mesh = new THREE.Mesh(crenelGeo, undefined);
    mesh.position.set(Math.cos(a) * 0.22, 1.0, Math.sin(a) * 0.22);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

function baseKnight(): THREE.BufferGeometry {
  // Base + abstract horse head approximated with a stretched box.
  return lathe([
    [0.0, 0.0],
    [0.36, 0.0],
    [0.36, 0.05],
    [0.3, 0.08],
    [0.22, 0.2],
    [0.2, 0.5],
    [0.24, 0.55],
    [0.18, 0.58],
    [0.0, 0.6]
  ]);
}

function knightHead(): THREE.BufferGeometry {
  // Make the head from a tilted, scaled icosahedron to suggest a horse.
  const head = new THREE.IcosahedronGeometry(0.28, 0);
  head.scale(0.7, 1.1, 1.4);
  head.translate(0, 0.85, 0.1);
  head.rotateX(-0.25);
  head.computeVertexNormals();
  return head;
}

function baseBishop(): THREE.BufferGeometry {
  return lathe([
    [0.0, 0.0],
    [0.34, 0.0],
    [0.34, 0.05],
    [0.28, 0.08],
    [0.2, 0.2],
    [0.16, 0.6],
    [0.22, 0.7],
    [0.16, 0.74],
    [0.22, 0.82],
    [0.1, 0.95],
    [0.05, 1.0],
    [0.0, 1.05]
  ]);
}

function baseQueen(): THREE.BufferGeometry {
  return lathe([
    [0.0, 0.0],
    [0.38, 0.0],
    [0.38, 0.05],
    [0.32, 0.08],
    [0.22, 0.2],
    [0.18, 0.65],
    [0.26, 0.78],
    [0.2, 0.82],
    [0.28, 0.9],
    [0.18, 1.0],
    [0.1, 1.1],
    [0.0, 1.15]
  ]);
}

function queenCrown(): THREE.Group {
  const g = new THREE.Group();
  const tipGeo = new THREE.SphereGeometry(0.05, 12, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const m = new THREE.Mesh(tipGeo);
    m.position.set(Math.cos(a) * 0.22, 1.18, Math.sin(a) * 0.22);
    m.castShadow = true;
    m.receiveShadow = true;
    g.add(m);
  }
  return g;
}

function baseKing(): THREE.BufferGeometry {
  return lathe([
    [0.0, 0.0],
    [0.4, 0.0],
    [0.4, 0.05],
    [0.32, 0.08],
    [0.22, 0.2],
    [0.18, 0.7],
    [0.28, 0.82],
    [0.22, 0.86],
    [0.3, 0.95],
    [0.18, 1.05],
    [0.12, 1.15]
  ]);
}

function kingCross(): THREE.Group {
  const g = new THREE.Group();
  const vGeo = new THREE.BoxGeometry(0.06, 0.22, 0.06);
  const hGeo = new THREE.BoxGeometry(0.16, 0.06, 0.06);
  const v = new THREE.Mesh(vGeo);
  v.position.set(0, 1.27, 0);
  const h = new THREE.Mesh(hGeo);
  h.position.set(0, 1.27, 0);
  v.castShadow = h.castShadow = true;
  v.receiveShadow = h.receiveShadow = true;
  g.add(v, h);
  return g;
}

export interface PieceMeshBundle {
  group: THREE.Group;
  /** All Mesh children that should receive the piece material (for theme swaps). */
  shadedMeshes: THREE.Mesh[];
  /** Approximate piece height for animation arcs. */
  height: number;
}

export function buildPieceMesh(type: PieceType, material: THREE.Material): PieceMeshBundle {
  const group = new THREE.Group();
  let bodyGeo: THREE.BufferGeometry;
  const extras: THREE.Group[] = [];
  let height = 1.0;

  switch (type) {
    case 'p':
      bodyGeo = basePawn();
      height = 0.78;
      break;
    case 'r':
      bodyGeo = baseRook();
      extras.push(rookCrown());
      height = 1.0;
      break;
    case 'n':
      bodyGeo = baseKnight();
      // Knight head as separate mesh so silhouette reads.
      {
        const headMesh = new THREE.Mesh(knightHead(), material);
        headMesh.castShadow = true;
        headMesh.receiveShadow = true;
        group.add(headMesh);
      }
      height = 1.05;
      break;
    case 'b':
      bodyGeo = baseBishop();
      height = 1.05;
      break;
    case 'q':
      bodyGeo = baseQueen();
      extras.push(queenCrown());
      height = 1.22;
      break;
    case 'k':
      bodyGeo = baseKing();
      extras.push(kingCross());
      height = 1.35;
      break;
  }

  const body = new THREE.Mesh(bodyGeo, material);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const shaded: THREE.Mesh[] = [body];
  for (const ex of extras) {
    // Assign material to all child meshes of decoration groups.
    ex.traverse(obj => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.material = material;
        m.castShadow = true;
        m.receiveShadow = true;
        shaded.push(m);
      }
    });
    group.add(ex);
  }
  // Knight head shaded mesh tracking
  group.children.forEach(c => {
    if ((c as THREE.Mesh).isMesh && !shaded.includes(c as THREE.Mesh)) {
      shaded.push(c as THREE.Mesh);
    }
  });

  return { group, shadedMeshes: shaded, height };
}
