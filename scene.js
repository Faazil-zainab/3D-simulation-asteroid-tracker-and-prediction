import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/postprocessing/ShaderPass.js';

const EARTH_RADIUS = 6371;
const SUN_RADIUS_KM = 696340;
const PLANET_RADIUS_VISUAL_SCALE = 0.02;
const ASTEROID_RADIUS = 150;
const ASTEROID_SCALE_FACTOR = 32000;
const ASTEROID_SAMPLE_COUNT = 40;
const BELT_ASTEROID_COUNT = 0;
const ASTEROID_TRAIL_POINTS = 24;
const ASTEROID_MOTION_SCALE = 0.2;
const PLANET_SPIN_SCALE = 0.06;
const ASTEROID_NEAR_PLANET_DISTANCE = 28000;

const planetConfigs = [
  {
    name: 'Mercury',
    radius: 2439,
    visualRadius: 120,
    orbitRadius: 30000,
    orbitSpeed: 4.15,
    texturePath: 'https://threejs.org/examples/textures/planets/mercury.jpg',
    orbitColor: 0xb9b0a8,
    axialTilt: 0.03,
    shininess: 8,
    glowColor: 0x8e8a84,
    glowIntensity: 0.08,
  },
  {
    name: 'Venus',
    radius: 6051,
    visualRadius: 170,
    orbitRadius: 43000,
    orbitSpeed: 1.62,
    texturePath: 'https://threejs.org/examples/textures/planets/venus.jpg',
    orbitColor: 0xe8c58f,
    axialTilt: 177.4,
    shininess: 10,
    glowColor: 0xffd59a,
    glowIntensity: 0.12,
  },
  {
    name: 'Earth',
    radius: EARTH_RADIUS,
    visualRadius: 190,
    orbitRadius: 76000,
    orbitSpeed: 1.0,
    texturePath: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
    orbitColor: 0x4db7ff,
    axialTilt: 23.4,
    shininess: 18,
    glowColor: 0x74c7ff,
    glowIntensity: 0.22,
    specularMapPath: 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg',
    normalMapPath: 'https://threejs.org/examples/textures/planets/earth_normal_2048.jpg',
    cloudMapPath: 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png',
  },
  {
    name: 'Mars',
    radius: 3390,
    visualRadius: 140,
    orbitRadius: 98000,
    orbitSpeed: 0.53,
    texturePath: 'https://threejs.org/examples/textures/planets/mars_1k_color.jpg',
    orbitColor: 0xff7b52,
    axialTilt: 25.2,
    shininess: 8,
    glowColor: 0xff9a6d,
    glowIntensity: 0.28,
  },
  {
    name: 'Jupiter',
    radius: 69911,
    visualRadius: 360,
    orbitRadius: 135000,
    orbitSpeed: 0.084,
    texturePath: 'https://threejs.org/examples/textures/planets/jupiter.jpg',
    orbitColor: 0xd9b38c,
    axialTilt: 3.1,
    shininess: 14,
    sizeMultiplier: 1.22,
    glowColor: 0xe8caa7,
    glowIntensity: 0.18,
  },
  {
    name: 'Saturn',
    radius: 58232,
    orbitRadius: 180000,
    orbitSpeed: 0.034,
    texturePath: 'https://threejs.org/examples/textures/planets/saturn.jpg',
    orbitColor: 0xf0d88a,
    axialTilt: 26.7,
    shininess: 12,
    sizeMultiplier: 1.18,
    ringTexturePath: 'https://threejs.org/examples/textures/planets/saturnringcolor.jpg',
    ringInnerScale: 1.25,
    ringOuterScale: 2.15,
    ringTiltDeg: 9.5,
    ringOpacity: 0.95,
    glowColor: 0xf6e0a6,
    glowIntensity: 0.2,
    ringGlowColor: 0xfff1c1,
    ringGlowIntensity: 0.42,
  },
  {
    name: 'Uranus',
    radius: 25362,
    orbitRadius: 225000,
    orbitSpeed: 0.012,
    texturePath: 'https://threejs.org/examples/textures/planets/uranus.jpg',
    orbitColor: 0x79e7f2,
    axialTilt: 97.8,
    shininess: 10,
    sizeMultiplier: 0.94,
    ringInnerScale: 1.35,
    ringOuterScale: 1.95,
    ringTiltDeg: 97.8,
    ringOpacity: 0.5,
    ringColor: 0x7ec4dd,
    glowColor: 0x8feef7,
    glowIntensity: 0.16,
    ringGlowColor: 0xdffcff,
    ringGlowIntensity: 0.34,
  },
  {
    name: 'Neptune',
    radius: 24622,
    visualRadius: 235,
    orbitRadius: 270000,
    orbitSpeed: 0.006,
    texturePath: 'https://threejs.org/examples/textures/planets/neptune.jpg',
    orbitColor: 0x5d8dff,
    axialTilt: 28.3,
    shininess: 10,
    sizeMultiplier: 0.94,
    glowColor: 0x779eff,
    glowIntensity: 0.18,
  },
];

const MARS_ORBIT_RADIUS = planetConfigs.find((planet) => planet.name === 'Mars').orbitRadius;
const JUPITER_ORBIT_RADIUS = planetConfigs.find((planet) => planet.name === 'Jupiter').orbitRadius;

function createProceduralEarthTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0b5ab5');
  gradient.addColorStop(0.5, '#1d8fe8');
  gradient.addColorStop(1, '#0d2e62');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = 'rgba(95, 172, 84, 0.9)';
  for (let index = 0; index < 220; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const width = 10 + Math.random() * 26;
    const height = 8 + Math.random() * 18;
    context.beginPath();
    context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 0.22;
  context.fillStyle = '#ffffff';
  for (let index = 0; index < 180; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    context.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralAsteroidTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#9a8d7d');
  gradient.addColorStop(0.55, '#5f554b');
  gradient.addColorStop(1, '#2e2924');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = 'rgba(32, 27, 24, 0.5)';
  for (let index = 0; index < 160; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 4 + Math.random() * 20;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralStarTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  gradient.addColorStop(0, '#070a12');
  gradient.addColorStop(1, '#010204');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = '#ffffff';
  for (let index = 0; index < 2400; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const intensity = Math.random();
    context.globalAlpha = intensity;
    context.fillRect(x, y, intensity > 0.85 ? 2 : 1, intensity > 0.85 ? 2 : 1);
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  return texture;
}

function createProceduralGlowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size * 0.5, size * 0.5, 0, size * 0.5, size * 0.5, size * 0.5);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 245, 220, 0.96)');
  gradient.addColorStop(0.45, 'rgba(255, 193, 92, 0.48)');
  gradient.addColorStop(0.72, 'rgba(255, 132, 54, 0.14)');
  gradient.addColorStop(1, 'rgba(255, 132, 54, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralNebulaTexture(primaryColor, secondaryColor) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size * 0.45, size * 0.42, 8, size * 0.5, size * 0.5, size * 0.5);
  gradient.addColorStop(0, primaryColor);
  gradient.addColorStop(0.48, secondaryColor);
  gradient.addColorStop(0.84, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.globalCompositeOperation = 'screen';
  for (let index = 0; index < 220; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 16 + Math.random() * 48;
    const cloud = context.createRadialGradient(x, y, 0, x, y, radius);
    cloud.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    cloud.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = cloud;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createStarfieldGeometry(count, minRadius, maxRadius) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const radius = THREE.MathUtils.lerp(minRadius, maxRadius, Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;

    color.setHSL(THREE.MathUtils.lerp(0.55, 0.67, Math.random()), THREE.MathUtils.lerp(0.15, 0.45, Math.random()), THREE.MathUtils.lerp(0.72, 1, Math.random()));
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

function createAsteroidTrailMaterial(color = 0x6ad7ff, opacity = 0.34) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function createAsteroidTrailGeometry() {
  const positions = new Float32Array(ASTEROID_TRAIL_POINTS * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, ASTEROID_TRAIL_POINTS);
  return geometry;
}

function createAsteroidLabelSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(4, 12, 24, 0.72)';
  context.strokeStyle = 'rgba(120, 210, 255, 0.8)';
  context.lineWidth = 3;
  context.fillRect(8, 8, canvas.width - 16, canvas.height - 16);
  context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  context.fillStyle = '#e9f8ff';
  context.font = '700 28px "Space Grotesk", sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width * 0.5, canvas.height * 0.5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(6800, 2400, 1);
  sprite.visible = false;

  return sprite;
}

const FilmicOverlayShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grainIntensity: { value: 0.05 },
    vignetteStrength: { value: 0.42 },
    aberrationStrength: { value: 0.0007 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float time;
    uniform float grainIntensity;
    uniform float vignetteStrength;
    uniform float aberrationStrength;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    void main() {
      vec2 centeredUv = vUv - 0.5;
      float distanceFromCenter = length(centeredUv);
      vec2 chromaOffset = centeredUv * aberrationStrength * (1.0 + distanceFromCenter * 1.8);

      vec3 color;
      color.r = texture2D(tDiffuse, vUv + chromaOffset).r;
      color.g = texture2D(tDiffuse, vUv).g;
      color.b = texture2D(tDiffuse, vUv - chromaOffset).b;

      float vignette = smoothstep(0.95, 0.15, distanceFromCenter);
      color *= mix(1.0 - vignetteStrength, 1.0, vignette);

      float grain = hash(vUv * (1200.0 + time * 20.0) + vec2(time, time * 1.7)) - 0.5;
      color += grain * grainIntensity;

      float scanline = sin((vUv.y + time * 0.04) * 1600.0) * 0.005;
      color -= scanline;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function createProceduralPlanetTexture(seedLabel) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const palettes = {
    Mercury: ['#6e6c69', '#4d4b48', '#272524'],
    Venus: ['#c59a52', '#8f6b2d', '#4d3818'],
    Earth: ['#0b5ab5', '#1d8fe8', '#0d2e62'],
    Mars: ['#c96c45', '#8d3f28', '#4f2116'],
    Jupiter: ['#d1b08c', '#9e6e4f', '#4a3527'],
    Saturn: ['#dcc98f', '#b48e58', '#6d5b36'],
    Uranus: ['#7bd2de', '#4596b3', '#23536f'],
    Neptune: ['#416fda', '#2441a0', '#15275f'],
  };
  const [base, mid, dark] = palettes[seedLabel] || ['#b7b7b7', '#7e7e7e', '#404040'];

  const gradient = context.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, base);
  gradient.addColorStop(0.5, mid);
  gradient.addColorStop(1, dark);
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.globalAlpha = 0.2;
  context.fillStyle = '#ffffff';
  for (let index = 0; index < 140; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const width = 8 + Math.random() * 18;
    const height = 4 + Math.random() * 14;
    context.beginPath();
    context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralCloudTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  context.clearRect(0, 0, size, size);
  context.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let index = 0; index < 150; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const width = 12 + Math.random() * 34;
    const height = 6 + Math.random() * 18;
    context.beginPath();
    context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralRingTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size * 0.5, size * 0.5, size * 0.1, size * 0.5, size * 0.5, size * 0.5);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.42, 'rgba(214, 196, 162, 0.20)');
  gradient.addColorStop(0.6, 'rgba(189, 165, 125, 0.58)');
  gradient.addColorStop(0.74, 'rgba(145, 123, 92, 0.36)');
  gradient.addColorStop(0.86, 'rgba(255, 235, 188, 0.10)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.strokeStyle = 'rgba(93, 79, 56, 0.28)';
  context.lineWidth = 5;
  for (let index = 0; index < 24; index += 1) {
    const radius = size * (0.18 + (index / 24) * 0.28);
    context.beginPath();
    context.arc(size * 0.5, size * 0.5, radius, 0, Math.PI * 2);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createProceduralAsteroidColorTexture(tint = '#d0c3ad') {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');

  const gradient = context.createRadialGradient(size * 0.35, size * 0.35, 10, size * 0.5, size * 0.5, size * 0.5);
  gradient.addColorStop(0, tint);
  gradient.addColorStop(0.6, '#6f6255');
  gradient.addColorStop(1, '#2b241f');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  context.fillStyle = 'rgba(24, 20, 18, 0.55)';
  for (let index = 0; index < 130; index += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 4 + Math.random() * 18;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createAsteroidMaterialTexture() {
  return loadTextureWithFallback('asteroid_texture.jpg', () => createProceduralAsteroidColorTexture());
}

function computeCollisionProbability(distance, velocityMagnitude) {
  const safeDistance = Math.max(distance, 1);
  const rawScore = (Math.max(velocityMagnitude, 0) / (safeDistance * safeDistance)) * 1000;
  return rawScore / (1 + rawScore);
}

function classifyProbability(probability) {
  if (probability >= 0.66) {
    return 'HIGH';
  }

  if (probability >= 0.33) {
    return 'MEDIUM';
  }

  return 'SAFE';
}

function createAsteroidFromData(data, index, sharedTexture) {
  const orbitRadius = Math.max(20000, data.orbitRadius ?? (data.semi_major_axis * ASTEROID_SCALE_FACTOR));
  const orbitSpeed = data.orbitSpeed;
  const inclination = data.inclination;
  const inclinationDeg = Number.isFinite(data.inclinationDeg) ? data.inclinationDeg : 0;
  const orbitalPeriod = Number.isFinite(data.orbitalPeriod) ? data.orbitalPeriod : (orbitSpeed > 0 ? 1 / orbitSpeed : 0);
  const initialAngle = Number.isFinite(data.initialAngle) ? data.initialAngle : (index / ASTEROID_SAMPLE_COUNT) * Math.PI * 2;
  const asteroidGeometry = new THREE.IcosahedronGeometry(ASTEROID_RADIUS * (0.78 + (index % 5) * 0.08), 1);
  const asteroidMaterial = new THREE.MeshStandardMaterial({
    map: sharedTexture,
    color: 0x8c6a4a,
    roughness: 1,
    metalness: 0.02,
    flatShading: true,
    emissive: new THREE.Color(0x3a2415),
    emissiveIntensity: 0.3,
  });
  const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
  asteroid.name = `Asteroid-${index + 1}`;
  asteroid.orbitRadius = orbitRadius;
  asteroid.orbitSpeed = orbitSpeed;
  asteroid.inclination = inclination;
  asteroid.inclinationDeg = inclinationDeg;
  asteroid.orbitalPeriod = orbitalPeriod;
  asteroid.initialAngle = initialAngle;
  asteroid.userData.motionAngle = initialAngle;
  asteroid.velocity = orbitRadius * orbitSpeed;
  asteroid.closestDistance = Infinity;
  asteroid.closestApproach = Infinity;
  asteroid.collisionProbability = 0;
  asteroid.riskLevel = 'SAFE';
  asteroid.userData.baseScale = asteroid.scale.clone();
  asteroid.userData.baseColor = asteroid.material.color.clone();
  asteroid.userData.baseEmissive = asteroid.material.emissive.clone();
  asteroid.userData.baseEmissiveIntensity = asteroid.material.emissiveIntensity ?? 0.3;
  asteroid.userData.source = data;

  const visibilityGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createProceduralGlowTexture(),
      color: 0xb8875d,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
  );
  visibilityGlow.scale.setScalar(ASTEROID_RADIUS * 9.5);
  visibilityGlow.renderOrder = 1;
  asteroid.userData.visibilityGlow = visibilityGlow;
  asteroid.position.set(
    orbitRadius * Math.cos(initialAngle),
    inclination * Math.sin(initialAngle),
    orbitRadius * Math.sin(initialAngle)
  );
  return asteroid;
}

function createAsteroidBeltEntry(index) {
  const orbitRadius = THREE.MathUtils.lerp(MARS_ORBIT_RADIUS, JUPITER_ORBIT_RADIUS, Math.random());
  const orbitSpeed = THREE.MathUtils.lerp(0.008, 0.022, Math.random());
  const inclination = THREE.MathUtils.lerp(100, 4200, Math.random()) * (Math.random() > 0.5 ? 1 : -1);
  const initialAngle = Math.random() * Math.PI * 2;
  const scale = THREE.MathUtils.lerp(0.12, 0.45, Math.random());

  return {
    index,
    orbitRadius,
    orbitSpeed,
    inclination,
    initialAngle,
    scale,
    closestDistance: Infinity,
    riskLevel: 'SAFE',
  };
}

function loadTextureWithFallback(url, fallbackFactory) {
  const fallbackTexture = fallbackFactory();
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(
    url,
    (loadedTexture) => {
      fallbackTexture.image = loadedTexture.image;
      fallbackTexture.colorSpace = THREE.SRGBColorSpace;
      fallbackTexture.anisotropy = 8;
      fallbackTexture.wrapS = loadedTexture.wrapS;
      fallbackTexture.wrapT = loadedTexture.wrapT;
      fallbackTexture.repeat.copy(loadedTexture.repeat);
      fallbackTexture.needsUpdate = true;
    },
    undefined,
    () => {
      fallbackTexture.needsUpdate = true;
    }
  );
  return fallbackTexture;
}

export function createThreeScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.Fog(0x03060d, 180000, 900000);

  const camera = new THREE.PerspectiveCamera(48, 1, 1, 400000);
  camera.position.set(0, 16000, 52000);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.25, 0.6, 0.12);
  const filmPass = new ShaderPass(FilmicOverlayShader);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(filmPass);
  composer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
  bloomPass.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.6;
  controls.minDistance = 300;
  controls.maxDistance = 320000;
  controls.target.set(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0x8ab6ff, 0.2);
  scene.add(ambientLight);

  const hemisphereLight = new THREE.HemisphereLight(0x1d3557, 0x000000, 0.18);
  scene.add(hemisphereLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.45);
  directionalLight.position.set(-50000, 30000, 60000);
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0x5cbcff, 0.18);
  fillLight.position.set(50000, -10000, -50000);
  scene.add(fillLight);

  const starSpriteTexture = createProceduralGlowTexture();
  const distantStars = new THREE.Points(
    createStarfieldGeometry(5200, 320000, 920000),
    new THREE.PointsMaterial({
      size: 900,
      sizeAttenuation: true,
      map: starSpriteTexture,
      transparent: true,
      opacity: 0.85,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(distantStars);

  const dustCloud = new THREE.Points(
    createStarfieldGeometry(1800, 150000, 450000),
    new THREE.PointsMaterial({
      size: 500,
      sizeAttenuation: true,
      map: starSpriteTexture,
      transparent: true,
      opacity: 0.42,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(dustCloud);

  const nebulaA = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createProceduralNebulaTexture('rgba(64, 129, 255, 0.52)', 'rgba(10, 22, 46, 0.08)'),
      color: 0x74b7ff,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  nebulaA.position.set(-175000, 90000, -300000);
  nebulaA.scale.set(420000, 300000, 1);
  scene.add(nebulaA);

  const nebulaB = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createProceduralNebulaTexture('rgba(255, 130, 80, 0.28)', 'rgba(46, 16, 14, 0.04)'),
      color: 0xff8e5a,
      transparent: true,
      opacity: 0.26,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  nebulaB.position.set(190000, -70000, -260000);
  nebulaB.scale.set(360000, 260000, 1);
  scene.add(nebulaB);

  const sunRadius = SUN_RADIUS_KM * PLANET_RADIUS_VISUAL_SCALE;
  const sunTexture = createProceduralStarTexture();
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffcc66,
      map: sunTexture,
      emissive: 0xff9c3b,
      emissiveMap: sunTexture,
      emissiveIntensity: 2.2,
      roughness: 1,
      metalness: 0,
    })
  );
  sun.position.set(0, 0, 0);
  scene.add(sun);

  const sunCorona = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createProceduralGlowTexture(),
      color: 0xffc96b,
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  sunCorona.scale.set(sunRadius * 6.5, sunRadius * 6.5, 1);
  scene.add(sunCorona);

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius * 1.18, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0xff9f3f,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  );
  scene.add(sunGlow);

  const sunHalo = new THREE.Mesh(
    new THREE.SphereGeometry(sunRadius * 1.55, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0xffb85f,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  );
  scene.add(sunHalo);

  const sunLight = new THREE.PointLight(0xffd36a, 3, 1000000, 2);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  const starTexture = loadTextureWithFallback('star_texture.jpg', createProceduralStarTexture);
  const starfieldMesh = new THREE.Mesh(
    new THREE.SphereGeometry(1000000, 64, 64),
    new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide })
  );
  scene.add(starfieldMesh);

  const orbitPaths = [];
  const planets = planetConfigs.map((config, index) => {
    const texture = loadTextureWithFallback(config.texturePath, () => createProceduralPlanetTexture(config.name));
    const displayRadius = config.radius * PLANET_RADIUS_VISUAL_SCALE * (config.sizeMultiplier ?? 1);
    const geometry = new THREE.SphereGeometry(displayRadius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.01,
      emissive: new THREE.Color(config.glowColor ?? 0x0f0f14),
      emissiveMap: texture,
      emissiveIntensity: config.glowIntensity ?? 0.12,
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.name = config.name;
    planet.orbitRadius = config.orbitRadius;
    planet.orbitSpeed = config.orbitSpeed;
    planet.orbitPhase = THREE.MathUtils.degToRad(index * 31);
    planet.axialTilt = THREE.MathUtils.degToRad(config.axialTilt ?? 0);
    planet.position.set(
      Math.cos(planet.orbitPhase) * planet.orbitRadius,
      0,
      Math.sin(planet.orbitPhase) * planet.orbitRadius
    );
    scene.add(planet);
    planet.rotation.z = planet.axialTilt;

    const planetGlow = new THREE.Mesh(
      new THREE.SphereGeometry(displayRadius * 1.08, 64, 64),
      new THREE.MeshBasicMaterial({
        color: config.glowColor ?? 0xffffff,
        transparent: true,
        opacity: config.glowIntensity ?? 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    );
    planet.add(planetGlow);
    planet.userData.planetGlow = planetGlow;
    planet.userData.glowBaseOpacity = config.glowIntensity ?? 0.12;

    if (config.name === 'Earth') {
      const cloudTexture = loadTextureWithFallback(config.cloudMapPath, createProceduralCloudTexture);
      const cloudLayer = new THREE.Mesh(
        new THREE.SphereGeometry(displayRadius * 1.015, 64, 64),
        new THREE.MeshPhongMaterial({
          map: cloudTexture,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          shininess: 4,
        })
      );
      cloudLayer.name = 'EarthClouds';
      cloudLayer.position.copy(planet.position);
      cloudLayer.rotation.z = planet.axialTilt;
      scene.add(cloudLayer);
      planet.userData.cloudLayer = cloudLayer;

      const normalLoader = new THREE.TextureLoader();
      normalLoader.setCrossOrigin('anonymous');
      normalLoader.load(config.normalMapPath, (normalMap) => {
        normalMap.anisotropy = 8;
        material.normalMap = normalMap;
        material.normalScale = new THREE.Vector2(0.85, -0.85);
        material.needsUpdate = true;
      });
    }

    if (config.ringInnerScale && config.ringOuterScale) {
      const ringTexture = config.ringTexturePath
        ? loadTextureWithFallback(config.ringTexturePath, createProceduralRingTexture)
        : null;
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(displayRadius * config.ringInnerScale, displayRadius * config.ringOuterScale, 128),
        new THREE.MeshStandardMaterial({
          map: ringTexture,
          color: config.ringColor ?? 0xffffff,
          transparent: true,
          side: THREE.DoubleSide,
          opacity: config.ringOpacity ?? 0.95,
          depthWrite: false,
          emissive: new THREE.Color(config.ringGlowColor ?? config.ringColor ?? 0xffffff),
          emissiveIntensity: config.ringGlowIntensity ?? 0.22,
          roughness: 0.95,
          metalness: 0,
        })
      );
      const ringGlow = new THREE.Mesh(
        new THREE.RingGeometry(displayRadius * config.ringInnerScale * 0.985, displayRadius * config.ringOuterScale * 1.06, 128),
        new THREE.MeshBasicMaterial({
          color: config.ringGlowColor ?? config.ringColor ?? 0xffffff,
          transparent: true,
          opacity: config.ringGlowIntensity ?? 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        })
      );
      ring.rotation.x = Math.PI / 2;
      ring.userData.tilt = THREE.MathUtils.degToRad(config.ringTiltDeg ?? 0);
      ring.rotation.z = ring.userData.tilt;
      ring.position.copy(planet.position);
      scene.add(ring);
      planet.userData.ring = ring;
      ringGlow.rotation.x = Math.PI / 2;
      ringGlow.rotation.z = ring.userData.tilt;
      ringGlow.position.copy(planet.position);
      scene.add(ringGlow);
      planet.userData.ringGlow = ringGlow;
    }

    const orbitPath = new THREE.Mesh(
      new THREE.RingGeometry(planet.orbitRadius, planet.orbitRadius + 220, 256),
      new THREE.MeshBasicMaterial({
        color: config.orbitColor,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    orbitPath.rotation.x = Math.PI / 2;
    scene.add(orbitPath);
    orbitPaths.push({ orbitPath, geometry, material, texture, planet });
    return planet;
  });

  const earth = planets.find((planet) => planet.name === 'Earth');
  const earthVisualRadius = earth?.geometry?.parameters?.radius || 190;

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(earthVisualRadius * 1.18, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x4db7ff,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    })
  );
  if (earth) {
    earth.add(glow);
  } else {
    scene.add(glow);
  }

  const earthAura = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createProceduralGlowTexture(),
      color: 0x5bb8ff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  earthAura.scale.set(earthVisualRadius * 5.5, earthVisualRadius * 5.5, 1);
  if (earth) {
    earth.add(earthAura);
  } else {
    scene.add(earthAura);
  }

  const asteroidTexture = createAsteroidMaterialTexture();
  const asteroids = [];
  const asteroidTrails = [];
  let selectedAsteroidMesh = null;

  const beltGeometry = BELT_ASTEROID_COUNT > 0 ? new THREE.IcosahedronGeometry(ASTEROID_RADIUS, 0) : null;
  const beltMaterial = BELT_ASTEROID_COUNT > 0
    ? new THREE.MeshStandardMaterial({
      map: asteroidTexture,
      color: 0xa99b88,
      roughness: 1,
      metalness: 0.01,
    })
    : null;
  const asteroidBeltMesh = BELT_ASTEROID_COUNT > 0
    ? new THREE.InstancedMesh(beltGeometry, beltMaterial, BELT_ASTEROID_COUNT)
    : null;
  if (asteroidBeltMesh) {
    asteroidBeltMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    asteroidBeltMesh.frustumCulled = false;
    scene.add(asteroidBeltMesh);
  }

  const asteroidBeltData = Array.from({ length: BELT_ASTEROID_COUNT }, (_, index) => createAsteroidBeltEntry(index));
  const asteroidBeltDummy = new THREE.Object3D();

  function updateAsteroidBelt(elapsedSeconds, timeScale = 1) {
    if (!asteroidBeltMesh || asteroidBeltData.length === 0) {
      return;
    }

    for (let index = 0; index < asteroidBeltData.length; index += 1) {
      const asteroid = asteroidBeltData[index];
      const angle = asteroid.initialAngle + elapsedSeconds * asteroid.orbitSpeed * timeScale * ASTEROID_MOTION_SCALE;
      asteroidBeltDummy.position.set(
        asteroid.orbitRadius * Math.cos(angle),
        asteroid.inclination * Math.sin(angle),
        asteroid.orbitRadius * Math.sin(angle)
      );
      asteroidBeltDummy.rotation.set(angle * 0.25, angle * 0.5, angle * 0.15);
      asteroidBeltDummy.scale.setScalar(asteroid.scale);
      asteroidBeltDummy.updateMatrix();
      asteroidBeltMesh.setMatrixAt(index, asteroidBeltDummy.matrix);
    }
    asteroidBeltMesh.instanceMatrix.needsUpdate = true;
  }

  function clearAsteroids() {
    while (asteroids.length > 0) {
      const asteroid = asteroids.pop();
      if (asteroid.userData.visibilityGlow) {
        scene.remove(asteroid.userData.visibilityGlow);
        asteroid.userData.visibilityGlow.material.map.dispose();
        asteroid.userData.visibilityGlow.material.dispose();
      }
      scene.remove(asteroid);
      if (asteroid.userData.labelSprite) {
        scene.remove(asteroid.userData.labelSprite);
        asteroid.userData.labelSprite.material.map.dispose();
        asteroid.userData.labelSprite.material.dispose();
      }
      asteroid.geometry.dispose();
      asteroid.material.dispose();
    }
    while (asteroidTrails.length > 0) {
      const trail = asteroidTrails.pop();
      scene.remove(trail.line);
      trail.geometry.dispose();
      trail.material.dispose();
    }
  }

  function setAsteroids(asteroidData) {
    clearAsteroids();
    asteroidData.forEach((data, index) => {
      const asteroid = createAsteroidFromData(data, index, asteroidTexture);
      asteroid.currentDistance = Infinity;
      asteroid.closestApproach = Infinity;
      asteroid.scale.setScalar(0.86 + ((index % 7) * 0.05));
      asteroid.userData.baseScale = asteroid.scale.clone();
      asteroid.userData.baseEmissive = asteroid.material.emissive.clone();
      asteroid.userData.baseEmissiveIntensity = asteroid.material.emissiveIntensity ?? 0.08;
      if (asteroid.userData.visibilityGlow) {
        asteroid.userData.visibilityGlow.position.copy(asteroid.position);
        asteroid.userData.visibilityGlow.scale.setScalar((asteroid.geometry?.parameters?.radius || ASTEROID_RADIUS) * 10.5);
        scene.add(asteroid.userData.visibilityGlow);
      }
      const labelSprite = createAsteroidLabelSprite(`Asteroid ${index + 1}`);
      asteroid.userData.labelSprite = labelSprite;
      scene.add(labelSprite);
      asteroid.userData.trailPoints = Array.from({ length: ASTEROID_TRAIL_POINTS }, () => asteroid.position.clone());
      const trailGeometry = createAsteroidTrailGeometry();
      const trailMaterial = createAsteroidTrailMaterial(index % 3 === 0 ? 0x97f0ff : 0x6ad7ff, 0.18 + ((index % 4) * 0.04));
      const trailLine = new THREE.Line(trailGeometry, trailMaterial);
      trailLine.frustumCulled = false;
      trailLine.renderOrder = -1;
      scene.add(trailLine);
      asteroid.userData.trail = { geometry: trailGeometry, material: trailMaterial, line: trailLine };
      asteroidTrails.push(asteroid.userData.trail);
      asteroids.push(asteroid);
      scene.add(asteroid);
    });
  }

  function setSelectedAsteroid(index) {
    if (selectedAsteroidMesh) {
      selectedAsteroidMesh.scale.copy(selectedAsteroidMesh.userData.baseScale || new THREE.Vector3(1, 1, 1));
      selectedAsteroidMesh.material.color.copy(selectedAsteroidMesh.userData.baseColor || new THREE.Color(0xcfc2ad));
      if ('emissive' in selectedAsteroidMesh.material) {
        selectedAsteroidMesh.material.emissive.set(0x000000);
      }
      if (selectedAsteroidMesh.material.emissiveIntensity !== undefined) {
        selectedAsteroidMesh.material.emissiveIntensity = 1;
      }
      selectedAsteroidMesh = null;
    }

    const asteroid = asteroids[index];
    if (!asteroid) {
      return null;
    }

    selectedAsteroidMesh = asteroid;
    asteroid.scale.copy(asteroid.userData.baseScale || new THREE.Vector3(1, 1, 1)).multiplyScalar(1.45);
    asteroid.material.color.set(0xffffff);
    if ('emissive' in asteroid.material) {
      asteroid.material.emissive.set(0x2d6cff);
    }
    if (asteroid.material.emissiveIntensity !== undefined) {
      asteroid.material.emissiveIntensity = 0.7;
    }

    return asteroid;
  }

  function getAsteroidSimulationState(index) {
    const asteroid = asteroids[index];
    if (!asteroid) {
      return null;
    }

    const motionAngle = asteroid.userData.motionAngle ?? asteroid.initialAngle ?? 0;
    const startPosition = asteroid.position.clone();
    const velocityDirection = new THREE.Vector3(
      -asteroid.orbitRadius * Math.sin(motionAngle),
      asteroid.inclination * Math.cos(motionAngle),
      asteroid.orbitRadius * Math.cos(motionAngle)
    ).normalize();

    return {
      startPosition,
      velocity: velocityDirection.multiplyScalar(asteroid.velocity || (asteroid.orbitRadius * asteroid.orbitSpeed)),
      asteroid,
    };
  }

  const trajectoryMaterial = new THREE.LineBasicMaterial({ color: 0x6ad7ff, transparent: true, opacity: 0.9 });
  const trajectoryGeometry = new THREE.BufferGeometry();
  const trajectoryLine = new THREE.Line(trajectoryGeometry, trajectoryMaterial);
  scene.add(trajectoryLine);

  function updateCelestialEffects(elapsedSeconds) {
    distantStars.rotation.y = elapsedSeconds * 0.00003;
    dustCloud.rotation.y = -elapsedSeconds * 0.00005;
    nebulaA.material.rotation = elapsedSeconds * 0.01;
    nebulaB.material.rotation = -elapsedSeconds * 0.008;
    sunCorona.material.opacity = 0.72 + (Math.sin(elapsedSeconds * 1.6) * 0.05);
    sunHalo.scale.setScalar(sunRadius * (1.5 + (Math.sin(elapsedSeconds * 0.8) * 0.012)));
    sunGlow.scale.setScalar(sunRadius * (1.16 + (Math.sin(elapsedSeconds * 1.4) * 0.01)));
    filmPass.uniforms.time.value = elapsedSeconds;
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    filmPass,
    controls,
    sun,
    sunGlow,
    sunCorona,
    sunHalo,
    sunLight,
    planets,
    earth,
    earthGlow: glow,
    earthAura,
    asteroids,
    asteroidBeltData,
    trajectoryLine,
    setAsteroids,
    setSelectedAsteroid,
    zoomBy(factor) {
      const target = controls.target.clone();
      const offset = camera.position.clone().sub(target);
      const nextDistance = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance);
      offset.setLength(nextDistance);
      camera.position.copy(target).add(offset);
      controls.update();
    },
    updateAsteroidBelt,
    updateCelestialEffects,
    updatePlanetOrbits(elapsedSeconds, timeScale = 1) {
      planets.forEach((planet) => {
        const angle = planet.orbitPhase + elapsedSeconds * planet.orbitSpeed * timeScale;
        planet.position.set(
          Math.cos(angle) * planet.orbitRadius,
          0,
          Math.sin(angle) * planet.orbitRadius
        );
        planet.rotation.z = planet.axialTilt;
        planet.rotation.y += planet.orbitSpeed * PLANET_SPIN_SCALE;
        if (planet.userData.cloudLayer) {
          planet.userData.cloudLayer.position.copy(planet.position);
          planet.userData.cloudLayer.rotation.z = planet.axialTilt;
          planet.userData.cloudLayer.rotation.y += planet.orbitSpeed * PLANET_SPIN_SCALE * 1.2;
        }
        if (planet.userData.ring) {
          planet.userData.ring.position.copy(planet.position);
          planet.userData.ring.rotation.z = planet.userData.ring.userData.tilt ?? 0;
        }
        if (planet.userData.ringGlow) {
          planet.userData.ringGlow.position.copy(planet.position);
          planet.userData.ringGlow.rotation.z = planet.userData.ringGlow.userData?.tilt ?? planet.userData.ring.userData.tilt ?? 0;
        }
        if (planet.userData.planetGlow) {
          const baseOpacity = planet.userData.glowBaseOpacity ?? 0.12;
          planet.userData.planetGlow.material.opacity = baseOpacity * (1.0 + (Math.sin(elapsedSeconds * 0.6 + planet.orbitPhase) * 0.08));
        }
      });
    },
    updateAsteroids(elapsedSeconds, earthPosition = null, timeScale = 1) {
      let nearestAsteroid = null;
      let nearestDistance = Infinity;

      asteroids.forEach((asteroid) => {
        const angle = asteroid.initialAngle + elapsedSeconds * asteroid.orbitSpeed * timeScale * ASTEROID_MOTION_SCALE;
        asteroid.userData.motionAngle = angle;
        asteroid.position.set(
          asteroid.orbitRadius * Math.cos(angle),
          asteroid.inclination * Math.sin(angle),
          asteroid.orbitRadius * Math.sin(angle)
        );
        asteroid.rotation.x += asteroid.orbitSpeed * 0.4;
        asteroid.rotation.y += asteroid.orbitSpeed * 0.55;

        const referencePosition = earthPosition || sun.position;
        const dx = asteroid.position.x - referencePosition.x;
        const dy = asteroid.position.y - referencePosition.y;
        const dz = asteroid.position.z - referencePosition.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        asteroid.currentDistance = distance;
        asteroid.closestApproach = Math.min(asteroid.closestApproach, distance);
        asteroid.collisionProbability = computeCollisionProbability(asteroid.closestApproach, asteroid.velocity);
        asteroid.riskLevel = classifyProbability(asteroid.collisionProbability);

        let isNearPlanet = false;
        for (let planetIndex = 0; planetIndex < planets.length; planetIndex += 1) {
          const planet = planets[planetIndex];
          const nearDistance = asteroid.position.distanceTo(planet.position);
          if (nearDistance <= ASTEROID_NEAR_PLANET_DISTANCE) {
            isNearPlanet = true;
            break;
          }
        }

        if (isNearPlanet) {
          asteroid.scale.copy(asteroid.userData.baseScale || new THREE.Vector3(1, 1, 1)).multiplyScalar(1.22);
          asteroid.material.emissive.set(0xffa63d);
          asteroid.material.emissiveIntensity = 0.9;
          if (asteroid.userData.visibilityGlow) {
            asteroid.userData.visibilityGlow.material.color.set(0xffc06a);
            asteroid.userData.visibilityGlow.material.opacity = 0.32;
          }
          if (asteroid.userData.labelSprite) {
            asteroid.userData.labelSprite.visible = true;
            asteroid.userData.labelSprite.position.copy(asteroid.position).add(new THREE.Vector3(0, 3200, 0));
          }
        } else {
          asteroid.scale.copy(asteroid.userData.baseScale || new THREE.Vector3(1, 1, 1));
          asteroid.material.emissive.copy(asteroid.userData.baseEmissive || new THREE.Color(0x3a2415));
          asteroid.material.emissiveIntensity = asteroid.userData.baseEmissiveIntensity ?? 0.3;
          if (asteroid.userData.visibilityGlow) {
            asteroid.userData.visibilityGlow.material.color.set(0xb8875d);
            asteroid.userData.visibilityGlow.material.opacity = 0.16;
          }
          if (asteroid.userData.labelSprite) {
            asteroid.userData.labelSprite.visible = false;
          }
        }

        if (asteroid.userData.visibilityGlow) {
          asteroid.userData.visibilityGlow.position.copy(asteroid.position);
          asteroid.userData.visibilityGlow.scale.copy(asteroid.scale).multiplyScalar(8.5);
        }

        const trailPoints = asteroid.userData.trailPoints;
        if (trailPoints && asteroid.userData.trail) {
          trailPoints.pop();
          trailPoints.unshift(asteroid.position.clone());

          const positions = asteroid.userData.trail.geometry.getAttribute('position');
          trailPoints.forEach((point, trailIndex) => {
            positions.setXYZ(trailIndex, point.x, point.y, point.z);
          });
          positions.needsUpdate = true;
          asteroid.userData.trail.geometry.computeBoundingSphere();
        }

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestAsteroid = asteroid;
        }
      });

      if (selectedAsteroidMesh) {
        selectedAsteroidMesh.scale.copy(selectedAsteroidMesh.userData.baseScale || new THREE.Vector3(1, 1, 1)).multiplyScalar(1.45);
      }

      return nearestAsteroid;
    },
    setTrajectory(points) {
      const positions = new Float32Array(points.length * 3);
      for (let index = 0; index < points.length; index += 1) {
        const point = points[index];
        positions[index * 3] = point.x;
        positions[index * 3 + 1] = point.y;
        positions[index * 3 + 2] = point.z;
      }
      trajectoryGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      trajectoryGeometry.computeBoundingSphere();
    },
    setAsteroidColor(color) {
      asteroids.forEach((asteroid) => asteroid.material.color.set(color));
    },
    getAsteroidSimulationState,
    setAsteroidPosition(position) {
      if (asteroids[0]) {
        asteroids[0].position.copy(position);
      }
    },
    resize(width, height) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      composer.setSize(width, height);
      bloomPass.setSize(width, height);
      filmPass.setSize(width, height);
    },
    render() {
      composer.render();
    },
    dispose() {
      orbitPaths.forEach(({ orbitPath, geometry, material, texture }) => {
        orbitPath.geometry.dispose();
        orbitPath.material.dispose();
        geometry.dispose();
        material.dispose();
        texture.dispose();
      });
      planets.forEach((planet) => {
        if (planet.userData.cloudLayer) {
          planet.userData.cloudLayer.geometry.dispose();
          planet.userData.cloudLayer.material.dispose();
        }
        if (planet.userData.ring) {
          planet.userData.ring.geometry.dispose();
          planet.userData.ring.material.dispose();
        }
        if (planet.userData.ringGlow) {
          planet.userData.ringGlow.geometry.dispose();
          planet.userData.ringGlow.material.dispose();
        }
        if (planet.userData.planetGlow) {
          planet.userData.planetGlow.geometry.dispose();
          planet.userData.planetGlow.material.dispose();
        }
      });
      glow.geometry.dispose();
      glow.material.dispose();
      earthAura.material.dispose();
      sunCorona.material.dispose();
      sunHalo.geometry.dispose();
      sunHalo.material.dispose();
      sun.geometry.dispose();
      sun.material.dispose();
      sunGlow.geometry.dispose();
      sunGlow.material.dispose();
      distantStars.geometry.dispose();
      distantStars.material.dispose();
      dustCloud.geometry.dispose();
      dustCloud.material.dispose();
      nebulaA.material.map.dispose();
      nebulaA.material.dispose();
      nebulaB.material.map.dispose();
      nebulaB.material.dispose();
      asteroids.forEach((asteroid) => {
        if (asteroid.userData.labelSprite) {
          asteroid.userData.labelSprite.removeFromParent();
          asteroid.userData.labelSprite.material.map.dispose();
          asteroid.userData.labelSprite.material.dispose();
        }
        if (asteroid.userData.visibilityGlow) {
          asteroid.userData.visibilityGlow.removeFromParent();
          asteroid.userData.visibilityGlow.material.map.dispose();
          asteroid.userData.visibilityGlow.material.dispose();
        }
        asteroid.geometry.dispose();
        asteroid.material.dispose();
        if (asteroid.userData.trail) {
          asteroid.userData.trail.line.removeFromParent();
          asteroid.userData.trail.geometry.dispose();
          asteroid.userData.trail.material.dispose();
        }
      });
      if (beltGeometry) {
        beltGeometry.dispose();
      }
      if (beltMaterial) {
        beltMaterial.dispose();
      }
      trajectoryGeometry.dispose();
      trajectoryMaterial.dispose();
      renderer.dispose();
    },
  };
}

export { EARTH_RADIUS, ASTEROID_RADIUS };