import type React from "react";
import { useRef, useState } from "react";
import { useDeviceStore } from "../../stores/deviceStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { touchCameraMovement } from "../../utils/touchCamera";

const KEY_CODES: Record<string, string> = {
  w: "KeyW",
  a: "KeyA",
  s: "KeyS",
  d: "KeyD",
  " ": "Space",
  Shift: "ShiftLeft",
};

// Button size presets
const BTN_SIZES = {
  small: { joystick: "w-24 h-24", button: "w-16 h-16", text: "text-xs" },
  medium: { joystick: "w-32 h-32", button: "w-20 h-20", text: "text-sm" },
  large: { joystick: "w-40 h-40", button: "w-28 h-28", text: "text-base" },
};

export const MobileControls: React.FC = () => {
  const isMobile = useDeviceStore((s) => s.isMobile);
  const { joystickSensitivity, buttonSize, hapticsEnabled } =
    useSettingsStore();
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Swipe camera state
  const swipeTouchRef = useRef<{
    id: number;
    startX: number;
    startY: number;
  } | null>(null);

  if (!isMobile) return null;

  const sizes = BTN_SIZES[buttonSize];

  const haptic = (duration = 20) => {
    if (hapticsEnabled && navigator.vibrate) navigator.vibrate(duration);
  };

  const releaseKeys = (keys: string[]) => {
    for (const key of keys) {
      const code = KEY_CODES[key] ?? key;
      if (activeKeysRef.current.has(code)) {
        window.dispatchEvent(
          new KeyboardEvent("keyup", { code, key, bubbles: true }),
        );
        activeKeysRef.current.delete(code);
      }
    }
  };

  const pressKey = (key: string) => {
    const code = KEY_CODES[key] ?? key;
    if (!activeKeysRef.current.has(code)) {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { code, key, bubbles: true }),
      );
      activeKeysRef.current.add(code);
    }
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = joystickRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = touch.clientX - rect.left - rect.width / 2;
    const rawY = touch.clientY - rect.top - rect.height / 2;
    const maxDist = 40 * joystickSensitivity;
    const dist = Math.hypot(rawX, rawY);
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(rawY, rawX);
    const x = Math.cos(angle) * clampedDist;
    const y = Math.sin(angle) * clampedDist;

    setJoystickPos({ x, y });

    const dirs = ["w", "a", "s", "d"];
    if (clampedDist > 15) {
      let key: string;
      if (angle > -Math.PI / 4 && angle < Math.PI / 4) key = "d";
      else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) key = "s";
      else if (angle >= (3 * Math.PI) / 4 || angle < -(3 * Math.PI) / 4)
        key = "a";
      else key = "w";
      releaseKeys(dirs.filter((k) => k !== key));
      pressKey(key);
    } else {
      releaseKeys(dirs);
    }
  };

  const handleJoystickEnd = () => {
    setJoystickPos({ x: 0, y: 0 });
    releaseKeys(["w", "a", "s", "d"]);
  };

  // Swipe camera handlers (right half, above buttons zone)
  const handleSwipeStart = (e: React.TouchEvent) => {
    if (swipeTouchRef.current !== null) return;
    const touch = e.changedTouches[0];
    swipeTouchRef.current = {
      id: touch.identifier,
      startX: touch.clientX,
      startY: touch.clientY,
    };
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!swipeTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === swipeTouchRef.current.id) {
        const dx = touch.clientX - swipeTouchRef.current.startX;
        const dy = touch.clientY - swipeTouchRef.current.startY;
        touchCameraMovement.x += dx * 0.8;
        touchCameraMovement.y += dy * 0.8;
        swipeTouchRef.current.startX = touch.clientX;
        swipeTouchRef.current.startY = touch.clientY;
        break;
      }
    }
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (!swipeTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === swipeTouchRef.current.id) {
        swipeTouchRef.current = null;
        break;
      }
    }
  };

  return (
    <div
      data-ocid="mobile_controls.panel"
      className="fixed inset-0 pointer-events-none z-40 select-none"
    >
      {/* Swipe camera zone: right half, top 65% of screen (above buttons) */}
      <div
        className="absolute top-0 right-0 pointer-events-auto touch-none"
        style={{ width: "50%", height: "65%" }}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        onTouchCancel={handleSwipeEnd}
      />

      {/* Virtual Joystick - Left */}
      <div className="absolute left-8 bottom-32 pointer-events-auto flex flex-col items-center">
        <div
          ref={joystickRef}
          data-ocid="mobile_controls.canvas_target"
          onTouchStart={handleJoystickMove}
          onTouchMove={handleJoystickMove}
          onTouchEnd={handleJoystickEnd}
          onTouchCancel={handleJoystickEnd}
          className={`relative ${sizes.joystick} rounded-full bg-cyan-500/20 border-2 border-cyan-500/40 touch-none`}
        >
          <div
            className="absolute w-12 h-12 rounded-full bg-cyan-500/80 border-2 border-cyan-400 shadow-lg shadow-cyan-500/50"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            }}
          />
        </div>
        <p className="text-xs text-cyan-500/70 mt-2 font-mono tracking-widest">
          MOVE
        </p>
      </div>

      {/* Action Buttons - Right */}
      <div className="absolute right-8 bottom-32 pointer-events-auto flex flex-col gap-4 items-center">
        <button
          type="button"
          data-ocid="mobile_controls.primary_button"
          onTouchStart={(e) => {
            e.preventDefault();
            haptic(15);
            pressKey(" ");
          }}
          onTouchEnd={() => releaseKeys([" "])}
          onTouchCancel={() => releaseKeys([" "])}
          className={`${sizes.button} rounded-full bg-yellow-500/80 border-2 border-yellow-400 flex items-center justify-center font-bold ${sizes.text} font-mono tracking-widest active:scale-90 transition-transform shadow-lg shadow-yellow-500/30 touch-none`}
        >
          BOOST
        </button>
        <button
          type="button"
          data-ocid="mobile_controls.secondary_button"
          onTouchStart={(e) => {
            e.preventDefault();
            haptic(15);
            pressKey("Shift");
          }}
          onTouchEnd={() => releaseKeys(["Shift"])}
          onTouchCancel={() => releaseKeys(["Shift"])}
          className={`${sizes.button} rounded-full bg-red-500/80 border-2 border-red-400 flex items-center justify-center font-bold ${sizes.text} font-mono tracking-widest active:scale-90 transition-transform shadow-lg shadow-red-500/30 touch-none`}
        >
          BRAKE
        </button>
      </div>
    </div>
  );
};
