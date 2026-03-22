# Frontier: Orbital Combat

## Current State
- Two camera modes: `orbital` (far, auto-orbit) and `cockpit` (close, weapons UI)
- ViewToggle at top-center cycles between the two
- CameraOrbitController handles smooth lerp between modes
- HUD conditionally shows orbital vs cockpit UI
- MobileControls has a single left joystick for movement
- `@react-three/postprocessing` is NOT installed
- shipStore has fuel/maxFuel, cargo/maxCargo; inventoryStore has resources/totalWeight

## Requested Changes (Diff)

### Add
- Third camera mode: `freeRoam` — full 6DOF flight, detached from orbital lock
- Combat mode replaces cockpit: same close camera + weapons UI, but ship auto-orbits Earth and player only aims (±45° pitch, ±90° yaw)
- Aim pitch/yaw state in cameraStore for combat mode
- Desktop controls for freeRoam: WASD movement + mouse look (pointer lock)
- Mobile controls for freeRoam: left joystick = move, right joystick = look direction
- Post-processing effects (MotionBlur 0.6, ChromaticAberration, Vignette) active only in combat mode
- Free Roam compact HUD overlay: fuel bar, cargo used/max, mineral scanner readout (top mined resource)
- 200ms CSS fade transitions on all conditional HUD elements
- Install `@react-three/postprocessing` package

### Modify
- `CameraMode` type: `'orbital' | 'cockpit'` → `'orbital' | 'combat' | 'freeRoam'`
- ViewToggle: cycles orbital→combat→freeRoam, with cyan/amber/green color theme
- CameraOrbitController: add combat (close + auto-orbit, no drag) and freeRoam (6DOF WASD/mouse) branches
- HUD conditional visibility: cockpit → combat; add freeRoam branch with compact HUD
- LockedIndicator: show in `combat` mode instead of `cockpit`
- AimCone + WeaponPanel: show in `combat` mode
- LaneIndicator, ScanCmdButtons, NAV/SCAN menu tabs: show in `orbital` only
- MobileControls: add second right joystick visible only in freeRoam mode
- NavMenuBar: hide NAV/SCAN in combat and freeRoam

### Remove
- `cockpit` as a mode label (replaced by `combat`)

## Implementation Plan
1. Install `@react-three/postprocessing` via package.json
2. Update `cameraStore.ts`: add `combat` and `freeRoam` modes; add `aimPitch`, `aimYaw`, `setAimPitch`, `setAimYaw` to state
3. Update `GameCanvas.tsx` CameraOrbitController to handle 3 modes:
   - `orbital`: existing far auto-orbit logic
   - `combat`: close camera, ship auto-orbits, player aim offsets camera direction via aimPitch/aimYaw
   - `freeRoam`: WASD-driven position delta + mouse look via pointer lock
4. Add PostProcessing wrapper in GameCanvas Canvas (EffectComposer with MotionBlur, ChromaticAberration, Vignette) — active only in combat mode
5. Update `HUD.tsx`:
   - ViewToggle: 3-way cycle with correct colors/icons/labels
   - All `cockpit` references → `combat`
   - Add `FreeRoamHUD` component: compact fuel/cargo/scanner readout, visible only in freeRoam
   - Add CSS transition classes on conditional panel wrappers
6. Update `MobileControls.tsx`: add right joystick for look direction, visible only in freeRoam mode; left joystick stays for all modes
7. Wire combat aim: mouse move events update aimPitch/aimYaw when mode === combat; clamp to ±45° / ±90°
