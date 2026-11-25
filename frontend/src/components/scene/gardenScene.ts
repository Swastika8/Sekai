import * as THREE from 'three';
import { gardenPose } from './gardenCamera';
import { cherrySites, makeSakura } from './gardenSakura';
import { makeDriftingLeaves, makeMaple, makePines } from './gardenTrees';
import { makeHouse, makeLanternPath, makeRidges, makeTerrain } from './gardenModels';
import { makePondLife } from './gardenKoi';
import { makeMediumSign } from './mediumSign';
import { makeCascade, makePool, makeSky, poolHeight, type GardenMotion, type PondLight } from './gardenWater';
import { initialLights, type GardenAction, type GardenController, type GardenLights } from './journey';

const { clamp, damp, smoothstep } = THREE.MathUtils;
const axisY = new THREE.Vector3(0, 1, 0);

const landmarks = [
  { id: 'falls', from: 0, to: 0.83, anchor: [7.38, 3.72, 4.01], size: [1.98, 7.03, 1.82], center: [7.21, 2.61, 4.0] },
  { id: 'house', from: 0, to: 1.49, anchor: [3.48, 1.72, 1.77], size: [4.95, 3.09, 3.76], center: [3.0, 1.7, -0.43] },
  { id: 'maple', from: 0.17, to: 1.48, anchor: [0.18, 3.81, -0.39], size: [3.82, 3.79, 2.6], center: [0.46, 2.92, -1.27] },
  { id: 'gate', from: 1.68, to: 2.56, anchor: [-6.54, 2.87, -8.19], size: [4.76, 3.63, 1.44], center: [-6.54, 1.60, -8.57] },
  { id: 'pond', from: 3.7, to: 5.1, anchor: [-10.7, -0.86, -19.35], size: [8.96, 0.17, 9.91], center: [-12.0, -0.91, -18.27] },
  ...cherrySites.map(({ position: [x, y, z], scale, from, to, markerHeight }, cherryIndex) => ({
    id: 'sakura', cherryIndex, from, to, anchor: [x + 0.48 * scale, y + markerHeight * scale, z + 0.64 * scale],
    size: [4.7 * scale, 2.35 * scale, 3.45 * scale], center: [x, y + 3.62 * scale, z],
  })),
].map((item) => ({
  id: item.id as GardenAction,
  from: item.from, to: item.to,
  cherryIndex: 'cherryIndex' in item ? item.cherryIndex : undefined,
  anchor: new THREE.Vector3().fromArray(item.anchor),
  bounds: new THREE.Box3().setFromCenterAndSize(new THREE.Vector3().fromArray(item.center), new THREE.Vector3().fromArray(item.size)),
}));

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Points)) return;
    geometries.add(object.geometry);
    for (const material of [object.material].flat()) materials.add(material);
    if (object instanceof THREE.InstancedMesh) object.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  const maps = new Set<THREE.Texture>();
  for (const material of materials) {
    if ('map' in material && material.map instanceof THREE.Texture) maps.add(material.map);
    material.dispose();
  }
  for (const map of maps) map.dispose();
}

