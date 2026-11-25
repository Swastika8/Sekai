import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type Point = [number, number, number];
type Random = () => number;

export function randomFrom(seed: number): Random {
  let state = seed;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const material = (color: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.87, ...extra });

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
export function box(group: THREE.Group, surface: THREE.Material, position: Point, dimensions: Point) {
  const mesh = new THREE.Mesh(boxGeometry, surface);
  mesh.position.set(...position);
  mesh.scale.set(...dimensions);
  group.add(mesh);
}

export function compact(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const originals = new Set<THREE.BufferGeometry>();

  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh) || Array.isArray(node.material)) return;
    const source = node.geometry as THREE.BufferGeometry;
    originals.add(source);
    const geometry = source.clone();
    if (!geometry.index) {
      geometry.setIndex(Array.from({ length: geometry.getAttribute('position').count }, (_, i) => i));
    }
    geometry.applyMatrix4(node.matrixWorld);
    const batch = batches.get(node.material) ?? [];
    batch.push(geometry);
    batches.set(node.material, batch);
  });

  const model = new THREE.Group();
  for (const [surface, parts] of batches) {
    const combined = mergeGeometries(parts);
    if (combined) model.add(new THREE.Mesh(combined, surface));
    for (const part of parts) part.dispose();
  }
  for (const original of originals) if (original !== boxGeometry) original.dispose();
  return model;
}

export function beam(group: THREE.Group, surface: THREE.Material, from: Point, to: Point, start: number, end = start) {
  const first = new THREE.Vector3(...from);
  const last = new THREE.Vector3(...to);
  const direction = last.clone().sub(first);
  const geometry = new THREE.CylinderGeometry(end, start, direction.length(), 7);
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.copy(first.add(last).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(mesh);
}

function curve(group: THREE.Group, surface: THREE.Material, points: THREE.Vector3[], width: number) {
  const path = new THREE.CatmullRomCurve3(points);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(4, points.length * 2), width, 4, false), surface));
}

function makeRoof(group: THREE.Group, boards: THREE.Material, tiles: THREE.Material, trim: THREE.Material) {
  const width = 2.84;
  const depth = 2.17;
  const ridge = 1.86;
  const top = 3.62;
  const eave = 2.40;

  function surface(u: number, v: number, face: number) {
    const y = eave + (top - eave) * Math.pow(1 - v, 1.64);
    const corner = Math.pow(Math.abs(u), 5) * Math.pow(v, 4) * 0.25;
    if (face < 2) {
      const x = u * THREE.MathUtils.lerp(ridge, width, v);
      return new THREE.Vector3(x, y + corner, (face === 0 ? 1 : -1) * depth * v);
    }
    return new THREE.Vector3((face === 2 ? 1 : -1) * THREE.MathUtils.lerp(ridge, width, v), y + corner, u * depth * v);
  }

  for (let face = 0; face < 4; face += 1) {
    const roof = new THREE.PlaneGeometry(1, 1, 28, 16);
    const { uv, position } = roof.attributes;
    for (let vertex = 0; vertex < uv.count; vertex += 1) {
      const point = surface(uv.getX(vertex) * 2 - 1, uv.getY(vertex), face);
      position.setXYZ(vertex, point.x, point.y, point.z);
    }
    roof.computeVertexNormals();
    group.add(new THREE.Mesh(roof, tiles));

    const edge = Array.from({ length: 21 }, (_, i) => surface(i / 10 - 1, 1, face));
    curve(group, trim, edge, 0.065);
    curve(group, boards, edge.map((point) => point.clone().add(new THREE.Vector3(0, -0.09, 0))), 0.045);

    const ribs = face < 2 ? 37 : 24;
    for (let i = 0; i < ribs; i += 1) {
      const u = (i / (ribs - 1)) * 2 - 1;
      const samples = Array.from({ length: 8 }, (_, step) => surface(u, 0.06 + (step / 7) * 0.94, face));
      for (const point of samples) point.y += 0.025;
      curve(group, trim, samples, face < 2 ? 0.033 : 0.027);
    }

    for (const v of [0.31, 0.53, 0.72, 0.87]) {
      const seam = Array.from({ length: 17 }, (_, i) => surface(i / 8 - 1, v, face));
      curve(group, tiles, seam, 0.021);
    }
  }

  curve(group, trim, [
    new THREE.Vector3(-2.18, top + 0.25, 0),
    new THREE.Vector3(-1.88, top + 0.1, 0),
    new THREE.Vector3(0, top + 0.075, 0),
    new THREE.Vector3(1.88, top + 0.1, 0),
    new THREE.Vector3(2.18, top + 0.25, 0),
  ], 0.082);
}

