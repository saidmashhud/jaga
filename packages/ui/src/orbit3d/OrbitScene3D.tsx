import { useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import {
  NodePositionsProvider,
  useCreateNodePositionStore,
} from "./node-positions";
import { LabelTraffic } from "./LabelTraffic";
import {
  LabelRegistryProvider,
  useCreateLabelRegistry,
} from "./label-registry";
import { FitCamera } from "./FitCamera";
import { SceneEffects, type EffectQuality } from "./SceneEffects";
import { sceneColors } from "./scene-tokens";

export interface OrbitScene3DProps {
  /** Post-processing tier; see useSceneCapabilities for the default policy. */
  quality?: EffectQuality;
  dpr?: [number, number];
  reducedMotion?: boolean;
  /**
   * Idle auto-orbit that reads as volume from the first frame. The caller
   * turns it off while a project is selected/entered so it can be inspected.
   */
  autoRotate?: boolean;
  /** Fired on Escape or a genuine click (not a drag) on empty space. */
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
 * Orbital camera with inertia. This is what makes the scene read as volume
 * rather than a decorated plane: the viewer can rotate/zoom around the depth
 * axis, and a gentle idle auto-orbit shows the parallax before any input.
 * Zoom only (no pan) so the composition can never be lost off-screen.
 */
function CameraRig({
  autoRotate = true,
  reducedMotion = false,
}: {
  autoRotate?: boolean;
  reducedMotion?: boolean;
}) {
  // Auto-orbit is an intro flourish: it shows depth on load, then hands full
  // control to the user the moment they grab the scene, so nodes don't drift
  // out from under a click.
  const [engaged, setEngaged] = useState(false);
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={11}
      maxDistance={34}
      // keep the horizon: never let the camera flip fully over the poles
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.82}
      autoRotate={autoRotate && !engaged && !reducedMotion}
      autoRotateSpeed={0.35}
      onStart={() => setEngaged(true)}
      target={[0, 0, 0]}
    />
  );
}

/**
 * Main WebGL workspace. Replaces the SVG scene: rapier drives node motion,
 * an HDRI-less Lightformer environment provides the neon rim light, and the
 * post stack (bloom / optional SSGI) turns emissive nodes into real light.
 *
 * Node labels are DOM (drei <Html>) so the scene keeps keyboard access.
 */
export function OrbitScene3D({
  quality = "bloom",
  dpr = [1, 1.5],
  reducedMotion = false,
  autoRotate = true,
  onClearSelection,
  onReady,
  children,
  className,
}: OrbitScene3DProps) {
  const store = useCreateNodePositionStore();
  const labels = useCreateLabelRegistry();
  // Where the pointer went down — used to tell a click apart from a camera drag
  // so that rotating the scene does not deselect the current project.
  const downPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <Canvas
      className={className}
      flat
      shadows
      dpr={dpr}
      gl={{ antialias: false }}
      // off-axis start so depth and parallax read from the very first frame
      camera={{ position: [8, 4.5, 19], fov: 34, near: 1, far: 60 }}
      onPointerDown={(event) => {
        downPos.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerMissed={(event) => {
        const down = downPos.current;
        // treat as a drag (camera orbit), not a click on empty space
        if (
          down &&
          Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6
        ) {
          return;
        }
        onClearSelection?.();
      }}
      // scene is decorative; every node is mirrored by a real DOM control
      aria-hidden="true"
    >
      <color attach="background" args={[sceneColors.background]} />
      <fog attach="fog" args={[sceneColors.background, 26, 46]} />

      <NodePositionsProvider value={store}>
        <LabelRegistryProvider value={labels}>
          {/*
          Двое следят за тем, чтобы сцену можно было читать: один разводит
          налезающие подписи, другой подбирает кадр под раскладку. Оба живут
          здесь, а не в вызывающем коде: узлы расставляет физика внутри
          канваса, и снаружи их расположение никому не известно.
        */}
          <LabelTraffic registry={labels} store={store} />
          <FitCamera registry={labels} store={store} />
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
        </LabelRegistryProvider>
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
            // Цвет ядра берётся из токена, а не вписан числом: вписанный пережил
            // смену палитры и остался единственным фиолетовым пятном на экране,
            // где фиолетового больше нет нигде.
            color="var(--color-accent-violet)"
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
      <CameraRig autoRotate={autoRotate} reducedMotion={reducedMotion} />
      <SceneEffects quality={quality} />
    </Canvas>
  );
}
