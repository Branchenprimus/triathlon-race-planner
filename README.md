# 🏊‍♂️ 🚴‍♂️ 🏃‍♂️ Race Planner

Vue 3 race planning for **Triathlon, Radrennen, Lauf and Schwimmen**. Pace and Nutrition are always visible together: two large cards on desktop (>1050 px), stacked on smaller screens. The repository, package and deployment identity remain `triathlon-race-planner`.

## Planning a race

1. Select a sport using the four top tabs. Arrow Left/Right and Home/End navigate the tabs; Tab moves into the active plan.
2. Choose a distance preset, or **Custom** to edit distances in kilometres (e.g. `0.4` = 400 m). Each sport retains its own selected preset, distances, splits and lock settings while switching.
3. Edit the target or discipline time as `HH:MM:SS`, move a slider, or edit pace/speed. Swim pace uses `MM:SS /100m`, run pace `MM:SS min/km`, cycling speed `km/h` (decimal point or comma).
4. Nutrition immediately uses the **actual active race duration**. Single-sport races contain only that sport, with no transitions or hidden triathlon splits. Editing a single-sport duration or pace changes its total and target time, rather than redistributing it back to a fixed target.

Times and distances in presets are editable **planning examples**, not actual event data or performance recommendations. Invalid, negative and non-finite inputs are rejected; invalid partial text is restored on blur. Zero duration/distance is allowed; pace editing requires a positive distance. Time inputs support up to `99:59:59`. Distances and nutrition amounts accept finite values from 0 to 1,000,000; body weight must be positive.

### Standard distances

| Sport | Presets |
| --- | --- |
| Triathlon | Sprint (0.75/20/5 km), Olympic (1.5/40/10 km), Half-Ironman (1.9/90/21.1 km), Ironman (3.8/180/42.2 km) |
| Radrennen | 20, 40, 90, 180 km |
| Lauf | 5 km, 10 km, half marathon (21.0975 km), marathon (42.195 km) |
| Schwimmen | Pool: 400, 800, 1500 m; Open Water: 1.9, 3.8, 5 km |

Every sport includes Custom. Selecting Custom starts from the current distance/time; selecting a standard preset resets distances and times to that template, so old custom times do not leak into a new preset. Existing triathlon target times and distributions are unchanged (1:30 / 3:00 / 6:00 / 12:00).

### Triathlon redistribution and locks

Triathlon retains swim, T1, bike, T2 and run, with T1/T2 locked by default. Editing a split redistributes remaining time proportionally among the other unlocked splits. Locked splits remain fixed when another split or the target changes. A lock prevents automatic redistribution, not direct editing of that split. The edited split is bounded by the remaining available time, so other splits cannot become negative. Integer allocation preserves the exact total despite rounding or zero-valued splits.

A target below the sum of locked times, or an adjustment with no other adjustable split, is rejected. Unlock a split first. Selecting a new preset explicitly resets all times to its template, retaining lock choices.

### Nutrition estimates

The Nutrition card has one source of race duration: the active Pace plan, **including transitions for triathlon**. There are no separate nutrition time inputs or second race selection that can drift out of sync.

The existing selectable carbohydrate templates are retained: Sprint 45, Olympic 60, 70.3 75 and Ironman 90 g/h. These are configurable legacy planning values, **not individual nutrition or medical recommendations**. Choose Custom target for your own g/h. Selecting a triathlon preset updates the default target template; choosing a nutrition template never changes race times. Nutrition settings and products are shared across sports.

- Total carbohydrate estimate = active duration (hours) × selected g/h, rounded to grams.
- Carbs/kg/h uses the entered body weight.
- Product names, carbs/serving, sodium/serving and servings remain editable; products can be added/removed (at least one remains).
- Planned carbs/sodium sum the products; Carb Gap is the nonnegative difference from the carbohydrate estimate.
- The existing app has no calorie or fluid model; this update does not invent one.

## Local persistence and migration

State is automatically saved in this browser under `triathlon-race-planner:v2`: selected sport, all four sport configurations, custom distances/times, triathlon locks, nutrition settings and products. Reload restores the selected sport and its plan. There is no backend sync.

When no v2 state exists, the previous `triathlon-race-planner:v1` triathlon state migrates into the Triathlon tab, preserving valid splits, lock choices and nutrition/product values. The original v1 entry is left untouched. Actual saved splits determine duration; stale legacy target strings or independent nutrition times are not trusted. Legacy Custom did not store custom distances, so migration starts those distances from Olympic defaults.

Persisted data is validated field by field: unknown sports/presets, nulls, malformed JSON, invalid numbers, wrong types and duplicate product identifiers recover safely. Standard preset distances come from the preset; custom distances come from validated saved values. Storage access/quota failures do not prevent planning.

## Development

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Tests use Node's built-in test runner and Vue reactivity, without adding a test framework. They cover all sport modes and presets, custom distances, independent configurations, single-sport time/pace changes and reactive nutrition, triathlon redistribution/locks, persistence/reload, legacy migration, malformed storage and input validation. A production build compiles the Vue templates.

### Main files

- `src/App.vue`: accessible sport tabs, responsive Pace/Nutrition cards and form bindings.
- `src/composables/useRacePlanner.js`: active sport state, presets, time/pace actions, nutrition derivation, validated loading/migration and saving.
- `src/composables/useTriathlonPresets.js`: original triathlon preset definitions.
- `src/components/DisciplineSlider.vue`: shared discipline time, slider, pace and optional triathlon distribution/lock controls.
- `src/utils/persistence.js`: best-effort JSON storage helpers.
- `src/utils/timeUtils.js`: time and pace formatting.

### Stable browser verification selectors

- Tabs: `getByRole('tab', { name: 'Triathlon', exact: true })` (also `Radrennen`, `Lauf`, `Schwimmen`). IDs: `#tab-triathlon`, `#tab-cycling`, `#tab-running`, `#tab-swimming`.
- Cards: headings `Pace` and `Nutrition`; `.pace-card` and `.nutrition-card`.
- Distance preset / target: `#preset`, `#targetTime`.
- Distance inputs: `#distance-swim`, `#distance-bike`, `#distance-run` (only active distances rendered; enabled in Custom).
- Discipline: `.discipline-swim`, `.discipline-bike`, `.discipline-run`, `.discipline-t1`, `.discipline-t2`; time `.discipline-time`, pace `.pace-info input`.
- Accessible discipline names: `Schwimmen time`, `Radfahren time`, `Laufen time`; corresponding `… pace or speed`, `… duration slider`, and triathlon-only `… lock`.
- Actual totals: `#pace-total-duration`, `#nutrition-total-duration`, `#nutrition-total-carbs`, `#nutrition-carbs-per-hour`.
- Nutrition inputs: `#bodyWeight`, `#carbMode`, `#customCarbs`, `#raceType` (default-template mode only).

## Technology

Vue 3 Composition API, Vite 8, native form controls and CSS grid/flexbox. No account or external nutrition service required.

## License

MIT
