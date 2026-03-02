# UI/UX Upgrade Plan (React Bits + GitHub Benchmarks)

Last updated: 2026-03-02

## 1. Goal

Upgrade Agent Skill Forge from "functional dashboard UI" to a consistent, motion-aware, accessibility-safe product interface while keeping build risk low.

## 2. External Benchmarks (validated on 2026-03-02)

1. React Bits components catalog
- Source: https://pro.reactbits.dev/components
- Why it matters: the catalog is organized by "Text", "Backgrounds", "Animations", and "Components", which is useful for choosing motion patterns by UI layer instead of adding random local animation classes.

2. Motion (Framer Motion) docs + ecosystem
- Transition docs: https://motion.dev/motion/transition
- Stagger docs: https://motion.dev/docs/stagger
- GitHub repo: https://github.com/motiondivision/motion
- Why it matters: provides a clear motion model (`tween` / `spring` / `inertia`) and staggered sequencing for lists, menus, and progressive reveals.

3. Magic UI
- GitHub repo: https://github.com/magicuidesign/magicui
- Why it matters: a practical reference set for high-contrast marketing-like sections, callouts, and premium visual blocks.

4. shadcn/ui
- GitHub repo: https://github.com/shadcn-ui/ui
- Why it matters: production-proven component API patterns for composability, accessibility, and predictable state styling.

## 3. Current Baseline in This Repository

Already completed in code:
- Semantic classes consolidated in `src/index.css`: `ui-btn-*`, `ui-input`, `ui-badge-*`, `ui-kicker`, `ui-caption`, `ui-field-label`.
- Added motion-semantic primitives:
  - `ui-page-enter`
  - `ui-card-lift`
  - `ui-tab`, `ui-tab-active`, `ui-tab-idle`
  - `ui-pill-*`
- Added reduced-motion fallback for semantic motion classes.
- Replaced remaining `themed-input` usages with `ui-input` across editor/library/settings/select flows.
- Unified tab styles in Library and Workspace Params.

## 4. Next Upgrade Sprints

## Sprint A (1-2 days): Motion language standardization
- Add one route-level transition wrapper in `App.tsx` (single source of truth for page enter/exit rhythm).
- Replace remaining one-off `animate-*` classes with semantic classes or Motion variants.
- Define timing tokens by intent:
  - `enter`: 280-420ms
  - `feedback`: 140-220ms
  - `critical`: no decorative motion

Acceptance:
- No new raw `animate-*` classes added in feature code.
- Reduced-motion mode keeps full functionality and removes decorative transitions.

## Sprint B (2-3 days): Library information hierarchy upgrade
- Add deterministic card priority rails:
  - Security state
  - Installability state
  - Source trust marker
- Convert install dropdown and list actions to one shared action component contract.
- Add list stagger only on first render (not on every filter keystroke).

Acceptance:
- Security/status badges are always top-visible with no truncation.
- Keyboard path: card action menu -> target selection -> close works end-to-end.

## Sprint C (2 days): Settings and Simulator polish
- Settings:
  - unify all inline status chips to semantic badge/pill variants
  - split destructive actions into a dedicated risk panel
- Simulator:
  - improve message rhythm (assistant typing, chunk reveal, and system panel collapse state persistence)
  - standardize role tokens for user/assistant/system blocks

Acceptance:
- Simulator can run a full chat loop with no layout jump.
- Settings destructive actions require explicit confirmation state and clear visual warning.

## 5. Engineering Guardrails

- Keep CSS utility + semantic-class hybrid strategy (no full rewrite).
- Keep bundle risk bounded:
  - Do not add heavy animation libraries unless replacing equivalent custom code.
  - Prefer lazy loading for visual-only modules.
- Every sprint must pass:
  - `npm run lint`
  - `npm run build`

## 6. Suggested Adoption Order for External Ideas

1. Motion principles from Motion docs (`transition` + `stagger`) as architectural baseline.
2. React Bits-inspired visual motifs only in high-impact entry points (hero, empty states, loading shells).
3. shadcn/ui and Magic UI patterns as component behavior references, not direct copy.