function shoji(group: THREE.Group, wood: THREE.Material, paper: THREE.Material, position: Point, facing: number) {
  const panel = new THREE.Group();
  panel.position.set(...position);
  panel.rotation.y = facing;
  box(panel, paper, [0, 0, 0], [0.96, 1.62, 0.075]);
  for (const x of [-0.475, -0.235, 0, 0.235, 0.475]) {
    box(panel, wood, [x, 0, 0.051], [0.027, 1.65, 0.049]);
  }
  for (const y of [-0.81, -0.55, -0.27, 0.01, 0.28, 0.54, 0.81]) {
    box(panel, wood, [0, y, 0.051], [0.99, 0.028, 0.049]);
  }
  group.add(panel);
}

export function makeHouse() {
  const model = new THREE.Group();
  const timber = material(0x51382b);
  const frame = material(0x2d2822);
  const plaster = material(0xb9a187);
  const porch = material(0x46392f);
  const tile = material(0x2a3b46, { side: THREE.DoubleSide, roughness: 0.65 });
  const edging = material(0x43525a, { roughness: 0.61 });
  const paper = material(0xf0bd75, { emissive: 0xe67b31, emissiveIntensity: 1.05, roughness: 0.75 });
  const lantern = material(0xffe0a1, { emissive: 0xff9c4b, emissiveIntensity: 2.2 });

  box(model, frame, [0, 0.03, 0], [4.78, 0.17, 3.66]);
  box(model, porch, [0, 0.18, 0.29], [4.95, 0.16, 4.05]);
  box(model, timber, [0, 2.31, 0], [4.64, 0.15, 3.22]);
  box(model, plaster, [0, 1.25, -1.51], [4.4, 2.0, 0.12]);
  box(model, plaster, [2.17, 1.25, 0], [0.12, 2, 3.05]);
  box(model, plaster, [-2.18, 1.96, 0], [0.12, 0.48, 3.05]);
  box(model, plaster, [0, 1.99, 1.52], [4.35, 0.38, 0.12]);
  box(model, plaster, [0, 0.29, 1.52], [4.35, 0.20, 0.12]);

  for (const x of [-2.18, -1.09, 0, 1.09, 2.18]) {
    box(model, frame, [x, 1.27, 1.61], [0.11, 2.18, 0.12]);
  }
  for (let panel = 0; panel < 4; panel += 1) {
    shoji(model, frame, paper, [-1.635 + panel * 1.09, 1.12, 1.59], 0);
  }
  for (let panel = 0; panel < 3; panel += 1) {
    shoji(model, frame, paper, [-2.18, 1.12, -1.04 + panel * 1.03], -Math.PI / 2);
  }
  for (const z of [-1.55, -0.52, 0.52, 1.55]) {
    box(model, frame, [-2.24, 1.27, z], [0.12, 2.18, 0.10]);
  }

  for (let plank = 0; plank < 27; plank += 1) {
    box(model, porch, [-2.37 + plank * 0.182, 0.26, 2.03], [0.172, 0.055, 0.54]);
  }
  for (const x of [-2.35, 2.35]) {
    box(model, frame, [x, 1.29, 1.89], [0.13, 2.16, 0.14]);
    box(model, frame, [x, -0.15, 1.8], [0.18, 0.45, 0.18]);
    box(model, frame, [x, 1.68, 1.83], [0.16, 0.07, 0.16]);
    box(model, lantern, [x, 1.84, 1.83], [0.14, 0.27, 0.14]);
    box(model, frame, [x, 2.01, 1.83], [0.18, 0.055, 0.18]);
    beam(model, timber, [x, 2.04, 1.83], [x, 2.24, 1.83], 0.018);
  }
  for (const x of [-2.2, -1.63, 1.63, 2.2]) {
    box(model, frame, [x, 0.49, 2.23], [0.065, 0.45, 0.07]);
  }
  for (const x of [-1.92, 1.92]) {
    box(model, timber, [x, 0.69, 2.23], [0.72, 0.065, 0.075]);
  }
  for (let step = 0; step < 3; step += 1) {
    box(model, porch, [-0.37, 0.12 - step * 0.17, 2.40 + step * 0.20], [1.72, 0.15, 0.35]);
  }
  makeRoof(model, frame, tile, edging);

  const house = compact(model);
  house.position.set(3.0, 0.22, -0.55);
  house.rotation.y = -0.24;
  return { house, paper, lantern };
}

