# Portrait System — SVG Character Busts

**Code:** `src/ui/portraits/` · **Style Lab:** tab "Cast" at `/style-lab` · **Ticket:** OTA-44
**Status:** Style Lab prototype. Wiring into Inbox/EventCard is gated behind OTA-29.

This document explains how the busts are composed so anyone can edit an existing
character or add a new one without reverse-engineering the SVG. Read it top to
bottom once; after that the FaceParams table and the "Adding a character"
walkthrough are the parts you'll come back to.

---

## 1. What this is and what it is not

Head-to-mid-torso **bust cutouts** for the recurring cast, composed at render
time from shared SVG parts. One consistent style: **stylized-serious**. This is
a brutal political sim — Fashemu must read as menacing, never as a fun avatar.

Hard rules inherited from the plan (`docs/plan-svg-busts-and-share-card.md`):

- **No cute**: no big round eyes, no default smiles, no bobblehead proportions,
  no sticker outlines. Heavy-lidded level gazes, set mouths, real brow weight.
- **Bounded cast**: 5 named characters + 3 commissioner variants + 3 deputy
  variants = 11 compositions. Resist building a character-creator UI.
- **Monogram fallback is sacred**: any lookup failure renders
  `AvatarMonogram` (`src/ui/AvatarMonogram.tsx`). Never a blank box, never a
  crash. If a new character won't come out right in a couple of iterations,
  ship the monogram and move on.
- **Two render tiers**: a full illustration (≥ 48px) and a purpose-built
  compact mark (< 48px). They are different drawings driven by the same data
  (§9). Never scale the full drawing down to 28px — features vanish.

## 2. File map

```
src/ui/portraits/
  index.ts          public exports (BustPortrait, CastGallery, types)
  BustPortrait.tsx  the component: spec lookup, layer assembly, HEAD_FIT,
                    and the entire CompactBust small tier
  types.ts          BustSpec, FaceParams and every part-selection union type
  specs.ts          CAST_SPECS (one entry per composition), variant tables,
                    getSpec() resolution, ALL_CAST_ENTRIES (gallery list)
  palette.ts        SKIN_TONES, FABRIC_COLORS, BG_TINTS, shade()
  CastGallery.tsx   Style Lab tab: grid, size ladder, mock event card, mock inbox
  parts/
    heads.tsx       4 skull shapes incl. neck + ears + side shading
    faces.tsx       feature primitives (Brow/Eye/Nose/Mouth), facial hair,
                    and the single parameterized Face component
    hair.tsx        lowFade, greyTemp, naturalVolume, geleWrap, shortCrop
    headwear.tsx    Fila (abetí ajá), PlainCap (kufi)
    clothing.tsx    7 outfits, each as base layer + collar front layer
    accessories.tsx glasses, coral beads, lapel pin, earrings
    frame.tsx       background tint, keyline, square/arch shapes
```

## 3. Coordinate system — the facial grid

Everything is authored in one viewBox: **`0 0 100 120`** (portrait 5:6). The
rendered `<svg>` is `width={size} height={size * 1.2}`.

All parts agree on this grid. If you draw a new part, land on these lines:

| Landmark            | Coordinate               |
|---------------------|--------------------------|
| Face center         | x = 50 (everything mirrors around it) |
| Cranium top         | y ≈ 13                   |
| Hairline            | y ≈ 22–24                |
| Brow line           | y = 34                   |
| Eye line            | y = 39                   |
| Nose base           | y = 49                   |
| Mouth               | y = 56                   |
| Chin                | y = 63 (angular/slim) · 64 (oval) · 66 (broad) |
| Ears                | y 36–48 at the head's side edges |
| Neck                | x 43–57, ends y ≈ 77     |
| Shoulder/trapezius  | leaves the neck at y ≈ 72, shoulder points y ≈ 88 |
| Frame               | rect x4 y4 w92 h116, rx 6 (or arch) |

Light source is **from the left**: shadow crescents go on the right side of the
head, bridge shadow on the right of the nose, rim-light stroke on the left.
Keep this consistent or a new part will look pasted on.

## 4. Layer order (full tier)

`BustPortrait` assembles layers back-to-front. Order is the whole 3D illusion:

