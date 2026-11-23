export const chapters = [
  { id: 'waterfall', name: 'Waterfall' },
  { id: 'tea-house', name: 'Tea house' },
  { id: 'lantern-gate', name: 'Lantern gate' },
  { id: 'journal', name: 'Journal' },
  { id: 'moon-pond', name: 'Moon pond' },
] as const;

export type GardenAction = 'falls' | 'house' | 'maple' | 'gate' | 'pond';

export const gardenActions: Record<GardenAction, string> = {
  falls: 'Stir the waterfall',
  house: 'Toggle the shoji lights',
  maple: 'Shake the maple',
  gate: 'Toggle the path lanterns',
  pond: 'Send a ripple',
};

export type GardenLights = { house: boolean; gate: boolean };
export const initialLights: GardenLights = { house: true, gate: false };

export interface GardenController {
  activate(action: GardenAction): void;
  dispose(): void;
}

