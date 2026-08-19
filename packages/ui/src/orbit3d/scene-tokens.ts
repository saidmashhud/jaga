import { rawColors, type SemanticStatus } from '@cortex/tokens';

/**
 * WebGL cannot read CSS custom properties, so the 3D scene consumes the raw
 * hex values from @cortex/tokens. This module is the single bridge between the
 * token package and three.js material colors — never hardcode colors in meshes.
 */

export interface StatusMaterial {
  /** Base colour of the sphere. */
  color: string;
  /** Emissive tint — what bloom picks up. */
  emissive: string;
  /** Emissive strength; paused projects barely glow. */
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
}

/**
 * Emissive stays low on purpose: bloom multiplies it, and a blown-out sphere
 * reads as «white», which would destroy the status-by-colour contract (§6.3).
 * The urgency ladder lives in the *relative* values — risk/decision glow, a
 * paused project is matte and almost dark.
 */
export const statusMaterial: Record<SemanticStatus, StatusMaterial> = {
  stable: {
    color: rawColors.stateStable,
    emissive: rawColors.stateStable,
    emissiveIntensity: 0.32,
    roughness: 0.34,
    metalness: 0.15,
  },
  working: {
    color: rawColors.stateWorking,
    emissive: rawColors.stateWorking,
    emissiveIntensity: 0.4,
    roughness: 0.28,
    metalness: 0.2,
  },
  attention: {
    color: rawColors.stateAttention,
    emissive: rawColors.stateAttention,
    emissiveIntensity: 0.58,
    roughness: 0.34,
    metalness: 0.1,
  },
  risk: {
    color: rawColors.stateRisk,
    emissive: rawColors.stateRisk,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.12,
  },
  paused: {
    color: rawColors.statePaused,
    emissive: '#0b0b0d',
    emissiveIntensity: 0.05,
    roughness: 0.82,
    metalness: 0.05,
  },
  decision: {
    color: rawColors.stateDecision,
    emissive: rawColors.stateDecision,
    emissiveIntensity: 0.95,
    roughness: 0.2,
    metalness: 0.3,
  },
};

export const sceneColors = {
  background: rawColors.bgCanvas,
  core: rawColors.accentViolet,
  // Ядро — это «Вы / Сейчас», а не данные, и светит оно лампой прибора.
  // Прежний сиреневый пережил смену палитры и остался самым крупным
  // фиолетовым пятном на экране, где фиолетового больше нет.
  coreEmissive: '#f0b45c',
  textPrimary: rawColors.textPrimary,
  textSecondary: rawColors.textSecondary,
} as const;

/** Connection line colour per relation type (mirrors the SVG scene). */
export const connectionColor3d: Record<string, string> = {
  team: '#c9a227',
  finance: rawColors.stateStable,
  dependency: rawColors.stateAttention,
  client: rawColors.stateDecision,
  resource: rawColors.stateWorking,
  knowledge: rawColors.accentViolet,
};

/** Node radius by ProjectNode size step. */
export const nodeRadius: Record<'sm' | 'md' | 'lg', number> = {
  sm: 0.62,
  md: 0.78,
  lg: 0.95,
};

/**
 * The scene space is 1200×800 with the core at (600, 400, 0); `z` is authored
 * around 0 and needs no centring. The same numbers feed the SVG fallback (which
 * reads x/y only) and this scene, so one mock drives both renderers.
 */
export const SCENE_WIDTH = 1200;
export const SCENE_HEIGHT = 800;
const WORLD_SCALE = 0.0165;

export function toWorld(position: {
  x: number;
  y: number;
  z?: number;
}): [number, number, number] {
  return [
    (position.x - SCENE_WIDTH / 2) * WORLD_SCALE,
    -(position.y - SCENE_HEIGHT / 2) * WORLD_SCALE,
    (position.z ?? 0) * WORLD_SCALE,
  ];
}