1. `FrameBackground` — per-character dark tint (`spec.bgTint`)
2. **Clothing base** — torso; drawn behind the head so the neck overlaps the collar
3. **Head** — includes neck (drawn first inside the head component, so the chin
   overlaps it), skull fill, right-side shadow crescent, left rim light, ears
4. **Hair** — wrapped in the HEAD_FIT transform (§5)
5. **Face** — the parameterized feature stack (§6); facial hair renders inside
   it, before the mouth, so lips stay visible over a beard
6. **Headwear** — fila/kufi over the hair, also HEAD_FIT-wrapped
7. **Clothing front** — collars/necklines/lapels that must overlap the neck base
8. **Accessories** — glasses at the eye line, beads at the neck base, etc.
9. `FrameKeyline` + grain rect (feTurbulence filter, unique id via `useId`)

Why clothing is split in two: the torso must sit *behind* the neck, but a
mandarin collar or lapel must close *over* it. Every entry in
`CLOTHING_COMPONENTS` has a partner in `CLOTHING_FRONT_COMPONENTS` (except
`teeUnderJacket`, whose crew neck is drawn low enough not to need one).

## 5. Head shapes and HEAD_FIT — why hair fits every skull

Four skulls in `parts/heads.tsx`, all with baked-in neck, ears, shading:

| HeadShape | Character read        | Widest span | Used by |
|-----------|-----------------------|-------------|---------|
| `broad`   | heavyset, jowly       | x ≈ 29–71   | Fashemu, elder commissioner, elder deputy |
| `oval`    | balanced default      | x ≈ 32–68   | Chief of Staff, SMJ, technocrat deputy |
| `angular` | tapered, younger      | x ≈ 33–67   | Dayo, technocrat commissioner, security chief |
| `slim`    | feminine, soft taper  | x ≈ 35–65   | Neo, gele commissioner |

**All head-hugging parts (hair, headwear, facial hair) are authored against the
oval head.** Each skull is a different width, so `BustPortrait` scales those
layers horizontally around the face center:

```ts
const HEAD_FIT = { broad: 1.12, oval: 1, angular: 0.96, slim: 0.92 }
// transform: translate(50 0) scale(fit 1) translate(-50 0)
```

This exists because of a real bug: the grey-temple hair and kufi cap were
visibly *smaller than the head* on broad-headed characters (the skull stuck out
past the hairline). If you add a fifth head shape, measure its cranium width
against oval's (x 33.5–66.5 at the hairline) and add a fit entry. Facial hair
gets the same treatment *inside* `Face` (the `fit` prop) because beards follow
the jaw; brows/eyes/nose/mouth do **not** scale — they stay on the standard
grid for every head, which keeps the cast's gaze consistent.

## 6. Faces are data — FaceParams

There are **no per-character face components**. One `Face` component
(`parts/faces.tsx`) renders a `FaceParams` object from the character's spec.
A new face is a params entry in `specs.ts`, not new path data.

```tsx
<Face skin={skin} p={spec.face} fit={HEAD_FIT[spec.headShape]} />
```

### Full parameter reference

Geometry values are viewBox units on the §3 grid. "Default" is what you get
when the field is omitted.

