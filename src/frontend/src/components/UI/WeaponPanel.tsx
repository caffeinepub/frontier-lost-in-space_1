import { WEAPONS } from "../../config/weapons";
import { useWeaponsStore } from "../../stores/useWeaponsStore";
import { handleFireButton } from "../../systems/combat";
import type { WeaponId } from "../../types/game";

export default function WeaponPanel() {
  const { activeWeapon, cooldowns, ammo, setActiveWeapon } = useWeaponsStore();

  const currentCooldown = cooldowns[activeWeapon] ?? 0;
  const canFire = currentCooldown <= 0 && (ammo[activeWeapon] ?? 1) > 0;

  return (
    <div
      style={{
        // Standardized 30% opacity
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(0,200,255,0.5)",
        borderRadius: "8px",
        padding: "8px 12px",
        boxShadow: "0 0 16px rgba(0,200,255,0.1)",
      }}
      data-ocid="weapons.panel"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {/* Weapon selector */}
        {WEAPONS.map((w) => {
          const isActive = w.id === activeWeapon;
          const cd = cooldowns[w.id] ?? 0;
          const a = ammo[w.id];
          const ammoDisplay = typeof a === "number" ? a : "∞";

          return (
            <button
              key={w.id}
              type="button"
              onClick={() => setActiveWeapon(w.id as WeaponId)}
              data-ocid={`weapons.${w.id}_button`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                minHeight: "48px",
                borderRadius: "6px",
                border: isActive
                  ? "1px solid rgba(0,200,255,1.0)"
                  : "1px solid rgba(0,200,255,0.3)",
                background: isActive
                  ? "rgba(0,200,255,0.12)"
                  : "rgba(255,255,255,0.04)",
                // Primary white when active, 70% white when not
                color: isActive ? "#00ccff" : "rgba(255,255,255,0.7)",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                whiteSpace: "nowrap",
                // 150ms interactive
                transition: "all 150ms ease",
                textShadow: isActive ? "0 0 8px rgba(0,200,255,0.7)" : "none",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  backgroundColor: w.color,
                  boxShadow: isActive ? `0 0 6px ${w.color}` : "none",
                }}
              />
              <span>{w.label}</span>
              <span style={{ fontSize: "10px", opacity: 0.7 }}>
                ▸{ammoDisplay}
              </span>
              {cd > 0 && isActive && (
                <span
                  style={{
                    fontSize: "10px",
                    color: "#ffaa00",
                    marginLeft: "2px",
                  }}
                >
                  CD
                </span>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div
          style={{
            width: "1px",
            height: "32px",
            background: "rgba(0,200,255,0.3)",
          }}
        />

        {/* FIRE button */}
        <button
          type="button"
          onClick={handleFireButton}
          disabled={!canFire}
          data-ocid="weapons.fire_button"
          style={{
            padding: "8px 20px",
            minHeight: "48px",
            borderRadius: "6px",
            border: canFire
              ? "2px solid rgba(255,60,60,1.0)"
              : "2px solid rgba(100,100,100,0.5)",
            background: canFire
              ? "rgba(255,50,50,0.25)"
              : "rgba(100,100,100,0.15)",
            color: canFire ? "#ff6666" : "rgba(100,100,100,0.6)",
            fontFamily: "monospace",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: canFire ? "pointer" : "not-allowed",
            // 150ms interactive
            transition: "all 150ms ease",
            textShadow: canFire ? "0 0 10px rgba(255,80,80,0.8)" : "none",
            boxShadow: canFire ? "0 0 14px rgba(255,60,60,0.3)" : "none",
          }}
        >
          FIRE
        </button>
      </div>
    </div>
  );
}
