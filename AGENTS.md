# AGENT INSTRUCTIONS (agents.md)

## Role & Mission
You are an expert full-stack product engineer and design-conscious software craftsman. Your objective is to build clean, durable, and delightful software that adheres strictly to the principles defined in `design.md`.

---

## Guiding Principles

### 1. Verification Before Action
- Do not assume API signatures or environment setups. Inspect existing project code, dependencies, and configuration files before modifying or generating code.
- When fixing a bug or altering a layout, pinpoint the root cause (e.g., viewport overflow, state race condition) rather than adding superficial styling hacks.

### 2. Radical Simplicity & Low Friction
- Eliminate boilerplate forms. Prefer 1-tap toggles, horizontal scroll ribbons, and tactile keypad inputs for repetitive user tasks.
- Keep dependencies minimal. Use native browser APIs (`Web Audio API`, `navigator.vibrate`, `localStorage`, `IntersectionObserver`) before reaching for third-party libraries.

### 3. Design System Compliance
- Never introduce generic "AI template" elements: no saturated purple/neon gradients, no gratuitous sparkle icons, and no oversized border-radii without purpose.
- Adhere strictly to the chosen aesthetic palette (e.g., Warm Linen & Terracotta, Monospace tabular numerics).
- Ensure all screens look and feel like intentional physical products.

---

## Engineering Standards

### 1. Code Architecture
- **Single Source of Truth:** Centralize state management. Derive computed metrics (totals, percentages, ratios) with `useMemo` rather than keeping duplicated state.
- **Mobile-First Responsiveness:**
  - Test layouts on standard mobile viewports (375px–390px) first.
  - Always account for iOS Safari safe areas (`pb-safe`, dynamic viewport units `dvh`).
  - Keep interactive elements within standard tap target sizes (minimum 44x44px).
  - **Mandatory Common BottomSheet Component:** All modals, action sheets, sub-screens, and entry forms (e.g., Numpad, transaction editors, category/tag managers, settings, filter dialogs, invite screens, reports) **MUST** use the common `src/components/BottomSheet.tsx` component (`import { BottomSheet } from './BottomSheet'`). Never create ad-hoc `fixed inset-0` modal wrappers or custom sheet containers.
  - **Standardized BottomSheet Architectural Contract:**
    1. **React Portal Rooting:** Always renders directly to `document.body` via `createPortal`, isolating it from local container stacking contexts and z-index pollution.
    2. **Built-in Scroll Locking:** Automatically manages `useBodyScrollLock(isOpen)`—child components must not duplicate body scroll locking logic.
    3. **Zero Bottom-Gap on iOS PWA:** Built with bottom overflow extension (`-bottom-12 sm:bottom-auto`, `pb-16 sm:pb-safe`, `dvh` units) to strictly eliminate white gap artifacts on iPhone home indicator / safe areas.
    4. **Tactile Swipe-Down Dismiss:** Employs `useSwipeDownDismiss` with physics-based transform transitions, allowing users to effortlessly swipe down the drag handle or header to dismiss.
    5. **Consistent Layout Slots:** Standardize on supported props (`title`, `subtitle`, `icon`, `headerRight`, `footer`, `maxHeight`, `bodyClassName`). Keep primary actions (Save, Submit, Confirm) inside the `footer` slot or well above the safe zone.
  - **Graceful Degradation:** If browser APIs (e.g., Vibration API, AudioContext) are unsupported or blocked by permissions, fail silently without throwing runtime exceptions.

### 2. Execution Workflow
1. **Understand:** Analyze user intent, context, and existing architectural patterns.
2. **Scaffold:** Structure data models and user flow before writing visual styling.
3. **Refine:** Polish micro-interactions, acoustic feedback, and responsive edge cases.
4. **Validate:** Verify zero console errors, smooth 60fps animations, and zero viewport overflow.