| Param | Default | What it does | Example use |
|---|---|---|---|
| `browY` | 34.2 | vertical brow position; higher number = lower brow = more glowering | Fashemu 34.4, security chief 34.8 (low), Neo 33.4 (high, open) |
| `browTilt` | 0.5 | angle: positive tilts inner ends DOWN (stern/knit). The left brow mirrors automatically | Dayo 2 (angry), security chief 1.8, CoS 0.3 (flat, unreadable) |
| `browW` | 6.4 | half-width of each brow | bushy elders 6.8, Neo 6 |
| `browWeight` | 2.1 | fill thickness — this is where menace lives | Fashemu 2.6, elder commissioner 2.7, women ~1.4–1.7 |
| `browColor` | ink `#17100C` | grey brows for elders | elder commissioner `#4E453C` |
| `browRaiseRight` | 0 | raises ONLY the right brow — the skeptic/insider asymmetry | Neo 1.2, SMJ 1.4 |
| `browKnit` | false | shadow wedge between the brows (glabella furrow) | Fashemu |
| `eyes` | `'normal'` | `'heavy'` drops the upper lid over the iris + adds a lid-fold stroke; `'wide'` opens the aperture and brightens the sclera | heavy = Fashemu/SMJ/elders; wide = Neo/Dayo |
| `lash` | false | thickens the upper-lid stroke (reads as lashes) and raises the default eye line to 38.8 | Neo, gele commissioner |
| `soft` | false | drops eye-socket shading from 0.4 to 0.18 opacity — without it women read haunted | Neo, gele commissioner |
| `eyeW` | 4.6 (4.7 lash) | eye half-width; smaller = narrowed | security chief 4.2 |
| `eyeY` | derived | override the eye line (heavy → 39.4, lash → 38.8, else 39.2) | rarely needed |
| `eyeOffset` | 6.8 (7.2 heavy) | distance of each eye from x=50 — wider-set for broad faces | usually leave derived |
| `noseW` | 7.2 | full nose width. Nigerian noses are broad; don't go under ~6.4 | Fashemu 9, elder 8.2, Neo 6.4 |
| `noseY` | 49 | nose base line | feminine faces 48.5 |
| `mouth` | `'set'` | `'set'` straight · `'frown'` corners drop 1.4 · `'smirk'` right corner up 1.2 · `'pressed'` no lower lip, thin line | frown = Fashemu, elder deputy; smirk = SMJ; pressed = CoS/Dayo |
| `mouthW` | 5.2 | mouth half-width | |
| `mouthY` | derived | 56, or 56.2 frown, or 55.5 tinted | elder commissioner 55.8 |
| `tintedLips` | false | warm lip color instead of skin-derived — subtle, feminine | Neo, gele commissioner |
| `facialHair` | `'none'` | see §7 catalog | |
| `foreheadCreases` | false | two faint horizontal creases at y 26–30 | all three elders |
| `underEyePouches` | false | age arcs under both eyes at y ≈ 43.5 | Fashemu, elder deputy |
| `nasolabialFolds` | false | deep nose-to-mouth-corner folds — heavy age/menace signal | Fashemu only |
| `smileLineRight` | false | single fold on the smirk side | SMJ |
| `cheekLine` | false | one faint cheek line — gaunt composure | Chief of Staff |
| `jawShade` | false | hard jaw shading strokes — military set | security chief |
| `chinCrease` | false | small crease under the mouth — clenched determination | Dayo |
| `beautyMark` | false | dot at (59.5, 49.5) | Neo |

### The feature primitives (for the rare bespoke need)

`Brow`, `Eye`, `Nose`, `Mouth` are exported from `parts/faces.tsx`. Design
notes if you ever touch them:

- **Features are filled shapes, not hairline strokes.** 1px strokes in a
  100-unit viewBox vanish below 48px. That was the first version's core
  mistake.
- **Eye**: socket shading ellipse → muted sclera (derived `shade(skin, 1.75)`,
  never a fixed light grey — fixed `#C7BBAC` turned ghostly on dark skin) →
  iris + glint → heavy ink upper lid → faint lower lid. The upper-lid stroke
  is the weight of the gaze; `heavy` drops it 1.1 units over the iris.
- **Nose**: bridge shadow stroke (right side, light-from-left), filled
  wing/base shape at 0.55 opacity, two nostril ellipses. Width via `noseW`.
- **Mouth**: filled upper lip (darker) + lower lip (lighter) + ink mouth line
  + under-lip shadow. Expression only moves the corner/mid control points.

## 7. Facial hair — catalog and the rules learned the hard way

Values in `FacialHair`: `none · greyMoustache · greyMoustacheGoatee ·
fullGreyBeard · darkGoatee · stubble`. All render inside `Face`, *before* the
mouth (lips draw on top), inside the `fit` transform (beards follow the jaw).
All take `mouthY` so they track the character's mouth position.

| Value | Shape | Worn by |
|---|---|---|
| `greyMoustache` | walrus moustache only | elder deputy (politician) |
| `greyMoustacheGoatee` | walrus + horseshoe goatee + soul patch | Fashemu |
| `fullGreyBeard` | solid jaw-wrapping mass + short sideburns + merged moustache | elder commissioner |
| `darkGoatee` | trim dark moustache + chin goatee | technocrat commissioner |
| `stubble` | translucent ink wash along the jaw | Dayo |

