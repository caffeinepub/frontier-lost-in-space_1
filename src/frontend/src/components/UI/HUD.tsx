import { useEffect } from "react";
import { useShipStore } from "../../stores/shipStore";
import { useStoryStore } from "../../stores/storyStore";
import { useEnemyStore } from "../../stores/useEnemyStore";
import { handleFireButton } from "../../systems/combat";
import { getSpeed } from "../../utils/physics";
import { CockpitView } from "../game/CockpitView";
import { FPSCounter } from "../ui/FPSCounter";
import { MechLogPanel } from "./MechLogPanel";
import MiningAlert from "./MiningAlert";
import NotificationSystem from "./NotificationSystem";
import RadarMinimap from "./RadarMinimap";
import StatusPanel from "./StatusPanel";
import { WaveIndicator } from "./WaveIndicator";
import WeaponPanel from "./WeaponPanel";

function VelPanel() {
  const { velocity, hull, maxHull, fuel, oxygen } = useShipStore();
  const speed = Math.round(getSpeed(velocity) * 20);
  const hullPct = Math.round((hull / maxHull) * 100);

  const statColor = (pct: number) =>
    pct > 60 ? "text-green-400" : pct > 30 ? "text-amber-400" : "text-red-400";

  return (
    <div className="absolute bottom-20 left-4 font-mono text-xs pointer-events-none select-none">
      <div
        className="rounded px-3 py-2 space-y-1.5 w-36"
        style={{
          background: "rgba(0,0,0,0.78)",
          border: "1.5px solid rgba(0,200,255,0.35)",
          boxShadow: "0 0 14px rgba(0,200,255,0.10)",
        }}
      >
        <div>
          <div className="text-cyan-400/60 text-[10px] tracking-widest uppercase mb-0.5">
            VEL
          </div>
          <div className="text-white text-2xl font-bold leading-none">
            {String(speed).padStart(3, "0")}
          </div>
          <div className="text-cyan-400/50 text-[10px]">KM/S</div>
        </div>
        <div className="border-t border-cyan-500/20" />
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-400">HULL</span>
            <span className={statColor(hullPct)}>{hullPct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">FUEL</span>
            <span className={statColor(fuel)}>{Math.round(fuel)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">O₂</span>
            <span className={statColor(oxygen)}>{Math.round(oxygen)}%</span>
          </div>
        </div>
        <div className="border-t border-cyan-500/20 pt-1">
          <div className="text-gray-500 text-[10px]">HDG 180°000000</div>
        </div>
      </div>
    </div>
  );
}

function ScanCmdButtons() {
  const { triggerEvent } = useStoryStore();

  return (
    <div className="absolute top-8 right-52 flex gap-2 pointer-events-auto">
      <button
        type="button"
        onClick={() => triggerEvent("p1_scan_results")}
        className="bg-black/70 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded transition-all"
        data-ocid="hud.scan_button"
      >
        SCAN
      </button>
      <button
        type="button"
        onClick={() => triggerEvent("p1_systems_damaged")}
        className="bg-black/70 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded transition-all"
        data-ocid="hud.cmd_button"
      >
        CMD
      </button>
    </div>
  );
}

function LockedIndicator() {
  const lockedTarget = useEnemyStore((s) => s.lockedTarget);
  if (!lockedTarget) return null;
  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 font-mono text-cyan-400 text-xs tracking-[0.3em] uppercase animate-pulse pointer-events-none"
      style={{ textShadow: "0 0 8px rgba(0,255,255,0.8)" }}
    >
      LOCKED
    </div>
  );
}

/** Slim bottom action dock — sits below cockpit oval, never overlaps it */
function BottomDock() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 30 }}
    >
      <div
        className="mx-auto flex items-end justify-center gap-3 px-4 pb-2"
        style={{ maxWidth: 700 }}
      >
        {/* Weapon panel — left side of dock */}
        <div className="pointer-events-auto">
          <WeaponPanel />
        </div>

        {/* Mech log — right side of dock */}
        <div className="pointer-events-auto">
          <MechLogPanel />
        </div>
      </div>
    </div>
  );
}

interface HUDProps {
  targetId?: string | null;
  targetDistance?: number;
}

export default function HUD(_props: HUDProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F" || e.code === "Space") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
          return;
        e.preventDefault();
        handleFireButton();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Layer 1 — cockpit frame (z-10) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <CockpitView />
        <div className="scanlines absolute inset-0 pointer-events-none" />
      </div>

      {/* Layer 2 — HUD panels that sit inside/around the cockpit (z-20) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {/* Top-left: CEP/L5 */}
        <StatusPanel />

        {/* Top-center: wave */}
        <WaveIndicator />

        {/* Top-right: SCAN/CMD */}
        <ScanCmdButtons />

        {/* Bottom-left: VEL + vitals */}
        <VelPanel />

        {/* Bottom-right: E-RADAR */}
        <RadarMinimap />

        {/* LOCKED indicator just above dock */}
        <LockedIndicator />

        {/* FPS */}
        <FPSCounter />

        {/* Alerts */}
        <MiningAlert />
        <NotificationSystem />
      </div>

      {/* Layer 3 — bottom action dock + floating panels (z-30) */}
      <BottomDock />
    </>
  );
}
