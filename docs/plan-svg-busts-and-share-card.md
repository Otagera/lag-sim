# Plan: SVG Character Busts (OTA-44) + Shareable End-State Card

**Status:** Approved plan, ready for implementation. Written 2026-07-03.
**Decisions locked with the user (do not re-litigate):**
1. The layered SVG parts system is **the** approach to OTA-44. Baked static images are a contingency only, not a workstream. The existing monogram (`src/ui/AvatarMonogram.tsx`) remains the permanent fallback.
2. Portraits and the shareable end-state card are both in this plan (Workstream A and B). V1 share artifact = **client-rendered image card** (SVG → PNG download / Web Share API). No server; the OTA-26 seeded-validation seam is noted but not built.
3. Bust placements for v1: **Inbox (28/36px) + EventCard (~72–96px)**. Ending-screen/share-card large variant is used in Workstream B.
4. Generic roles (`commissioner`, `deputy`): **parts-varied** — deterministic 2–3 variants per role derived from role/key, so different commissioners don't share a face.

**Gating:** Both workstreams are **Style Lab prototypes first**. Wiring into real game screens (Phases A4 and B3) is gated behind the fresh-player watch (OTA-29, Linear-only ticket) — build the prototype phases now, stop before wiring unless OTA-29 is confirmed closed.

---

## Read before starting

