import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { sceneColors } from './scene-tokens';

export interface UserCore3DProps {
  /** Soft breathing pulse — on while a recommendation is unattended. */
  pulse?: boolean;
  reducedMotion?: boolean;
}

/** Central «Вы / Сейчас» core: emissive sphere that bloom turns into a sun. */
export function UserCore3D({ pulse = false, reducedMotion = false }: UserCore3DProps) {
  const mesh = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion || !pulse) return;
    const t = state.clock.elapsedTime;
    const breath = 1 + Math.sin(t * 1.6) * 0.045;
    mesh.current?.scale.setScalar(breath);
    halo.current?.scale.setScalar(1 + Math.sin(t * 1.6) * 0.09);
    const mat = mesh.current?.material as THREE.MeshStandardMaterial | undefined;
    if (mat) mat.emissiveIntensity = 1.5 + Math.sin(t * 1.6) * 0.35;
  });

  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <meshStandardMaterial
          color={sceneColors.core}
          emissive={sceneColors.coreEmissive}
          emissiveIntensity={1.5}
          roughness={0.18}
          metalness={0.35}
        />
      </mesh>
      {/* additive shell that reads as atmosphere around the core */}
      <mesh ref={halo}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color={sceneColors.coreEmissive}
          transparent
          opacity={0.09}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight
        color={sceneColors.coreEmissive}
        intensity={11}
        distance={16}
        decay={2}
      />
    </group>
  );
}
