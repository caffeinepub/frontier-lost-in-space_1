# Frontier: Orbital Combat

## Current State
- WeaponPanel renders weapon buttons horizontally with full text labels (PULSE CANNON, RAIL GUN, MISSILE) + FIRE button all in one wide row, causing overflow into joystick areas on mobile
- MobileControls renders left joystick (bottom-left) and right joystick (bottom-right) with no awareness of WeaponPanel position — overlapping occurs
- Boost mechanic is cluttered; no clear single-tap activation, no cooldown UI
- 5-lane orbital system exists in laneStore but camera orbits loosely around the globe rather than locking to a lane track (rail-shooter feel)
- Z-index layering: MobileControls at z-40, HUD at z-20, WeaponPanel inside HUD — potential conflicts

## Requested Changes (Diff)

### Add
- Boost button: single tap activates 1.5s burst, cooldown ring animates around button, grays out during cooldown
- Lane-locked rail camera: in orbital/combat modes camera follows ship along the current lane orbit track; globe appears to rotate past you

### Modify
- WeaponPanel: redesign as compact horizontal tab bar (nav-bar style) — small icon dot + short label only (PULSE / RAIL / MISSILE), no ammo text on button face, shrink padding. FIRE button stays but separated. Entire panel must fit within the center space between left and right joysticks on mobile landscape.
- MobileControls: ensure left joystick stays bottom-left (8–12px inset), right joystick stays bottom-right (8–12px inset). Add explicit safe-zone awareness so WeaponPanel in center never overlaps joystick bounds.
- Z-index audit: MobileControls z-40, WeaponPanel z-30, HUD overlays z-20 — no conflicts
- Boost: move from wherever it currently exists into a small dedicated button above the left joystick or in the SHIP panel; add tap-once logic with 1.5s active duration, 4s cooldown ring UI

### Remove
- Long text labels on weapon buttons (replace with short 3–4 char labels)
- Any boost/brake clutter from the main HUD visible area

## Implementation Plan
1. Rewrite WeaponPanel as compact nav-tab style — icon dot + short label, tight padding, max-width constrained to fit between joysticks
2. Add boost state to shipStore or a local boostStore: `isBoostActive`, `boostCooldown`, tap handler with setTimeout
3. Add BoostButton component — circular, tap-to-activate, SVG cooldown ring that drains over 4s, grayed during cooldown
4. Update MobileControls to position joysticks with explicit pixel insets and add `pointerEvents: none` pass-through zone in center for WeaponPanel
5. Fix lane camera: in orbital/combat mode, CameraController locks camera to current lane radius, orbits around Earth; player sees globe rotating, not camera spinning
6. Z-index audit across HUD.tsx, MobileControls.tsx, WeaponPanel — ensure no overlap
