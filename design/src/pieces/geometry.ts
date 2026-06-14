import * as THREE from 'three';
import type { PieceType } from '../types.js';

const SEG = 20;

function mat(color: number, opts?: { emissive?: number; metalness?: number; roughness?: number }): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissive ? 0.4 : 0,
    metalness: opts?.metalness ?? 0.2,
    roughness: opts?.roughness ?? 0.6
  });
}

function metal(c: number): THREE.MeshStandardMaterial {
  return mat(c, { metalness: 0.85, roughness: 0.25 });
}

function glow(c: number): THREE.MeshStandardMaterial {
  return mat(c, { emissive: c, metalness: 0.1, roughness: 0.3 });
}

function cyl(rt: number, rb: number, h: number, s = SEG): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(rt, rb, h, s);
}

function box(w: number, h: number, d: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(w, h, d);
}

export interface PieceMeshBundle {
  group: THREE.Group;
  shadedMeshes: THREE.Mesh[];
  height: number;
}

// ═══════════════════════════════════════════════════════════════════
// PAWN — Armored footman with round shield and short sword
// ═══════════════════════════════════════════════════════════════════

function buildPawn(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base disc
  const base = new THREE.Mesh(cyl(0.26, 0.28, 0.08), mat(0x3a2a18));
  base.position.y = 0.04;
  g.add(base);

  // Boots
  for (const x of [-0.07, 0.07]) {
    const boot = new THREE.Mesh(box(0.08, 0.1, 0.1), mat(0x2a1a0a));
    boot.position.set(x, 0.13, 0.02);
    g.add(boot);
  }

  // Legs (chainmail)
  for (const x of [-0.06, 0.06]) {
    const leg = new THREE.Mesh(cyl(0.035, 0.03, 0.16), mat(0x666666, { metalness: 0.5 }));
    leg.position.set(x, 0.26, 0);
    g.add(leg);
  }

  // Leather tunic
  const tunic = new THREE.Mesh(cyl(0.11, 0.09, 0.2), mat(0x7a4422));
  tunic.position.y = 0.44;
  g.add(tunic);

  // Belt
  const belt = new THREE.Mesh(cyl(0.1, 0.1, 0.03), mat(0x4a2a10));
  belt.position.y = 0.36;
  g.add(belt);

  // Arms
  for (const x of [-0.13, 0.13]) {
    const arm = new THREE.Mesh(cyl(0.025, 0.02, 0.18), mat(0xc9a87c));
    arm.position.set(x, 0.42, 0);
    arm.rotation.z = x > 0 ? -0.15 : 0.15;
    g.add(arm);
  }

  // Left: round shield
  const shield = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    metal(0x888888)
  );
  shield.rotation.x = Math.PI / 2;
  shield.position.set(-0.18, 0.42, 0.06);
  g.add(shield);

  // Shield boss
  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), metal(0xcccccc));
  boss.position.set(-0.18, 0.42, 0.1);
  g.add(boss);

  // Right: short sword
  const blade = new THREE.Mesh(box(0.02, 0.2, 0.008), metal(0xaaaaaa));
  blade.position.set(0.16, 0.55, 0);
  g.add(blade);
  const hilt = new THREE.Mesh(box(0.06, 0.02, 0.02), mat(0x4a2a10));
  hilt.position.set(0.16, 0.44, 0);
  g.add(hilt);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, SEG, SEG), mat(0xc9a87c));
  head.position.y = 0.62;
  g.add(head);

  // Helmet (simple conical)
  const helm = new THREE.Mesh(
    new THREE.ConeGeometry(0.085, 0.12, 8),
    metal(0x777777)
  );
  helm.position.y = 0.72;
  g.add(helm);

  // Nose guard
  const guard = new THREE.Mesh(box(0.015, 0.06, 0.02), metal(0x777777));
  guard.position.set(0, 0.66, 0.07);
  g.add(guard);

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.82 };
}

// ═══════════════════════════════════════════════════════════════════
// KNIGHT — Heavy cavalry on warhorse
// ═══════════════════════════════════════════════════════════════════

