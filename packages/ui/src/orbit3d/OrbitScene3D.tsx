import { useRef, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { NodePositionsProvider, useCreateNodePositionStore } from './node-positions';
import { SceneEffects, type EffectQuality } from './SceneEffects';
import { sceneColors } from './scene-tokens';

export interface OrbitScene3DProps {
  /** Post-processing tier; see useSceneCapabilities for the default policy. */
  quality?: EffectQuality;
  dpr?: [number, number];
  reducedMotion?: boolean;
  /** Fired on Escape or a click on empty space. */
  onClearSelection?: () => void;
  /**
   * Fired once the physics world is live and the scene has actually drawn.
   * The rapier WASM bundle suspends <Physics>, and a suspended Canvas paints
   * nothing — the caller uses this to hold a placeholder instead of black.
   */
  onReady?: () => void;
  /** Scene contents: spheres, connections, core, portals. */
  children?: ReactNode;
  className?: string;
}

/** Fires once real frames are being drawn (rendered inside <Physics>). */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    // a couple of frames for the environment cubemap to resolve
    if (frames.current === 3) onReady?.();
  });
  return null;
}

/**
 * Main WebGL workspace. Replaces the SVG scene: rapier drives node motion,
 * an HDRI-less Lightformer environment provides the neon rim light, and the
 * post stack (bloom / optional SSGI) turns emissive nodes into real light.
 *
 * Node labels are DOM (drei <Html>) so the scene keeps keyboard access.
 */
export function OrbitScene3D({
  quality = 'bloom',
  dpr = [1, 1.5],
  reducedMotion = false,
  onClearSelection,
  onReady,
  children,
  className,
}: OrbitScene3DProps) {
  const store = useCreateNodePositionStore();

  return (
    <Canvas
      className={className}
      flat
      shadows
      dpr={dpr}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, 22], fov: 34, near: 1, far: 60 }}
      onPointerMissed={() => onClearSelection?.()}
      // scene is decorative; every node is mirrored by a real DOM control
      aria-hidden="true"
    >
      <color attach="background" args={[sceneColors.background]} />
      <fog attach="fog" args={[sceneColors.background, 26, 46]} />

      <NodePositionsProvider value={store}>
        {/*
          No cursor-repeller body here, unlike the pmndrs ballpit demos: a
          collider under the pointer physically shoves a node out from under
          the click, and here nodes are the primary control, not decoration.
          Life comes from the anchor springs and node-to-node collisions.

          NOTE: <Physics> suspends on the rapier WASM and only resolves when the
          boundary that catches it sits OUTSIDE this Canvas (see OrbitWorkspace).
          A <Suspense> placed here instead leaves physics suspended forever.
        */}
        <Physics timeStep="vary" gravity={[0, 0, 0]} paused={reducedMotion}>
          <ReadySignal onReady={onReady} />
          {children}
        </Physics>
      </NodePositionsProvider>

      {/*
        Deliberately dim: nodes must read as their status colour, not as light
        sources. The rings give a violet/cyan rim that matches the brand
        accents without washing the spheres out.
      */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer
            form="circle"
            intensity={48}
            rotation-x={Math.PI / 2}
            position={[0, 5, -9]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={4}
            rotation-y={Math.PI / 2}
            position={[-5, 1, -1]}
            scale={2}
          />
          <Lightformer
            form="circle"
            intensity={4}
            rotation-y={-Math.PI / 2}
            position={[10, 1, 0]}
            scale={8}
          />
          <Lightformer
            form="ring"
            color="#7657ff"
            intensity={42}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[10, 10, 0]}
            scale={10}
          />
          <Lightformer
            form="ring"
            color="#37d9ff"
            intensity={24}
            onUpdate={(self) => self.lookAt(0, 0, 0)}
            position={[-10, -8, 2]}
            scale={8}
          />
        </group>
      </Environment>

      <ambientLight intensity={0.55} />
      <SceneEffects quality={quality} />
    </Canvas>
  );
}