export function placedInstances(
  geometry: THREE.BufferGeometry, surface: THREE.Material,
  placements: { position: Point; scale: Point; rotation: Point; color: number }[],
) {
  const mesh = new THREE.InstancedMesh(geometry, surface, placements.length);
  const transform = new THREE.Object3D();
  const color = new THREE.Color();
  placements.forEach((item, index) => {
    transform.position.set(...item.position);
    transform.scale.set(...item.scale);
    transform.rotation.set(...item.rotation);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
    mesh.setColorAt(index, color.setHex(item.color));
  });
  return mesh;
}

export function makeTerrain() {
  const garden = new THREE.Group();
  const random = randomFrom(2817);
  const stoneColors = [0x4b5653, 0x3f4b4a, 0x64706a, 0x536153, 0x4f5c50, 0x3c4b46];
  const mossColors = [0x4e633f, 0x546844, 0x60744b, 0x667450, 0x3d5239, 0x748259];
  const bedrock: [Point, Point, Point][] = [
    [[2.7, -0.37, -0.9], [3.75, 0.83, 2.69], [0.08, -0.12, -0.05]],
    [[0.20, -0.51, -2.0], [2.75, 0.95, 2.62], [0.04, 0.12, 0.04]],
    [[5.32, -0.51, 1.1], [1.90, 0.89, 1.52], [0.12, 0.28, -0.11]],
    [[-2.33, -0.43, -4.3], [3.11, 0.98, 2.4], [0.13, 0.28, 0.04]],
    [[7.54, 2.02, 0.98], [2.31, 4.24, 1.77], [-0.07, -0.28, 0.09]],
    [[8.70, 3.13, 1.79], [1.57, 3.22, 1.45], [0.06, -0.34, -0.13]],
    [[6.93, 4.77, 1.18], [1.77, 1.46, 1.54], [0.07, 0.26, 0.22]],
    [[7.03, 5.47, 2.16], [1.40, 0.70, 1.19], [0.10, -0.19, 0.13]],
    [[6.06, 5.37, 2.31], [0.54, 0.72, 0.82], [-0.13, 0.19, 0.14]],
    [[7.96, 5.73, 2.15], [0.63, 0.61, 0.68], [0.07, -0.37, -0.15]],
    [[8.55, 1.43, 2.67], [0.97, 2.68, 0.92], [0.07, 0.13, -0.04]],
    [[6.15, 1.4, 1.48], [0.77, 2.38, 0.86], [0.13, 0.43, -0.19]],
    [[9.27, 0.16, 3.63], [1.16, 1.37, 1.17], [-0.19, -0.18, -0.22]],
    [[5.94, -0.45, 3.02], [1.00, 0.68, 0.63], [0.11, -0.31, -0.18]],
    [[9.13, -0.48, 5.03], [1.61, 0.83, 1.33], [0.06, 0.29, -0.08]],
    [[-5.22, -0.95, 4.51], [1.44, 0.44, 0.87], [0.03, 0.46, -0.04]],
  ];

  const formations = bedrock.map(([position, scale, rotation], index) => ({
    position, scale, rotation, color: stoneColors[index % stoneColors.length],
  }));
  for (let stone = 0; stone < 59; stone += 1) {
    const x = -2.8 + random() * 9.5;
    const z = -2.9 + random() * 4.7;
    const size = 0.22 + random() * 0.59;
    formations.push({
      position: [x, -0.55 + random() * 0.36, z],
      scale: [size * (0.85 + random()), size * 0.65, size * (0.7 + random() * 0.7)],
      rotation: [random() * 0.45, random() * 6.28, random() * 0.21],
      color: stoneColors[stone % stoneColors.length],
    });
  }

  const rock = new THREE.IcosahedronGeometry(1, 1);
  garden.add(placedInstances(rock, material(0xffffff, { flatShading: true }), formations));

  const patches: Parameters<typeof placedInstances>[2] = [];
  const patchSites: [Point, Point][] = [
    [[2.5, 0.135, -1.2], [3.23, 0.33, 2.12]],
    [[-0.03, 0.25, -2.55], [2.57, 0.41, 1.96]],
    [[-2.39, 0.02, -4.3], [2.9, 0.37, 2.03]],
    [[5.3, 0.10, 1.12], [1.57, 0.23, 1.13]],
    [[7.18, 5.92, 1.68], [1.41, 0.23, 1.12]],
    [[8.78, 3.58, 2.9], [0.71, 0.53, 0.51]],
    [[8.72, 1.54, 3.25], [0.84, 0.47, 0.56]],
    [[6.3, -0.13, 2.63], [0.61, 0.23, 0.53]],
  ];
  for (const [position, scale] of patchSites) {
    patches.push({ position, scale, rotation: [0, random() * 0.25, 0.01], color: mossColors[Math.floor(random() * mossColors.length)] });
    for (let i = 0; i < 6; i += 1) {
      const angle = random() * Math.PI * 2;
      patches.push({
        position: [position[0] + Math.cos(angle) * scale[0] * 0.73, position[1] + scale[1] * 0.37, position[2] + Math.sin(angle) * scale[2] * 0.79],
        scale: [scale[0] * 0.16, scale[1] * 0.6, scale[2] * 0.21],
        rotation: [0, angle, 0],
        color: mossColors[Math.floor(random() * mossColors.length)],
      });
    }
  }
  garden.add(placedInstances(new THREE.IcosahedronGeometry(1, 1), material(0xffffff, { flatShading: true }), patches));
  return garden;
}

