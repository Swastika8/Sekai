import * as THREE from 'three';
import { placedInstances, randomFrom, type Point } from './gardenModels';

type Placements = Parameters<typeof placedInstances>[2];
const tau = Math.PI * 2;
const up = new THREE.Vector3(0, 1, 0);
const { lerp } = THREE.MathUtils;

// The distance levels have the same stems, colors, and silhouettes. They share the instance buffers.
export function foliageLevels(close: THREE.BufferGeometry, distant: THREE.BufferGeometry, material: THREE.Material,
  placements: Placements, distance: number) {
  const near = placedInstances(close, material, placements);
  const far = new THREE.InstancedMesh(distant, material, 0);
  far.instanceMatrix = near.instanceMatrix;
  far.instanceColor = near.instanceColor;
  far.count = near.count;
  near.computeBoundingSphere();
  const levels = new THREE.LOD();
  levels.position.copy(near.boundingSphere!.center);
  near.position.copy(levels.position).negate();
  far.position.copy(near.position);
  levels.addLevel(near, 0);
  levels.addLevel(far, distance, 0.10);
  return levels;
}

// Build tapered segments directly into one mesh. A fine twig needs only three sides.
export class TreeBranches {
  private positions: number[] = [];
  private normals: number[] = [];
  private indices: number[] = [];
  private axis = new THREE.Vector3();
  private radial = new THREE.Vector3();
  private normal = new THREE.Vector3();
  private rotation = new THREE.Quaternion();

  add(a: Point, b: Point, base: number, tip: number) {
    const sides = base > 0.07 ? 7 : base > 0.025 ? 5 : 3;
    const offset = this.positions.length / 3;
    this.axis.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const length = this.axis.length();
    this.rotation.setFromUnitVectors(up, this.axis.normalize());
    for (let i = 0; i < sides; i++) {
      const angle = tau * i / sides;
      this.radial.set(Math.sin(angle), 0, Math.cos(angle)).applyQuaternion(this.rotation);
      this.normal.copy(this.radial).addScaledVector(this.axis, (base - tip) / length).normalize();
      const { x, y, z } = this.radial;
      this.positions.push(a[0] + x * base, a[1] + y * base, a[2] + z * base,
        b[0] + x * tip, b[1] + y * tip, b[2] + z * tip);
      this.normals.push(this.normal.x, this.normal.y, this.normal.z, this.normal.x, this.normal.y, this.normal.z);
      const here = offset + i * 2, next = offset + ((i + 1) % sides) * 2;
      this.indices.push(here, next, here + 1, next, next + 1, here + 1);
      if (base > 0.07 && i > 0 && i < sides - 1) this.indices.push(offset, next, here, offset + 1, here + 1, next + 1);
    }
  }

  mesh(material: THREE.Material) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geometry.setIndex(this.indices);
    return new THREE.Mesh(geometry, material);
  }
}

