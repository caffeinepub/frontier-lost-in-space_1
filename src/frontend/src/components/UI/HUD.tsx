import { useEffect } from "react";
import { useSwipeControls } from "../../hooks/useSwipeControls";
import { useCameraStore } from "../../stores/cameraStore";
import { useInventoryStore } from "../../stores/inventoryStore";
import { useMenuStore } from "../../stores/menuStore";
import { useShipStore } from "../../stores/shipStore";
import { useEnemyStore } from "../../stores/useEnemyStore";
import { useWeaponsStore } from "../../stores/useWeaponsStore";
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

/** SCAN + CMD buttons — ORBITAL only, no story triggers */
function ScanCmdButtons() {
  const mode = useCameraStore((s) => s.mode);
  if (mode !== "orbital") return null;

  return (
    <div className="absolute top-8 right-52 flex gap-2 pointer-events-auto">
      <button
        type="button"
        onClick={() => console.log("SCAN")}
        className="bg-black/70 border border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase px-3 py-1.5 rounded transition-all"
        data-ocid="hud.scan_button"
      >
        SCAN
      </button>
      <button
        type="button"
        onClick={() => console.log("CMD")}
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
  const enemies = useEnemyStore((s) => s.enemies);
  const mode = useCameraStore((s) => s.mode);
  if (!lockedTarget || mode !== "combat") return null;

  const enemy = enemies.find((e) => e.id === lockedTarget);
  if (!enemy) return null;

  const dist = enemy.distance ?? 80;
  const hpPct = enemy.hp / enemy.maxHp;
  const threat = hpPct > 0.7 ? "LOW" : hpPct > 0.3 ? "MED" : "HIGH";
  const threatColor =
    threat === "LOW" ? "#00ff88" : threat === "MED" ? "#ffaa00" : "#ff4444";

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none text-center"
      style={{ fontFamily: "monospace" }}
    >
      <div
        className="text-cyan-400 text-xs tracking-[0.3em] uppercase animate-pulse"
        style={{ textShadow: "0 0 8px rgba(0,255,255,0.8)" }}
      >
        LOCKED
      </div>
      <div className="text-white text-[10px] tracking-widest mt-0.5">
        DIST: {Math.round(dist)}u
      </div>
      <div
        className="text-[10px] tracking-widest mt-0.5"
        style={{ color: threatColor }}
      >
        THREAT: {threat}
      </div>
    </div>
  );
}

/** Center crosshair reticle — color changes when target in range */
function CombatReticle() {
  const mode = useCameraStore((s) => s.mode);
  const lockedTarget = useEnemyStore((s) => s.lockedTarget);
  const enemies = useEnemyStore((s) => s.enemies);
  const activeWeapon = useWeaponsStore((s) => s.activeWeapon);

  if (mode !== "combat") return null;

  const RANGES: Record<string, number> = { pulse: 60, rail: 200, missile: 120 };

  let color = "rgba(255,255,255,0.5)";
  if (lockedTarget) {
    const enemy = enemies.find((e) => e.id === lockedTarget);
    if (enemy) {
      const dist = enemy.distance ?? 80;
      const inRange = dist <= (RANGES[activeWeapon] ?? 80);
      color = inRange ? "#00ff88" : "#ff4444";
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div style={{ position: "relative", width: 40, height: 40 }}>
        {/* crosshair lines */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 1,
            background: color,
            opacity: 0.8,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            width: 1,
            background: color,
            opacity: 0.8,
          }}
        />
        {/* center dot */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: 4,
            background: color,
            borderRadius: "50%",
            transform: "translate(-50%,-50%)",
          }}
        />
        {/* corner brackets */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 8,
            height: 8,
            borderTop: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 8,
            height: 8,
            borderTop: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 8,
            height: 8,
            borderBottom: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 8,
            height: 8,
            borderBottom: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
          }}
        />
      </div>
    </div>
  );
}

/** Lead indicator — small marker offset from center showing estimated intercept */
function LeadIndicator() {
  const mode = useCameraStore((s) => s.mode);
  const lockedTarget = useEnemyStore((s) => s.lockedTarget);
  if (mode !== "combat" || !lockedTarget) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: -25,
            left: 15,
            width: 8,
            height: 8,
            border: "1px solid rgba(255,200,0,0.7)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </div>
  );
}

/** Missile lock charge bar */
function MissileLockBar() {
  const mode = useCameraStore((s) => s.mode);
  const activeWeapon = useWeaponsStore((s) => s.activeWeapon);
  const missileLocking = useWeaponsStore((s) => s.missileLocking);
  const missileLockTimer = useWeaponsStore((s) => s.missileLockTimer);

  if (mode !== "combat" || activeWeapon !== "missile" || !missileLocking)
    return null;

  const pct = Math.min((missileLockTimer / 1.5) * 100, 100);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        bottom: "60%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 80,
        marginTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: "#ff9900",
          textAlign: "center",
          letterSpacing: "0.15em",
          marginBottom: 3,
        }}
      >
        LOCKING...
      </div>
      <div
        style={{
          height: 3,
          background: "rgba(255,255,255,0.1)",
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(255,153,0,0.4)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#ff9900",
            transition: "width 0.05s linear",
          }}
        />
      </div>
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
        {isCombat && (
          <div className="pointer-events-auto flex-1 transition-opacity duration-200">
            <WeaponPanel />
          </div>
        )}
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
      <ViewToggle />

      {/* Layer 1 — cockpit frame (z-10) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <CockpitView />
        <div className="scanlines absolute inset-0 pointer-events-none" />
      </div>

      {/* Layer 2 — HUD panels (z-20) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        <StatusPanel />
        <WaveIndicator />
        <ScanCmdButtons />
        {isOrbital && <LaneIndicator />}
        {isCombat && <AimCone />}
        {isCombat && <CombatReticle />}
        {isCombat && <LeadIndicator />}
        {isCombat && <MissileLockBar />}
        <FreeRoamHUD />
        <RadarMinimap />
        <LockedIndicator />
        <FPSCounter />
        <MiningAlert />
        <NotificationSystem />
      </div>

      {/* Layer 3 — nav menu + dock (z-30) */}
      <NavMenuBar />
      <BottomDock />
    </>
  );
}