function buildKnight(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base
  const base = new THREE.Mesh(cyl(0.28, 0.3, 0.08), mat(0x2a1a0a));
  base.position.y = 0.04;
  g.add(base);

  // Horse body
  const hBody = new THREE.Mesh(box(0.18, 0.14, 0.35), mat(0x3a2210));
  hBody.position.set(0, 0.22, 0);
  g.add(hBody);

  // Horse neck
  const neck = new THREE.Mesh(box(0.09, 0.22, 0.09), mat(0x3a2210));
  neck.position.set(0, 0.38, 0.14);
  neck.rotation.x = -0.35;
  g.add(neck);

  // Horse head
  const hHead = new THREE.Mesh(box(0.06, 0.08, 0.16), mat(0x3a2210));
  hHead.position.set(0, 0.52, 0.2);
  hHead.rotation.x = -0.5;
  g.add(hHead);

  // Horse ears
  for (const x of [-0.025, 0.025]) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.04, 4),
      mat(0x3a2210)
    );
    ear.position.set(x, 0.58, 0.18);
    ear.rotation.x = -0.3;
    g.add(ear);
  }

  // Horse legs
  for (const [x, z] of [[-0.08, -0.1], [0.08, -0.1], [-0.08, 0.1], [0.08, 0.1]]) {
    const leg = new THREE.Mesh(box(0.04, 0.12, 0.04), mat(0x3a2210));
    leg.position.set(x, 0.1, z);
    g.add(leg);
  }

  // Horse tail
  const tail = new THREE.Mesh(box(0.03, 0.12, 0.02), mat(0x1a0a00));
  tail.position.set(0, 0.28, -0.2);
  tail.rotation.x = 0.3;
  g.add(tail);

  // Rider body (chainmail)
  const rider = new THREE.Mesh(cyl(0.07, 0.06, 0.16), metal(0x666666));
  rider.position.set(0, 0.42, -0.02);
  g.add(rider);

  // Rider arms
  for (const x of [-0.1, 0.1]) {
    const arm = new THREE.Mesh(cyl(0.02, 0.018, 0.14), mat(0xc9a87c));
    arm.position.set(x, 0.4, 0);
    g.add(arm);
  }

  // Lance
  const lance = new THREE.Mesh(cyl(0.01, 0.008, 0.5), mat(0x5a3a1a));
  lance.position.set(0.12, 0.48, 0.12);
  lance.rotation.x = -0.55;
  g.add(lance);

  // Lance tip
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.018, 0.07, 6),
    metal(0xcccccc)
  );
  tip.position.set(0.12, 0.68, 0.3);
  tip.rotation.x = -0.55;
  g.add(tip);

  // Rider head
  const rHead = new THREE.Mesh(new THREE.SphereGeometry(0.055, SEG, SEG), mat(0xc9a87c));
  rHead.position.set(0, 0.58, -0.02);
  g.add(rHead);

  // Rider helm (bucket style)
  const rHelm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.055, 0.08, 8),
    metal(0x888888)
  );
  rHelm.position.set(0, 0.62, -0.02);
  g.add(rHelm);

  // Plume
  const plume = new THREE.Mesh(box(0.01, 0.1, 0.04), mat(0xcc2222));
  plume.position.set(0, 0.7, -0.02);
  g.add(plume);

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.85 };
}

// ═══════════════════════════════════════════════════════════════════
// BISHOP — Hooded mage with crystal staff
// ═══════════════════════════════════════════════════════════════════

