# Design: Coastal Lagos
**Date:** 2026-06-26 · **Status:** locked · **Supersedes:** Federal Gazette (2026-06-20)
**Archetype:** Sage · **Register:** product
**DNA:** State-responsive atmospheric UI — light coastal base washed with situational colour and weather
**Scheme:** light-first (coastal calm); situational dark for storm state only

---

## The Art Direction in One Line

A fresh, light, coastal Lagos that the game's events wash with situational colour, mood, and weather — calm and bright by default, charged or storm-struck as the state demands.

---

## The Core Concept

Lagos is a coastal city. On an ordinary day it is **bright, airy, fresh** — lagoon light, sky, sea air. The UI's resting state is that. But Lagos is a city of moods. Events have colour drawn from a Lagosian's lived palette. The UI is **state-responsive**: the calm bright base is washed with situational colour, mood, and even weather as the game state changes. The interface *feels* what the city feels.

This is web-native design doing what CSS does best: light + colour + motion responding to state. It needs no painted art assets and achieves something painted UI cannot — an environment that breathes with the moment.

---

## Kill List

- No brown / sepia / colonial-archive warmth — Lagos is bright and electric, not nostalgic-muddy
- No Newsreader, no Federal Gazette palette (`#84ca9c` green, `#fcfdfc` background)
- No box shadows as decoration — elevation via layered shadow tokens only
- No Tailwind `bg-gray-*` / `text-gray-*` — always use CSS custom property tokens
- No `rounded-lg` or border-radius > 6px
- No Inter, Roboto, or Open Sans
- No ambient animation except the atmospheric shimmer and rain (both controlled by ThemeProvider)
- No dark mode toggle — dark state is *earned* by storm, not switched
- No pure `#000000` or `#ffffff` — always token variables
- Error/warning use `--error-9`, `--warning-9` — not the accent teal

---

## Situational System

Three states. ThemeProvider sets `html[data-situation]`. CSS overrides fire automatically. Every component transitions for free.

| State | Trigger | Feel | `--dur` |
|-------|---------|------|---------|
| `calm` | Default | Bright coastal, teal/sky | `900ms` |
| `crisis` | Cash < 15 · Trust < 40 · PC < 20 · faction ≤ 20 | Red pressure wash bleeds in | `900ms` |
| `storm` | `riotModeActive` · `consecutiveBankruptWeeks ≥ 2` | Dark, generator-blue, animated rain | `240ms` |

Storm is **earned** — the UI dims, rain falls, the city goes dark. The 240ms hit is intentional: shocks should hit.

---

## Palette

### Base (calm — bright coastal)

| Token | Value | Meaning |
|-------|-------|---------|
| `--background` | `#EDF5F8` | Sea-light off-white — coastal morning |
| `--surface` | `#FFFFFF` | Clean white card surface |
| `--surface-2` | `#F1F8FC` | Elevated / secondary surface |
| `--text` | `#13201E` | Deep near-black ink |
| `--text-secondary` | `#3C5868` | Subdued text |
| `--accent-solid` | `#1A9B8E` | Lagoon teal — primary accent |
| `--border` | `rgba(26,155,142,.18)` | Teal-tinted, gossamer |

### From "The Colours of Lagos"

| Colour | Hex | Use |
|--------|-----|-----|
| Lagoon Teal | `#1A9B8E` | Calm resting accent, CTA buttons |
| Sky Blue | `#3B9FE0` | Info, secondary accent |
| Danfo Yellow | `#F5C518` | Urgency indicators |
| Blood Red | `#D7322A` | Crisis accent, danger states |
| Generator Blue | `#5899D2` | Storm accent, power/systems |
| Sweeper Green | `#3AA048` | Success, civic wins |

### Crisis overrides (`html[data-situation="crisis"]`)

```css
--background: #FFF2EE;  --accent-solid: #D7322A;
--border: rgba(215,50,42,.2);  --text: #1C0808;
```

### Storm overrides (`html[data-situation="storm"]`)

```css
--background: #0C1720;  --surface: #101C28;
--accent-solid: #5899D2;  --text: #BDD0E0;
--dur: 240ms;
```

Full override tables are in `src/index.css`.

---

## Typography

| Role | Font | Fallback |
|------|------|---------|
| Display (event titles, game title, key headings) | Playfair Display | Georgia, Times New Roman, serif |
| Body / Prose (event body text, long-form) | Georgia | Times New Roman, serif |
| UI (labels, stats, buttons, nav, data) | Archivo Narrow | Helvetica Neue, Arial, sans-serif |

**Scale (major third · 1.25 · base 13px):**

| Token | Size | Use |
|-------|------|-----|
| `--text-2xs` | 10px | ALL CAPS labels — stat names, section headers |
| `--text-xs` | 11px | Secondary metadata |
| `--text-sm` | 13px | Body UI text, data values, button labels |
| `--text-base` | 16px | Section headings (Archivo Narrow 600) |
| `--text-lg` | 20px | Secondary display |
| `--text-xl` | 26px | Event card titles (Playfair Display) |
| `--text-2xl` | 30px | Primary display headings |

