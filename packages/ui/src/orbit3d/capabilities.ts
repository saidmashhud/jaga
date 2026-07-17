import { useEffect, useState } from 'react';
// from ./quality, not ./SceneEffects — importing the scene here would drag
// three.js into the entry chunk and defeat the lazy load of the 3D workspace
import type { EffectQuality } from './quality';

/** True when the browser can actually give us a WebGL2 context. */
export function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ??
        canvas.getContext('webgl') ??
        (canvas.getContext('experimental-webgl') as unknown),
    );
  } catch {
    return false;
  }
}

/** Reads the GPU string via WEBGL_debug_renderer_info, when exposed. */
function detectRenderer(): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return '';
    const ext = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    return String(
      (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) ?? '',
    );
  } catch {
    return '';
  }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export interface SceneCapabilities {
  webgl: boolean;
  reducedMotion: boolean;
  quality: EffectQuality;
  /** Device pixel ratio clamp for the canvas. */
  dpr: [number, number];
}

const QUALITY_VALUES: EffectQuality[] = ['ssgi', 'bloom', 'off'];

/** `?quality=ssgi|bloom|off` forces a tier — used for QA and demo machines. */
function qualityOverride(): EffectQuality | null {
  if (typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('quality');
  return QUALITY_VALUES.includes(value as EffectQuality)
    ? (value as EffectQuality)
    : null;
}

/**
 * Picks the post-processing tier.
 *
 * Detection is resolved synchronously (lazy useState initialisers, not an
 * effect): a first render at the wrong tier would build one post-processing
 * stack and immediately tear it down, and the composer does not survive that.
 *
 * `bloom` is the default for every GPU. SSGI is opt-in via `?quality=ssgi`
 * because §16 requires the page to stay interactive on a laptop without a
 * discrete GPU — and because realism-effects' SSGI pass is built against an
 * older three API than the 0.165 we pin (it warns about copyFramebufferToTexture
 * and WebGLMultipleRenderTargets, and renders an empty frame).
 */
export function useSceneCapabilities(): SceneCapabilities {
  const reducedMotion = usePrefersReducedMotion();
  const [webgl] = useState(detectWebGL);
  const [renderer] = useState(detectRenderer);
  const [override] = useState(qualityOverride);

  const strongGpu = /nvidia|radeon|rx |geforce|apple m[1-9]/i.test(renderer);
  const auto: EffectQuality = reducedMotion ? 'off' : 'bloom';
  const quality = override ?? auto;

  return {
    webgl,
    reducedMotion,
    quality,
    dpr: strongGpu ? [1, 2] : [1, 1.5],
  };
}