- `AGENTS.md` — engine purity rules, "questions before major decisions".
- `DESIGN.md` — **the current design system is "Coastal Lagos"** (bright coastal, 3 situational states, palette below). Ignore any older "Federal Gazette" references (including the stale row in AGENTS.md's docs table).
- `src/ui/StyleLab.tsx` — tab conventions (see "House conventions" below).
- Existing prototype folders for idiom: `src/ui/desk/`, `src/ui/research/`, `src/ui/goals/`, `src/ui/seals/`.

### House conventions (all prior SVG-cluster work follows these — do the same)

- Per-feature `keyframes.ts` exporting a CSS string, injected via `<style>` in JSX.
- Every animation gated by `useReducedMotion()` with a static fallback.
- Style Lab tab registration = extend the `TabId` union + `TABS` array (`src/ui/StyleLab.tsx:71` and `:1279`) + conditional render + import. Next free ids: `9` (Cast), `10` (Share).
- **Visual verification is mandatory**: temp Playwright `.mjs` script in project root against `localhost:5173` (dev server), take screenshots **including zoomed crops at the actual render sizes**, actually look at them, iterate at least once, delete the script after. Plain-but-correct output gets rejected; the user judges by looking.
- Legibility beats compactness; organic curves over mechanical lines; layered detail (relief highlights/shadows, material gradients) beats flat color for craft.
- Checks before reporting done: `npx tsc --noEmit` (or `npm run build`), `npx vitest run`, biome lint.

### Palette (Coastal Lagos — use tokens, never raw grays or pure #000/#fff)

Lagoon Teal `#1A9B8E` (calm accent) · Sky Blue `#3B9FE0` · Danfo Yellow `#F5C518` · Blood Red `#D7322A` (**crisis-reserved**) · Generator Blue `#5899D2` (**storm-reserved**) · Sweeper Green `#3AA048`. Fonts: Playfair Display (display), Georgia (prose), Archivo Narrow (UI). Kill list: no sepia/brown nostalgia, no decorative box shadows, no border-radius > 6px.

---

# Workstream A — SVG Character Busts (OTA-44)

## A0. Reference technique (already researched — do not spend time re-deriving)

Reference: `github.com/ubik23/charactercreator`. The transferable technique, confirmed by fetching the repo:

- Each part category is a **`<g>` layer with an id**; a character = an ordered stack of layers inside one `<svg>`. **Layer order is the whole 3D illusion** — back hair/collar behind head, face features above head, clothing over torso, foreground collar/accessory last.
- Paths carry **classes (or CSS variables) that drive coloring**, so skin tone / fabric color are swapped without touching path data.
- Parts are hand-optimized SVGs (minimal attributes), composed inline — no `<use>`/external refs needed.

Adapt, don't port: we implement parts as **typed React components returning `<g>` fragments**, with colors passed as props (skin tone, fabric, accent) rather than CSS classes — it's more idiomatic for this codebase and keeps everything tree-shakeable. If you want to study their actual part SVGs, fetch `https://github.com/ubik23/charactercreator` → `src/layer/`; but the drawing itself should be original (our style, our cast).

## A1. Tone spec — READ THIS TWICE

**Stylized-SERIOUS, not cute/whimsical.** This is a brutal political sim; the busts must carry menace and weight. Fashemu is a godfather who threatens the player — he must read as dangerous, not as a fun avatar. Concretely:

- **No**: big round eyes, smiles by default, bobblehead proportions, pastel skin, sticker-style thick outlines, rounded-blob shapes.
- **Yes**: naturalistic head proportions (slightly stylized is fine), heavy-lidded/level gazes, closed or set mouths, strong jaw/brow shadow shapes, dignified posture, fabric rendered with the layered-relief craft used in `src/ui/desk/` (gradient + highlight/shadow paths, not flat fills).
- Faces are **Nigerian**: a range of deep-to-medium skin tones (define 4–5 as named constants), Yoruba/Igbo facial character, natural hair / fila caps / gele where specified.
- Expression is per-character and **fixed** (no expression system in v1 — that's scope creep).
- Whimsy belongs to social/citizen voices elsewhere in the game, never to these power players.

## A2. Architecture — `src/ui/portraits/`

New folder (prototype-only until Phase A4):

```
src/ui/portraits/
  index.ts            // exports BustPortrait, CastGallery (Style Lab), types
  BustPortrait.tsx    // public component: composes parts for a CharacterId
  types.ts            // PartProps, SkinTone, BustSpec, VariantSeed
  palette.ts          // skin tones, fabric colors, background tints (from Coastal Lagos tokens)
  specs.ts            // CAST_SPECS: per-character part selection + colors + variant tables
  parts/
    heads.tsx         // head/neck/ear silhouettes (2–3 shapes: broad, oval, angular)
    faces.tsx         // brow+eye+nose+mouth feature sets (per-character expression baked in)
    hair.tsx          // hairstyles: low fade, grey-templed crop, natural volume, gele wrap
    headwear.tsx      // fila (abetí ajá), plain cap — worn by Fashemu and traditionalist deputy
    clothing.tsx      // agbada (layered, embroidered neckline), suit+tie, senator-style kaftan,
                      // blouse+gele pairing, uniform hint for security-chief
    accessories.tsx   // glasses (round wire, heavy rectangular), coral beads, lapel pin, earrings
    frame.tsx         // the bust cutout: rounded-rect (≤6px radius) or arch window, bg tint,
                      // optional .atm-grain overlay, 1px keyline
```

### Component contract

```tsx
<BustPortrait charId={CharacterId} size={number} variantKey={string?} shape={'square'|'arch'} />
```

- Root is a single `<svg viewBox="0 0 100 120">` (portrait aspect, head-to-mid-torso). All parts are drawn in that one coordinate space; `size` only scales the rendered box.
- **Two detail tiers**, switched by `size` (cutoff ~48px):
  - `full` (≥48px): all layers — clothing embroidery, accessory detail, hair texture strokes, subtle rim-light path.
  - `compact` (<48px): tighter head-crop viewBox (e.g. `0 8 100 84`), features simplified (merged brow+eye shapes, no embroidery), stroke weights bumped so it stays legible at 28px. **This is the same precedent as `LagosSealMark`'s compact mode <64px.** Do not just scale the full drawing down — 28px is the size that will actually be seen most, treat it as a first-class design target.
- Unknown/missing `charId` or spec → render `AvatarMonogram` (import it; never crash, never render an empty box).
- Static art — no animation needed in v1. If any idle animation is added later (blink etc.), it follows the keyframes.ts + `useReducedMotion()` convention. Don't add it now.

### Part composition (layer order, back to front)

1. frame background (tinted per character, from `palette.ts`)
2. torso/clothing base
3. neck + head silhouette (skin tone)
4. back-layer hair / headwear back
5. face features (brow, eyes, nose, mouth, facial hair)
6. front hair / fila / gele
7. clothing front layer (agbada neckline, collar, tie)
8. accessories (glasses, beads, lapel pin)
9. frame keyline + optional grain

Each part component: `({ skin, fabric, accent }: PartProps) => <g>…</g>`, pure, no state.

## A3. The cast — `specs.ts`

Names below are the canonical in-game identities (from `src/engine/inboxEngine.ts` and Style Lab fixtures). Keep each spec a data object (part keys + colors), not bespoke drawing code, so the parts stay reusable.

**Named characters (one fixed bust each):**

| CharacterId | Identity | Direction |
|---|---|---|
| `fashemu` | Chief B.O.A. Fashemu — the godfather | **The centerpiece; get him right first.** Older, heavyset, fila (abetí ajá) worn with authority, rich dark agbada with embroidered neckline, coral beads. Heavy-lidded level stare, set mouth, grey at temples. He should feel like he's appraising you. |
| `chief-of-staff` | Chief of Staff | 40s–50s, crisp senator-style kaftan or suit, rectangular glasses, composed/unreadable. The competent operator. |
| `neo` | Nneoma "Neo" Okonkwo — journalist ("Watching", "I have questions") | Woman, 30s, natural hair or short crop, blazer, direct skeptical gaze — the one person not intimidated. |
| `dayo` | Comrade Dayo Afolabi — youth organiser | Late 20s, open collar / activist tee under jacket, intense forward energy, the only one allowed anything near warmth — but earnest-serious, not cute. |
| `smj` | Hon. Seun Majekodunmi — party insider | Smooth, expensive plain kaftan, slight knowing asymmetry to the mouth (the friendly warning man), wire glasses. |

**Generic roles (parts-varied, deterministic):**

- `commissioner` — 5 concrete people exist (`CommissionerRole = works | finance | environment | transport | information`, each with a `name` in state). Build **3 commissioner variants** from the parts bin (e.g. woman + gele + glasses; older man + agbada; younger man + suit). Map role → variant with a fixed table in `specs.ts` (deterministic, no hashing needed: 5 roles → 3 variants).
- `deputy` — 7 `DeputyKey`s (`technocrat, politician, loyalist, reformer, traditionalist, economist, security-chief`). Build **3 deputy variants** (technocrat/economist/reformer share a bespectacled-professional variant; politician/loyalist/traditionalist share an agbada-establishment variant; security-chief gets a uniform-hinted variant). Fixed table again.
- `variantKey` prop selects the variant: callers pass `CommissionerRole` or `DeputyKey` when they have it; absent → variant 0. **Resolution stays inside `specs.ts`** — callers never pick parts.

Total drawn output: 5 named busts + 6 variant busts = **11 compositions from ~a dozen shared parts**. That's the bound. If the parts bin tempts you toward a full character-creator UI, stop — out of scope.

## A4. Style Lab tab — "Cast" (TabId 9)

`CastGallery` in `src/ui/portraits/` (or `src/ui/styleLab/`—match where Research/Goals/Seals tab panels live):

- Grid of all 11 busts at 96px with name + role captions (Archivo Narrow).
- A **size ladder row**: Fashemu (or a toggle for any character) at 28 / 36 / 48 / 72 / 96 / 160px side by side — this is the primary legibility check.
- A mock inbox row and a mock event-card header using the fixtures from `src/ui/styleLab/fixtures.ts`, so the busts are judged in context, not on white.
- Optional: `shape` toggle (square/arch) and situational-state background toggle (calm/crisis/storm tints behind the grid) to confirm the busts don't fight the crisis red wash.

### Definition of done for the prototype (STOP here pending OTA-29)

- All 11 render; typecheck/lint/tests green.
- Playwright screenshots of the tab **plus zoomed crops at 28px and 36px** reviewed and iterated at least once.
- Fashemu passes the squint test: menacing at 96px, *recognizable* at 28px.
- No real-politician likenesses; no real party iconography (no broom/umbrella/torch — same rule as `src/ui/seals/`).

## A5. Wiring (gated behind OTA-29 — separate PR)

1. **Inbox** (`src/ui/Inbox.tsx`): replace both `AvatarMonogram` call sites (28px row, 36px detail) with `BustPortrait`. Pass `variantKey` where the message context knows the commissioner role / deputy key — check what `InboxMessage` carries; if it only has `from: CharacterId`, add an optional `fromVariant?: string` to the message type with a default in `startingState`-adjacent code paths (`inboxEngine.ts` knows the role/key at message-creation time: `commissionerLabel(role, …)` and `DEPUTY_LABELS[deputyKey]` already exist there).
2. **EventCard** (`src/ui/EventCard.tsx`): `EventCard` events have **no sender field** today. Add optional `speaker?: CharacterId` (+ `speakerVariant?: string`) to the `EventCard` type in `src/state/types.ts`. Render a 72–96px bust beside the title when present. Populate `speaker` **only for clearly character-voiced cards** in a first pass: the Fashemu ask/arc cards, Chief-of-Staff memo cards, SMJ/insider cards. Do not force a speaker onto systemic events (FAAC shortfall, flooding). This is a data-touch across `src/data/events/*` — keep it to grep-able, obvious cases (~20–40 cards), list them in the PR description.
3. Keep `AvatarMonogram.tsx` in place as the fallback path — do not delete it.
4. Re-run the full visual verification against the **real** inbox and a real Fashemu event, all three situational states.

## A6. Stop rules (from the user, non-negotiable)

- If a character doesn't come out right in **a couple of iterations**, ship the monogram for that character and move on. No regeneration/over-build spiral.
- No expression variants, no animation system, no body poses, no player-facing customization. Bust cutout only.

---

# Workstream B — Shareable End-State Card

## B0. Concept

A brutal, story-rich ending is the shareable artifact ("my governor went bankrupt in week 27 because of overheads"). V1 = a **client-rendered image card** the player downloads or shares from the Legacy screen. No backend. Design the card so a future seed/validation footer can slot in (OTA-26), but build none of that.

## B1. Data — all of it already exists

From `LegacyScreen.tsx` / `buildLegacy` / `endingNarrator`:

- **Exit line**: `state.gameOverType` → the `exitReasons` map in `LegacyScreen.tsx:108` ("State Insolvency — Term Cut Short", "Removal by Assembly", …). This is the headline of the card.
- **Verdict headline**: `pickVerdictHeadline(state, gameOverType)` (`src/engine/endingNarrator.ts`).
- **Tenure**: `formatGameDate(state.week)` + week count; decisions made = `state.resolvedEvents.length`.
- **2–3 key moments**: `pickKeyMomentsForLegacy(state)` — this is the "story-rich" part; truncate each to one line.
- **3–4 stat grades**: reuse `grade()`/`gradeColor()` logic (extract them from `LegacyScreen.tsx` into a shared module rather than duplicating).
- **Seal**: `LagosSealMark` from `src/ui/seals/` as a low-opacity watermark — fictional marks only, never real party/INEC symbols.
- **Optional (if A is done)**: small Fashemu bust when the ending is godfather-flavored (`fashemuEndingPath` non-null) — he looms over your downfall. Skip cleanly if portraits aren't wired yet; don't create a hard dependency between workstreams.
- **OTA-26 seam**: reserve a footer line for `seed · hash` in the layout (render the game version + week for now). Comment it as the validation seam.

## B2. Architecture — `src/ui/share/`

```
src/ui/share/
  index.ts
  ShareCard.tsx        // pure SVG card component, props = ShareCardData (no store access)
  buildShareCardData.ts// (state: GameState) => ShareCardData — pure, unit-testable
  exportCard.ts        // svg element → PNG blob (serialize → Image → canvas.toBlob)
  ShareLabPanel.tsx    // Style Lab tab: fixture states + live preview + export button
```

- **Format**: one size for v1 — **1080×1350 (4:5 portrait)**, the format that works on WhatsApp/X/IG feeds. Render `ShareCard` as an SVG with a fixed viewBox; on-screen preview just scales it. (A 1200×630 landscape og-variant is explicitly v2.)
- **Look**: this is Coastal Lagos's most public artifact. Playfair Display display-serif headline, deep teal or storm-blue field depending on ending flavor (crisis endings may use the red **sparingly** — Blood Red is crisis-reserved, and a bankruptcy ending qualifies; don't use it for a two-terms-complete ending), grain via a feTurbulence filter (the SVG equivalent of `.atm-grain`), seal watermark off-center per the `WatermarkLayer` rule (only one mark may claim center). Game name + "played at <url-or-name>" footer for virality attribution.
- **Tone**: the card states the brutal fact plainly — exit line huge, verdict headline under it, key moments as a short indictment list. It should read like a front page about your downfall, not a scoreboard.

### `exportCard.ts` — the one genuinely tricky part

SVG → PNG via: `XMLSerializer` → `Blob` → `URL.createObjectURL` → `new Image()` → draw to `canvas` at 2× → `canvas.toBlob('image/png')`.

**Font pitfall (will silently produce wrong output if skipped):** an SVG drawn to canvas via `<img>` loads **no external resources** — stylesheets and font links inside it are ignored, so Playfair/Archivo will fall back to generic serif/sans in the exported PNG even though the on-screen preview looks right. Handle it: embed the needed font subsets as base64 WOFF2 inside a `<style>@font-face` block in the serialized SVG (fetch the font, `FileReader.readAsDataURL`, cache the data-URI at module level; subset only the weights actually used). Verify by **comparing the downloaded PNG against the preview screenshot** — that comparison is part of the definition of done, not optional. If embedding fights back for more than a session, the sanctioned fallback is Georgia/system serif *declared in the card's own styles* so preview and export match — a matching-but-plainer card beats a mismatched one.

**Share/download UX:** `navigator.share({ files: [pngFile] })` when `navigator.canShare` supports files (mobile), else anchor-download `lagos-legacy-week{N}.png`. Both behind one "Share your legacy" button. Sending to the OS share sheet is user-initiated publishing — fine, no confirmation needed beyond the click.

## B3. Style Lab tab — "Share" (TabId 10)

- 3–4 fixture `ShareCardData` cases: bankruptcy week 27 (the canonical brutal one), impeachment/removal, mass uprising, two-terms-complete (the rare triumphant one — visibly different flavor, teal not red).
- Live preview at display scale + real export button so the PNG pipeline is exercised from the Lab.
- Screenshot-verify the preview **and open the exported PNG** — both, every iteration.

### Definition of done (STOP here pending OTA-29 / core-ship)

- All fixtures render; export produces a correct 1080×1350 PNG with correct fonts; typecheck/lint/tests green; visual review done on preview + exported file.

## B4. Wiring (gated — after core ships)

- Add the "Share your legacy" button to `LegacyScreen.tsx`, calling `buildShareCardData(state)` → offscreen `ShareCard` → `exportCard`. No always-mounted offscreen SVG; mount on demand.
- Unit test `buildShareCardData` (pure function) against 2–3 constructed `GameState` fixtures — exit label mapping, grade math, key-moment truncation.

---

# Sequencing, deliverables, and review

**Order:** A2→A3→A4 (busts prototype) first — it's the higher-priority polish and Workstream B optionally decorates with it. Then B1→B3. Phases A5 and B4 are separate, gated PRs.

**Suggested commits:** (1) parts system + cast specs + Cast tab; (2) share card + export + Share tab; (3+) gated wiring PRs later.

**Out of scope for the implementing agent (do not touch):** real game screens (`Inbox.tsx`, `EventCard.tsx`, `LegacyScreen.tsx`, `types.ts`) until the gated phases; the events data files; anything server-side; the known `computeNodeLayout()` research bug (tracked separately).

**Hand back for review with:** the Style Lab screenshots (full + 28px/36px crops for busts; preview + exported PNG for the card), the list of any characters that fell back to monogram under the stop rule, and confirmation of typecheck/vitest/lint. The reviewing agent will check tone (menace test), size-ladder legibility, palette discipline (crisis red usage, no raw grays), fallback behavior, and the font-embed correctness of the exported PNG.
