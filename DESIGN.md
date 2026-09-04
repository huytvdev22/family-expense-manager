# DESIGN GUIDELINES (design.md)

## Core Philosophy: Anti-Generic AI
Most AI-generated UIs suffer from uniform blandness: dark slate/indigo neon gradients, rounded cards with heavy drop shadows, meaningless circular progress rings, and generic dashboard layouts. Software should feel like an intentional, physical, and crafted tool—not a template.

---

## 1. Aesthetic Direction & Tone
- **Calm & Editorial:** Favor materials over synthetic effects. Use warm papers, linen, muted ceramics, deep charcoal, terracotta, sage, and warm amber rather than stark #000 or saturated electric blues.
- **Physicality & Tactility:** Interfaces should evoke tangible objects (Braun calculators, Dieter Rams audio equipment, Field Notes notebooks, Teenage Engineering pocket operators).
- **Restraint Over Decoration:** Every visual element must convey information. No decorative badges, empty stats cards, or arbitrary AI sparkle icons (`✨`) unless representing actual generative actions.

---

## 2. Typography & Hierarchy
- **Editorial Pairing:** Combine a grounded grotesque/humanist sans-serif for UI labels with a distinct tabular monospace for numbers, dates, codes, and financial ledger data.
- **Tabular Numerics:** Always use `tabular-nums` for counters, balances, and financial data so digits align vertically across lists and rows.
- **Clear Information Weight:** Differentiate hierarchy through size and opacity (`opacity-60`, `font-mono text-xs uppercase`) rather than introducing new font weights or bright colors.

---

## 3. Interaction & Micro-Sensory Feedback
- **Zero-Friction Flows (The 3-Second Rule):** Frequent daily tasks (e.g., logging an expense) must never require navigating dropdown menus, modal overlays, or multiple screens.
- **Custom In-App Numpads:** For numerical input on mobile devices, use dedicated in-app numpads instead of summoning the operating system's software keyboard, which disrupts layout stability.
- **Acoustic & Haptic Micro-Interactions:** - Use brief, mechanical clicks (via Web Audio API synthesize: gentle sine/triangle waves, 30–80ms) to simulate physical key depressions.
  - Pair actions with low-latency haptic vibrations (`navigator.vibrate(10)`).
- **1-Tap Frequent Presets:** Provide horizontal quick-action ribbons for common real-world operations rather than open-ended text fields.

---

## 4. Layout Architecture: Responsive Duality
- **Mobile Experience (Handheld Context):**
  - Ergonomic thumb-zone accessibility: primary triggers and navigation must live at the screen's bottom (Bottom Dock).
  - Horizontal scrolling carousels for tag selection to preserve vertical screen real estate.
  - Strict containment: prevent awkward viewport scrolling during single-task input.
- **Desktop Experience (Workspace Context):**
  - Transform from input-centric to analysis-centric.
  - Multi-column ledger view, inline spreadsheet editing, and bilateral balance sheets.
  - Minimalist typographic data tables over noisy multi-color pie charts.

---

## 5. Visual System & State Guidelines
- **Borders & Separation:** Prefer subtle hairline borders (`border-stone-200 / border-stone-800`) or dashed ledger dividers over heavy drop-shadow cards.
- **Status Badges:** Use subtle tinting with tone-on-tone borders (`bg-emerald-50 text-emerald-800 border-emerald-200`) instead of saturated pill tags.
- **Empty States:** Provide calm, human copy that conveys reassurance rather than illustrative vector empty-state graphics.