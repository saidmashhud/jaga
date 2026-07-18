import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export interface OrbitRing3DProps {
  radius: number;
  /** Ring tilt in radians [x, y, z] — a real orbit, not a flat ellipse. */
  tilt?: [number, number, number];
  color?: string;
  opacity?: number;
  /** Slow rotation around the ring's own axis; disabled under reduced motion. */
  spin?: number;
  reducedMotion?: boolean;
}

/**
 * Background orbit as a true circle in 3D. Perspective — not a hand-authored
 * squash — is what turns it into an ellipse on screen, so the rings stay
 * believable while the camera moves around them.
 */
export function OrbitRing3D({
  radius,
  tilt = [Math.PI / 2, 0, 0],
  color = '#879ac2',
  opacity = 0.12,
  spin = 0.02,
  reducedMotion = false,
}: OrbitRing3DProps) {
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
    const points = curve.getPoints(160).map((p) => new THREE.Vector3(p.x, p.y, 0));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [radius]);

  useFrame((state) => {
    if (reducedMotion || !group.current) return;
    group.current.rotation.z = state.clock.elapsedTime * spin;
  });

  return (
    <group rotation={tilt}>
      <group ref={group}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <lineLoop geometry={geometry} raycast={() => null}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={opacity}
            toneMapped={false}
            depthWrite={false}
          />
        </lineLoop>
      </group>
    </group>
  );
}