Rules (each one is a fixed defect, not taste):

1. **A moustache grows FROM the upper lip.** Its inner edge follows the mouth
   curve, its wings drape just past the mouth corners, its top stops under the
   nose. A floating lens-shape above the mouth reads as a smudge.
2. **A goatee is a connected horseshoe** running from below the mouth corners
   around the chin point, plus a soul patch. An isolated chin blob reads as a
   milk drip.
3. **A full beard is one solid mass** hugging the jawline, open above the
   mouth, extending slightly past the chin, with short sideburns bridging to
   the hairline. A thin band traced around the jaw reads as a chinstrap.
4. **Grey-on-dark-skin is a value problem.** Salt-and-pepper on dark skin must
   be a *dark* base (`#5A5148`–`#8E857C`) with sparse *light streaks*
   (`#9A9187`–`#B8AFA4`). A light base fill (`#B0A79C`) turns the beard into a
   pale mask. Streaks sparse — 3–5 strokes at ≤ 0.6 opacity; dense streaks
   read as scratches.

## 8. Hair, headwear, clothing, accessories

### Hair (`parts/hair.tsx`) — silhouette is the identity signal

At small sizes the hair/headwear silhouette does more identity work than the
face. Each style must be a *distinct shape*, not a recolored cap:

- `lowFade` — skull-hugging cap, crisp hairline, faded temples.
- `greyTemp` — same crop with solid grey temple patches + grey fleck strokes.
- `naturalVolume` — a proper afro: mass extends past the skull on every side
  (x 26–74, top y 4), irregular edge, pick-texture arcs inside.
- `geleWrap` — the gele head-tie. **Cut from its own rich fabric — the
  ACCENT color, not the outfit fabric** (`shade(accent, …)` for all folds).
  When it used the outfit color it read as hair/pompadour. Rounded tied folds
  leaning right + a side knot; blunt lobes, never spikes (spikes read as punk
  hair). Stitching along the brow edge picks up the outfit color.
- `shortCrop` — feminine crop, soft edge, baby-hair line.

### Headwear (`parts/headwear.tsx`)

- **`Fila` (abetí ajá — "like dog's ears").** Three things make it read, all
  discovered by failing at it twice:
  1. **Height** — the crown rises well above the skull (top near y = −3) with
     near-vertical sides. A low dome reads as a beret/beanie.
  2. **The pinch** — a diagonal crease from the top-left shoulder toward the
     band, with the right panel dropped into shadow past it (two-panel
     structure). The left flap is tucked UP (seam + light sliver).
  3. **The dog-ear** — the right flap folds DOWN over the ear **on the face**,
     so its inner edge shows against the skin, reaching to y ≈ 44 and extending
     past the head edge. If the flap sits behind the head silhouette it reads
     as a hair bun.
  Slim gold-embroidered band at the brow (dashes in `accent`).
- **`PlainCap` (kufi)** — shallow round cap, band, vertical ribbing.

### Clothing (`parts/clothing.tsx`)

All torsos share the trapezius geometry (§3) and shade folds with
`shade(fabric, ~0.65)` plus a highlight at `~1.2`. Catalog, base + front:

| ClothingStyle | Base silhouette | Front layer |
|---|---|---|
| `agbada` | widest shoulders in the cast (x 6–94), layered sleeve-drape folds, inner tunic panel | gold-embroidered concentric neckline arcs + stitch loops + center slit |
| `senator` | crisp structured suit, chest pocket | standing band collar + 3-button placket |
| `suit` | western two-piece | shirt V + notch lapels + tie (tie colored by `accent`) |
| `kaftan` | soft straight drape | mandarin collar + embroidered placket strip |
| `blazer` | tailored, slimmer | shell top in the V (from `accent`) + slim lapels |
| `teeUnderJacket` | light crew-neck tee, open jacket panels (jacket = `fabric`) | — |
| `uniform` | epaulettes with gold bars, breast pockets | collar points + gold button line |

