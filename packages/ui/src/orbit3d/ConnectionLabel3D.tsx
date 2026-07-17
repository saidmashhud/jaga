import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { nodeVector, useNodePositionStore } from './node-positions';
import styles from './ConnectionLabel3D.module.css';

export interface ConnectionLabel3DProps {
  sourceId: string;
  targetId: string;
  /** Position along the connection, 0–1. Defaults to the midpoint. */
  t?: number;
  dimmed?: boolean;
  emphasized?: boolean;
  children: React.ReactNode;
}

const a = new THREE.Vector3();
const b = new THREE.Vector3();
const mid = new THREE.Vector3();
const dir = new THREE.Vector3();

/**
 * Caption pinned to a connection between two moving nodes. DOM (drei <Html>)
 * rather than 3D text so it stays crisp and uses the same type tokens.
 */
export function ConnectionLabel3D({
  sourceId,
  targetId,
  t = 0.5,
  dimmed = false,
  emphasized = false,
  children,
}: ConnectionLabel3DProps) {
  const group = useRef<THREE.Group>(null);
  const store = useNodePositionStore();

  useFrame(() => {
    if (!group.current) return;
    a.copy(nodeVector(store, sourceId));
    b.copy(nodeVector(store, targetId));

    // same bow as Connection3D so the caption sits on the curve, not the chord
    mid.copy(a).add(b).multiplyScalar(0.5);
    dir.copy(b).sub(a);
    mid.x += -dir.y * 0.12;
    mid.y += dir.x * 0.12;

    // quadratic bezier at t
    const mt = 1 - t;
    group.current.position.set(
      mt * mt * a.x + 2 * mt * t * mid.x + t * t * b.x,
      mt * mt * a.y + 2 * mt * t * mid.y + t * t * b.y,
      mt * mt * a.z + 2 * mt * t * mid.z + t * t * b.z,
    );
  });

  return (
    <group ref={group}>
      <Html center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span
          className={`${styles.label} ${dimmed ? styles.dimmed : ''} ${
            emphasized ? styles.emphasized : ''
          }`}
        >
          {children}
        </span>
      </Html>
    </group>
  );
}
