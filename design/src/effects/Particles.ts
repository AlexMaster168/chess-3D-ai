import * as THREE from 'three';

interface Burst {
  points: THREE.Points;
  velocities: Float32Array;
  life: number;
  maxLife: number;
}

interface Shockwave {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  finalScale: number;
}

/**
 * Lightweight CPU-driven particle puffs (~50 per burst). Uses a single
 * BufferGeometry per burst to keep draw-calls low. Auto-cleans on expiry.
 */
export class ParticleSystem {
  private bursts: Burst[] = [];
  private shockwaves: Shockwave[] = [];
  private parent: THREE.Object3D;
  private material: THREE.PointsMaterial;

  constructor(parent: THREE.Object3D, color: THREE.ColorRepresentation = 0xffcc66) {
    this.parent = parent;
    this.material = new THREE.PointsMaterial({
      color,
      size: 0.12,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
  }

  setColor(color: THREE.ColorRepresentation): void {
    this.material.color.set(color);
  }

  spawnBurst(
    x: number,
    y: number,
    z: number,
    count = 50,
    options: { color?: THREE.ColorRepresentation; speed?: number; size?: number; maxLife?: number } = {}
  ): void {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const speedScale = options.speed ?? 1;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      // Random hemisphere upward spread.
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.5;
      const speed = (1.4 + Math.random() * 1.8) * speedScale;
      velocities[i * 3 + 0] = Math.cos(theta) * Math.sin(phi) * speed;
      velocities[i * 3 + 1] = Math.cos(phi) * speed * 1.2;
      velocities[i * 3 + 2] = Math.sin(theta) * Math.sin(phi) * speed;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = this.material.clone();
    if (options.color !== undefined) mat.color.set(options.color);
    if (options.size !== undefined) mat.size = options.size;
    const points = new THREE.Points(geo, mat);
    this.parent.add(points);
    this.bursts.push({
      points,
      velocities,
      life: 0,
      maxLife: options.maxLife ?? 0.9
    });
  }

  /** Expanding ring on the board plane — used as the impact shockwave. */
  spawnShockwave(
    x: number,
    y: number,
    z: number,
    options: { color?: THREE.ColorRepresentation; finalScale?: number; maxLife?: number } = {}
  ): void {
    const geo = new THREE.RingGeometry(0.18, 0.32, 64);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: options.color ?? 0xfff0c0,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    this.parent.add(mesh);
    this.shockwaves.push({
      mesh,
      life: 0,
      maxLife: options.maxLife ?? 0.55,
      finalScale: options.finalScale ?? 7
    });
  }

  /** Called each frame from the render loop. */
  update(dt: number): void {
    const gravity = -4.5;
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.life += dt;
      const t = b.life / b.maxLife;
      const posAttr = b.points.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let j = 0; j < arr.length / 3; j++) {
        b.velocities[j * 3 + 1] += gravity * dt;
        arr[j * 3 + 0] += b.velocities[j * 3 + 0] * dt;
        arr[j * 3 + 1] += b.velocities[j * 3 + 1] * dt;
        arr[j * 3 + 2] += b.velocities[j * 3 + 2] * dt;
      }
      posAttr.needsUpdate = true;
      const mat = b.points.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - t);
      mat.size = 0.12 * (1 - 0.4 * t);
      if (b.life >= b.maxLife) {
        this.parent.remove(b.points);
        b.points.geometry.dispose();
        (b.points.material as THREE.Material).dispose();
        this.bursts.splice(i, 1);
      }
    }
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life += dt;
      const t = sw.life / sw.maxLife;
      // Ease-out expansion so the wave races outward then settles.
      const eased = 1 - Math.pow(1 - t, 3);
      const scale = 1 + eased * (sw.finalScale - 1);
      sw.mesh.scale.set(scale, scale, scale);
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.95 * (1 - t));
      if (sw.life >= sw.maxLife) {
        this.parent.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
      }
    }
  }

  dispose(): void {
    for (const b of this.bursts) {
      this.parent.remove(b.points);
      b.points.geometry.dispose();
      (b.points.material as THREE.Material).dispose();
    }
    this.bursts.length = 0;
    for (const sw of this.shockwaves) {
      this.parent.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      (sw.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves.length = 0;
    this.material.dispose();
  }
}
