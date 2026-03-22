import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function EarthGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const dayTexture = useTexture("/textures/earth_day.jpg");

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 64, 64]} />
      <meshStandardMaterial map={dayTexture} roughness={0.8} metalness={0.1} />

      {/* Inner atmosphere — tighter glow */}
      <mesh scale={1.03}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#2299ff"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere — wide soft halo */}
      <mesh scale={1.06}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#0066cc"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </mesh>
  );
}