function buildBishop(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base
  const base = new THREE.Mesh(cyl(0.26, 0.28, 0.08), mat(0x1a2a4a));
  base.position.y = 0.04;
  g.add(base);

  // Robe (layered)
  const robe1 = new THREE.Mesh(cyl(0.22, 0.16, 0.12), mat(0x1a3366));
  robe1.position.y = 0.14;
  g.add(robe1);
  const robe2 = new THREE.Mesh(cyl(0.16, 0.1, 0.22), mat(0x2244aa));
  robe2.position.y = 0.31;
  g.add(robe2);

  // Sash
  const sash = new THREE.Mesh(box(0.24, 0.025, 0.025), mat(0xdaa520, { metalness: 0.6 }));
  sash.position.set(0, 0.35, 0.08);
  sash.rotation.z = 0.2;
  g.add(sash);

  // Arms
  for (const x of [-0.12, 0.12]) {
    const arm = new THREE.Mesh(cyl(0.022, 0.018, 0.18), mat(0x1a3366));
    arm.position.set(x, 0.38, 0);
    arm.rotation.z = x > 0 ? -0.1 : 0.1;
    g.add(arm);
  }

  // Hands
  for (const x of [-0.12, 0.12]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mat(0xc9a87c));
    hand.position.set(x, 0.28, 0);
    g.add(hand);
  }

  // Staff (right hand)
  const staff = new THREE.Mesh(cyl(0.012, 0.01, 0.5), mat(0x3a2040));
  staff.position.set(0.14, 0.45, 0);
  g.add(staff);

  // Crystal orb
  const orb = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.05, 1),
    glow(0x44aaff)
  );
  orb.position.set(0.14, 0.74, 0);
  g.add(orb);

  // Staff prongs
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const prong = new THREE.Mesh(cyl(0.005, 0.003, 0.04), metal(0xdaa520));
    prong.position.set(
      0.14 + Math.cos(a) * 0.025,
      0.72,
      Math.sin(a) * 0.025
    );
    g.add(prong);
  }

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, SEG, SEG), mat(0xc9a87c));
  head.position.y = 0.58;
  g.add(head);

  // Hood
  const hood = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, SEG, SEG, 0, Math.PI * 2, 0, Math.PI * 0.6),
    mat(0x1a3366)
  );
  hood.position.y = 0.6;
  g.add(hood);

  // Hood tip
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.04, 0.08, 6),
    mat(0x1a3366)
  );
  tip.position.set(0, 0.68, -0.03);
  tip.rotation.x = 0.2;
  g.add(tip);

  // Beard
  const beard = new THREE.Mesh(box(0.035, 0.07, 0.025), mat(0x888888));
  beard.position.set(0, 0.54, 0.05);
  g.add(beard);

  // Eyes (glowing)
  for (const x of [-0.025, 0.025]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.008, 6, 6),
      glow(0x44aaff)
    );
    eye.position.set(x, 0.59, 0.055);
    g.add(eye);
  }

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.82 };
}

// ═══════════════════════════════════════════════════════════════════
// ROOK — Stone golem with glowing eyes
// ═══════════════════════════════════════════════════════════════════

function buildRook(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base
  const base = new THREE.Mesh(cyl(0.3, 0.32, 0.1), mat(0x3a3a3a));
  base.position.y = 0.05;
  g.add(base);

  // Body (massive stone)
  const body = new THREE.Mesh(box(0.26, 0.28, 0.22), mat(0x5a5a5a));
  body.position.y = 0.24;
  g.add(body);

  // Shoulders
  for (const x of [-0.16, 0.16]) {
    const shoulder = new THREE.Mesh(box(0.08, 0.12, 0.12), mat(0x4a4a4a));
    shoulder.position.set(x, 0.34, 0);
    g.add(shoulder);
  }

  // Arms
  for (const x of [-0.24, 0.24]) {
    const arm = new THREE.Mesh(box(0.08, 0.2, 0.08), mat(0x5a5a5a));
    arm.position.set(x, 0.24, 0);
    g.add(arm);

    // Fists (fist-sized rocks)
    const fist = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.065, 0),
      mat(0x6a6a6a)
    );
    fist.position.set(x, 0.12, 0);
    g.add(fist);
  }

  // Head (blocky)
  const head = new THREE.Mesh(box(0.14, 0.12, 0.12), mat(0x5a5a5a));
  head.position.y = 0.44;
  g.add(head);

  // Eyes (glowing red)
  for (const x of [-0.03, 0.03]) {
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.015, 0.015),
      glow(0xff4400)
    );
    eye.position.set(x, 0.46, 0.06);
    g.add(eye);
  }

  // Mouth (dark slit)
  const mouth = new THREE.Mesh(box(0.06, 0.015, 0.015), mat(0x1a1a1a));
  mouth.position.set(0, 0.42, 0.06);
  g.add(mouth);

  // Crenellations
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const crenel = new THREE.Mesh(box(0.05, 0.06, 0.05), mat(0x4a4a4a));
    crenel.position.set(Math.cos(a) * 0.1, 0.54, Math.sin(a) * 0.1);
    g.add(crenel);
  }

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.62 };
}

// ═══════════════════════════════════════════════════════════════════
// QUEEN — Armored sorceress with floating orb
// ═══════════════════════════════════════════════════════════════════

