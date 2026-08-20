import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { nodeVector, useNodePositionStore } from './node-positions';
import { useLabelRegistry } from './label-registry';
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

  // Подпись связи встаёт в ту же очередь, что и подписи узлов. Иначе выходит
  // две толпы, каждая разведена внутри себя и слепа к другой, — а налезают
  // они как раз друг на друга: подпись связи проходит ровно между узлами.
  const labelRef = useRef<HTMLSpanElement>(null);
  const registry = useLabelRegistry();
  // Своя точка, а не group.position: та появляется лишь к первому кадру, а
  // запись в очереди нужна уже при появлении подписи.
  const at = useRef(new THREE.Vector3());
  const key = `${sourceId}→${targetId}@${t}`;
  useEffect(() => {
    registry.set(key, { ref: labelRef, at: at.current, z: 0, kind: 'link' });
    return () => {
      registry.delete(key);
    };
  }, [registry, key]);

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
    at.current.set(
      mt * mt * a.x + 2 * mt * t * mid.x + t * t * b.x,
      mt * mt * a.y + 2 * mt * t * mid.y + t * t * b.y,
      mt * mt * a.z + 2 * mt * t * mid.z + t * t * b.z,
    );
    group.current.position.copy(at.current);
  });

  return (
    <group ref={group}>
      <Html center distanceFactor={11} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span
          ref={labelRef}
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
