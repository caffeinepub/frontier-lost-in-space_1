import { useEffect } from "react";
import { useSwipeControls } from "../../hooks/useSwipeControls";
import { useCameraStore } from "../../stores/cameraStore";
import { useInventoryStore } from "../../stores/inventoryStore";
import { useMenuStore } from "../../stores/menuStore";
import { useShipStore } from "../../stores/shipStore";
import { useStoryStore } from "../../stores/storyStore";
import { useEnemyStore } from "../../stores/useEnemyStore";
import { handleFireButton } from "../../systems/combat";
import type { ResourceType } from "../../types/game";
import { RESOURCES } from "../../utils/constants";
import { CockpitView } from "../game/CockpitView";
import { FPSCounter } from "../ui/FPSCounter";
import { AimCone } from "./AimCone";
import { LaneIndicator } from "./LaneIndicator";
import { MechLogPanel } from "./MechLogPanel";
import MiningAlert from "./MiningAlert";
import NotificationSystem from "./NotificationSystem";
import RadarMinimap from "./RadarMinimap";
import StatusPanel from "./StatusPanel";
import { WaveIndicator } from "./WaveIndicator";
import WeaponPanel from "./WeaponPanel";

/** Large, obvious view mode toggle — 3 modes */
function ViewToggle() {
  const { mode, setMode } = useCameraStore();

  const cycleMode = () => {
    if (mode === "orbital") setMode("combat");
    else if (mode === "combat") setMode("freeRoam");
    else setMode("orbital");
  };

  const config = {
    orbital: {
      icon: "🌍",
      label: "ORBITAL",
      color: "#00ccff",
      border: "rgba(0,200,255,0.7)",
      shadow: "0 0 18px rgba(0,200,255,0.35)",
    },
    combat: {
      icon: "🎯",
      label: "COMBAT",
      color: "#ffaa00",
      border: "rgba(255,160,0,0.7)",
      shadow: "0 0 18px rgba(255,160,0,0.35)",
    },
    freeRoam: {
      icon: "🚀",
      label: "FREE ROAM",
      color: "#00ff88",
      border: "rgba(0,255,136,0.7)",
      shadow: "0 0 18px rgba(0,255,136,0.35)",
    },
  };

  const c = config[mode];

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 pointer-events-auto"
      style={{ zIndex: 40 }}
    >
      <button
        type="button"
        onClick={cycleMode}
        style={{
          background: "rgba(0,0,0,0.82)",
          border: `2px solid ${c.border}`,
          borderRadius: "12px",
          padding: "8px 22px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          boxShadow: c.shadow,
          backdropFilter: "blur(6px)",
          minWidth: "140px",
          cursor: "pointer",
          transition: "all 0.25s ease",
        }}
        data-ocid="hud.view_toggle"
      >
        <span style={{ fontSize: "18px", lineHeight: 1 }}>{c.icon}</span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "0.2em",
            color: c.color,
            textShadow: `0 0 8px ${c.color}cc`,
          }}
        >
          {c.label}
        </span>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.1em",
          }}
        >
          Tap to switch
        </span>
      </button>
    </div>
  );
}

/** SCAN + CMD buttons — ORBITAL only */
function ScanCmdButtons() {
  const { triggerEvent } = useStoryStore();
  const mode = useCameraStore((s) => s.mode);
  if (mode !== "orbital") return null;

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
  const mode = useCameraStore((s) => s.mode);
  if (!lockedTarget || mode !== "combat") return null;
  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 font-mono text-cyan-400 text-xs tracking-[0.3em] uppercase animate-pulse pointer-events-none"
      style={{ textShadow: "0 0 8px rgba(0,255,255,0.8)" }}
    >
      LOCKED
    </div>
  );
}