function buildQueen(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base
  const base = new THREE.Mesh(cyl(0.28, 0.3, 0.08), mat(0x2a1a3a));
  base.position.y = 0.04;
  g.add(base);

  // Dress (flowing)
  const dress1 = new THREE.Mesh(cyl(0.24, 0.18, 0.1), mat(0x4a1a5a));
  dress1.position.y = 0.13;
  g.add(dress1);
  const dress2 = new THREE.Mesh(cyl(0.18, 0.1, 0.2), mat(0x6622aa));
  dress2.position.y = 0.28;
  g.add(dress2);

  // Corset (armor)
  const corset = new THREE.Mesh(cyl(0.1, 0.08, 0.12), metal(0x999999));
  corset.position.y = 0.44;
  g.add(corset);

  // Pauldrons
  for (const x of [-0.12, 0.12]) {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      metal(0x999999)
    );
    pauldron.position.set(x, 0.52, 0);
    g.add(pauldron);
  }

  // Arms
  for (const x of [-0.14, 0.14]) {
    const arm = new THREE.Mesh(cyl(0.02, 0.016, 0.16), mat(0xc9a87c));
    arm.position.set(x, 0.42, 0);
    arm.rotation.z = x > 0 ? -0.1 : 0.1;
    g.add(arm);
  }

  // Left hand: floating orb
  const orbGroup = new THREE.Group();
  orbGroup.position.set(-0.16, 0.58, 0);
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 12),
    glow(0xff44ff)
  );
  orbGroup.add(orb);
  // Orb glow
  const orbGlow = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xff44ff, transparent: true, opacity: 0.2, side: THREE.BackSide })
  );
  orbGroup.add(orbGlow);
  // Orbiting ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.006, 8, 24),
    glow(0xff88ff)
  );
  ring.rotation.x = Math.PI / 3;
  orbGroup.add(ring);
  g.add(orbGroup);

  // Crown
  const crownBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.012, 8, 20),
    metal(0xffd700)
  );
  crownBase.position.y = 0.64;
  crownBase.rotation.x = Math.PI / 2;
  g.add(crownBase);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.06, 4),
      metal(0xffd700)
    );
    spike.position.set(Math.cos(a) * 0.08, 0.7, Math.sin(a) * 0.08);
    g.add(spike);
    // Gem on each spike
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.01, 0),
      glow(0xff44ff)
    );
    gem.position.set(Math.cos(a) * 0.08, 0.74, Math.sin(a) * 0.08);
    g.add(gem);
  }

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, SEG, SEG), mat(0xd4b090));
  head.position.y = 0.6;
  g.add(head);

  // Hair (long, flowing back)
  const hair = new THREE.Mesh(box(0.1, 0.06, 0.12), mat(0x1a0a00));
  hair.position.set(0, 0.58, -0.06);
  g.add(hair);

  // Eyes
  for (const x of [-0.02, 0.02]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 6, 6),
      glow(0xff44ff)
    );
    eye.position.set(x, 0.61, 0.05);
    g.add(eye);
  }

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.85 };
}

// ═══════════════════════════════════════════════════════════════════
// KING — Armored warrior king with greatsword and shield
// ═══════════════════════════════════════════════════════════════════

