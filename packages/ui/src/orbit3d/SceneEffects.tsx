import { useEffect, useState } from 'react';
import type { Camera, Scene } from 'three';
import type { EffectQuality } from './quality';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  Pass,
  RenderPass,
  ToneMappingEffect,
} from 'postprocessing';

/**
 * realism-effects ships no type declarations and resolves to CJS. Typed here
 * rather than via an ambient `declare module`, because consumers compile this
 * package from source and would not see a global declaration from our program.
 */
interface RealismEffectsModule {
  SSGIEffect: new (
    composer: EffectComposer,
    scene: Scene,
    camera: Camera,
    options?: Record<string, unknown>,
  ) => Effect;
  VelocityDepthNormalPass: new (scene: Scene, camera: Camera) => Pass;
}

export type { EffectQuality };

export interface SceneEffectsProps {
  /**
   * `ssgi` — screen-space global illumination + bloom (discrete GPU);
   * `bloom` — bloom only (integrated GPU, the safe default);
   * `off` — no post-processing (reduced motion / weak hardware).
   */
  quality?: EffectQuality;
}

/**
 * Post-processing stack. SSGI is genuinely expensive — §16 requires the page to
 * stay interactive on a laptop without a discrete GPU, so the caller tiers this
 * and `bloom` is what most machines get.
 */
export function SceneEffects({ quality = 'bloom' }: SceneEffectsProps) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const [composer] = useState(() => new EffectComposer(gl, { multisampling: 0 }));

  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);

  useEffect(() => {
    if (quality === 'off') return;
    let disposed = false;

    const addBaseAndBloom = () => {
      composer.addPass(
        new EffectPass(
          camera,
          new BloomEffect({
            mipmapBlur: true,
            // high threshold: only genuinely hot pixels bloom, so a node keeps
            // its status colour instead of turning into a white blob
            luminanceThreshold: 0.5,
            intensity: quality === 'ssgi' ? 0.5 : 0.62,
            levels: 6,
          }),
        ),
      );
      composer.addPass(new EffectPass(camera, new FXAAEffect(), new ToneMappingEffect()));
    };

    composer.addPass(new RenderPass(scene, camera));

    if (quality === 'ssgi') {
      // realism-effects is ESM-only and heavy; load it only when SSGI is asked
      // for. Every step after the await re-checks `disposed`: without that, a
      // late-resolving setup appends its passes on top of the next quality's
      // stack and the composer renders garbage.
      void (async () => {
        const { SSGIEffect, VelocityDepthNormalPass } = (await import(
          // @ts-expect-error — untyped module, shape declared above
          'realism-effects'
        )) as RealismEffectsModule;
        if (disposed) return;
        const velocityDepthNormalPass = new VelocityDepthNormalPass(scene, camera);
        composer.addPass(velocityDepthNormalPass);
        composer.addPass(
          new EffectPass(
            camera,
            new SSGIEffect(composer, scene, camera, {
              distance: 5.98,
              thickness: 2.83,
              denoiseIterations: 1,
              denoiseKernel: 3,
              radius: 11,
              steps: 20,
              refineSteps: 4,
              spp: 1,
              resolutionScale: 1,
              missedRays: false,
              velocityDepthNormalPass,
            }),
          ),
        );
        if (disposed) return;
        addBaseAndBloom();
      })();
    } else {
      addBaseAndBloom();
    }

    return () => {
      disposed = true;
      composer.removeAllPasses();
    };
  }, [composer, camera, scene, quality]);

  useFrame((_, delta) => {
    if (quality === 'off') return;
    gl.autoClear = true;
    composer.render(delta);
  }, 1);

  return null;
}
