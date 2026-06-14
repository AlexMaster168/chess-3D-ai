import * as THREE from 'three';
import type { PieceType } from '../types.js';

export interface BattleParts {
  weapons: THREE.Object3D[];
  limbs: THREE.Object3D[];
  effects: THREE.Object3D[];
  all: THREE.Object3D[];
}

const PART_SCALE = 0.85;

function makeMaterial(color: number, emissive: number = 0x000000): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    emissiveIntensity: 0.3,
    metalness: 0.7,
    roughness: 0.3
  });
}

function makeSword(steelColor: number = 0xc0c0c0): THREE.Group {
  const g = new THREE.Group();
  const bladeMat = makeMaterial(steelColor, 0x222244);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.6, 0.01),
    bladeMat
  );
  blade.position.y = 0.3;
  blade.castShadow = true;

  const guardMat = makeMaterial(0x8B7355);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.03, 0.04),
    guardMat
  );
  guard.position.y = 0.0;

  const gripMat = makeMaterial(0x4a3728);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.12, 8),
    gripMat
  );
  grip.position.y = -0.07;

  g.add(blade, guard, grip);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeShield(color: number = 0x8B4513): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMaterial(color, 0x111111);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16),
    mat
  );
  disc.rotation.x = Math.PI / 2;
  disc.castShadow = true;

  const bossMat = makeMaterial(0xDAA520, 0x221100);
  const boss = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    bossMat
  );
  boss.position.z = 0.025;

  g.add(disc, boss);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeSpear(): THREE.Group {
  const g = new THREE.Group();
  const shaftMat = makeMaterial(0x8B4513);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6),
    shaftMat
  );
  shaft.position.y = 0.35;
  shaft.castShadow = true;

  const tipMat = makeMaterial(0xc0c0c0, 0x333333);
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.025, 0.1, 8),
    tipMat
  );
  tip.position.y = 0.75;

  g.add(shaft, tip);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeStaff(orbColor: number = 0x44aaff): THREE.Group {
  const g = new THREE.Group();
  const shaftMat = makeMaterial(0x5C4033);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.02, 0.9, 8),
    shaftMat
  );
  shaft.position.y = 0.45;
  shaft.castShadow = true;

  const orbMat = new THREE.MeshStandardMaterial({
    color: orbColor,
    emissive: orbColor,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
    metalness: 0.1,
    roughness: 0.2
  });
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 16),
    orbMat
  );
  orb.position.y = 0.95;

  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xDAA520,
    emissive: 0xDAA520,
    emissiveIntensity: 0.3,
    metalness: 0.9,
    roughness: 0.1
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.008, 8, 24),
    ringMat
  );
  ring.position.y = 0.95;
  ring.rotation.x = Math.PI / 2;

  g.add(shaft, orb, ring);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeGolemArm(): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMaterial(0x696969, 0x111111);

  const upper = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.35, 0.12),
    mat
  );
  upper.position.y = 0.175;
  upper.castShadow = true;

  const lower = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.3, 0.14),
    mat
  );
  lower.position.y = 0.5;
  lower.position.z = 0.08;

  const fist = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.14, 0.18),
    mat
  );
  fist.position.y = 0.68;
  fist.position.z = 0.08;
  fist.castShadow = true;

  g.add(upper, lower, fist);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeMagicOrb(color: number = 0xff44ff): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.7,
    metalness: 0,
    roughness: 0.1
  });
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 20, 20),
    mat
  );
  sphere.castShadow = false;

  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 16),
    glowMat
  );

  g.add(sphere, glow);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeBroadSword(): THREE.Group {
  const g = new THREE.Group();
  const bladeMat = makeMaterial(0xe8e8e8, 0x111122);
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.55, 0.015),
    bladeMat
  );
  blade.position.y = 0.275;
  blade.castShadow = true;

  const edgeMat = makeMaterial(0xffffff, 0x222222);
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.12, 0.02),
    edgeMat
  );
  edge.position.y = 0.58;

  const guardMat = makeMaterial(0xDAA520, 0x221100);
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.035, 0.05),
    guardMat
  );
  guard.position.y = 0.0;

  const gripMat = makeMaterial(0x4a3728);
  const grip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.14, 8),
    gripMat
  );
  grip.position.y = -0.085;

  g.add(blade, edge, guard, grip);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeAxe(): THREE.Group {
  const g = new THREE.Group();
  const shaftMat = makeMaterial(0x5C4033);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.018, 0.65, 6),
    shaftMat
  );
  shaft.position.y = 0.325;
  shaft.castShadow = true;

  const bladeMat = makeMaterial(0x888888, 0x111111);
  const bladeGeo = new THREE.BoxGeometry(0.2, 0.18, 0.02);
  const bladeL = new THREE.Mesh(bladeGeo, bladeMat);
  bladeL.position.set(-0.06, 0.6, 0);
  bladeL.rotation.z = 0.15;
  bladeL.castShadow = true;

  const bladeR = new THREE.Mesh(bladeGeo, bladeMat);
  bladeR.position.set(0.06, 0.6, 0);
  bladeR.rotation.z = -0.15;
  bladeR.castShadow = true;

  g.add(shaft, bladeL, bladeR);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeMagicCrown(color: number = 0xffd700): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.6,
    metalness: 0.9,
    roughness: 0.1
  });

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.02, 0.12, 6),
      mat
    );
    spike.position.set(Math.cos(a) * 0.1, 0.06, Math.sin(a) * 0.1);
    g.add(spike);
  }

  const base = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.015, 8, 24),
    mat
  );
  base.rotation.x = Math.PI / 2;
  g.add(base);

  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeHorseHead(): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMaterial(0x3a2a1a, 0x050302);

  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.3, 0.15),
    mat
  );
  neck.position.set(0, 0.15, 0.08);
  neck.rotation.x = -0.2;
  neck.castShadow = true;

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.22),
    mat
  );
  head.position.set(0, 0.38, 0.2);
  head.rotation.x = -0.4;
  head.castShadow = true;

  const earMat = makeMaterial(0x2a1a0a);
  const earGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
  const earL = new THREE.Mesh(earGeo, earMat);
  earL.position.set(-0.04, 0.48, 0.14);
  earL.rotation.z = 0.3;
  const earR = new THREE.Mesh(earGeo, earMat);
  earR.position.set(0.04, 0.48, 0.14);
  earR.rotation.z = -0.3;

  const maneMat = makeMaterial(0x1a0a00);
  for (let i = 0; i < 4; i++) {
    const mane = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.03, 0.04),
      maneMat
    );
    mane.position.set(0, 0.35 - i * 0.08, 0.01);
    mane.rotation.x = 0.1;
    g.add(mane);
  }

  g.add(neck, head, earL, earR);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeCape(color: number = 0x8B0000): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    metalness: 0.1,
    roughness: 0.8
  });
  const cape = new THREE.Mesh(
    new THREE.PlaneGeometry(0.35, 0.5),
    mat
  );
  cape.position.set(0, 0.25, -0.15);
  cape.rotation.x = 0.3;
  cape.castShadow = true;
  g.add(cape);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeMagicRing(color: number = 0x44aaff): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.015, 8, 48),
    mat
  );
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeRockFist(): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMaterial(0x555555, 0x0a0a0a);
  const fist = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.12, 0),
    mat
  );
  fist.castShadow = true;
  g.add(fist);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeWhip(): THREE.Group {
  const g = new THREE.Group();
  const mat = makeMaterial(0x3a2a1a);
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.006, 0.08, 4),
      mat
    );
    seg.position.set(0, 0.04 + i * 0.08, 0);
    seg.rotation.z = Math.sin(i * 0.8) * 0.15;
    g.add(seg);
  }
  const tip = new THREE.Mesh(
    new THREE.ConeGeometry(0.015, 0.04, 4),
    makeMaterial(0xc0c0c0)
  );
  tip.position.y = 0.04 + segments * 0.08;
  g.add(tip);
  g.scale.setScalar(PART_SCALE);
  return g;
}

