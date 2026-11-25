import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { placedInstances, randomFrom, type Point } from './gardenModels';
import { foliageLevels, TreeBranches } from './gardenTrees';
import { poolHeight } from './gardenWater';

interface CherrySite {
  position: Point;
  scale: number;
  yaw: number;
  from: number;
  to: number;
  landing: number;
  markerHeight: number;
}

export const cherrySites: CherrySite[] = [
  { position: [3.75, 0.04, -3.03], scale: 1.24, yaw: 0.14, from: 0, to: 1.40, landing: 0.12, markerHeight: 3.82 },
  { position: [-4.21, -0.04, -10.15], scale: 0.93, yaw: -0.64, from: 1.40, to: 2.67, landing: 0.14, markerHeight: 3.22 },
  { position: [-12.03, -0.31, -22.78], scale: 0.83, yaw: 0.68, from: 3.57, to: 5.1, landing: poolHeight + 0.058, markerHeight: 3.03 },
  { position: [7.59, 5.97, 1.59], scale: 0.50, yaw: -0.41, from: 0, to: 0.83, landing: poolHeight + 0.058, markerHeight: 3.62 },
];

const tau = Math.PI * 2;
const { lerp, smoothstep } = THREE.MathUtils;
const blossomTints = [0xffa7c5, 0xffc8dc, 0xffe1e8, 0xfff4ef, 0xfca1bf];