export function mountGarden(
  container: HTMLElement,
  scroll: { current: number },
  buttons: Map<GardenAction, HTMLButtonElement>,
  mediumLink: HTMLAnchorElement,
  onReady: (ready: boolean) => void,
  onLights: (lights: GardenLights) => void,
): GardenController | null {
  const canvas = document.createElement('canvas');
  let renderer: THREE.WebGLRenderer;
  try {
    const context = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!context) return null;
    renderer = new THREE.WebGLRenderer({ canvas, context });
  } catch {
    return null;
  }

  const scene = new THREE.Scene();
  const gl = renderer.getContext();
  let parallelCompile: KHR_parallel_shader_compile | null = null;
  scene.fog = new THREE.FogExp2(0x374e55, 0.021);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x142928);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.11, 160);
  const motion: GardenMotion = { time: { value: 0 }, progress: { value: 0 }, pixelRatio: { value: 1 } };
  const walk = { value: scroll.current };
  const pondInteraction: PondLight = {
    rippleCenter: { value: new THREE.Vector2(-10.7, -19.35) },
    rippleStart: { value: -30 },
    lanterns: { value: 0.13 },
  };
  const ambient = new THREE.HemisphereLight(0xc8dce2, 0x4a493d, 1.87);
  const moonlight = new THREE.DirectionalLight(0xcddfec, 2.45);
  moonlight.position.set(-4, 11, 8);
  const sunset = new THREE.DirectionalLight(0xf5b280, 1.63);
  sunset.position.set(2, 8, -9);
  const shojiLight = new THREE.PointLight(0xffb771, 19, 8, 2);
  shojiLight.position.set(3.65, 1.35, 2.48);
  const pathLight = new THREE.PointLight(0xffb479, 5, 11, 2);
  pathLight.position.set(-7.44, 1.72, -7.13);
  scene.add(ambient, moonlight, sunset, shojiLight, pathLight);

  const maple = makeMaple(618);
  maple.position.set(0.28, 0.18, -1.44);
  maple.scale.setScalar(0.98);
  const youngMaple = makeMaple(113);
  youngMaple.position.set(5.83, -0.44, 3.52);
  youngMaple.rotation.y = -0.63;
  const gateMaple = makeMaple(225);
  gateMaple.position.set(-10.82, 0.03, -8.2);
  gateMaple.rotation.y = 0.52;
  gateMaple.scale.setScalar(0.92);
  const pondMaple = makeMaple(492);
  pondMaple.position.set(-7.62, 0.05, -19.89);
  pondMaple.rotation.y = 0.79;
  pondMaple.scale.setScalar(0.87);
  const teaHouse = makeHouse();
  const mediumSign = makeMediumSign(mediumLink);
  const lanternPath = makeLanternPath();
  const pondLife = makePondLife(pondInteraction);
  pondLife.pond.visible = false;
  const cascade = makeCascade(motion);
  const pool = makePool(motion, pondInteraction);
  pool.material.transparent = false;
  const foliage = makeDriftingLeaves();
  const sakura = makeSakura();

  scene.add(makeSky(walk), makeRidges(), pool, makeTerrain(), makePines(),
    teaHouse.house, mediumSign.model, maple, youngMaple, gateMaple, pondMaple, lanternPath.path, foliage.leaves,
    sakura.garden, cascade, pondLife.pond);
  container.append(canvas);
  canvas.style.cursor = 'grab';

  let frame = 0;
  let shaders: 'new' | 'compiling' | 'ready' = 'new';
  let lastFrame = 0;
  let nextFrame = 0;
  let lastInterval = 0;
  let quality = 1;
  let sampleMs = 0;
  let sampleFrames = 0;
  let healthyWindows = 0;
  let inView = false;
  let contextLost = false;
  let disposed = false;
  let reading = false;
  const paper = container.closest('.garden-walk')?.querySelector('.journal-inner');
  let paperObserver: IntersectionObserver | undefined;
  let portrait = 0;
  let tablet = 0;
  let waterfallSurge = 0;
  let mapleBurst = 0;
  let lastScroll = scroll.current;
  let lights = { ...initialLights };
  const screen = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const pointerGoal = new THREE.Vector2();
  const orbit = new THREE.Vector2();
  const orbitGoal = new THREE.Vector2();
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const hit = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const pondPlane = new THREE.Plane(axisY, -poolHeight);
  let drag: { id: number; x: number; y: number; yaw: number; pitch: number; moved: boolean } | undefined;
  let width = 1;
  let height = 1;
  let controlsVisible = false;

  function resizeBuffer() {
    const maxRatio = Math.min(window.devicePixelRatio || 1, width < 700 ? 1.2 : 1.42, Math.sqrt(2_250_000 / (width * height)));
    motion.pixelRatio.value = maxRatio * quality;
    renderer.setDrawingBufferSize(width, height, motion.pixelRatio.value);
  }

  function resize() {
    const previousHeight = height;
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    camera.aspect = width / height;
    portrait = 1 - smoothstep(camera.aspect, 0.5, 1.45);
    tablet = 1 - smoothstep(Math.abs(camera.aspect - 1.32), 0, 0.49);
    camera.fov = 39 + portrait * 9.5 + tablet * 4.5;
    camera.updateProjectionMatrix();
    resizeBuffer();
    if (paper && (!paperObserver || previousHeight !== height)) {
      paperObserver?.disconnect();
      paperObserver = new IntersectionObserver(([entry]) => {
        reading = entry.isIntersecting;
      }, { rootMargin: `-${Math.floor(height * 0.43)}px 0px` });
      paperObserver.observe(paper);
    }
  }

  function showReady(ready: boolean) {
    if (controlsVisible === ready) return;
    controlsVisible = ready;
    if (ready) {
      container.dataset.scene = 'webgl';
      onLights(lights);
    }
    else {
      delete container.dataset.scene;
      delete mediumLink.dataset.projected;
      mediumLink.style.removeProperty('inset');
      for (const button of buttons.values()) button.hidden = true;
    }
    onReady(ready);
  }

  function ripple(x = -10.7, z = -19.35) {
    pondInteraction.rippleCenter.value.set(x, z);
    pondInteraction.rippleStart.value = motion.time.value;
  }

  function activate(action: GardenAction, cherryIndex?: number) {
    if (action === 'falls') {
      waterfallSurge = 1;
      ripple(7.11, 4.81);
    }
    if (action === 'maple') mapleBurst = 1;
    if (action === 'sakura') sakura.scatter(walk.value, motion.time.value, cherryIndex);
    if (action === 'pond') ripple();
    if (action === 'house' || action === 'gate') {
      lights = { ...lights, [action]: !lights[action] };
      onLights(lights);
    }
  }

  function refreshLandmarks() {
    for (const [id, button] of buttons) {
      const landmark = landmarks.find((item) => item.id === id && walk.value >= item.from && walk.value < item.to);
      if (!landmark) {
        if (!button.hidden) button.hidden = true;
        continue;
      }
      projected.copy(landmark.anchor).project(camera);
      const px = (projected.x + 1) * width * 0.5;
      const py = (1 - projected.y) * height * 0.5;
      const framed = px >= 30 && px <= width - 30 && py >= 89 && py <= height - 32 && projected.z > -1 && projected.z < 1;
      if (button.hidden === framed) button.hidden = !framed;
      if (framed) {
        const translate = `${Math.round(px)}px ${Math.round(py)}px`;
        if (button.style.translate !== translate) button.style.translate = translate;
      }
    }
  }

  function sampleFrame(gap: number) {
    sampleMs += Math.min(gap, 150);
    sampleFrames++;
    if (sampleMs < 1_100) return;
    const average = sampleMs / sampleFrames;
    const previous = quality;
    healthyWindows = average < 18.5 ? healthyWindows + 1 : 0;
    if (average > 23) quality = Math.max(0.62, quality - 0.14);
    else if (healthyWindows >= 5) {
      quality = Math.min(1, quality + 0.07);
      healthyWindows = 0;
    }
    sampleMs = 0;
    sampleFrames = 0;
    if (quality !== previous) resizeBuffer();
  }

  function draw(now: number) {
    // Keep native scrolling and the poster active while the GPU links the entire walk.
    // Poll inside this cancellable loop so a hidden tab or lost context can suspend startup.
    if (shaders === 'new') {
      parallelCompile = gl.getExtension('KHR_parallel_shader_compile');
      renderer.compile(scene, camera);
      for (const texture of pondLife.skins) renderer.initTexture(texture);
      shaders = 'compiling';
    }
    if (shaders === 'compiling') {
      const status = parallelCompile?.COMPLETION_STATUS_KHR;
      if (status && renderer.info.programs?.some(({ program }) => !gl.getProgramParameter(program as WebGLProgram, status))) {
        frame = requestAnimationFrame(draw);
        return;
      }
      shaders = 'ready';
      walk.value = scroll.current;
    }
    const settled = scroll.current === lastScroll && Math.abs(scroll.current - walk.value) < 0.025;
    const interval = reading && settled && !drag ? 1_000 / 15 : 1_000 / 60;
    const cadenceChanged = interval !== lastInterval;
    if (cadenceChanged) {
      nextFrame = now;
      lastInterval = interval;
      sampleMs = 0;
      sampleFrames = 0;
      healthyWindows = 0;
    }
    if (now + 0.8 < nextFrame) {
      frame = requestAnimationFrame(draw);
      return;
    }
    nextFrame = (now - nextFrame < interval ? nextFrame : now) + interval;
    const gap = lastFrame ? now - lastFrame : 0;
    if (gap && !cadenceChanged && interval === 1_000 / 60) sampleFrame(gap);
    const elapsed = gap ? Math.min(150, gap) : 1_000 / 60;
    lastFrame = now;
    motion.time.value += elapsed / 1_000;
    const time = motion.time.value;
    const dt = elapsed / 1_000;
    const smoothing = 1 - Math.exp(-elapsed / 96);
    if (!drag && Math.abs(scroll.current - lastScroll) > 0.006) orbitGoal.multiplyScalar(0.86);
    lastScroll = scroll.current;
    pointer.lerp(pointerGoal, smoothing);
    orbit.lerp(orbitGoal, smoothing);
    walk.value = damp(walk.value, scroll.current, 12, dt);

    const phase = walk.value;
    mediumSign.model.visible = phase < 1.58 && !mediumLink.hidden;
    if (mediumSign.model.visible) mediumSign.panel.rotation.x = 0.025 * Math.sin(time * 1.18);
    waterfallSurge = damp(waterfallSurge, 0, 0.56, dt);
    mapleBurst = damp(mapleBurst, 0, 0.77, dt);
    const water = smoothstep(phase, 0.06, 0.74);
    motion.progress.value = damp(motion.progress.value, Math.max(water, 0.72 * waterfallSurge), 7, dt);

    gardenPose(phase, eye, target);
    const arrival = 1 - smoothstep(phase, 0.42, 1.12);
    const center = (portrait * 4.64 + tablet * 0.64) * arrival;
    eye.x += center;
    target.x += center;
    target.y -= portrait * arrival * 0.61;
    const pondView = smoothstep(phase, 3.15, 3.96);
    target.x += portrait * pondView * 0.53;
    eye.y += portrait * pondView * 0.46;
    eye.y += Math.sin(time * 0.62) * 0.046;
    camera.position.copy(eye).sub(target).applyAxisAngle(axisY, orbit.x).add(target);
    camera.position.y += orbit.y * 1.57;
    camera.position.x += pointer.x * 0.30;
    target.y += pointer.y * -0.15;
    camera.lookAt(target);

    const night = smoothstep(phase, 2.6, 4.45);
    ambient.intensity = 1.87 - 0.56 * night;
    sunset.intensity = 1.63 - 0.87 * night;
    teaHouse.paper.emissiveIntensity = damp(teaHouse.paper.emissiveIntensity, lights.house ? 1.05 : 0.02, 6, dt);
    teaHouse.paper.color.setHSL(0.103, 0.45, lights.house ? 0.60 : 0.10);
    teaHouse.lantern.emissiveIntensity = damp(teaHouse.lantern.emissiveIntensity, lights.house ? 2.2 : 0.09, 6, dt);
    shojiLight.intensity = damp(shojiLight.intensity, lights.house ? 19 : 0, 5, dt);
    lanternPath.glow.emissiveIntensity = damp(lanternPath.glow.emissiveIntensity, lights.gate ? 2.65 : 0.38, 6, dt);
    pathLight.intensity = damp(pathLight.intensity, lights.gate ? 22 : 4, 5, dt);
    pondInteraction.lanterns.value = damp(pondInteraction.lanterns.value, lights.gate ? 1 : 0.13, 6, dt);

    maple.rotation.z = Math.sin(time * 0.88) * 0.013 + Math.sin(time * 9.1) * mapleBurst * 0.077;
    gateMaple.rotation.z = Math.sin(time * 0.73) * 0.021;
    pondMaple.rotation.z = Math.sin(time * 0.79 + 2.4) * 0.020;
    const growth = smoothstep(phase, 0.49, 0.99);
    youngMaple.visible = growth > 0.015;
    youngMaple.scale.setScalar(0.96 * growth);
    youngMaple.rotation.z = Math.sin(time * 0.96 + 1.7) * 0.022;

    foliage.drift(time, mapleBurst);
    sakura.drift(time);
    cascade.visible = phase < 1.75;
    // Only the moon pond needs a transparent surface over fish and gravel.
    const nearPond = phase > 1.45;
    pool.material.transparent = nearPond;
    pondLife.pond.visible = nearPond;
    if (nearPond) pondLife.swim(time, dt);
    renderer.render(scene, camera);
    showReady(true);
    refreshLandmarks();
    mediumSign.positionLink(camera, width, height);
    frame = requestAnimationFrame(draw);
  }

  function syncLoop() {
    if (inView && !document.hidden && !contextLost && !disposed) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrame = 0;
      lastInterval = 0;
    }
  }

  function onPointer(event: PointerEvent) {
    if (event.pointerType !== 'touch' && !(event.target instanceof Element && event.target.closest('.garden-hotspot'))) {
      pointerGoal.set(event.clientX / width - 0.5, event.clientY / height - 0.5);
    }
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 6) return;
    drag.moved = true;
    orbitGoal.set(clamp(drag.yaw - dx * 0.0033, -0.52, 0.52), clamp(drag.pitch + dy * 0.0035, -0.48, 0.48));
    canvas.style.cursor = 'grabbing';
  }

  function startDrag(event: PointerEvent) {
    if (event.button !== 0 || drag) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw: orbitGoal.x, pitch: orbitGoal.y, moved: false };
    canvas.setPointerCapture(event.pointerId);
  }

  function pick(event: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    screen.set(((event.clientX - box.left) / box.width) * 2 - 1, 1 - ((event.clientY - box.top) / box.height) * 2);
    ray.setFromCamera(screen, camera);
    let selected: (typeof landmarks)[number] | undefined;
    let closest = Infinity;
    for (const landmark of landmarks) {
      const { id, bounds, from, to } = landmark;
      if (id === 'pond' || walk.value < from || walk.value >= to || !ray.ray.intersectBox(bounds, hit)) continue;
      const distance = ray.ray.origin.distanceToSquared(hit);
      if (distance >= closest) continue;
      closest = distance;
      selected = landmark;
    }
    if (selected) activate(selected.id, selected.cherryIndex);
    else if (walk.value >= 3.65 && ray.ray.intersectPlane(pondPlane, hit) &&
      hit.x > -16.6 && hit.x < -7.0 && hit.z > -27.0 && hit.z < -12.5) ripple(hit.x, hit.z);
  }

  function stopDrag(event: PointerEvent) {
    if (drag?.id !== event.pointerId) return;
    const moved = drag.moved;
    drag = undefined;
    canvas.style.cursor = 'grab';
    if (!moved && event.type === 'pointerup') pick(event);
  }

  const resetPointer = () => pointerGoal.set(0, 0);
  const onLoss = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    showReady(false);
    syncLoop();
  };
  const onRestore = () => {
    contextLost = false;
    shaders = 'new';
    resize();
    syncLoop();
  };
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    syncLoop();
  });
  const sizes = new ResizeObserver(resize);
  resize();
  observer.observe(container);
  sizes.observe(container);
  window.addEventListener('pointermove', onPointer, { passive: true });
  document.documentElement.addEventListener('pointerleave', resetPointer);
  canvas.addEventListener('pointerdown', startDrag);
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);
  canvas.addEventListener('lostpointercapture', stopDrag);
  document.addEventListener('visibilitychange', syncLoop);
  canvas.addEventListener('webglcontextlost', onLoss);
  canvas.addEventListener('webglcontextrestored', onRestore);

  return {
    activate,
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      paperObserver?.disconnect();
      sizes.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      canvas.removeEventListener('pointerdown', startDrag);
      canvas.removeEventListener('pointerup', stopDrag);
      canvas.removeEventListener('pointercancel', stopDrag);
      canvas.removeEventListener('lostpointercapture', stopDrag);
      document.removeEventListener('visibilitychange', syncLoop);
      canvas.removeEventListener('webglcontextlost', onLoss);
      canvas.removeEventListener('webglcontextrestored', onRestore);
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      showReady(false);
    },
  };
}

