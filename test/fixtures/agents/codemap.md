# Codemap

## Modules

### src/shared/bots/goap.ts (14)
A planner sketch.
imports: src/shared/bots/state.ts
used by: src/server/bot-brain.ts
- `Fact` type :6 `= boolean | number | string` — A fact.
- `plan` async fn :55 `<Ctx>(s: WorldState): Plan | undefined` — Plans to the goal.
  calls: `satisfies`, `unmet`
  `@why` Ties break by id.
- `LOCAL` const (local) :3 `= 1`
- `Aabb` export :23

### src/server/bot-brain.ts (20)
used by: src/shared/bots/goap.ts
- `runBrain` fn :10 `(id: number): void` — Runs the brain.

### src/client/arena-scene.ts (30)
- `yawToRadians` fn :40 `(deg: number): number`