/** Compact Free Roam HUD — fuel, cargo, scanner */
function FreeRoamHUD() {
  const mode = useCameraStore((s) => s.mode);
  const fuel = useShipStore((s) => s.fuel);
  const maxFuel = useShipStore((s) => s.maxFuel);
  const maxCargo = useShipStore((s) => s.maxCargo);
  const resources = useInventoryStore((s) => s.resources);
  const totalWeight = useInventoryStore((s) => s.totalWeight);

  if (mode !== "freeRoam") return null;

  const fuelPct = Math.round((fuel / maxFuel) * 100);
  const cargoUsed = Math.round(totalWeight());

  // Find top mined resource
  let topResource: { label: string; amount: number } | null = null;
  for (const [key, amt] of Object.entries(resources)) {
    const rKey = key as ResourceType;
    const weight = (RESOURCES[rKey]?.weight ?? 1) * amt;
    if (weight > 0 && (!topResource || weight > topResource.amount)) {
      topResource = { label: RESOURCES[rKey]?.name ?? key, amount: amt };
    }
  }

  const fuelColor =
    fuelPct > 50 ? "#00ff88" : fuelPct > 25 ? "#ffaa00" : "#ff4444";
  const cargoColor =
    cargoUsed / maxCargo < 0.8
      ? "#00ccff"
      : cargoUsed / maxCargo < 0.95
        ? "#ffaa00"
        : "#ff4444";

  return (
    <div
      className="absolute top-16 right-3 pointer-events-none transition-opacity duration-200"
      style={{
        background: "rgba(0,0,0,0.72)",
        border: "1px solid rgba(0,255,136,0.35)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: "11px",
        minWidth: "170px",
        boxShadow: "0 0 12px rgba(0,255,136,0.12)",
      }}
    >
      {/* FUEL */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span
            style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}
          >
            FUEL
          </span>
          <span style={{ color: fuelColor }}>{fuelPct}%</span>
        </div>
        <div
          style={{
            height: "4px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${fuelPct}%`,
              background: fuelColor,
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* CARGO */}
      <div className="mb-2">
        <div className="flex justify-between">
          <span
            style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.15em" }}
          >
            CARGO
          </span>
          <span style={{ color: cargoColor }}>
            {cargoUsed}/{maxCargo} KG
          </span>
        </div>
      </div>

      {/* SCANNER */}
      <div
        style={{
          borderTop: "1px solid rgba(0,255,136,0.2)",
          paddingTop: "8px",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.15em",
            marginBottom: "3px",
          }}
        >
          SCANNER
        </div>
        <div
          style={{ color: topResource ? "#00ff88" : "rgba(255,255,255,0.3)" }}
        >
          {topResource
            ? `TOP: ${topResource.label} ${topResource.amount}u`
            : "CLEAR"}
        </div>
      </div>
    </div>
  );
}

// All panels in menu bar; NAV + SCAN only shown in orbital mode
const ALL_NAV_PANELS = [
  { id: "ship" as const, label: "SHIP", orbitOnly: false },
  { id: "cargo" as const, label: "CARGO", orbitOnly: false },
  { id: "nav" as const, label: "NAV", orbitOnly: true },
  { id: "scan" as const, label: "SCAN", orbitOnly: true },
  { id: "comm" as const, label: "COMM", orbitOnly: false },
];

function NavMenuBar() {
  const { activePanel, togglePanel } = useMenuStore();
  const mode = useCameraStore((s) => s.mode);
  const isOrbital = mode === "orbital";

  const visiblePanels = ALL_NAV_PANELS.filter((p) => !p.orbitOnly || isOrbital);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto"
      style={{ bottom: "72px", zIndex: 30 }}
    >
      <div
        className="flex gap-1.5 px-3 py-1.5 rounded-full"
        style={{
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(0,200,255,0.2)",
        }}
      >
        {visiblePanels.map(({ id, label }) => {
          const isActive = activePanel === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => togglePanel(id)}
              className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-full transition-all ${
                isActive
                  ? "border border-cyan-400 bg-cyan-500/20 text-cyan-300"
                  : "border border-transparent text-cyan-500/60 hover:text-cyan-400 hover:border-cyan-500/40"
              }`}
              data-ocid={`hud.${id}.tab`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Bottom dock — WeaponPanel + FIRE only visible in COMBAT mode */
function BottomDock() {
  const mode = useCameraStore((s) => s.mode);
  const isCombat = mode === "combat";

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 30 }}
    >
      <div
        className="mx-auto flex items-end justify-center gap-3 px-4 pb-2"
        style={{ maxWidth: 700 }}
      >
        {/* Weapon panel — COMBAT only */}
        {isCombat && (
          <div className="pointer-events-auto flex-1 transition-opacity duration-200">
            <WeaponPanel />
          </div>
        )}

        {/* Mech log — always visible */}
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
  useSwipeControls();

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

  const mode = useCameraStore((s) => s.mode);
  const isOrbital = mode === "orbital";
  const isCombat = mode === "combat";

  return (
    <>
      {/* View mode toggle — always on top */}
      <ViewToggle />

      {/* Layer 1 — cockpit frame (z-10) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <CockpitView />
        <div className="scanlines absolute inset-0 pointer-events-none" />
      </div>

      {/* Layer 2 — HUD panels (z-20) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        {/* Status bars — always visible */}
        <StatusPanel />

        {/* Wave indicator — always visible */}
        <WaveIndicator />

        {/* SCAN/CMD — orbital only */}
        <ScanCmdButtons />

        {/* Lane indicator — orbital only */}
        {isOrbital && <LaneIndicator />}

        {/* Aim cone — combat only */}
        {isCombat && <AimCone />}

        {/* Free Roam compact HUD */}
        <FreeRoamHUD />

        {/* Radar — always visible */}
        <RadarMinimap />

        {/* LOCKED — combat only */}
        <LockedIndicator />

        {/* FPS */}
        <FPSCounter />

        {/* Alerts */}
        <MiningAlert />
        <NotificationSystem />
      </div>

      {/* Layer 3 — nav menu + dock (z-30) */}
      <NavMenuBar />
      <BottomDock />
    </>
  );
}
