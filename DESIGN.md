# Design: Federal Gazette
**Date:** 2026-06-20 · **Status:** confirmed
**Archetype:** Sage · **Register:** product
**DNA:** Editorial Minimalism base + layout borrow from Data-Dense Pro · **Dominant axis:** color
**Scheme:** light-first; dark tokens provided for optional system-preference support

---

## Direction

The Economist printed in Lagos — editorial authority with Nigerian green replacing the trademark red.
Every decision in the game carries weight; the interface should feel like a serious intelligence product, not a game UI.
Data density is an aesthetic choice, not a compromise: the tighter the spacing, the more consequential each number feels.

---

## Signature move

A 2px horizontal rule in `--accent-solid` (`#84ca9c`) appears at the top inner edge of every EventCard — and nowhere else in the UI. No other element uses the accent color as a structural element.

---

## Type

- **Display:** Newsreader (Google Fonts) — used ONLY for EventCard titles and the game title in the header
  - Stack: `'Newsreader', Georgia, 'Times New Roman', serif`
  - Size: 20px (event card titles)
  - Weight: 600
  - Leading: 1.3
- **Body / Data:** Archivo Narrow (Google Fonts) — everything else: labels, stat values, faction names, buttons, body text
  - Stack: `'Archivo Narrow', 'Helvetica Neue', Arial, sans-serif`
  - Use tabular numerals: `font-variant-numeric: tabular-nums`
- **Scale (Major Third · 1.25 · base 13px):**
  - `--text-2xs`: 10px — UPPERCASE labels (stat names, faction names, section headers)
  - `--text-xs`: 11px — secondary metadata
  - `--text-sm`: 13px — body text, data values, button labels
  - `--text-base`: 16px — section headings (Archivo Narrow 600)
  - `--text-lg`: 20px — event card titles (Newsreader 600 only)
- **Label style:** ALL CAPS + 0.08em letter-spacing at `--text-2xs` for stat labels, faction names, section headers
- **Leading:** 1.5 for body text; 1.3 for display; 1.2 for dense data cells

---

## Color tokens

Light scheme:

```css
:root {
  --neutral-1: #fcfdfc;
  --neutral-2: #f8f9f8;
  --neutral-3: #eef1ef;
  --neutral-4: #e5e9e6;
  --neutral-5: #dae0dc;
  --neutral-6: #cdd4cf;
  --neutral-7: #bec6c0;
  --neutral-8: #a4aea7;
  --neutral-9: #afbbb2;
  --neutral-10: #9da8a0;
  --neutral-11: #5f6561;
  --neutral-12: #2b2f2c;
  --accent-1: #fafefb;
  --accent-2: #f4fbf6;
  --accent-3: #e6f5ea;
  --accent-4: #d9eedf;
  --accent-5: #c9e7d2;
  --accent-6: #b7ddc3;
  --accent-7: #a2d1b1;
  --accent-8: #82ba95;
  --accent-9: #84ca9c;
  --accent-10: #74b68b;
  --accent-11: #486d55;
  --accent-12: #203326;
  --accent-on-solid: #061009;
  --error-3: #ffebe9;
  --error-9: #c56c65;
  --error-11: #86534f;
  --success-3: #e6f6e6;
  --success-9: #84cc86;
  --success-11: #486e49;
  --warning-3: #f6f0e4;
  --warning-9: #ceb47e;
  --warning-11: #6f6144;
  --info-3: #e7f2fa;
  --info-9: #7aabce;
  --info-11: #4c677a;
  --background: var(--neutral-1);
  --surface: var(--neutral-2);
  --surface-hover: var(--neutral-3);
  --surface-active: var(--neutral-4);
  --border-subtle: var(--neutral-6);
  --border: var(--neutral-7);
  --border-strong: var(--neutral-8);
  --text-secondary: var(--neutral-11);
  --text: var(--neutral-12);
  --accent-bg-subtle: var(--accent-3);
  --accent-solid: var(--accent-9);
  --accent-solid-hover: var(--accent-10);
  --accent-text: var(--accent-11);
}
```

Dark scheme (for `[data-theme="dark"]` or `@media (prefers-color-scheme: dark)`):

