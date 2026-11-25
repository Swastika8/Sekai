import * as THREE from 'three';
import boardImage from '../../assets/garden/medium-board.webp';
import { beam, box, compact } from './gardenModels';

export function makeMediumSign(link: HTMLAnchorElement) {
  const model = new THREE.Group();
  model.position.set(1.64, 0.44, 1.60);
  model.rotation.y = -0.43;

  const cedar = new THREE.MeshStandardMaterial({ color: 0x71513b, roughness: 0.93 });
  const bracket = new THREE.Group();
  const armY = 1.96;
  box(bracket, cedar, [-0.84, armY / 2 - 0.025, -0.09], [0.13, armY + 0.21, 0.14]);
  box(bracket, cedar, [0, armY, -0.04], [1.92, 0.11, 0.17]);
  beam(bracket, cedar, [-0.83, armY - 0.43, -0.09], [-0.38, armY, -0.08], 0.045);
  model.add(compact(bracket));

  const width = 1.54;
  const height = width * 336 / 816;
  const boardY = -0.52;
  const hanger = new THREE.Group();
  const cord = new THREE.MeshStandardMaterial({ color: 0xba9260, roughness: 1 });
  for (const x of [-0.54, 0.54]) {
    beam(hanger, cord, [x, 0.04, 0], [x, boardY + height / 2 - 0.01, 0], 0.018);
  }
  box(hanger, cedar, [0, boardY, 0], [width + 0.018, height + 0.018, 0.092]);
  const panel = compact(hanger);
  panel.position.set(0.045, armY - 0.05, 0.03);
  model.add(panel);

  const texture = new THREE.TextureLoader().load(boardImage);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }));
  face.position.set(0, boardY, 0.048);
  panel.add(face);

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

  return { model, panel, positionLink };
}

const edge = (value: number) => Math.max(0, Math.round(value)) + 'px';
