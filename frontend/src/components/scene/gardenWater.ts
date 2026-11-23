import * as THREE from 'three';

export const poolHeight = -0.91;

export interface GardenMotion {
  time: THREE.IUniform<number>;
  progress: THREE.IUniform<number>;
  pixelRatio: THREE.IUniform<number>;
}

export interface PondLight {
  rippleCenter: THREE.IUniform<THREE.Vector2>;
  rippleStart: THREE.IUniform<number>;
  lanterns: THREE.IUniform<number>;
}

const noise = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.545312); }
  float noise(vec2 p) {
    vec2 cell = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(cell), hash(cell + vec2(1, 0)), f.x),
      mix(hash(cell + vec2(0, 1)), hash(cell + vec2(1, 1)), f.x), f.y);
  }
`;

const cascade = `
  vec3 waterfallPoint(float u, float v, float elapsed) {
    float spread = 1.0 + 0.38 * pow(v, 4.0);
    float x = 7.02 + (u - 0.5) * 1.53 * spread + 0.13 * sin(v * 3.0);
    float y = mix(6.09, -0.88, pow(v, 1.05));
    float z = 3.23 + 0.27 * smoothstep(0.0, 0.09, v) + 0.12 * v + 1.23 * pow(v, 1.65);
    z += sin(u * 31.0 + v * 6.0 - elapsed * 4.0) * 0.046;
    return vec3(x, y, z);
  }
