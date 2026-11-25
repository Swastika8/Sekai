import * as THREE from 'three';
import { beam, compact, placedInstances, randomFrom, type Point } from './gardenModels';
import { poolHeight, rippleSpeed, type PondLight } from './gardenWater';

const tau = Math.PI * 2;
const { lerp, smoothstep, damp } = THREE.MathUtils;
type Patch = [number, number, number, number, string];
const red = '#d74424', ink = '#293336', ivory = '#fff2d8';
const varieties: { name: string; ground: string; fin: number; size: number; patches: Patch[] }[] = [
  { name: 'Kohaku', ground: ivory, fin: 0xffefd2, size: 0.99,
    patches: [[0.30, 0.53, 0.13, 0.26, red], [0.60, 0.44, 0.18, 0.26, red], [0.85, 0.52, 0.10, 0.16, red]] },
  { name: 'Sanke', ground: '#f6e6ce', fin: 0xf3e7cf, size: 0.84,
    patches: [[0.34, 0.56, 0.18, 0.26, red], [0.69, 0.45, 0.20, 0.24, red], [0.26, 0.44, 0.06, 0.11, ink], [0.49, 0.59, 0.09, 0.13, ink], [0.59, 0.37, 0.07, 0.11, ink]] },
  { name: 'Yamabuki', ground: '#edba48', fin: 0xffda87, size: 0.89, patches: [] },
  { name: 'Tancho', ground: '#fff6e5', fin: 0xf5ead8, size: 0.83,
    patches: [[0.83, 0.50, 0.096, 0.14, '#cf3626']] },
  { name: 'Showa', ground: '#34353a', fin: 0xe9c29b, size: 0.93,
    patches: [[0.25, 0.47, 0.15, 0.26, ivory], [0.62, 0.58, 0.20, 0.28, ivory], [0.87, 0.41, 0.10, 0.22, ivory], [0.39, 0.54, 0.12, 0.20, red], [0.77, 0.45, 0.11, 0.22, red]] },
];

