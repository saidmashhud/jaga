import { Suspense, lazy } from 'react';
// deep import on purpose: '@cortex/ui/orbit3d' re-exports the scene, which
// would pull three.js into the entry chunk and defeat the lazy load below
import { useSceneCapabilities } from '@cortex/ui/orbit3d/capabilities';
import { OrbitScene } from './OrbitScene';
import styles from './OrbitWorkspace.module.css';

// three + drei + rapier are ~1MB gzipped — never in the initial bundle
const OrbitScene3DView = lazy(() =>
  import('./OrbitScene3DView').then((m) => ({ default: m.OrbitScene3DView })),
);

/**
 * Chooses the renderer for the workspace. Exactly one scene is mounted at a
 * time — two would put two controls with the same accessible name in the tree.
 *
 * The R3F scene is the product scene. The SVG scene remains the renderer for
 * machines without WebGL and for `prefers-reduced-motion`, where a physics sim
 * and a breathing core are exactly what §15 asks us to turn off.
 */
export function OrbitWorkspace() {
  const { webgl, reducedMotion, quality, dpr } = useSceneCapabilities();

  if (!webgl || reducedMotion) return <OrbitScene />;

  return (
    <Suspense
      fallback={
        <div className={styles.loading} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <span>Сборка сцены…</span>
        </div>
      }
    >
      <OrbitScene3DView quality={quality} dpr={dpr} reducedMotion={reducedMotion} />
    </Suspense>
  );
}