```css
[data-theme="dark"] {
  --neutral-1: #121312;
  --neutral-2: #191a19;
  --neutral-3: #212321;
  --neutral-4: #282b29;
  --neutral-5: #2f3431;
  --neutral-6: #383d39;
  --neutral-7: #444b46;
  --neutral-8: #5a635d;
  --neutral-9: #afbbb2;
  --neutral-10: #c2cec6;
  --neutral-11: #b2b9b4;
  --neutral-12: #e5e9e6;
  --accent-1: #111312;
  --accent-2: #161b17;
  --accent-3: #1a251e;
  --accent-4: #1e2f23;
  --accent-5: #203929;
  --accent-6: #23442f;
  --accent-7: #295439;
  --accent-8: #386e4c;
  --accent-9: #84ca9c;
  --accent-10: #9addb0;
  --accent-11: #9bc3a7;
  --accent-12: #d7efde;
  --accent-on-solid: #061009;
  --error-3: #2d1d1c;
  --error-9: #c56c65;
  --error-11: #e0a7a1;
  --success-3: #1a261a;
  --success-9: #84cc86;
  --success-11: #9bc49b;
  --warning-3: #262219;
  --warning-9: #ceb47e;
  --warning-11: #c5b696;
  --info-3: #1b2329;
  --info-9: #7aabce;
  --info-11: #9fbcd1;
  --background: var(--neutral-1);
  --surface: var(--neutral-2);
  --surface-hover: var(--neutral-3);
  --surface-active: var(--neutral-4);
  --border-subtle: var(--neutral-6);
  --border: var(--neutral-7);
  --border-strong: var(--neutral-8);
  --text-secondary: var(--neutral-11);
  --text: var(--neutral-12);
  --accent-bg-subtle: var(--accent-3);
  --accent-solid: var(--accent-9);
  --accent-solid-hover: var(--accent-10);
  --accent-text: var(--accent-11);
}
```

Contrast report (WCAG 2.x — all PASS):
```
PASS  [light] neutral-11 on neutral-2: 5.65:1   (AA body)
PASS  [light] neutral-12 on neutral-2: 12.88:1  (AAA)
PASS  [light] neutral-12 on neutral-3: 11.98:1  (AAA)
PASS  [light] accent-11 on neutral-2: 5.52:1    (AA)
PASS  [light] accent-on-solid on accent-9: 10.05:1
PASS  [dark]  neutral-11 on neutral-2: 8.79:1   (AAA)
PASS  [dark]  neutral-12 on neutral-2: 14.28:1  (AAA)
PASS  [dark]  accent-11 on neutral-2: 8.96:1    (AAA)
```

---

## Space, shape, depth

- **Spacing scale:** 4px unit — `space-1: 4px` / `space-2: 8px` / `space-3: 12px` / `space-4: 16px` / `space-6: 24px` / `space-8: 32px`
- **Radius:** 0 (zero) everywhere. Form inputs and buttons: 2px maximum.
- **Borders:** 1px solid `--border` for section dividers and panel edges. No box shadows.
- **Structure rule:** Hierarchy comes from spacing, weight, and 1px rules — never from card shadows or colored backgrounds. Surfaces use `--surface` only when a panel needs to lift slightly from `--background`; do not nest surfaces.
- **Accent rule:** The 2px green rule appears only on EventCard tops (the signature move). No other element uses `--accent-solid` as a border or background.

---

## Motion

- **Timing:** micro 100ms / standard 150ms
- **Easing:** `ease-out` for all entries; `ease-in` for exits
- **Allowed:** opacity and `color` transitions on hover/focus states; button `background-color` transitions (150ms); no layout animation
- **Never:** transform-based entrance animations; ambient motion; bounce or spring easing; animating width/height; transitions longer than 200ms
- **prefers-reduced-motion:** `transition: none` for all transitions inside the media query

---

## Font loading (index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Archivo+Narrow:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Never (this project's kill list)

- No `rounded-lg` (or any radius > 2px)
- No box shadows (`shadow-*`)
- No pure `#000000` or `#ffffff` — always use token variables
- No Tailwind `bg-gray-*` / `text-gray-*` once token migration begins
- No gradient backgrounds
- The 2px green rule (`--accent-solid` border) appears ONLY on EventCard top — nowhere else
- No second accent usage: `--accent-solid` is for the EventCard rule and CTA buttons only
- Error/warning states use `--error-9`, `--warning-9` — not the accent green
- No Inter, Roboto, or Open Sans as display font
- No ambient animation or motion between state changes

---

## Open questions

- Light vs. dark as default: the game is currently dark-mode-only (`bg-gray-900`). Federal Gazette is light-first. Decision needed before implementation: ship light only, dark only, or both with a toggle.
- Google Fonts CDN vs. self-hosted: CDN is faster to ship but adds external dependency.
- Tailwind custom theme integration: tokens can be added to `tailwind.config` as CSS variable references so Tailwind utilities still work.