`;

const sheetVertex = `
  uniform float time;
  uniform float progress;
  uniform vec3 layer;
  varying vec2 vUv;
  ${cascade}

  void main() {
    vUv = uv;
    vec3 p = waterfallPoint(uv.x * layer.x + layer.y, uv.y, time);
    p.z += layer.z;
    float lift = smoothstep(0.05, 0.67, progress);
    float lowerWater = pow(uv.y, 2.1);
    p.x -= lowerWater * lift * 0.92;
    p.y += lowerWater * lift * 3.9;
    p.z += lowerWater * lift * 0.86;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const sheetFragment = `
  uniform float time;
  uniform float progress;
  uniform vec3 layer;
  varying vec2 vUv;
  ${noise}

  void main() {
    float speed = vUv.y - time * 0.68;
    float threads = noise(vec2(vUv.x * 81.0, speed * 9.1));
    float streak = noise(vec2(vUv.x * 39.0 + sin(speed * 3.7) * 0.25, speed * 3.6));
    float surge = noise(vec2(vUv.x * 16.0 - 8.0 * layer.z, speed * 12.0));
    float sparkle = smoothstep(0.48, 0.89, threads * 0.61 + surge * 0.39);
    float sideways = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));
    float fracture = smoothstep(0.0, 0.19, streak + 0.42 - progress * 1.7 * vUv.y);
    float opacity = (0.59 + threads * 0.36) * sideways * fracture * (1.0 - smoothstep(0.27, 0.75, progress));
    vec3 color = mix(vec3(0.12, 0.31, 0.35), vec3(0.83, 0.94, 0.92), 0.29 + streak * 0.38 + sparkle * 0.32);
    gl_FragColor = vec4(color, opacity);
    #include <colorspace_fragment>
  }
`;

const dropsVertex = `
  attribute vec4 seed;
  uniform float time;
  uniform float progress;
  uniform float pixelRatio;
  varying float vChange;
  varying float vOpacity;
  varying float vSpin;
  ${cascade}

  void main() {
    float drop = fract(seed.x + time * (0.38 + 0.36 * seed.y));
    float gravity = drop * (0.45 + 0.63 * drop);
    vec3 current = waterfallPoint(seed.z, gravity, time);
    current.x += (seed.w - 0.48) * (0.09 + 0.56 * gravity);
    current.z += 0.13 + seed.w * 0.21;
    vec3 vapor = vec3(
      7.0 + (seed.z - 0.65) * 5.8 - sin(seed.w * 8.0 + time * 0.8) * 0.75,
      3.1 + seed.w * 3.8 + sin(time + seed.z * 8.0) * 0.31,
      4.3 + (seed.y - 0.53) * 2.3
    );
    vChange = smoothstep(0.10 + seed.w * 0.23, 0.63 + seed.z * 0.24, progress);
    float curve = sin(3.14159 * vChange);
    vec3 p = mix(current, vapor, vChange);
    p += vec3(-0.63 * curve, curve * (0.9 + 0.8 * seed.x), 0.22 * curve);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (3.5 + 6.5 * seed.y + 3.0 * curve) * clamp(14.0 / -view.z, 0.6, 1.7) * pixelRatio;
    vOpacity = (0.38 + seed.w * 0.56) * (1.0 - smoothstep(0.64, 1.0, vChange));
    vSpin = vChange * (seed.x * 12.0 + time);
  }
`;

const dropsFragment = `
  varying float vChange;
  varying float vOpacity;
  varying float vSpin;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    p = mat2(cos(vSpin), -sin(vSpin), sin(vSpin), cos(vSpin)) * p;
    float edge = length(p * vec2(mix(4.3, 1.0, vChange), 1.03));
    float alpha = (1.0 - smoothstep(0.13, 0.49, edge)) * vOpacity;
    gl_FragColor = vec4(mix(vec3(0.58, 0.87, 0.91), vec3(0.82, 0.90, 0.90), vChange), alpha);
    #include <colorspace_fragment>
  }
`;

const cloudVertex = `
  attribute vec4 seed;
  uniform float time;
  uniform float progress;
  varying vec2 vUv;
  varying float vOpacity;
  varying float vWarmth;
  varying float vSeed;

  void main() {
    vUv = uv;
    vSeed = seed.z;
    float launch = fract(seed.w + time * (0.045 + seed.z * 0.041));
    float fade = smoothstep(0.0, 0.19, launch) * (1.0 - smoothstep(0.69, 1.0, launch));
    float rise = smoothstep(0.14 + seed.x * 0.15, 0.82, progress);
    float release = smoothstep(0.69, 1.0, progress);
    vec3 basin = vec3(
      7.11 + (seed.x - 0.48) * (1.1 + launch * 2.3),
      -0.86 + launch * (0.11 + seed.y * 0.68),
      4.80 + (seed.z - 0.53) * 1.6 + launch * 0.75
    );

    // Three overlapping billows rise from the plunge pool and drift above the roof.
    float cluster = floor(seed.z * 3.0);
    vec3 bank = vec3(
      7.95 - cluster * 1.48 + (seed.x - 0.5) * 2.2 - 2.75 * release,
      3.78 + cluster * 0.55 + (seed.y - 0.45) * 1.27 + launch * 1.05 + 0.62 * release,
      4.12 - cluster * 1.24 + (seed.z - 0.5) * 1.65
    );
    bank.x += sin(6.0 * seed.y + time * 0.44) * 0.54;
    bank.z += cos(8.0 * seed.w + time * 0.36) * 0.21;
    vec3 center = mix(basin, bank, rise);
    float size = mix(0.42 + launch * 1.2, 1.12 + seed.y * 1.28 + launch * 0.57, rise);
    vec4 view = modelViewMatrix * vec4(center, 1.0);
    view.xy += (uv - 0.5) * size * vec2(1.23 + 0.25 * seed.w, 0.77 + 0.26 * seed.y);
    gl_Position = projectionMatrix * view;
    vOpacity = fade * mix(0.275, 0.62 - release * 0.13, rise);
    vWarmth = seed.y;
  }
`;

const cloudFragment = `
  uniform float time;
  varying vec2 vUv;
  varying float vOpacity;
  varying float vWarmth;
  varying float vSeed;
  ${noise}

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float shape = length(p);
    float eddies = noise(p * 2.4 + vec2(vSeed * 29.0 - time * 0.10, time * 0.13));
    float density = 1.0 - smoothstep(0.16, 0.97, shape + eddies * 0.32);
    vec3 shade = mix(vec3(0.15, 0.25, 0.29), vec3(0.64, 0.77, 0.78), 0.33 + 0.28 * eddies + 0.28 * vUv.y);
    shade += vec3(0.085, 0.039, 0.0) * vWarmth;
    gl_FragColor = vec4(shade, density * vOpacity);
    #include <colorspace_fragment>
  }
`;

function seeds(count: number) {
  const values = new Float32Array(count * 4);
  for (let i = 0; i < values.length; i += 1) values[i] = Math.random();
  return values;
}

export function makeCascade(motion: GardenMotion) {
  const spray = new THREE.Group();
  const sheet = new THREE.PlaneGeometry(1, 1, 22, 44);
  const layers = [new THREE.Vector3(0.85, 0.08, 0), new THREE.Vector3(0.37, 0.64, -0.13), new THREE.Vector3(0.31, -0.12, -0.09)];

  for (const layer of layers) {
    const surface = new THREE.ShaderMaterial({
      uniforms: { ...motion, layer: { value: layer } },
      vertexShader: sheetVertex, fragmentShader: sheetFragment,
      side: THREE.DoubleSide, transparent: true, depthWrite: false,
    });
    const ribbon = new THREE.Mesh(sheet, surface);
    ribbon.frustumCulled = false;
    ribbon.renderOrder = 2;
    spray.add(ribbon);
  }

  const count = 620;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds(count), 4));
  const dropMaterial = new THREE.ShaderMaterial({
    uniforms: { ...motion }, vertexShader: dropsVertex, fragmentShader: dropsFragment,
    transparent: true, depthWrite: false,
  });
  const drops = new THREE.Points(geometry, dropMaterial);
  drops.frustumCulled = false;
  drops.renderOrder = 3;
  spray.add(drops);

  const quad = new THREE.PlaneGeometry(1, 1);
  const cloudGeometry = new THREE.InstancedBufferGeometry();
  cloudGeometry.setIndex(quad.index);
  cloudGeometry.setAttribute('position', quad.attributes.position);
  cloudGeometry.setAttribute('uv', quad.attributes.uv);
  cloudGeometry.setAttribute('seed', new THREE.InstancedBufferAttribute(seeds(74), 4));
  cloudGeometry.instanceCount = 74;
  const clouds = new THREE.Mesh(cloudGeometry, new THREE.ShaderMaterial({
    uniforms: { ...motion }, vertexShader: cloudVertex, fragmentShader: cloudFragment,
    transparent: true, depthWrite: false,
  }));
  clouds.frustumCulled = false;
  clouds.renderOrder = 4;
  spray.add(clouds);

  return spray;
}