function makeMagicBlast(color: number = 0x44aaff): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const blast = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 12),
    mat
  );
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
  );
  g.add(blast, glow);
  g.scale.setScalar(PART_SCALE);
  return g;
}

export function createBattleParts(type: PieceType): BattleParts {
  const weapons: THREE.Object3D[] = [];
  const limbs: THREE.Object3D[] = [];
  const effects: THREE.Object3D[] = [];

  switch (type) {
    case 'p': {
      const sword = makeSword(0xb0b0b0);
      sword.name = 'weapon_sword';
      sword.position.set(0.2, 0.45, 0.15);
      sword.visible = false;
      weapons.push(sword);

      const shield = makeShield(0x8B4513);
      shield.name = 'weapon_shield';
      shield.position.set(-0.2, 0.4, 0.15);
      shield.visible = false;
      weapons.push(shield);

      const spear = makeSpear();
      spear.name = 'weapon_spear';
      spear.position.set(0.2, 0, 0.15);
      spear.rotation.z = -0.5;
      spear.visible = false;
      weapons.push(spear);
      break;
    }
    case 'n': {
      const sword = makeSword(0xd4af37);
      sword.name = 'weapon_sword';
      sword.position.set(0.22, 0.5, 0.2);
      sword.visible = false;
      weapons.push(sword);

      const horse = makeHorseHead();
      horse.name = 'limb_horse';
      horse.position.set(0, 0.35, 0.15);
      horse.visible = false;
      limbs.push(horse);

      const lance = makeSpear();
      lance.name = 'weapon_lance';
      lance.position.set(0.18, 0.1, 0.25);
      lance.rotation.z = -0.3;
      lance.visible = false;
      weapons.push(lance);
      break;
    }
    case 'b': {
      const staff = makeStaff(0x44aaff);
      staff.name = 'weapon_staff';
      staff.position.set(0.2, 0, 0.15);
      staff.visible = false;
      weapons.push(staff);

      const orb = makeMagicOrb(0x44aaff);
      orb.name = 'effect_orb';
      orb.position.set(0, 1.1, 0);
      orb.visible = false;
      effects.push(orb);

      const cape = makeCape(0x000066);
      cape.name = 'limb_cape';
      cape.position.set(0, 0.2, -0.18);
      cape.visible = false;
      limbs.push(cape);
      break;
    }
    case 'r': {
      const armL = makeGolemArm();
      armL.name = 'limb_arm_l';
      armL.position.set(-0.3, 0.1, 0.1);
      armL.rotation.z = 0.5;
      armL.visible = false;
      limbs.push(armL);

      const armR = makeGolemArm();
      armR.name = 'limb_arm_r';
      armR.position.set(0.3, 0.1, 0.1);
      armR.rotation.z = -0.5;
      armR.visible = false;
      limbs.push(armR);

      const rockL = makeRockFist();
      rockL.name = 'weapon_fist_l';
      rockL.position.set(-0.4, 0.65, 0.1);
      rockL.visible = false;
      weapons.push(rockL);

      const rockR = makeRockFist();
      rockR.name = 'weapon_fist_r';
      rockR.position.set(0.4, 0.65, 0.1);
      rockR.visible = false;
      weapons.push(rockR);
      break;
    }
    case 'q': {
      const crown = makeMagicCrown(0xffd700);
      crown.name = 'effect_crown';
      crown.position.set(0, 1.15, 0);
      crown.visible = false;
      effects.push(crown);

      const orb = makeMagicOrb(0xff44ff);
      orb.name = 'effect_orb';
      orb.position.set(0.25, 0.7, 0.15);
      orb.visible = false;
      effects.push(orb);

      const ring = makeMagicRing(0xff44ff);
      ring.name = 'effect_ring';
      ring.position.set(0, 0.5, 0);
      ring.visible = false;
      effects.push(ring);

      const blast = makeMagicBlast(0xff44ff);
      blast.name = 'effect_blast';
      blast.position.set(0, 0.8, 0.3);
      blast.visible = false;
      effects.push(blast);
      break;
    }
    case 'k': {
      const sword = makeBroadSword();
      sword.name = 'weapon_sword';
      sword.position.set(0.22, 0.45, 0.15);
      sword.visible = false;
      weapons.push(sword);

      const shield = makeShield(0xDAA520);
      shield.name = 'weapon_shield';
      shield.position.set(-0.22, 0.45, 0.15);
      shield.visible = false;
      weapons.push(shield);

      const whip = makeWhip();
      whip.name = 'weapon_whip';
      whip.position.set(0.22, 0.3, 0.15);
      whip.visible = false;
      weapons.push(whip);
      break;
    }
  }

  const all = [...weapons, ...limbs, ...effects];
  return { weapons, limbs, effects, all };
}

export function attachBattleParts(parent: THREE.Group, parts: BattleParts): void {
  for (const obj of parts.all) {
    parent.add(obj);
  }
}

export function detachBattleParts(parent: THREE.Group, parts: BattleParts): void {
  for (const obj of parts.all) {
    parent.remove(obj);
  }
}

export function showParts(parts: BattleParts, names: string[]): void {
  for (const obj of parts.all) {
    if (names.some(n => obj.name.includes(n))) {
      obj.visible = true;
    }
  }
}

export function hideAllParts(parts: BattleParts): void {
  for (const obj of parts.all) {
    obj.visible = false;
  }
}

export function findPart(parts: BattleParts, name: string): THREE.Object3D | undefined {
  return parts.all.find(obj => obj.name.includes(name));
}