function pinePad(detailed: boolean) {
  const random = randomFrom(982);
  const positions: number[] = [], colors: number[] = [], uvs: number[] = [], indices: number[] = [];
  function vertex(x: number, y: number, z: number, tint: number) {
    positions.push(x, y, z);
    uvs.push(0.5 + x * 0.36, 0.5 + z * 0.36);
    colors.push(...new THREE.Color(tint).toArray());
    return positions.length / 3 - 1;
  }
  const segments = detailed ? 20 : 12;
  const top = vertex(0, 0.30, 0, 0xc9d4b7);
  const shoulder: number[] = [], edge: number[] = [], undersideEdge: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a = tau * i / segments, r = 0.97 + 0.16 * Math.sin(a * 5) + 0.095 * Math.cos(a * 3 + 0.5);
    if (detailed) shoulder.push(vertex(Math.cos(a) * r * 0.66, 0.13 + random() * 0.12, Math.sin(a) * r * 0.66, i % 3 ? 0xc3cfb6 : 0xadbfab));
    const x = Math.cos(a) * r, y = -0.07 + random() * 0.10, z = Math.sin(a) * r;
    edge.push(vertex(x, y, z, i % 2 ? 0x95ab98 : 0xbcc9a6));
    undersideEdge.push(vertex(x, y, z, 0x879889));
  }
  const underside = vertex(0, -0.16, 0, 0x879889);
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    if (detailed) indices.push(top, shoulder[n], shoulder[i], shoulder[i], shoulder[n], edge[i], edge[i], shoulder[n], edge[n]);
    else indices.push(top, edge[n], edge[i]);
    indices.push(underside, undersideEdge[i], undersideEdge[n]);
  }
  // Needle fans break up both the rim and the upper surface of each branch tip.
  const tufts = detailed ? 21 : 6, blades = detailed ? 3 : 2;
  for (let tuft = 0; tuft < tufts; tuft++) {
    const a = random() * tau, r = tuft % 2 ? Math.sqrt(random()) : 0.80 + random() * 0.22;
    const x = Math.cos(a) * r, z = Math.sin(a) * r, y = 0.27 * (1 - r * r) - 0.015;
    for (let needle = 0; needle < blades; needle++) {
      const direction = a + (needle - 1) * 0.42 + random() * 0.30;
      const dx = Math.cos(direction), dz = Math.sin(direction), length = 0.16 + random() * 0.24;
      const left = vertex(x - dz * 0.033, y, z + dx * 0.033, 0x819c88);
      const right = vertex(x + dz * 0.033, y, z - dx * 0.033, 0xb1c0a0);
      const tip = vertex(x + dx * length, y + 0.05 + random() * 0.16, z + dz * length, needle === 1 ? 0xf5edcf : 0xd7dfbf);
      indices.push(left, right, tip);
    }
  }
  const pad = new THREE.BufferGeometry();
  pad.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  pad.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  pad.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  pad.setIndex(indices);
  pad.computeVertexNormals();
  return pad;
}