### Accessories (`parts/accessories.tsx`)

Aligned to the grid, not to a character: glasses on the eye line (y ≈ 39),
beads/pins at the neck base (y ≈ 78–86), earrings at the lobes.
`roundGlasses` are gold wire (keep r ≤ 4.6 — bigger and the top arc collides
with the brows and reads as yellow eyebrows); `heavyGlasses` are dark
rectangles with a faint lens glint; `coralBeads` are the chieftaincy necklace
(two strands, chunky, highlight dot per bead); `lapelPin` and `earrings` use
`accent`.

## 9. The compact tier (< 48px)

`CompactBust` in `BustPortrait.tsx` is a **separate square drawing**
(`viewBox 0 0 64 64`), not a crop or scale-down. At 28px the full illustration
is an illegible smudge; identity at that size comes from:

1. **silhouette** — per-style hair/headwear blocks (tall leaning fila with a
   small dog-ear, gele lobes, afro mass, kufi, crop; same design rules as full
   tier, simplified)
2. **skin tone + background tint**
3. **one signature accessory** — thick-stroke glasses, 5 coral bead dots, gold
   hoop earrings
4. **a minimal face** — two filled brow bars, two dot eyes, one mouth stroke,
   nose hint. Strokes ≥ 1.1 units (≈ 0.5px at 28px).

It derives its expression from the same `FaceParams` — no second source of
truth: frown ⇐ `mouth === 'frown'`, smirk ⇐ `'smirk'`, stern brow angle ⇐
`browTilt ≥ 1.8`, heavy-lid dash ⇐ `eyes === 'heavy'`, feminine head shape ⇐
`lash`, facial hair ⇐ `facialHair` (simplified shapes, same catalog).

The compact head is one fixed shape (plus a feminine variant), so compact
hair/headwear doesn't need HEAD_FIT.

## 10. Palette and `shade()`

`palette.ts`:

- `SKIN_TONES`: `ebony #4C2E20 · dark #5C3A2B · mediumDark #7A4E3E ·
  medium #9E6B55 · olive #B88770`. Ebony was originally `#3D221A` and got
  lightened: on near-black skin every grey element (brows, beard, sclera)
  reads *lighter than the skin* and the face becomes a pale-marked mask.
  If you add a darker tone, re-check every grey against it.
- `FABRIC_COLORS`: named outfit colors (agbadaTeal, kaftanTan, uniformGreen…).
  Specs may also pass raw hex — `getFabricColor` falls through.
- `BG_TINTS`: very dark per-character frame tints (≈ L 8–12%). They carry
  identity at 28px, so keep them distinct hues, not just dark grey.
- **`shade(hex, f)`** is the whole shading system: `f < 1` scales toward
  black, `f > 1` lerps toward white. Every shadow/fold/highlight is derived
  from the base skin/fabric with it — never hand-pick a shadow color, or it
  breaks when someone changes the base.
  Conventions: folds/shadows `0.6–0.72`, deep shadow `0.45`, highlights
  `1.2–1.35`, derived sclera `1.75`.

Frame: rounded rect (rx 6 — the design-system max) or arch; keyline
`rgba(255,255,255,0.06)`; grain via an feTurbulence filter whose id comes from
`useId()` (a static id breaks when the same character appears twice on screen —
SVG ids are document-global).

## 11. Spec resolution and variants

```ts
BustPortrait({ charId, size, variantKey?, specKey?, shape? })
```

- `specKey` (Style Lab only) → direct `CAST_SPECS` lookup.
- `charId === 'commissioner'` → `COMMISSIONER_VARIANTS[variantKey]`, default
  v0. Five roles map onto three variants (works/transport → v0 woman-in-gele,
  finance/information → v1 bearded elder, environment → v2 young technocrat).
- `charId === 'deputy'` → `DEPUTY_VARIANTS[variantKey]`, default v0
  (technocrat/economist/reformer → v0, politician/loyalist/traditionalist →
  v1 elder, security-chief → v2 uniform).
- Anything unresolvable → `null` → monogram fallback.

The variant tables are deliberately dumb fixed maps — deterministic, no
hashing, easy to retune.