function buildKing(): PieceMeshBundle {
  const g = new THREE.Group();

  // Base
  const base = new THREE.Mesh(cyl(0.3, 0.32, 0.1), mat(0x2a1a0a));
  base.position.y = 0.05;
  g.add(base);

  // Legs (plate armor)
  for (const x of [-0.07, 0.07]) {
    const leg = new THREE.Mesh(box(0.07, 0.18, 0.07), metal(0x777777));
    leg.position.set(x, 0.19, 0);
    g.add(leg);
  }

  // Torso (plate armor)
  const torso = new THREE.Mesh(cyl(0.12, 0.09, 0.22), metal(0x888888));
  torso.position.y = 0.4;
  g.add(torso);

  // Cape
  const cape = new THREE.Mesh(box(0.22, 0.3, 0.015), mat(0x881111, { roughness: 0.8 }));
  cape.position.set(0, 0.38, -0.1);
  cape.rotation.x = 0.12;
  g.add(cape);

  // Pauldrons (large, ornate)
  for (const x of [-0.14, 0.14]) {
    const pauldron = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      metal(0x999999)
    );
    pauldron.position.set(x, 0.52, 0);
    g.add(pauldron);
    // Spikes on pauldrons
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.012, 0.04, 4),
      metal(0xcccccc)
    );
    spike.position.set(x, 0.58, 0);
    g.add(spike);
  }

  // Arms (armored)
  for (const x of [-0.16, 0.16]) {
    const arm = new THREE.Mesh(box(0.05, 0.2, 0.05), metal(0x777777));
    arm.position.set(x, 0.4, 0);
    g.add(arm);
  }

  // Right: greatsword
  const swordBlade = new THREE.Mesh(box(0.025, 0.35, 0.01), metal(0xdddddd));
  swordBlade.position.set(0.18, 0.65, 0);
  g.add(swordBlade);
  const swordEdge = new THREE.Mesh(box(0.015, 0.35, 0.015), metal(0xeeeeee));
  swordEdge.position.set(0.18, 0.65, 0);
  g.add(swordEdge);
  const crossguard = new THREE.Mesh(box(0.08, 0.025, 0.025), metal(0xffd700));
  crossguard.position.set(0.18, 0.47, 0);
  g.add(crossguard);
  const grip = new THREE.Mesh(cyl(0.012, 0.015, 0.08), mat(0x3a1a08));
  grip.position.set(0.18, 0.42, 0);
  g.add(grip);
  // Pommel
  const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), metal(0xffd700));
  pommel.position.set(0.18, 0.37, 0);
  g.add(pommel);

  // Left: heater shield
  const shieldBody = new THREE.Mesh(box(0.1, 0.14, 0.02), metal(0xcccccc));
  shieldBody.position.set(-0.2, 0.42, 0.06);
  g.add(shieldBody);
  // Shield border
  const shieldBorder = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.008, 6, 16),
    metal(0xffd700)
  );
  shieldBorder.position.set(-0.2, 0.42, 0.07);
  g.add(shieldBorder);
  // Shield emblem (crown)
  const emblem = new THREE.Mesh(
    new THREE.TorusGeometry(0.03, 0.005, 6, 12),
    glow(0xff2222)
  );
  emblem.position.set(-0.2, 0.44, 0.08);
  g.add(emblem);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, SEG, SEG), mat(0xc9a87c));
  head.position.y = 0.6;
  g.add(head);

  // Crown
  const crownBase = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.015, 8, 20),
    metal(0xffd700)
  );
  crownBase.position.y = 0.68;
  crownBase.rotation.x = Math.PI / 2;
  g.add(crownBase);

  // Crown points
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const point = new THREE.Mesh(
      new THREE.ConeGeometry(0.015, 0.08, 4),
      metal(0xffd700)
    );
    point.position.set(Math.cos(a) * 0.09, 0.76, Math.sin(a) * 0.09);
    g.add(point);
  }

  // Cross on top
  const crossV = new THREE.Mesh(box(0.015, 0.06, 0.015), metal(0xffd700));
  crossV.position.y = 0.84;
  g.add(crossV);
  const crossH = new THREE.Mesh(box(0.04, 0.015, 0.015), metal(0xffd700));
  crossH.position.y = 0.84;
  g.add(crossH);

  // Eyes
  for (const x of [-0.025, 0.025]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.007, 6, 6),
      glow(0xffd700)
    );
    eye.position.set(x, 0.61, 0.055);
    g.add(eye);
  }

  return { group: g, shadedMeshes: collectMeshes(g), height: 0.95 };
}

function collectMeshes(group: THREE.Group): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  group.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
  });
  return meshes;
}

export function buildPieceMesh(type: PieceType, material: THREE.Material): PieceMeshBundle {
  let bundle: PieceMeshBundle;
  switch (type) {
    case 'p': bundle = buildPawn(); break;
    case 'n': bundle = buildKnight(); break;
    case 'b': bundle = buildBishop(); break;
    case 'r': bundle = buildRook(); break;
    case 'q': bundle = buildQueen(); break;
    case 'k': bundle = buildKing(); break;
  }
  // Apply piece color material ONLY to body/torso meshes, not weapons/armor
  for (const mesh of bundle.shadedMeshes) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }
  return bundle;
}
