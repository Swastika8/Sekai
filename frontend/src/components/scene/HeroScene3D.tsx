import { useEffect, useRef, type RefObject } from 'react';
import { Droplets, Flame, Flower2, Leaf, Waves } from 'lucide-react';
import { mountGarden } from './gardenScene';
import { gardenActions, type GardenAction, type GardenController, type GardenLights } from './journey';

const icons = { falls: Droplets, house: Flame, maple: Leaf, sakura: Flower2, gate: Flame, pond: Waves };

interface SceneProps {
  progress: { current: number };
  controlsRef: RefObject<GardenController | null>;
  mediumLink: RefObject<HTMLAnchorElement | null>;
  onReady: (ready: boolean) => void;
  onLights: (lights: GardenLights) => void;
}

export default function HeroScene3D({ progress, controlsRef, mediumLink, onReady, onLights }: SceneProps) {
  const container = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<GardenAction, HTMLButtonElement>());

  useEffect(() => {
    if (!container.current || !mediumLink.current) return;
    const garden = mountGarden(container.current, progress, buttons.current, mediumLink.current, onReady, onLights);
    if (!garden) onReady(false);
    controlsRef.current = garden;
    return () => {
      controlsRef.current = null;
      garden?.dispose();
    };
  }, [progress, controlsRef, mediumLink, onReady, onLights]);

  return (
    <div className="garden-live">
      <div className="garden-canvas" ref={container} aria-hidden="true" />
      <div className="garden-hotspots">
        {(Object.keys(gardenActions) as GardenAction[]).map((action) => {
          const Icon = icons[action];
          return (
            <button key={action} type="button" className="garden-hotspot" aria-label={gardenActions[action]}
              data-object={action} hidden
              ref={(node) => { if (node) buttons.current.set(action, node); else buttons.current.delete(action); }}
              onClick={() => controlsRef.current?.activate(action)}>
              <Icon size={19} strokeWidth={1.6} aria-hidden="true" />
              <span aria-hidden="true">{gardenActions[action]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