## 12. Adding a new character — walkthrough

Say the game grows a "Speaker of the House" (`speaker`):

1. **Spec first** (`specs.ts`). Compose from existing parts:

   ```ts
   speaker: {
     skinTone: 'mediumDark',
     headShape: 'oval',
     face: {
       browTilt: 0.8, browWeight: 2.2,
       eyes: 'heavy',
       noseW: 7.6,
       mouth: 'smirk', smileLineRight: true,
       facialHair: 'darkGoatee',
       foreheadCreases: true,
     },
     hair: 'greyTemp',
     headwear: 'plainCap',
     clothing: 'agbada',
     accessories: ['lapelPin'],
     fabricColor: '#3A2A5A',        // or a FABRIC_COLORS name
     accentColor: '#D4AF37',
     bgTint: '#161226',             // dark, but a distinct hue
   },
   ```

2. If it's a real `CharacterId`, extend the union in `src/state/types.ts` and
   add a monogram entry in `AvatarMonogram.tsx` (the fallback must exist).
3. Add a row to `ALL_CAST_ENTRIES` so the Style Lab gallery shows it.
4. **Look at it** — Cast tab, size ladder at 28/36/48/72/96/160. Squint test:
   distinct from every existing character at 28px? Right menace level at 96px?
5. Iterate params (a couple of rounds max). Only reach for new part drawing
   if no parts combination works — and then draw on the §3 grid, obey the §7/§8
   rules, and add the part to its ComponentMap + union type.
6. Gates: `npx tsc --noEmit`, `npx vitest run`, `npx biome check`, and the
   screenshot verification below.

## 13. Verification workflow (non-negotiable)

Visual work here ships only after being *looked at*:

1. Dev server running (`npm run dev`), Style Lab → Cast tab.
2. Temp Playwright script in the project root (deleted after) screenshots the
   tab **plus zoomed crops** of anything you changed — full-page shots hide
   exactly the defects that matter (a 96px tile hid "gold glasses reading as
   yellow eyebrows" and "beard reading as a pale mask").
3. Check the size ladder ends: 28px legibility and 160px craft.
4. Iterate at least once. The first render is never right.

## 14. Collected lessons (why the code looks the way it does)

Every one of these was a shipped defect first:

1. Hairline strokes for features → invisible below 48px. **Fill shapes.**
2. Scaling the full drawing to 28px → smudge. **Separate compact drawing.**
3. Hair/caps authored on one skull → don't fit others. **HEAD_FIT scaling.**
4. Fixed light colors (sclera, beard) on dark skin → ghost mask. **Derive from
   skin with `shade()`, light greys only as sparse streaks on a dark base.**
5. Gele in outfit color → reads as hair. **Gele gets its own fabric (accent).**
6. Pointed gele folds → punk hair. **Blunt rounded lobes.**
7. Low-dome fila → beret. **Tall pinched two-panel crown.**
8. Fila flap behind the head → hair bun. **Flap overlaps the face, inner edge
   against skin.**
9. Floating moustache/chin blob → smudge/milk drip. **Moustache from the lip,
   goatee as a connected horseshoe.**
10. Round glasses at r 5.6 → collide with brows, read as yellow eyebrows.
    **r ≤ 4.6, centered slightly below the eye line.**
11. Static SVG filter ids → collide when a character repeats. **`useId()`.**
12. Same face template for everyone → "all five read as the same person."
    **Every character needs one unmistakable silhouette feature** (fila+beads,
    afro, gele, heavy glasses + white senator collar, kaftan + wire glasses…).

## 15. Wiring notes (for the gated OTA-29 phase)

- Inbox swap: two `AvatarMonogram` call sites (28px row, 36px detail) →
  `BustPortrait`. `inboxEngine.ts` knows commissioner role / deputy key at
  message creation; carry it so `variantKey` can be passed.
- EventCard: add optional `speaker?: CharacterId` (+ `speakerVariant?`) to the
  EventCard type; 72–96px bust beside the title; populate only clearly
  character-voiced cards (Fashemu arc, CoS memos, SMJ) — never systemic events.
- Re-verify against the real screens in all three situational states
  (calm/crisis/storm) — the busts sit on different washes there.