const poolVertex = `
  uniform float time;
  varying vec3 vWorld;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    world.y += (sin(world.x * 0.95 + world.z * 1.5 + time) + sin(world.z * 2.35 - time * 1.7)) * 0.018;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const poolFragment = `
  uniform float time;
  uniform float progress;
  uniform float rippleStart;
  uniform float lanterns;
  uniform vec2 rippleCenter;
  varying vec3 vWorld;
  ${noise}

  void main() {
    vec2 p = vWorld.xz;
    float wind = noise(vec2(p.x * 1.1, p.y * 3.2 + time * 0.39));
    float glint = smoothstep(0.60, 0.91, wind);
    float shore = smoothstep(3.0, 21.0, distance(cameraPosition.xz, p));
    vec3 color = mix(vec3(0.017, 0.063, 0.066), vec3(0.092, 0.183, 0.185), shore);
    color += glint * vec3(0.018, 0.051, 0.052);
    float fromFall = length((p - vec2(7.11, 4.81)) * vec2(0.76, 1.06));
    float waves = pow(0.5 + 0.5 * sin(fromFall * 22.0 - time * 8.0), 6.0);
    float churn = exp(-fromFall * 0.51) * (0.22 + waves * 0.61) * (1.0 - smoothstep(0.18, 0.92, progress));
    color += churn * vec3(0.17, 0.33, 0.32);
    float reflection = (p.x - 3.0 + sin(p.y * 7.4 + time * 1.7) * 0.19) / (1.1 + 0.1 * max(0.0, p.y));
    float warm = exp(-reflection * reflection) * smoothstep(0.2, 3.0, p.y) * (1.0 - smoothstep(7.0, 17.0, p.y));
    color += warm * (0.18 + 0.67 * glint) * vec3(0.67, 0.29, 0.085);
    float moonDist = (p.x + 12.25 + 0.34 * sin(p.y * 6.1 + time)) * 0.76;
    float moon = exp(-moonDist * moonDist);
    float moonTrail = moon * (1.0 - smoothstep(-17.5, -9.5, p.y)) * smoothstep(-31.0, -17.5, p.y);
    color += moonTrail * vec3(0.19, 0.24, 0.24) * (0.10 + glint * 0.66);
    vec2 bough = (p - vec2(-12.03, -20.38) + vec2(0.25 * sin(p.y * 6.1 + time), 0.0)) * vec2(0.57, 0.52);
    color += vec3(0.18, 0.022, 0.073) * exp(-dot(bough, bough)) * (0.12 + 0.88 * glint);
    float pathGlow = exp(-length((p - vec2(-7.87, -8.66)) * vec2(1.04, 0.46)) * 0.81);
    color += pathGlow * lanterns * vec3(0.34, 0.16, 0.055) * (0.2 + glint * 0.55);

    float age = time - rippleStart;
    float radius = length(p - rippleCenter);
    float ripple = pow(0.5 + 0.5 * sin(radius * 17.0 - age * 13.0), 7.0);
    float waveFront = (radius - age * 0.88) * 1.85;
    float ring = exp(-waveFront * waveFront);
    color += vec3(0.23, 0.46, 0.43) * ripple * ring * exp(-age * 0.58);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

export function makePool(motion: GardenMotion, interaction: PondLight) {
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(170, 140, 45, 40), new THREE.ShaderMaterial({
    uniforms: { ...motion, ...interaction }, vertexShader: poolVertex, fragmentShader: poolFragment,
  }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, poolHeight, -8);
  return pool;
}

export function makeSky(journey: THREE.IUniform<number>) {
  const vertexShader = `
    varying vec3 vDirection;
    void main() {
      vDirection = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const fragmentShader = `
    uniform float journey;
    varying vec3 vDirection;
    ${noise}

    void main() {
      vec3 direction = normalize(vDirection);
      float elevation = direction.y;
      float light = exp(-abs(elevation - 0.023) * 9.1) * (0.66 + 0.34 * direction.x);
      vec3 color = mix(vec3(0.028, 0.064, 0.105), vec3(0.126, 0.218, 0.26), exp(-max(0.0, elevation) * 3.9));
      color += vec3(0.23, 0.13, 0.064) * light;
      float bands = noise(vec2(direction.x * 7.0, elevation * 76.0)) * exp(-abs(elevation - 0.112) * 9.0);
      color += vec3(0.105, 0.14, 0.165) * bands * 0.44;
      float afterglow = exp(-abs(elevation - 0.082) * 10.5 - abs(direction.x - 0.30) * 2.4);
      color += vec3(0.13, 0.023, 0.062) * afterglow;

      float night = smoothstep(2.2, 4.2, journey);
      color = mix(color, color * vec3(0.52, 0.70, 0.83), night * 0.80);
      vec3 moon = normalize(vec3(mix(0.224, -0.55, night), mix(0.119, 0.037, night), -1.0));
      float distanceToMoon = length(direction - moon);
      float disc = 1.0 - smoothstep(0.018, 0.0194, distanceToMoon);
      float halo = exp(-distanceToMoon * 18.0) * 0.28;
      color = mix(color, vec3(0.91, 0.79, 0.55), disc * 0.95 + halo * (1.0 - disc));
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }
  `;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(120, 36, 20), new THREE.ShaderMaterial({
    uniforms: { journey }, side: THREE.BackSide, vertexShader, fragmentShader, depthWrite: false,
  }));
  sky.renderOrder = -10;
  return sky;
}

