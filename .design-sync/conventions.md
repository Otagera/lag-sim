# Federal Gazette — Lagos Governor Sim

**The Economist printed in Lagos.** Editorial authority with Nigerian green replacing trademark red. Every screen should feel like a serious intelligence product, not a game UI. Data density is aesthetic: tighter spacing makes numbers feel more consequential.

## No wrapping needed

This is a CSS-variable token system — no provider, no theme wrapper. Drop `<link rel="stylesheet" href="styles.css">` and every token is available.

## The styling idiom

**Style exclusively via `var(--*)` tokens.** Never hard-code hex colours. The token vocabulary:

| Role | Token |
|------|-------|
| Page background | `var(--background)` |
| Panel/card surface | `var(--surface)` |
| Hovered surface | `var(--surface-hover)` |
| Selected/active surface | `var(--surface-active)` |
| Default dividers + panel borders | `var(--border)` |
| Subtle dividers | `var(--border-subtle)` |
| Strong borders (emphasis) | `var(--border-strong)` |
| Primary text | `var(--text)` |
| Secondary / label text | `var(--text-secondary)` |
| Nigerian green (CTAs only) | `var(--accent-solid)` |
| Accent text on light bg | `var(--accent-text)` |
| Accent tint bg (banners) | `var(--accent-bg-subtle)` |
| Error fill / tint | `var(--error-9)` / `var(--error-3)` |
| Error text | `var(--error-11)` |
| Success fill / tint | `var(--success-9)` / `var(--success-3)` |
| Success text | `var(--success-11)` |
| Warning fill / tint | `var(--warning-9)` / `var(--warning-3)` |
| Warning text | `var(--warning-11)` |
| Info fill / tint | `var(--info-9)` / `var(--info-3)` |
| Info text | `var(--info-11)` |

Dark mode: add `.dark` to `<html>`. The same token names resolve to dark values automatically.

## Typography

**Two families, two jobs:**

- **Newsreader** (`font-family: 'Newsreader', Georgia, serif`) — display headings and EventCard titles ONLY. `font-weight: 600`, `line-height: 1.3`. Apply via the `.font-display` utility class.
- **Archivo Narrow** (`font-family: 'Archivo Narrow', 'Helvetica Neue', Arial, sans-serif`) — everything else: labels, stats, data, body, buttons. `font-variant-numeric: tabular-nums` always on data.

**Text scale (Major Third · 1.25 · base 13px):**

| Class / inline | Size | Use |
|---|---|---|
| `.label-caps` utility | 10px ALL CAPS, 0.08em tracking, `var(--text-secondary)` | Section headers, stat names, district labels |
| Default body | 13px | Data values, button labels, body copy |
| Section heading | 16px 600 | Panel titles |
| Display | 20px 600 Newsreader | Major event/headline titles |

## Shape, spacing, depth

- **Radius: 0 everywhere.** Form inputs and buttons: 2px maximum. No `border-radius` on panels, cards, or overlays.
- **No box shadows.** Hierarchy comes from 1px borders, spacing, and weight — never from shadow.
- **Spacing unit: 4px.** Use multiples: 4 / 8 / 12 / 16 / 24 / 32px.
- **Borders:** `1px solid var(--border)`. Use `var(--border-strong)` only for emphasis.
- **Surface nesting:** use `var(--surface)` when a panel needs to lift slightly from `var(--background)`. Do not nest surfaces inside surfaces.

## The signature move (one rule only)

A 2px horizontal rule in `var(--accent-solid)` (`#84ca9c`) appears ONLY at the top inner edge of EventCards — and nowhere else. **Do not apply `--accent-solid` as a structural border on any other element.** CTAs (primary buttons) use it as background fill.

## Map UI — how to design district panels and overlays

Map overlay panels are the main design surface for this project. Apply these rules:

**District tooltip / info card:**
```html
<div style="background: var(--surface); border: 1px solid var(--border); padding: 12px 16px;">
  <p class="label-caps">Alimosho</p>
  <p style="font-size: 13px; color: var(--text); font-variant-numeric: tabular-nums;">
    Approval: <strong>62%</strong>
  </p>
</div>
```

**Status badges for district health:** use semantic fills directly:
- Crisis / low: `background: var(--error-3); color: var(--error-11)`
- Warning / medium: `background: var(--warning-3); color: var(--warning-11)`
- Stable: `background: var(--success-3); color: var(--success-11)`
- Info / neutral: `background: var(--info-3); color: var(--info-11)`

**Control panel alongside the map:**
```html
<div style="background: var(--background); border-left: 1px solid var(--border); padding: 16px; width: 280px;">
  <p class="label-caps" style="margin-bottom: 8px;">District Summary</p>
  <!-- stat rows -->
  <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border-subtle);">
    <span style="color: var(--text-secondary); font-size: 11px;">Infrastructure</span>
    <span style="color: var(--text); font-variant-numeric: tabular-nums;">55 / 100</span>
  </div>
</div>
```

**Selected district highlight:** `background: var(--surface-active)` on the row or tooltip wrapper. No outline, no accent green, no shadows.

**Overlay on canvas:** float a `position: absolute` panel with `background: var(--surface); border: 1px solid var(--border)`. No backdrop blur, no opacity.

## Where to look

- Tokens: `styles.css` and its `_ds_bundle.css` import
- Typography utilities: `.font-display` and `.label-caps` in `styles.css`
- All color decisions: the token table above
