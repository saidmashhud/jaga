import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface OrbitRing3DProps {
  radius: number;
  /** Vertical squash — matches the elliptical rings of the SVG scene. */
  squash?: number;
  color?: string;
  opacity?: number;
  /** Slow rotation; disabled under reduced motion. */
  spin?: number;
  reducedMotion?: boolean;
}

/** Faint background orbit line. Decorative — never intercepts pointer events. */
export function OrbitRing3D({
  radius,
  squash = 0.82,
  color = '#879ac2',
  opacity = 0.12,
  spin = 0.02,
  reducedMotion = false,
}: OrbitRing3DProps) {
  const ref = useRef<THREE.Line>(null);

  const points = useRef(
    new THREE.EllipseCurve(0, 0, radius, radius * squash, 0, Math.PI * 2, false, 0)
      .getPoints(128)
      .map((p) => new THREE.Vector3(p.x, p.y, 0)),
  ).current;

  useFrame((state) => {
    if (reducedMotion || !ref.current) return;
    ref.current.rotation.z = state.clock.elapsedTime * spin;
  });

  return (
    // @ts-expect-error — three's Line element name collides with SVG's in JSX
    <line ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
      />
    </line>
  );
}