function makePetal() {
  // The raised edges and the notch at the tip give each petal a cupped silhouette.
  const vertices: Point[] = [
    [0, 0.48, 0], [0, 0, 0.08], [0.25, 0.24, 0.11], [0.43, 0.60, 0.18],
    [0.38, 0.84, 0.22], [0.19, 1.0, 0.20], [0.02, 0.86, 0.14], [-0.16, 0.99, 0.19],
    [-0.38, 0.87, 0.21], [-0.43, 0.63, 0.17], [-0.25, 0.25, 0.10],
  ];
  const colors = vertices.flatMap(([, y]) => new THREE.Color(0xb53969).lerp(new THREE.Color(0xffe8f0), y).toArray());
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const indices: number[] = [];
  for (let edge = 1; edge < vertices.length; edge++) indices.push(0, edge, edge === vertices.length - 1 ? 1 : edge + 1);
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFlower(petal: THREE.BufferGeometry) {
  const parts = Array.from({ length: 5 }, (_, i) =>
    petal.clone().scale(1, 1 - (i % 3) * 0.032, 1).rotateX(0.11 + (i % 2) * 0.08).rotateZ(i * tau / 5));
  const heart = new THREE.CircleGeometry(0.185, 10);
  heart.deleteAttribute('uv');
  const centerColors: number[] = [];
  for (let i = 0; i < heart.attributes.position.count; i++) {
    centerColors.push(...new THREE.Color(i === 0 ? 0xf1ae65 : 0xffdc91).toArray());
  }
  heart.setAttribute('color', new THREE.Float32BufferAttribute(centerColors, 3));
  parts.push(heart.translate(0, 0, 0.095));
  const flower = mergeGeometries(parts)!;
  for (const part of parts) part.dispose();
  return flower;
}

// At a distance, keep the five notched petals in one shallow cup.
function makeDistantFlower() {
  const positions = [0, 0, 0.04], colors = new THREE.Color(0xec9a95).toArray(), indices: number[] = [];
  const outline = [[-0.5, 0.23], [-0.30, 0.94], [0, 0.84], [0.27, 0.99]];
  for (let petal = 0; petal < 5; petal++) {
    for (const [offset, radius] of outline) {
      const angle = Math.PI / 2 + petal * tau / 5 + offset;
      positions.push(Math.cos(angle) * radius, Math.sin(angle) * radius, radius * 0.28);
      colors.push(...new THREE.Color(radius < 0.5 ? 0xcb6991 : 0xffe8f0).toArray());
      const i = positions.length / 3 - 1;
      indices.push(0, i, i % (outline.length * 5) + 1);
    }
  }
  const flower = new THREE.BufferGeometry();
  flower.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  flower.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  flower.setIndex(indices);
  flower.computeVertexNormals();
  return flower;
}

function growCherry(site: CherrySite, index: number, flower: THREE.BufferGeometry, distant: THREE.BufferGeometry, bud: THREE.BufferGeometry,
  petals: THREE.Material, bark: THREE.Material, budSkin: THREE.Material) {
  const random = randomFrom(2471 + 439 * index);
  const wood = new TreeBranches();
  const flowers: Parameters<typeof placedInstances>[2] = [];
  const buds: typeof flowers = [];
  const tips: THREE.Vector3[] = [];
  const trunk: Point[] = [[0, -0.18, 0], [0.13, 0.68, 0.02], [-0.20, 1.48, 0.13],
    [0.13, 2.29, -0.07], [-0.02, 3.01, -0.18], [-0.30, 3.70, 0.09]];
  for (let i = 1; i < trunk.length; i++) wood.add(trunk[i - 1], trunk[i], 0.275 - i * 0.038, 0.251 - i * 0.039);

  // Each arm forks into finer upward-facing sprays. Flowers grow in little bunches along those twigs.
  const arms = [[1, 3.05, 2.36, 2.80], [2, 0.38, 2.34, 3.03], [2, -2.07, 2.00, 3.41],
    [2, 1.86, 1.83, 3.39], [3, -0.71, 1.96, 3.74], [4, 2.68, 1.45, 4.10],
    [4, 0.77, 1.30, 4.23], [5, -1.81, 0.91, 4.44]];
  for (const [joint, angle, reach, height] of arms) {
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const end: Point = [dx * reach, height, dz * reach * 0.82];
    const elbow: Point = [dx * reach * 0.54, height - 0.72, dz * reach * 0.39];
    wood.add(trunk[joint], elbow, 0.119, 0.075);
    wood.add(elbow, end, 0.080, 0.024);
    const twigCount = site.scale < 0.7 ? 3 : 5;
    for (let twig = 0; twig < twigCount; twig++) {
      const along = 0.12 + 0.76 * twig / (twigCount - 1);
      const side = twig % 2 ? 1 : -1;
      const fork: Point = [lerp(elbow[0], end[0], along), lerp(elbow[1], end[1], along), lerp(elbow[2], end[2], along)];
      const spread = side * (0.33 + random() * 0.49);
      const tip: Point = [fork[0] + dx * 0.59 - dz * spread, fork[1] + 0.34 + random() * 0.47, fork[2] + dz * 0.44 + dx * spread];
      wood.add(fork, tip, 0.039, 0.010);
      for (let spur = 0; spur < 3; spur++) {
        const t = 0.38 + spur * 0.29;
        const stem: Point = [lerp(fork[0], tip[0], t), lerp(fork[1], tip[1], t), lerp(fork[2], tip[2], t)];
        const spray = (spur % 2 ? 1 : -1) * (0.13 + random() * 0.20);
        const center: Point = [stem[0] + dx * 0.13 - dz * spray, stem[1] + 0.08 + random() * 0.12, stem[2] + dz * 0.13 + dx * spray];
        wood.add(stem, center, 0.016, 0.007);
        tips.push(new THREE.Vector3(...center));
        const count = 3 + Math.floor(random() * 4);
        for (let i = 0; i < count; i++) {
          const bearing = random() * tau, radius = Math.sqrt(random()) * 0.23;
          const size = 0.098 + random() * 0.084;
          flowers.push({
            position: [center[0] + Math.cos(bearing) * radius, center[1] + (random() - 0.4) * 0.24, center[2] + Math.sin(bearing) * radius],
            rotation: [(random() - 0.62) * 2.45, bearing, random() * tau], scale: [size, size, size],
            color: blossomTints[Math.floor(random() * blossomTints.length)],
          });
        }
        buds.push({ position: [center[0] + dx * 0.18, center[1] + 0.13, center[2] + dz * 0.18],
          scale: [0.058, 0.087, 0.055], rotation: [dz, 0, -dx], color: spur % 2 ? 0xd96c93 : 0xbc537d });
      }
    }
  }
  const tree = new THREE.Group();
  tree.add(wood.mesh(bark), foliageLevels(flower, distant, petals, flowers, 11 * site.scale), placedInstances(bud, budSkin, buds));
  tree.position.set(...site.position);
  tree.scale.setScalar(site.scale);
  tree.rotation.y = site.yaw;
  tree.updateMatrixWorld();
  for (const tip of tips) tip.applyMatrix4(tree.matrixWorld);
  return { tree, tips };
}

export function makeSakura() {
  const garden = new THREE.Group();
  const petal = makePetal();
  const flower = makeFlower(petal), distant = makeDistantFlower();
  const bud = new THREE.IcosahedronGeometry(1, 0);
  const petals = new THREE.MeshLambertMaterial({
    color: 0xffffff, vertexColors: true, side: THREE.DoubleSide, emissive: 0x391623, emissiveIntensity: 0.22,
  });
  const bark = new THREE.MeshStandardMaterial({ color: 0x583a42, roughness: 0.9 });
  const budSkin = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const trees = cherrySites.map((site, index) => growCherry(site, index, flower, distant, bud, petals, bark, budSkin));
  for (const { tree } of trees) garden.add(tree);

  const random = randomFrom(8107);
  const ambientCount = 90, showerCount = 38;
  function pickTip(site: number) {
    const tips = trees[site].tips;
    return tips[Math.floor(random() * tips.length)];
  }
  const flights = Array.from({ length: ambientCount + showerCount }, (_, i) => {
    const site = i % trees.length;
    return { site, start: pickTip(site), offset: random(), angle: random() * tau, duration: 5.1 + random() * 3.2,
      sideways: (random() - 0.58) * 2.9, forward: 3.5 + random() * 3.4, size: 0.090 + random() * 0.092 };
  });
  const loose = new THREE.InstancedMesh(petal, petals, flights.length);
  loose.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  loose.frustumCulled = false;
  loose.count = ambientCount;
  for (let i = 0; i < flights.length; i++) loose.setColorAt(i, new THREE.Color(blossomTints[i % blossomTints.length]));
  garden.add(loose);
  const transform = new THREE.Object3D();
  let lastShake = -100;
  let shakenSite = -1;

  function scatter(walk: number, time: number, site = cherrySites.findIndex(({ from, to }) => walk >= from && walk < to)) {
    if (site < 0) return;
    shakenSite = site;
    lastShake = time;
    for (let i = ambientCount; i < flights.length; i++) {
      flights[i].site = site;
      flights[i].start = pickTip(site);
    }
  }

  function drift(time: number) {
    const age = time - lastShake;
    for (let i = 0; i < trees.length; i++) {
      const shake = i === shakenSite ? Math.exp(-age * 3.2) * Math.sin(age * 18) * 0.053 : 0;
      trees[i].tree.rotation.z = Math.sin(time * 0.74 + i * 2.3) * 0.008 + shake;
    }
    loose.count = age < 5.7 ? flights.length : ambientCount;
    for (let i = 0; i < loose.count; i++) {
      const f = flights[i];
      const shower = i >= ambientCount;
      const progress = shower ? (age - f.offset * 0.38) / (f.duration * 0.64) : (time / f.duration + f.offset) % 1;
      const fall = THREE.MathUtils.clamp(progress / 0.80, 0, 1);
      const rest = smoothstep(progress, 0.71, 0.87);
      const spin = time * 2.9 + f.angle;
      const flutter = Math.sin(spin + fall * 5);
      transform.position.set(
        f.start.x + f.sideways * fall + Math.sin(f.angle + fall * 8) * fall * 0.41,
        lerp(f.start.y, cherrySites[f.site].landing, fall) + Math.sin(Math.PI * fall) * (0.16 * flutter + (shower ? 0.65 : 0)) + rest * 0.016 * flutter,
        f.start.z + f.forward * Math.max(0, progress) + Math.sin(fall * 7 + f.angle) * fall * 0.35,
      );
      transform.rotation.set(lerp(-0.48 + Math.sin(spin) * 1.32, -Math.PI / 2, rest),
        (1 - rest) * Math.cos(spin * 0.69 + f.angle), f.angle + fall * 4.2);
      const fade = smoothstep(progress, 0, 0.052) * (1 - smoothstep(progress, 0.89, 1));
      transform.scale.setScalar(f.size * (shower ? 1.25 : 1) * fade);
      transform.updateMatrix();
      loose.setMatrixAt(i, transform.matrix);
    }
    loose.instanceMatrix.needsUpdate = true;
  }
  return { garden, scatter, drift };
}
