# Design System Overview

This document defines the emerging design system for the project. The goal is to remove ad‑hoc Tailwind class usage and move toward semantic, reusable tokens and components.

## Semantic Color Tokens

Colors in `tailwind.config.js` expose the following semantic families:

| Token    | Purpose                                |
|----------|----------------------------------------|
| brand    | Primary brand hue (was gradient green) |
| success  | Positive state / confirmations         |
| warning  | Caution / attention required           |
| danger   | Errors & destructive actions           |
| info     | Informational accents                  |
| neutral  | Grays, surfaces, text                  |
| accent   | Supporting accent (orange)             |

Replace direct usages of `bg-blue-*`, `bg-green-*`, `text-gray-*` with the semantic alternative whenever the usage conveys meaning.

## Buttons

Primary implementation: `src/lib/presentation/components/Button.svelte`.

Variants available:
```
<Button variant="primary" />   // brand action
<Button variant="secondary" /> // neutral alternative
<Button variant="danger" />    // destructive
<Button variant="outline" />   // low emphasis framed
<Button variant="ghost" />     // low emphasis text
```
Sizes: `sm | md | lg`. Shape: prop `rounded` (pill) or default (rounded-button radius).

Legacy `.btn` / `.btn-primary` classes remain temporarily; migrate to `<Button>` component or semantic utilities `.btn-primary`, `.btn-danger` defined via plugin.

### Migration Guide
1. When you see `class="btn-primary ..."` => Replace with `<Button variant="primary">` if dynamic, or apply `.btn-primary` utility.
2. Consolidate padding: use size prop instead of manual `px-* py-*` classes for consistency.
3. Gradients: Reserve gradients for marketing/hero sections; keep buttons flat (solid) for accessibility and contrast. A special gradient style can be reintroduced via a dedicated variant if required.

## Spacing & Radius

Standard radii:
| Usage           | Token          |
|-----------------|----------------|
| Buttons         | `rounded-button` (0.55rem)
| Cards / surfaces| `rounded-lg`    |
| Pills / tags    | `rounded-full`  |

## Shadows
Focus ring + shadow: use `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500`. Avoid ad‑hoc ring colors.

## Do & Don't
Do: `bg-brand-600 hover:bg-brand-500` for a primary action.
Don't: Mix `bg-green-600` and `bg-amber-500` in the same button unless part of a defined gradient pattern.

## Next Steps
1. Refactor existing Svelte route components to use `<Button>`.
2. Add Tag / Badge component using semantic tokens.
3. Introduce typography scale tokens (t-shirt sizes) if heading styles begin to diverge.
4. Add dark mode surface mapping (brand-400/500 for primary in dark mode).

## Pastel Gradient Tokens

Unified soft gradients replace earlier multi‑stop vivid gradients to reduce visual noise:

Utility Classes:
```
.gradient-brand-soft     // 135deg green‑pastel → peach
.gradient-brand-soft-x   // 90deg variant (horizontal bars, nav)
.gradient-brand-soft-text // Text fill version (clip text)
```
Usage Guidelines:
* Reserve for hero, marketing highlight, progress bars, or subtle section dividers.
* Avoid using inside primary buttons (keeps actions high contrast & accessible).
* Combine with `glass` surfaces cautiously (one decorative layer per component).

## Glass (Liquid) Surfaces

Utility Classes:
```
.glass        // Light glass panel
.glass-dark   // Dark / overlay glass panel
.glass-border // Additional border accent
.glass-edge   // Inset + drop shadow combo
```
Use for floating toolbars, modals, or highlight panels over imagery/gradient backgrounds. Ensure underlying contrast remains ≥ WCAG AA (test with axe or manual contrast tools).

## Shimmer Skeletons

Class `.shimmer` adds a sweeping light highlight. Apply only to medium/large placeholders; avoid in large lists (> 12 items) to prevent distraction and performance issues.

Performance Tip: Shimmer uses a lightweight CSS animation; batching many simultaneously may still trigger layout/repaint overhead on low‑power devices—prefer static pulse for dense grids.

## Accessibility & Contrast

Pastel backgrounds can reduce contrast. When placing text over `.gradient-brand-soft`, prefer a deep neutral/brand tone (`#14532d` or `text-neutral-800`). Re‑test after any palette tweak using Lighthouse or axe:
Checklist:
* Body text ≥ 4.5:1 contrast.
* Large headings (≥ 24px bold) ≥ 3:1.
* Interactive focus states remain clearly visible (ring + color change).


---
Version: 2025-08-24
Maintainer: Design System WG