function paintSkin(variety: typeof varieties[number], seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(canvas.width, canvas.height);
  ctx.fillStyle = variety.ground;
  ctx.fillRect(0, 0, 1, 1);
  const random = randomFrom(seed);
  for (const [x, y, width, height, pigment] of variety.patches) {
    const outline = Array.from({ length: 16 }, (_, index) => {
      const angle = tau * index / 16;
      const radius = 0.84 + random() * 0.31;
      return [x + width * radius * Math.cos(angle), y + height * radius * Math.sin(angle)];
    });
    ctx.fillStyle = pigment;
    ctx.beginPath();
    ctx.moveTo((outline[15][0] + outline[0][0]) / 2, (outline[15][1] + outline[0][1]) / 2);
    outline.forEach(([px, py], i) => {
      const [nx, ny] = outline[(i + 1) % outline.length];
      ctx.quadraticCurveTo(px, py, (px + nx) / 2, (py + ny) / 2);
    });
    ctx.closePath();
    ctx.fill();
  }
  // Staggered scale rows stop at the gill plate, leaving the head smooth.
  for (let row = 0; row < 20; row++) {
    for (let scale = 0; scale < 19; scale++) {
      const x = 0.08 + scale * 0.035 + (row % 2) * 0.0175, y = 0.11 + row * 0.041;
      ctx.strokeStyle = variety.name === 'Yamabuki' ? 'rgba(118,74,21,0.32)' : 'rgba(65,61,57,0.17)';
      ctx.lineWidth = 0.003;
      ctx.beginPath();
      ctx.moveTo(x + 0.012, y - 0.019);
      ctx.quadraticCurveTo(x - 0.018, y, x + 0.012, y + 0.019);
      ctx.stroke();
    }
  }
  const sheen = ctx.createLinearGradient(0, 0, 0, 1);
  sheen.addColorStop(0, 'rgba(199,166,116,.35)');
  sheen.addColorStop(0.33, 'rgba(255,249,215,.02)');
  sheen.addColorStop(0.50, 'rgba(255,250,225,.13)');
  sheen.addColorStop(0.67, 'rgba(255,249,215,.02)');
  sheen.addColorStop(1, 'rgba(199,166,116,.35)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 1, 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function bodyShape() {
  // Longitudinal profiles give the carp broad shoulders, a blunt snout and a narrow tail wrist.
  const profile = new THREE.CatmullRomCurve3([
    [-0.85, 0.012, 0.018], [-0.74, 0.073, 0.084], [-0.51, 0.128, 0.138], [-0.25, 0.216, 0.183],
    [0.06, 0.279, 0.218], [0.34, 0.302, 0.232], [0.57, 0.267, 0.206], [0.76, 0.221, 0.164],
    [0.92, 0.150, 0.112], [1.025, 0.068, 0.064], [1.054, 0.003, 0.010],
  ].map(([z, width, height]) => new THREE.Vector3(z, width, height)));
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rings = 34, sides = 28;
  for (let ring = 0; ring <= rings; ring++) {
    const { x: z, y: width, z: height } = profile.getPoint(ring / rings);
    for (let side = 0; side <= sides; side++) {
      const angle = (side / sides - 0.50) * tau;
      positions.push(width * Math.sin(angle), height * Math.cos(angle) - 0.028 * smoothstep(z, 0.55, 1.05), z);
      uvs.push((z + 0.85) / 1.904, side / sides);
      if (ring < rings && side < sides) {
        const a = ring * (sides + 1) + side, b = a + sides + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const body = new THREE.BufferGeometry();
  body.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  body.setIndex(indices);
  body.computeVertexNormals();
  return body;
}

function finShape() {
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  const dark = new THREE.Color(0x948479), light = new THREE.Color(0xfff3d1), color = new THREE.Color();
  function fan(root: Point, rim: Point[], bow: number) {
    const edge = new THREE.CatmullRomCurve3(rim.map(point => new THREE.Vector3(...point)));
    const first = positions.length / 3;
    positions.push(...root);
    colors.push(...dark.toArray());
    const rays = 20;
    for (let ring = 1; ring <= 3; ring++) {
      const t = ring / 3;
      for (let spoke = 0; spoke <= rays; spoke++) {
        const tip = edge.getPoint(spoke / rays);
        positions.push(lerp(root[0], tip.x, t), lerp(root[1], tip.y, t) + bow * Math.sin(t * Math.PI), lerp(root[2], tip.z, t));
        color.copy(dark).lerp(light, t * (spoke % 2 ? 0.85 : 0.53));
        colors.push(...color.toArray());
        if (spoke === rays) continue;
        const a = first + 1 + (ring - 1) * (rays + 1) + spoke;
        if (ring === 1) indices.push(first, a, a + 1);
        else indices.push(a - rays - 1, a, a + 1, a - rays - 1, a + 1, a - rays);
      }
    }
  }
  for (const side of [-1, 1]) {
    fan([side * 0.21, -0.013, 0.43], [[side * 0.34, 0.008, 0.42], [side * 0.54, 0.015, 0.32],
      [side * 0.66, -0.025, 0.19], [side * 0.62, -0.062, 0.055], [side * 0.45, -0.084, -0.065], [side * 0.26, -0.055, 0.13]], 0.052);
    fan([side * 0.14, -0.105, -0.22], [[side * 0.22, -0.10, -0.21], [side * 0.34, -0.13, -0.37],
      [side * 0.32, -0.15, -0.51], [side * 0.15, -0.13, -0.43]], 0.020);
  }
  fan([0, 0.12, -0.04], [[0, 0.19, 0.38], [0.016, 0.345, 0.24], [0.032, 0.34, 0.10],
    [0.04, 0.265, -0.23], [0.024, 0.212, -0.46], [0, 0.105, -0.61]], 0);
  fan([0, 0, -0.73], [[0.015, 0.057, -0.79], [0.092, 0.19, -1.02], [0.19, 0.32, -1.40],
    [0.14, 0.15, -1.29], [0.018, 0.006, -1.115], [-0.098, -0.135, -1.26], [-0.18, -0.26, -1.36],
    [-0.108, -0.22, -1.07], [-0.016, -0.058, -0.79]], 0);
  const fins = new THREE.BufferGeometry();
  fins.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  fins.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  fins.setIndex(indices);
  fins.computeVertexNormals();
  return fins;
}

// Two spatial phases of the same travelling wave can be blended on the GPU at any point in a tail beat.
function addSwimMotion(geometry: THREE.BufferGeometry) {
  const rest = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const shapes: THREE.BufferAttribute[] = [], normals: THREE.BufferAttribute[] = [];
  for (const offset of [0, Math.PI / 2]) {
    const posed = geometry.clone();
    const position = posed.getAttribute('position');
    const delta = new Float32Array(rest.count * 3), normalDelta = new Float32Array(rest.count * 3);
    for (let i = 0; i < rest.count; i++) {
      const x = rest.getX(i), y = rest.getY(i), z = rest.getZ(i);
      const rear = smoothstep(0.48 - z, 0, 1.93);
      const wave = offset + 1.94 * (0.48 - z);
      const bend = 0.43 * rear * rear;
      delta[i * 3] = bend * Math.sin(wave);
      delta[i * 3 + 1] = 0.105 * smoothstep(Math.abs(x), 0.29, 0.63) * Math.sin(offset + 0.82);
      delta[i * 3 + 2] = x * bend * 1.94 * Math.cos(wave);
      position.setXYZ(i, x + delta[i * 3], y + delta[i * 3 + 1], z + delta[i * 3 + 2]);
    }
    posed.computeVertexNormals();
    const posedNormals = posed.getAttribute('normal');
    for (let i = 0; i < rest.count; i++) {
      normalDelta.set([posedNormals.getX(i) - normal.getX(i), posedNormals.getY(i) - normal.getY(i), posedNormals.getZ(i) - normal.getZ(i)], i * 3);
    }
    shapes.push(new THREE.BufferAttribute(delta, 3));
    normals.push(new THREE.BufferAttribute(normalDelta, 3));
    posed.dispose();
  }
  geometry.morphTargetsRelative = true;
  geometry.morphAttributes.position = shapes;
  geometry.morphAttributes.normal = normals;
  geometry.computeBoundingSphere();
}

function makeFace() {
  const head = new THREE.Group();
  const whiskers = new THREE.Group();
  const surface = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.33 });
  const ball = new THREE.SphereGeometry(1, 10, 7);
  function tint(geometry: THREE.BufferGeometry, pigment: number) {
    const color = new THREE.Color(pigment);
    const colors = new Float32Array(geometry.getAttribute('position').count * 3);
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geometry;
  }
  const pearl = tint(ball.clone(), 0xffe5ae), onyx = tint(ball.clone(), 0x1f2829), glint = tint(ball, 0xfff7e7);
  function eyePart(shape: THREE.BufferGeometry, at: Point, size: Point) {
    const eye = new THREE.Mesh(shape, surface);
    eye.position.set(...at);
    eye.scale.set(...size);
    head.add(eye);
  }
  for (const side of [-1, 1]) {
    eyePart(pearl, [side * 0.194, 0.105, 0.72], [0.060, 0.051, 0.062]);
    eyePart(onyx, [side * 0.212, 0.122, 0.730], [0.051, 0.041, 0.049]);
    eyePart(glint, [side * 0.228, 0.153, 0.742], [0.014, 0.010, 0.013]);
    beam(whiskers, surface, [side * 0.104, -0.035, 0.989], [side * 0.172, -0.071, 1.11], 0.013, 0.008);
    beam(whiskers, surface, [side * 0.172, -0.071, 1.11], [side * 0.205, -0.076, 1.14], 0.008, 0.002);
  }
  for (const part of whiskers.children) if (part instanceof THREE.Mesh) tint(part.geometry, 0xc5a384);
  head.add(whiskers);
  return compact(head);
}

export function makePondLife(surface: PondLight) {
  const pond = new THREE.Group();
  const body = bodyShape(), fins = finShape(), face = makeFace();
  addSwimMotion(body);
  addSwimMotion(fins);
  const school = varieties.map((variety, index) => {
    const koi = new THREE.Group();
    koi.name = variety.name;
    const skin = new THREE.Mesh(body, new THREE.MeshStandardMaterial({ map: paintSkin(variety, 905 + index), roughness: 0.40, metalness: 0.035 }));
    const fan = new THREE.Mesh(fins, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, color: variety.fin }));
    koi.add(skin, fan, face.clone());
    koi.scale.setScalar(variety.size);
    pond.add(koi);
    return { koi, skin, fan, phase: tau * index / varieties.length, energy: 0, beat: index * 1.75 };
  });

  const floorY = poolHeight - 1.12;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(17, 19), new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
      varying vec2 p;
      void main() { vec4 world = modelMatrix * vec4(position, 1.0); p = world.xz; gl_Position = projectionMatrix * viewMatrix * world; }`,
    fragmentShader: `
      varying vec2 p;
      uniform float time;
      void main() {
        vec2 local = (p - vec2(-11.65, -18.8)) / vec2(4.9, 5.4);
        float shelf = smoothstep(0.15, 1.16, length(local));
        float grain = fract(sin(dot(floor(p * 48.0), vec2(31.1, 71.7))) * 4375.5);
        vec3 color = mix(vec3(0.012, 0.055, 0.059), vec3(0.054, 0.125, 0.112), shelf) * (0.91 + 0.14 * grain);
        vec2 q = p * 2.4 + 0.5 * sin(p.yx * 1.35 + time * 0.36);
        float lines = abs(sin(q.x + time * 0.29) + 0.78 * sin(q.y - time * 0.23));
        color += vec3(0.024, 0.051, 0.042) * (1.0 - smoothstep(0.0, 0.115, lines)) * (0.30 + 0.70 * shelf);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(-11.65, floorY, -18.80);
  pond.add(floor);
  const random = randomFrom(418);
  const pebbles: Parameters<typeof placedInstances>[2] = [];
  for (let i = 0; i < 95; i++) {
    const theta = random() * tau, radius = 0.32 + Math.sqrt(random()) * 0.69, size = 0.035 + random() ** 2 * 0.21;
    pebbles.push({ position: [-11.65 + Math.cos(theta) * 4.7 * radius, floorY + 0.008, -18.8 + Math.sin(theta) * 5.0 * radius],
      scale: [size * 1.4, size * 0.48, size], rotation: [0, theta, 0.09], color: [0x475c57, 0x53655d, 0x626e61, 0x727a6b][i % 4] });
  }
  pond.add(placedInstances(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff }), pebbles));
  const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vUv; void main() { float d = length((vUv - 0.5) * 2.0); gl_FragColor = vec4(0.009, 0.036, 0.035, (1.0 - smoothstep(0.23, 1.0, d)) * 0.62); }`,
    transparent: true, depthWrite: false,
  }), school.length);
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadows.frustumCulled = false;
  pond.add(shadows);
  const shadowPose = new THREE.Object3D();
  shadowPose.rotation.order = 'YXZ';

  function swim(time: number, dt: number) {
    floor.material.uniforms.time.value = time;
    for (const [index, fish] of school.entries()) {
      const { koi, skin, fan, phase } = fish;
      const distance = Math.hypot(koi.position.x - surface.rippleCenter.value.x, koi.position.z - surface.rippleCenter.value.y);
      const sinceWave = time - surface.rippleStart.value - distance / rippleSpeed;
      const startle = sinceWave >= 0 && distance < 4.0 ? Math.exp(-sinceWave * 1.6) * (1 - smoothstep(distance, 2, 4)) : 0;
      fish.energy = damp(fish.energy, startle, 6, dt);
      const angle = time * 0.195 + phase + 0.135 * Math.sin(time * 0.27 + phase) + fish.energy * 0.18;
      const rx = 1.82 + 0.23 * Math.sin(phase), rz = 1.59 + 0.25 * Math.cos(phase);
      koi.position.set(-11.58 + rx * Math.cos(angle) + 0.23 * Math.sin(2 * angle + phase),
        poolHeight - 0.44 - (index % 3) * 0.078 + 0.039 * Math.sin(2 * angle + phase),
        -18.77 + rz * Math.sin(angle) + 0.15 * Math.sin(time * 0.15 + phase));
      koi.rotation.set(0.025 * Math.cos(angle * 2), Math.atan2(-rx * Math.sin(angle) + 0.46 * Math.cos(2 * angle + phase), rz * Math.cos(angle)),
        0.095 * Math.sin(angle + phase) + 0.08, 'YXZ');
      fish.beat += dt * (3.2 + index * 0.16 + fish.energy * 4.5);
      const amplitude = 0.78 + 0.17 * Math.sin(time * 0.93 + phase) + 0.29 * fish.energy;
      for (const mesh of [skin, fan]) {
        mesh.morphTargetInfluences![0] = Math.sin(fish.beat) * amplitude;
        mesh.morphTargetInfluences![1] = Math.cos(fish.beat) * amplitude;
      }
      shadowPose.position.set(koi.position.x + 0.16, floorY + 0.025, koi.position.z - 0.12);
      shadowPose.rotation.set(-Math.PI / 2, koi.rotation.y, 0, 'YXZ');
      shadowPose.scale.set(0.94 * koi.scale.x, 2.47 * koi.scale.x, 1);
      shadowPose.updateMatrix();
      shadows.setMatrixAt(index, shadowPose.matrix);
    }
    shadows.instanceMatrix.needsUpdate = true;
  }
  return { pond, swim, skins: school.map(fish => fish.skin.material.map!) };
}
