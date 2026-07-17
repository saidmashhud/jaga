/**
 * 3D Orbit scene (React Three Fiber).
 *
 * Exported from a separate entry point (`@cortex/ui/orbit3d`) on purpose:
 * three.js + drei + rapier are ~1MB, and a consumer importing `Button` from
 * `@cortex/ui` must never pay for them.
 */

export { OrbitScene3D, type OrbitScene3DProps } from './OrbitScene3D';
export { ProjectSphere, type ProjectSphereProps } from './ProjectSphere';
export { UserCore3D, type UserCore3DProps } from './UserCore3D';
export { Connection3D, type Connection3DProps } from './Connection3D';
export { ConnectionLabel3D, type ConnectionLabel3DProps } from './ConnectionLabel3D';
export { OrbitRing3D, type OrbitRing3DProps } from './OrbitRing3D';
export { PortalCard, InsightPanel3D, type PortalCardProps } from './PortalCard';
export { SceneEffects, type SceneEffectsProps, type EffectQuality } from './SceneEffects';
export {
  useSceneCapabilities,
  usePrefersReducedMotion,
  detectWebGL,
  type SceneCapabilities,
} from './capabilities';
export {
  statusMaterial,
  sceneColors,
  connectionColor3d,
  nodeRadius,
  toWorld,
  SCENE_WIDTH,
  SCENE_HEIGHT,
  type StatusMaterial,
} from './scene-tokens';
export {
  useNodePositionStore,
  nodeVector,
  type NodePositionStore,
} from './node-positions';