export function makeRidges() {
  const mountains = new THREE.Group();
  const random = randomFrom(562);
  const ridges = [
    { z: -68, color: 0x66747a, base: 3.8, amplitude: 8.5, phase: 1.5 },
    { z: -54, color: 0x50676d, base: 2.1, amplitude: 6.7, phase: 0.12 },
    { z: -43, color: 0x3d575d, base: 1.4, amplitude: 5.7, phase: -1.7 },
    { z: -33, color: 0x2e464c, base: 0.8, amplitude: 5.3, phase: 0.72 },
  ];

  for (const { z, color, base, amplitude, phase } of ridges) {
    const geometry = new THREE.PlaneGeometry(94, 1, 86, 1);
    const { position, uv } = geometry.attributes;
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const peak = base + ((Math.sin(x * 0.21 + phase) + 1) * 0.35 + Math.abs(Math.sin(x * 0.089 + phase)) * 0.53) * amplitude;
      const y = uv.getY(i) < 0.5 ? -3.4 : peak + random() * 0.72;
      position.setXYZ(i, x, y, z + Math.sin(x * 0.11) * 1.45);
    }
    const surface = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    mountains.add(new THREE.Mesh(geometry, surface));
  }
  return mountains;
}

function pathLantern(model: THREE.Group, stone: THREE.Material, glow: THREE.Material, x: number, y: number, z: number, size: number) {
  const pedestal = new THREE.Group();
  box(pedestal, stone, [0, 0.085, 0], [0.54, 0.17, 0.54]);
  box(pedestal, stone, [0, 0.36, 0], [0.21, 0.43, 0.21]);
  box(pedestal, stone, [0, 0.58, 0], [0.46, 0.11, 0.46]);
  box(pedestal, glow, [0, 0.76, 0], [0.33, 0.29, 0.33]);
  for (const side of [-0.17, 0.17]) {
    for (const front of [-0.17, 0.17]) box(pedestal, stone, [side, 0.76, front], [0.065, 0.37, 0.065]);
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.46, 0.23, 4), stone);
  cap.rotation.y = Math.PI / 4;
  cap.position.y = 1.04;
  pedestal.add(cap);
  box(pedestal, stone, [0, 1.18, 0], [0.13, 0.12, 0.13]);
  pedestal.position.set(x, y, z);
  pedestal.scale.setScalar(size);
  model.add(pedestal);
}