function pineNeedles() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#f7f6e8';
  ctx.fillRect(0, 0, 256, 256);
  ctx.lineCap = 'round';
  const random = randomFrom(733);
  for (let tuft = 0; tuft < 700; tuft++) {
    const x = random() * 256, y = random() * 256;
    const bearing = Math.atan2(y - 128, x - 128) + (random() - 0.5) * 1.9;
    const length = 3 + random() * 8;
    ctx.strokeStyle = tuft % 3 ? 'rgba(88,112,92,.39)' : 'rgba(139,159,117,.55)';
    ctx.lineWidth = 0.8 + random() * 0.7;
    ctx.beginPath();
    for (let needle = -1; needle <= 1; needle++) {
      const angle = bearing + needle * 0.34;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makePines() {
  const forest = new THREE.Group();
  const sites = [
    [-10.2, -10.4, 0, 3.0], [-9.1, -7.3, -0.2, 2.7], [-3.8, -9.1, 0, 3.9],
    [-2.68, -9.2, -0.2, 4.6], [-1.2, -7, -0.15, 3.2], [0.2, -8.4, -0.2, 4.7],
    [1.95, -9.6, -0.2, 3.8], [3.7, -8.4, -0.15, 3.18], [5.4, -9.6, 0, 5.6],
    [7.0, -5.9, -0.15, 4.68], [9.0, -5.5, 0, 6.1], [10.1, -4.5, 0, 4.4],
    [-2.55, -4.55, 0.28, 2.13], [-1.1, -4.35, 0.42, 2.65], [8.4, 0.4, 5.65, 2.28],
    [-12.2, -9.5, 0.1, 4.1], [-11.1, -12.15, 0.05, 3.7], [-3.7, -11.9, 0.05, 3.4],
    [-16.4, -16.0, -0.18, 4.5], [-15.7, -19.2, -0.12, 3.3], [-14.4, -23.8, -0.15, 4.2],
    [-12.5, -25.9, -0.2, 5.3], [-9.4, -24.8, -0.1, 4.15], [-7.4, -22.2, -0.2, 4.2],
    [-4.2, -16.4, 0.2, 4.85], [-5.3, -17.9, 0.0, 4.1], [-1.5, -17.2, 0.01, 3.6],
  ];
  const random = randomFrom(877);
  const wood: Placements = [], mounds: Placements = [];
  const banks: Placements[] = Array.from({ length: 5 }, () => []);
  const direction = new THREE.Vector3(), rotation = new THREE.Euler(), quaternion = new THREE.Quaternion();
  const greens = [0x355e4b, 0x466e53, 0x547c5b, 0x638762, 0x71926d];
  function limb(a: THREE.Vector3, b: THREE.Vector3, width: number) {
    direction.subVectors(b, a);
    const length = direction.length();
    quaternion.setFromUnitVectors(up, direction.normalize());
    rotation.setFromQuaternion(quaternion);
    wood.push({ position: [(a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2], rotation: [rotation.x, rotation.y, rotation.z],
      scale: [width, length, width], color: width > 0.075 ? 0x55463d : 0x664e3e });
  }
  for (const [x, z, y, h] of sites) {
    const pads = banks[z < -14 ? (x < -8 ? 0 : 1) : (x < -6 ? 2 : x < 4 ? 3 : 4)];
    const turn = random() * tau;
    const lean = 0.12 + random() * 0.14;
    function spine(t: number) {
      const bow = t * lean + Math.sin(t * 7.3) * t * 0.078;
      return new THREE.Vector3(x + h * bow * Math.cos(turn), y + t * h, z + h * (bow * Math.sin(turn) + 0.035 * Math.sin(t * 6)));
    }
    mounds.push({ position: [x, y - 0.64, z], scale: [h * 0.44, 0.66, h * 0.37], rotation: [0.055, turn, 0.025], color: 0x485c46 });
    let base = spine(-0.13);
    for (let joint = 1; joint <= 6; joint++) {
      const end = spine(joint / 6);
      limb(base, end, h * (0.061 - joint * 0.0072));
      base = end;
    }
    for (let level = 0; level < 8; level++) {
      const t = 0.26 + level * 0.095, origin = spine(t);
      const angle = turn + level * 2.40 + (random() - 0.5) * 0.65;
      const dx = Math.cos(angle), dz = Math.sin(angle);
      const reach = h * (0.47 - t * 0.26) * (0.82 + random() * 0.40);
      const elbow = origin.clone().add(new THREE.Vector3(dx * reach * 0.48, -h * 0.026, dz * reach * 0.48));
      limb(origin, elbow, h * (0.033 - t * 0.014));
      for (let twig = -1; twig <= 1; twig++) {
        const spread = twig * reach * (0.32 + random() * 0.20);
        const end = elbow.clone().add(new THREE.Vector3(dx * reach * 0.54 - dz * spread, h * (0.048 + random() * 0.058), dz * reach * 0.54 + dx * spread));
        limb(elbow, end, h * (0.020 - t * 0.008));
        const radius = reach * (twig === 0 ? 0.56 : 0.46) * (0.84 + random() * 0.29);
        pads.push({ position: [end.x, end.y + radius * 0.06, end.z], scale: [radius * 1.12, radius * 0.94, radius * 0.78],
          rotation: [(random() - 0.5) * 0.23, angle + twig, (random() - 0.5) * 0.24],
          color: greens[Math.min(4, Math.floor(t * 3.2 + random() * 1.7))] });
      }
    }
    const crown = spine(0.99);
    pads.push({ position: [crown.x, crown.y, crown.z], scale: [h * 0.16, h * 0.16, h * 0.132], rotation: [0.05, turn, -0.035], color: greens[4] });
  }
  mounds.push(
    { position: [2.8, -1.02, -8.85], scale: [9.8, 1.12, 3.1], rotation: [0, 0.04, 0], color: 0x44584c },
    { position: [-12.0, -1.04, -25.6], scale: [7.5, 1.14, 3.0], rotation: [0, -0.04, 0], color: 0x495e51 },
  );
  forest.add(placedInstances(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshLambertMaterial(), mounds));
  forest.add(placedInstances(new THREE.CylinderGeometry(0.64, 1, 1, 6, 1, true), new THREE.MeshStandardMaterial({ roughness: 0.92 }), wood));
  const close = pinePad(true), distant = pinePad(false);
  const needles = new THREE.MeshLambertMaterial({ vertexColors: true, map: pineNeedles(), side: THREE.DoubleSide });
  for (const pads of banks) forest.add(foliageLevels(close, distant, needles, pads, 11));
  return forest;
}

function mapleLeaf(detailed = true) {
  // Seven pointed lobes fold away from the midrib. The same blade also falls from the canopy.
  const half = detailed
    ? [[-0.018, -0.25], [-0.035, -0.012], [-0.57, -0.21], [-0.31, 0.12], [-0.77, 0.19], [-0.68, 0.21],
      [-1, 0.39], [-0.26, 0.32], [-0.48, 0.66], [-0.61, 1], [-0.12, 0.48], [-0.07, 1.01]]
    : [[-0.025, -0.25], [-0.57, -0.21], [-0.31, 0.12], [-1, 0.39], [-0.26, 0.32], [-0.61, 1], [-0.12, 0.48]];
  const outline = [...half, [0, 1.27], ...half.slice().reverse().map(([x, z]) => [-x, z])];
  const positions = [0, 0.085, 0.09], colors = new THREE.Color(0xf3c39a).toArray(), indices: number[] = [];
  for (const [i, [x, z]] of outline.entries()) {
    positions.push(x, -0.13 * Math.abs(x) + 0.065 * z * z, z);
    colors.push(...new THREE.Color(z > 0.77 ? 0xffead0 : i % 4 === 0 ? 0xd8bba1 : 0xe4cbb6).toArray());
    indices.push(0, i + 1, (i + 1) % outline.length + 1);
  }
  const leaf = new THREE.BufferGeometry();
  leaf.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  leaf.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  leaf.setIndex(indices);
  leaf.computeVertexNormals();
  return leaf;
}

export function makeMaple(seed: number) {
  const random = randomFrom(seed);
  const tree = new THREE.Group(), wood = new TreeBranches();
  const bark = new THREE.MeshStandardMaterial({ color: 0x523c31, roughness: 0.91 });
  const leaves: Placements = [];
  const palette = [0x913c32, 0xa84932, 0xbe4d31, 0xcc5b36, 0xd77342, 0xe4914e, 0xd89857];
  const trunk: Point[] = [[0, -0.42, 0], [0.1, 0.74, 0.012], [0.31, 1.51, 0.015], [0.20, 2.3, -0.065], [0.42, 2.97, 0.08], [0.77, 3.62, 0.09]];
  for (let i = 0; i < trunk.length - 1; i++) wood.add(trunk[i], trunk[i + 1], 0.245 - i * 0.039, 0.221 - i * 0.041);
  for (let i = 0; i < 6; i++) {
    const a = i * tau / 6 + 0.2;
    wood.add([0.02, 0.21, 0], [Math.cos(a) * 0.62, -0.24, Math.sin(a) * 0.58], 0.15, 0.022);
  }
  const limbs: [number, Point, Point][] = [
    [2, [-0.4, 1.92, 0.04], [-1.61, 2.57, 0.22]], [2, [0.89, 1.86, 0.45], [1.94, 2.36, 0.68]],
    [3, [-0.59, 2.66, -0.39], [-1.46, 3.15, -0.66]], [3, [0.93, 2.73, -0.41], [1.96, 3.19, -0.6]],
    [4, [-0.06, 3.44, 0.37], [-0.61, 3.77, 0.8]], [4, [0.89, 3.49, -0.24], [1.22, 3.96, -0.29]],
    [5, [0.91, 3.87, 0.24], [0.86, 4.26, 0.48]],
  ];
  for (const [joint, elbow, tip] of limbs) {
    wood.add(trunk[joint], elbow, 0.105, 0.069);
    wood.add(elbow, tip, 0.073, 0.026);
    const startAngle = random() * tau;
    for (let fork = 0; fork < 7; fork++) {
      const angle = startAngle + fork * tau / 7, dx = Math.cos(angle), dz = Math.sin(angle);
      const reach = 0.59 + random() * 0.55, start = 0.37 + 0.49 * random();
      const base: Point = [lerp(elbow[0], tip[0], start), lerp(elbow[1], tip[1], start), lerp(elbow[2], tip[2], start)];
      const end: Point = [tip[0] + dx * reach, tip[1] + 0.02 + random() * 0.51, tip[2] + dz * reach * 0.83];
      wood.add(base, end, 0.029, 0.007);
      const shade = Math.min(4, Math.floor(random() * 4 + joint * 0.30));
      for (let node = 0; node < 4; node++) {
        const t = 0.24 + node * 0.23, side = node % 2 ? -1 : 1;
        const stem: Point = [lerp(base[0], end[0], t), lerp(base[1], end[1], t), lerp(base[2], end[2], t)];
        const spray: Point = [stem[0] + dx * 0.10 - dz * side * 0.23, stem[1] + 0.04, stem[2] + dz * 0.10 + dx * side * 0.23];
        wood.add(stem, spray, 0.012, 0.004);
        for (let blade = 0; blade < 3; blade++) {
          const turn = angle + blade * tau / 3 + random() * 0.39;
          const size = 0.16 + random() * 0.15;
          leaves.push({ position: [spray[0] + Math.sin(turn) * 0.10, spray[1] + (random() - 0.5) * 0.14, spray[2] + Math.cos(turn) * 0.10],
            rotation: [(random() - 0.31) * 1.58, turn, (random() - 0.50) * 1.60], scale: [size, size, size],
            color: palette[shade + Math.floor(random() * 3)] });
        }
      }
    }
  }
  const blades = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  tree.add(wood.mesh(bark), foliageLevels(mapleLeaf(), mapleLeaf(false), blades, leaves, 10));
  return tree;
}

export function makeDriftingLeaves() {
  const centers = [[0.3, 3.9, -1.44], [-10.82, 4.0, -8.2], [-7.63, 3.6, -19.75]];
  const random = randomFrom(588);
  const seeds = Array.from({ length: 63 }, (_, i) => ({ center: centers[i % centers.length], offset: random(), phase: random() * tau, size: 0.062 + random() * 0.095 }));
  const leaves = new THREE.InstancedMesh(mapleLeaf(), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), seeds.length);
  const colors = [0xe7a262, 0xbd6140, 0xb95542, 0xd88345];
  seeds.forEach((_, i) => leaves.setColorAt(i, new THREE.Color(colors[i % colors.length])));
  leaves.frustumCulled = false;
  leaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const transform = new THREE.Object3D();
  function drift(time: number, burst: number) {
    for (let i = 0; i < seeds.length; i++) {
      const { center, offset, phase, size } = seeds[i];
      const fall = (offset + time * 0.16) % 1;
      const gust = i % centers.length === 0 ? burst : 0;
      transform.position.set(center[0] + Math.sin(time * 0.66 + phase) * (1.62 + gust * 2.5), center[1] - fall * 4.9,
        center[2] + Math.cos(phase + fall * 2.5) * 1.85 + gust * fall);
      transform.rotation.set(phase + time * 2.8, time * 1.45 + phase, phase + fall * 4.6);
      transform.scale.setScalar(size * Math.min(1, (1 - fall) * 7, fall * 8));
      transform.updateMatrix();
      leaves.setMatrixAt(i, transform.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;
  }
  return { leaves, drift };
}
