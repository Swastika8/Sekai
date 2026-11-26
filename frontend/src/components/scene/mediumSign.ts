import * as THREE from 'three';
import boardImage from '../../assets/garden/medium-board.webp';
import { box, compact } from './gardenModels';

export function makeMediumSign(link: HTMLAnchorElement) {
  const cedar = new THREE.MeshStandardMaterial({ color: 0x71513b, roughness: 0.93 });
  const width = 0.88;
  const height = width * 336 / 816;
  const stake = new THREE.Group();
  box(stake, cedar, [0, 0.21, -0.045], [0.08, 0.58, 0.085]);
  const board = new THREE.Group();
  board.position.set(0, 0.52, 0);
  board.rotation.x = -0.22;
  box(board, cedar, [0, 0, -0.03], [width + 0.012, height + 0.012, 0.058]);
  stake.add(board);
  const model = compact(stake);

  // A rolled lip and a hollow interior give the small stoneware pot its silhouette.
  const potProfile = [[0.10, 0], [0.14, 0.025], [0.14, 0.055], [0.21, 0.12], [0.26, 0.24],
    [0.25, 0.32], [0.17, 0.40], [0.16, 0.43], [0.19, 0.44], [0.19, 0.47],
    [0.145, 0.47], [0.14, 0.425], [0.21, 0.30], [0.17, 0.16], [0, 0.12]];
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potProfile.map(([r, y]) => new THREE.Vector2(r, y)), 20),
    new THREE.MeshStandardMaterial({ color: 0x7faaa0, roughness: 0.44 }));
  pot.position.set(-0.58, -0.065, -0.26);
  model.add(pot);

  const texture = new THREE.TextureLoader().load(boardImage);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }));
  face.position.copy(board.position);
  face.quaternion.copy(board.quaternion);
  model.add(face);
  model.position.set(-8.06, 0.098, -12.36);
  model.rotation.y = 0.19;

  const corners = [-1, 1].flatMap(x => [-1, 1].map(y => new THREE.Vector3(x * width / 2, y * height / 2, 0)));
  const point = new THREE.Vector3();

  // The plank carries the lettering. Project its four corners so the real HTML link follows it.
  function positionLink(camera: THREE.Camera, viewWidth: number, viewHeight: number) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    if (model.visible && face.worldToLocal(point.copy(camera.position)).z > 0) {
      for (const corner of corners) {
        point.copy(corner).applyMatrix4(face.matrixWorld).project(camera);
        if (point.z < -1 || point.z >= 1) {
          link.dataset.projected = 'away';
          return;
        }
        const x = (point.x + 1) * viewWidth / 2;
        const y = (1 - point.y) * viewHeight / 2;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    const visible = right > 0 && left < viewWidth && bottom > 0 && top < viewHeight && right - left > 12;
    const state = visible ? 'visible' : 'away';
    if (link.dataset.projected !== state) link.dataset.projected = state;
    if (!visible) return;

    const padX = Math.max(0, (44 - (right - left)) / 2);
    const padY = Math.max(0, (44 - (bottom - top)) / 2);
    const inset = `${edge(top - padY)} ${edge(viewWidth - right - padX)} ${edge(viewHeight - bottom - padY)} ${edge(left - padX)}`;
    if (link.style.inset !== inset) link.style.inset = inset;
  }

  return { model, positionLink };
}

const edge = (value: number) => Math.max(0, Math.round(value)) + 'px';
