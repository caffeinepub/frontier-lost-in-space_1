import { useState } from "react";
import { WEAPONS } from "../../config/weapons";
import { useWeaponsStore } from "../../stores/useWeaponsStore";
import { handleFireButton } from "../../systems/combat";
import type { WeaponId } from "../../types/game";

export default function WeaponPanel() {
  const { activeWeapon, cooldowns, ammo, setActiveWeapon } = useWeaponsStore();
  const [collapsed, setCollapsed] = useState(false);

  const currentCooldown = cooldowns[activeWeapon] ?? 0;
  const canFire = currentCooldown <= 0 && (ammo[activeWeapon] ?? 1) > 0;

  return (
    <div
      className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-lg shadow-cyan-500/20 p-3 text-xs font-mono pointer-events-auto animate-slide-in-bottom"
      data-ocid="weapons.panel"
    >
      <button
        type="button"
        className="w-full text-left text-cyan-400 text-[10px] tracking-[0.2em] font-bold mb-2 text-glow-cyan cursor-pointer select-none hover:text-cyan-300 transition-colors flex items-center bg-transparent border-0 p-0"
        onClick={() => setCollapsed((c) => !c)}
        data-ocid="weapons.toggle"
      >
        WEAPONS
        <span className="ml-1 text-[8px]">{collapsed ? "▶" : "▼"}</span>
      </button>

      {!collapsed && (
        <div className="flex gap-3 items-end">
          {/* Weapon selector */}
          <div className="flex flex-col gap-1">
            {WEAPONS.map((w) => {
              const isActive = w.id === activeWeapon;
              const cd = cooldowns[w.id] ?? 0;
              const a = ammo[w.id] ?? "∞";
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setActiveWeapon(w.id as WeaponId)}
                  data-ocid={`weapons.${w.id}_button`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all ${
                    isActive
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-cyan-500/40"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: w.color }}
                  />
                  <span>{w.label}</span>
                  <span className="ml-auto text-[10px] text-gray-500">
                    {typeof a === "number" ? a : "∞"}
                  </span>
                  {cd > 0 && isActive && (
                    <span className="text-[10px] text-amber-400">CD</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* FIRE button */}
          <button
            type="button"
            onClick={handleFireButton}
            disabled={!canFire}
            data-ocid="weapons.fire_button"
            className={`w-20 h-20 rounded-lg border-2 font-bold text-lg tracking-widest transition-all select-none ${
              canFire
                ? "border-red-500 bg-red-600/30 text-red-400 hover:bg-red-500/50 hover:text-white active:scale-95 shadow-lg shadow-red-500/30"
                : "border-gray-600 bg-gray-800/40 text-gray-600 cursor-not-allowed"
            }`}
          >
            FIRE
          </button>
        </div>
      )}
    </div>
  );
}