**Rules:**
- Label style: ALL CAPS + `0.08em` letter-spacing at `--text-2xs`
- Prose leading: 1.75 (event body — legibility first)
- Display leading: 1.25
- Tabular numerals on all stat values: `font-variant-numeric: tabular-nums`
- `.font-display` class applies Playfair Display
- `.prose` class applies Georgia at 15px / 1.75 leading

---

## Space, Shape, Depth

- **Spacing:** 4px unit — `4 / 8 / 12 / 16 / 24 / 32 / 48px`
- **Radius:** 6px for cards / panels. 2px for buttons. 0 for data cells / stat rows.
- **Borders:** 1px solid `--border`. No hard black borders. Depth via shadow, not border weight.

**Elevation:**

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05)` | Card resting |
| `--shadow-md` | `0 4px 20px rgba(0,0,0,.09)` | Card hover / raised panel |
| `--shadow-atm` | `0 1px 2px rgba(0,0,0,.04), 0 4px 14px rgba(0,0,0,.06), 0 16px 56px rgba(0,0,0,.07)` | Atmospheric depth |

**Atmospheric depth technique:** Subtle radial gradient on card surfaces (faint accent tint at top-left → pure white), layered box-shadows, optional grain overlay (SVG fractalNoise ~4% opacity, `mix-blend-mode: soft-light`) via `.atm-grain` class.

**Signature move:** A 1px horizontal gradient rule (`transparent → var(--accent-solid) → transparent`) separating the EventCard kicker from its title — and only there.

---

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--dur-fast` | `200ms` | Hover micro-interactions |
| `--dur-norm` | `300ms` | Choice commit, modal open |
| `--dur` | `900ms` default / `240ms` storm | Atmospheric mood transitions |
| `--ease-out` | `cubic-bezier(0,0,.4,1)` | Entries, expansions |
| `--ease-spr` | `cubic-bezier(.16,1,.3,1)` | Banner arrivals, panel open |

**Transition rule:** Mood shifts are atmospheric (900ms). Storm hits fast (240ms). `--dur` switches automatically via `html[data-situation]`.

**Required motion:**
- Full-UI colour/background transition on situation change (CSS custom property cascade)
- DiagnosisBanner: `banner-arrive` keyframe — never appears statically
- Choices: `translateY(-2px)` hover lift, scale-down commit, consequence fade-in
- Rain: CSS keyframe on storm state (`sl-rainfall` — 60 drops, z-index 15)
- Numbers: count-up interpolation on stat change (RAF-based, 700ms)
- Stat at threshold: `stat-warn` pulse animation (3 cycles)
- Calm ambient: faint radial shimmer (`tp-shimmer`, 7s, `mix-blend-mode: overlay`)

---

## Layout

```
[StatusBar — sticky top: Seal · Title · Year/Month · Treasury · Trust · PC · Research button · Next Week]
[DiagnosisBanner — conditional, slides in on crisis/storm, hidden on calm]
[Progress hairline — 2px, term completion left-to-right]
[Scroll area — max-width 720px centred]
  [EventCard — hero, full width, Playfair Display title]
[Dock — sticky bottom: Inbox | Economy | Factions | People | State of the State]
[Panel overlay — slides up from Dock tap]
```

**No sidebar.** Everything except vital signs and the current event lives behind the Dock.
**Research** opens as a full-screen standalone overlay (not a bottom sheet).
**State of the State** — Dock destination showing all stats in full.
**Simple/Detailed mode toggle** — removed. BudgetPanel always shows full detail.

---

## Component Hierarchy

```
Primitives (src/ui/components/)
  Surface · Button · Stat · Pill · Banner · Typography (Kicker/Heading/Prose)
  Seal · Badge · Tab · RainLayer

Composed game (src/ui/game/)
  DiagnosisBanner · StateOfTheState

Screens (src/ui/)
  WelcomeScreen · ArchetypeSelectionScreen · DeputySelectionScreen
  HandoverNotesModal · GoalSelectionScreen · WelcomeModal
  LagosHerald · LegacyScreen

Panels (src/ui/ — opened from Dock)
  Inbox · BudgetPanel · FactionPanel · DeputyPanel · NPCPanel · CabinetPanel

Full-screen overlays
  ResearchTree
```

**Rule:** Screens compose components. Changing a token restyles the game. No hardcoded colours in screens.

---

## Contrast (WCAG AA)

| Pair | Ratio | Result |
|------|-------|--------|
| `--text` on `--background` | ~14:1 | AAA |
| `--text-secondary` on `--background` | ~5.5:1 | AA |
| `--accent-on-solid` on `--accent-solid` | >4.5:1 | AA |
| Crisis: `--text` on crisis `--background` | ~13:1 | AAA |
| Storm: `--text` (`#BDD0E0`) on `#0C1720` | ~9:1 | AAA |

---

## The Test

Flip calm → crisis → storm. Does the UI visibly, atmospherically *transform*? Does the bright coastal calm feel fresh (not brown)? Does the storm earn its darkness? Does it feel like a *game*, not an app?

If yes: art direction holds. Expand situational states incrementally (election watermarks, godfather tension, triumph) using the same system.

---

*Art direction locked 2026-06-26. Any deviation edits this file first.*
