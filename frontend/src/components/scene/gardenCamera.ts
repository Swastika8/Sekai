import { CatmullRomCurve3, Vector3 } from 'three';

const stops = [
  { phase: 0, eye: [0.22, 5.22, 19.0], at: [0.40, 2.58, -0.18] },
  { phase: 0.25, eye: [1.03, 5.22, 16.5], at: [2.27, 2.66, -0.08] },
  { phase: 0.58, eye: [1.07, 4.45, 12.38], at: [3.01, 2.14, -0.26] },
  { phase: 1, eye: [-1.91, 3.25, 8.52], at: [2.12, 1.56, -0.46] },
  { phase: 1.25, eye: [-3.62, 2.96, 5.22], at: [-2.15, 1.54, -2.72] },
  { phase: 1.63, eye: [-4.81, 2.63, 1.98], at: [-5.80, 1.51, -7.41] },
  { phase: 2, eye: [-5.9, 2.72, -2.62], at: [-6.95, 1.59, -9.25] },
  { phase: 2.34, eye: [-6.27, 2.38, -5.69], at: [-6.97, 1.54, -12.02] },
  { phase: 2.66, eye: [-6.54, 2.34, -8.33], at: [-8.28, 1.29, -14.17] },
  { phase: 3, eye: [-7.48, 3.99, -10.25], at: [-10.64, 0.77, -17.75] },
  { phase: 3.55, eye: [-9.01, 3.36, -11.31], at: [-11.32, 0.59, -18.74] },
  { phase: 4, eye: [-9.53, 2.60, -12.35], at: [-12.24, 0.55, -19.92] },
  { phase: 5, eye: [-9.83, 2.21, -13.46], at: [-12.47, 0.52, -20.56] },
];

const eye = new CatmullRomCurve3(stops.map(({ eye }) => new Vector3().fromArray(eye)));
const aim = new CatmullRomCurve3(stops.map(({ at }) => new Vector3().fromArray(at)));

export function gardenPose(phase: number, position: Vector3, target: Vector3) {
  const next = stops.findIndex((stop) => stop.phase > phase);
  const segment = next > 0 ? next - 1 : stops.length - 2;
  const from = stops[segment].phase;
  const to = stops[segment + 1].phase;
  const fraction = Math.min(1, Math.max(0, (phase - from) / (to - from)));
  const sample = (segment + fraction) / (stops.length - 1);
  eye.getPoint(sample, position);
  aim.getPoint(sample, target);
}