export function makeLanternPath() {
  const structure = new THREE.Group();
  const wood = material(0x99452f);
  const dark = material(0x382b26);
  const endgrain = material(0x6b3f35);
  const stone = material(0x657365, { flatShading: true });
  const glow = material(0xecbb72, { emissive: 0xe0370f, emissiveIntensity: 0.42 });
  const bridge = new THREE.Group();
  const arch = (z: number) => 0.10 + 0.52 * (1 - (z / 2.6) ** 2);

  for (let i = 0; i < 23; i += 1) {
    const z = -2.48 + i * 0.226;
    box(bridge, i % 4 === 1 ? endgrain : wood, [0, arch(z), z], [1.9, 0.15, 0.215]);
  }
  for (const x of [-0.91, 0.91]) {
    const posts = [-2.42, -1.23, 0, 1.23, 2.42];
    for (const z of posts) box(bridge, dark, [x, arch(z) + 0.35, z], [0.105, 0.7, 0.105]);
    const rail = posts.map((z) => new THREE.Vector3(x, arch(z) + 0.69, z));
    curve(bridge, wood, rail, 0.073);
    curve(bridge, endgrain, rail.map((point) => point.clone().setY(point.y - 0.36)), 0.041);
  }
  bridge.position.set(-4.58, -0.26, -2.0);
  bridge.rotation.y = 0.49;
  structure.add(bridge);

  const gate = new THREE.Group();
  for (const side of [-1, 1]) {
    beam(gate, wood, [side * 1.55, 0.08, 0], [side * 1.38, 3.12, 0], 0.203, 0.165);
    beam(gate, dark, [side * 1.55, 0, 0], [side * 1.53, 0.39, 0], 0.235);
  }
  box(gate, wood, [0, 2.48, 0], [3.84, 0.21, 0.23]);
  box(gate, dark, [0, 2.82, 0.01], [0.32, 0.58, 0.17]);
  const lintel = [-2.53, -1.84, 0, 1.84, 2.53].map((x) => new THREE.Vector3(x, 3.19 + 0.34 * (x / 2.53) ** 4, 0));
  curve(gate, wood, lintel, 0.19);
  curve(gate, dark, lintel.map((point) => point.clone().setY(point.y + 0.16)), 0.132);
  gate.position.set(-6.55, 0.04, -8.6);
  gate.rotation.y = 0.19;
  structure.add(gate);

  for (const [x, y, z, size] of [
    [-4.18, -0.28, 0.75, 0.83], [-6.83, -0.26, -4.55, 0.82], [-3.96, -0.18, -5.15, 0.77],
    [-8.4, 0.03, -7.5, 1.05], [-4.58, 0.02, -7.65, 0.98], [-8.06, -0.20, -10.8, 0.86],
    [-5.23, -0.24, -10.65, 0.83], [-8.91, -0.31, -14.78, 0.85], [-7.14, -0.29, -17.1, 1.03],
    [-15.42, -0.26, -19.9, 1.11], [-8.45, -0.26, -22.5, 1],
  ]) pathLantern(structure, stone, glow, x, y, z, size);

  const terrain = new THREE.Group();
  const trail = new THREE.IcosahedronGeometry(1, 1);
  const shelves: Parameters<typeof placedInstances>[2] = [
    { position: [-5.7, -0.66, -7.3], scale: [3.25, 0.9, 4.05], rotation: [0.04, 0.23, -0.03], color: 0x526149 },
    { position: [-6.9, -0.68, -12.75], scale: [3.18, 0.92, 4.5], rotation: [0.02, -0.39, 0.03], color: 0x5b6a50 },
    { position: [-4.1, -0.64, -16.8], scale: [2.54, 0.94, 3.82], rotation: [0.07, -0.21, -0.05], color: 0x485d49 },
    { position: [-15.46, -0.72, -18.93], scale: [2.37, 0.73, 4.1], rotation: [-0.12, 0.27, 0.06], color: 0x4d6652 },
    { position: [-11.23, -0.64, -24.72], scale: [5.25, 1.02, 2.7], rotation: [0.07, 0.11, -0.06], color: 0x53694f },
  ];
  const random = randomFrom(718);
  for (let i = 0; i < 34; i += 1) {
    const z = -4.72 - 0.3 * i;
    const x = -5.15 + 0.18 * (z + 4.72) + (random() - 0.5) * 0.56;
    const size = 0.38 + random() * 0.25;
    shelves.push({ position: [x, -0.02, z], scale: [size, 0.12, size * 0.63], rotation: [0.05, random(), -0.10], color: 0x8a9280 });
  }
  for (let i = 0; i < 32; i += 1) {
    const theta = random() * Math.PI * 1.45;
    const size = 0.26 + random() * 0.73;
    shelves.push({
      position: [-11.15 + Math.sin(theta) * 4.65, -0.67, -18.56 + Math.cos(theta) * 5.65],
      scale: [size, size * 0.52, size * .74], rotation: [random() * .45, theta, random() * .4],
      color: [0x52635b, 0x718374, 0x435750, 0x64776a][i % 4],
    });
  }
  terrain.add(placedInstances(trail, material(0xffffff, { flatShading: true }), shelves));
  terrain.add(compact(structure));
  return { path: terrain, glow };
}
