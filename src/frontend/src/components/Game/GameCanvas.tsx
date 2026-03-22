import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useState } from "react";
import { useGameStore } from "../../stores/gameStore";
import { useExplosionStore } from "../../stores/useExplosionStore";
import { useProjectileStore } from "../../stores/useProjectileStore";
import type { ProjectileData } from "../../stores/useProjectileStore";
import { useWeaponsStore } from "../../stores/useWeaponsStore";
import { EnemyLayer } from "../Combat/EnemyLayer";
import { Explosion } from "../Combat/Explosion";
import { Projectile } from "../Combat/Projectile";
import CraftingPanel from "../Crafting/CraftingPanel";
import AsteroidField from "../Environment/AsteroidField";
import DerelictShips from "../Environment/DerelictShips";
import { EarthGlobe } from "../Environment/EarthGlobe";
import SpaceStation from "../Environment/SpaceStation";
import StarField from "../Environment/StarField";
import InventoryPanel from "../Inventory/InventoryPanel";
import MiningLaser from "../Ship/MiningLaser";
import ShipController from "../Ship/ShipController";
import HUD from "../UI/HUD";

function ProjectileLayer() {
  const { projectiles, removeProjectile } = useProjectileStore();

  useFrame((_, delta) => {
    useWeaponsStore.getState().tickCooldowns(delta);
  });

  return (
    <>
      {projectiles.map((proj: ProjectileData) => (
        <Projectile
          key={proj.id}
          {...proj}
          onExpire={removeProjectile}
          onHit={removeProjectile}
        />
      ))}
    </>
  );
}

function ExplosionLayer() {
  const { explosions, removeExplosion } = useExplosionStore();

  return (
    <>
      {explosions.map((exp) => (
        <Explosion
          key={exp.id}
          position={exp.position}
          onComplete={() => removeExplosion(exp.id)}
        />
      ))}
    </>
  );
}

export default function GameCanvas() {
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetDistance, setTargetDistance] = useState(
    Number.POSITIVE_INFINITY,
  );
  const { showInventory, showCrafting, setNearestTargetDistance } =
    useGameStore();

  const handleTargetChange = useCallback(
    (id: string | null, dist: number) => {
      setTargetId(id);
      setTargetDistance(dist);
      setNearestTargetDistance(dist);
    },
    [setNearestTargetDistance],
  );

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ fov: 60, near: 0.05, far: 1000, position: [0, 0.5, 2.8] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#081626" }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[100, 100, 50]}
          intensity={3.5}
          color="#ffffff"
        />
        <pointLight
          position={[0, 0, 0]}
          intensity={1.2}
          color="#4488ff"
          distance={200}
        />
        <pointLight
          position={[0, 80, 0]}
          intensity={0.6}
          color="#ffffff"
          distance={300}
        />

        {/* Scene */}
        <StarField />

        {/* Earth Globe — centered at world origin */}
        <group position={[0, 0, 0]}>
          <EarthGlobe />
        </group>

        <AsteroidField onTargetChange={handleTargetChange} />
        <SpaceStation />
        <DerelictShips />
        <MiningLaser targetId={targetId} targetDistance={targetDistance} />

        {/* Combat */}
        <EnemyLayer />
        <ProjectileLayer />
        <ExplosionLayer />

        {/* Player */}
        <ShipController />
      </Canvas>

      <HUD targetId={targetId} targetDistance={targetDistance} />

      {showInventory && <InventoryPanel />}
      {showCrafting && <CraftingPanel />}
    </div>
  );
}
