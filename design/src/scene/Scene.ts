import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface SceneHandles {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  controls: OrbitControls;
  lights: {
    key: THREE.DirectionalLight;
    fill: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
    hemi: THREE.HemisphereLight;
  };
  resize(width: number, height: number): void;
  dispose(): void;
}

export function createScene(container: HTMLElement): SceneHandles {
  const width = Math.max(1, container.clientWidth);
  const height = Math.max(1, container.clientHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101418);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 8, 9);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // Environment map (IBL) — kept at low intensity so it only flavours reflective/glass
  // materials. Full intensity made every white piece glow regardless of direct lighting.
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envTex = pmrem.fromScene(envScene, 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.25;
    pmrem.dispose();
  } catch {
    // PMREM/RoomEnvironment can fail in headless contexts; safe to ignore.
  }

  // --- Lighting rig: balanced for playability, not magazine photography ----
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xbfd6ff, 0x3a2418, 0.3);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4e0, 0.9);
  key.position.set(5, 9, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -8;
  key.shadow.camera.right = 8;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -8;
  key.shadow.bias = -0.0005;
  key.shadow.radius = 4;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xb9d8ff, 0.35);
  fill.position.set(-6, 5, 4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xfff0c0, 0.4);
  rim.position.set(0, 4, -8);
  scene.add(rim);

  const boardSpot = new THREE.SpotLight(0xffe8c2, 0.4, 22, Math.PI / 5, 0.55, 1.4);
  boardSpot.position.set(0, 11, 0);
  boardSpot.target.position.set(0, 0, 0);
  scene.add(boardSpot);
  scene.add(boardSpot.target);

  // --- Controls --------------------------------------------------------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 18;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI / 2 - 0.12;
  controls.enablePan = false;
  controls.rotateSpeed = 0.7;
  controls.update();

  // --- Post-processing -------------------------------------------------
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.3, 0.7, 0.9);
  bloom.threshold = 0.9;
  composer.addPass(bloom);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  function resize(w: number, h: number): void {
    const ww = Math.max(1, w);
    const hh = Math.max(1, h);
    camera.aspect = ww / hh;
    camera.updateProjectionMatrix();
    renderer.setSize(ww, hh);
    composer.setSize(ww, hh);
  }

  function dispose(): void {
    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    bloom,
    controls,
    lights: { key, fill, rim, ambient, hemi },
    resize,
    dispose
  };
}
