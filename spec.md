# Frontier: Orbital Combat

## Current State
- App boots via StartScreen (requires click to start)
- StoryPanel always mounted in App.tsx, triggers A.E.G.I.S. dialogue 3s after game starts
- EnemyLayer spawns gradually, immediately hostile and approaching player
- No targeting cone — lockedTarget exists in store but no cone auto-lock logic
- All weapons fire same way; only pulse has spread; no missile lock-on, no rail hitscan
- No passive patrol mode; no per-weapon behavior differentiation
- HUD shows LOCKED but no distance/threat level display

## Requested Changes (Diff)

### Add
- CombatTargetingSystem 3D component: each frame finds nearest enemy within 45-deg cone from camera forward, updates lockedTarget
- Cyan outline ring on locked enemy mesh
- HUD target info: locked enemy distance + threat level (combat mode)
- Reticle color: green when in weapon range, red when out of range
- Lead indicator: 3D predicted intercept point for moving targets
- Passive patrol: enemies orbit at fixed radius, not approaching, until hostile
- Hostile trigger: enemy goes hostile when player within 40 units OR any weapon fired
- setAllHostile() in useEnemyStore + hostile flag per enemy
- Missile: 1.5s lock-on timer, then tracking projectile curves toward target
- Rail: instant hitscan damage to locked target + brief beam visual
- Distance-based accuracy: pulse spread scales with distance

### Modify
- App.tsx: remove StoryPanel, skip StartScreen, remove triggerEvent useEffect
- EnemyLayer: spawn exactly 6 enemies on mount with hostile=false
- EnemyMesh: cyan ring when locked; patrol vs hostile movement logic
- combat.ts handleFireButton: set all enemies hostile on fire; weapon-specific behavior
- HUD LockedIndicator: show distance + threat level, not just LOCKED text
- ScanCmdButtons: remove triggerEvent calls

### Remove
- StartScreen from active render path
- StoryPanel from App.tsx
- Story useEffect (triggerEvent after 3s)
- Immediate-hostile enemy spawn behavior

## Implementation Plan
1. Add hostile flag + setAllHostile to useEnemyStore
2. Add missile lock state to useWeaponsStore
3. Modify App.tsx: skip start screen, remove story
4. Modify EnemyLayer: 6 enemies, patrol mode, hostile triggers
5. Add CombatTargetingSystem inside Canvas
6. Update EnemyMesh: cyan ring, patrol/hostile movement
7. Update combat.ts: weapon-specific behaviors, hostile trigger
8. Update HUD: target distance/threat display, reticle color
