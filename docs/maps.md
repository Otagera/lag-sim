# Maps Architecture

Two map UIs exist in the game, both currently **unplugged** from the app's render tree.
Source code is intact; re-plug by restoring `<MapPanel />` in `App.tsx`.

---

## 1. Maplibre Overview Map (`MapPanel.tsx`)

**File:** `src/ui/MapPanel.tsx`

An interactive choropleth map using Maplibre GL with OpenFreeMap vector tiles.
Renders the 20 Lagos LGA polygons from `public/data/lagos-lgas.geojson` with
per-LGA fill colour driven by the active layer (approval / infrastructure /
security / youth tension).

### Features

- Layer tabs switch the colour ramp
- Click an LGA to see its **district dossier** (stats + capital projects)
- Hover shows tooltip with approval sparkline
- Three map modes: `overview` (Maplibre tiles), `night` (Pixi.js city), `district` (procedural canvas)

### Data flow

```
GameStore.constituencyApproval
  → buildFillExpression() → Maplibre 'match' expression → LGA fill colour
GameStore.constituencyApproval + approvalHistory
  → hover tooltip (name + sparkline)
GameStore.capitalProjects
  → buildProjectsGeoJSON() → Maplibre circle layer
```

### MapPanel contains all three map views

| Mode | Component | Description |
|---|---|---|
| `overview` | Maplibre GL map | Vector tiles with LGA polygon overlay. Hidden when in night/district mode. |
| `night` | NightMapCanvas | Pixi.js isometric night city (see below). Shown on "Night" tab click. |
| `district` | DistrictCanvas | Canvas 2D procedural district scene for selected LGA. Shown on LGA click. |

---

## 2. Night Isometric City (`NightMapCanvas.tsx`)

**File:** `src/ui/map/NightMapCanvas.tsx`

A PixiJS isometric night view of Lagos. Real 20-LGA geography from GeoJSON
projected into iso grid space. Always night. Buildings, window lights, traffic,
generators, boats, landmarks, and LGA labels rendered as layered Pixi containers.

### Layer stack (top-to-bottom rendering order)

| # | Layer | File | What it draws |
|---|---|---|---|
| 1 | Ground | `groundLayer.ts` | LGA polygon fills (warm brown-grey) over deep blue-black water with animated lagoon/Atlantic shimmer |
| 2 | Roads | `roadsLayer.ts` | LGA boundary outline strokes |
| 3 | Buildings | `buildingsLayer.ts` | 3600 isometric building footprints coloured by zone type |
| 4 | Generators | `generatorsLayer.ts` | Warm-orange diesel glow dots in high-power-deficit zones (up to 250 dots) |
| 5 | Traffic | `trafficLayer.ts` | Moving 2px vehicle dots on road paths including Third Mainland Bridge |
| 6 | Boats | `boatsLayer.ts` | Ferries, cargo ships, and Makoko canoes on the lagoon (up to 40) |
| 7 | Landmarks | `landmarksLayer.ts` | Third Mainland Bridge, Lekki-Ikoyi A-frame, Apapa cranes, National Theatre, VI towers |
| 8 | Labels | `labelsLayer.ts` | 7 key LGA names always-visible; all 20 show name + approval% on hover |
| 9 | Lights | `lightsLayer.ts` | Per-building window dots (tint/alpha by zone trust+security), zone glow halos, water reflection shimmer |

### Projection pipeline

```
public/data/lagos-lgas.geojson  (20 LGA polygons, WGS84)
  → geoProjection.ts:loadLGAGeometry()
    → equirectangular lat/lng → normalized → iso (a,b) space
    → Douglas-Peucker simplification (threshold 0.25)
    → ProjectedLGA[]  (cached singleton)
```

### Stat → visual pipeline

```
GameStore.stats  (infrastructureScore, securityIndex, youthTension)
  → mapSelectors.ts:selectMapState()
    → ZoneMapState[] (one per CITY_ZONES, weighted toward weakest constituent)
    → per-zone: trust (from constituencyApproval), infrastructure, security, powerDeficit, crisisState
  → LightsLayer: window tint via TRUST_STOPS ramps, alpha via infra-litFraction
  → GeneratorsLayer: visibility via zone.powerDeficit thresholds
```

### Key types

- `MapLayer` (`src/ui/map/types.ts`) — interface with `init()`, `update()`, `destroy()`
- `MapState` (`src/state/mapSelectors.ts`) — `{ zones: ZoneMapState[], globalEvent, lens }`
- `MapLens` — `'approval' | 'infrastructure' | 'security' | 'youth'`

### Colour lenses

Window lights and zone glow tint shift by active lens:
- **Approval (default):** furious red (trust=0) → warm white-gold (trust=100)
- **Infrastructure:** critical red → adequate yellow → excellent green
- **Security:** dangerous red → moderate amber → safe cool-white
- **Youth tension:** calm teal → burning red at high tension

---

## 3. District Procedural View (`DistrictCanvas.tsx`)

**File:** `src/ui/DistrictCanvas.tsx`

A Canvas 2D top-down procedural scene for a single selected LGA. Shows
buildings, roads, trees, vehicles, and project pins on a 180×140 tile grid.
Uses deterministic seeding from `districtProfiles.ts` + `cityScene.ts`.

**Supporting files:**
- `src/data/districtProfiles.ts` — per-LGA seed, density, character flags
- `src/data/cityScene.ts` — deterministic scene generator from seed
- `src/data/cityPalette.ts` — colour constant values
- `src/ui/cityRenderer.ts` — Canvas 2D draw loops

---

## File Index

### Pixi night map (`src/ui/map/`)
| File | Role |
|---|---|
| `NightMapCanvas.tsx` | Orchestrator — init Pixi app, fetch GeoJSON, mount 9 layers |
| `buildings.ts` | Deterministic 3600-building generator (seeded PRNG) |
| `geoProjection.ts` | GeoJSON loading, lng/lat→iso projection, point-in-polygon |
| `projection.ts` | Iso→screen math (`TILE_W=8`, `TILE_H=4`, `FLOOR_H=5`) |
| `types.ts` | `MapLayer` interface |
| `layers/groundLayer.ts` | LGA land fills + water base + shimmer sprites |
| `layers/roadsLayer.ts` | LGA boundary strokes |
| `layers/buildingsLayer.ts` | 3600 isometric building columns |
| `layers/generatorsLayer.ts` | Generator glow dots (up to 250) |
| `layers/trafficLayer.ts` | Moving vehicle dots (212 total, 8 road paths) |
| `layers/boatsLayer.ts` | Lagoon boats (40 active) |
| `layers/landmarksLayer.ts` | 5 landmark silhouettes + bridge traffic |
| `layers/labelsLayer.ts` | LGA name + approval% labels |
| `layers/lightsLayer.ts` | Window dots + zone glow + water reflection |

### Maplibre + district (`src/ui/`)
| File | Role |
|---|---|
| `MapPanel.tsx` | Maplibre GL container, mode switcher, district dossier |
| `DistrictCanvas.tsx` | Procedural LGA scene (Canvas 2D) |
| `lagosGeoJSON.ts` | LGA key ↔ shapeName mapping + fill expression builder |
| `lagosMapStyle.ts` | Maplibre GL style spec (OpenFreeMap tiles) |
| `mapData.ts` | Layer config (approval/infra/security/youth) |
| `cityRenderer.ts` | Canvas 2D render loop for DistrictCanvas |

### Data layers
| File | Role |
|---|---|
| `src/data/lagosLayout.ts` | `CITY_ZONES` (8 land zones) + `ZoneType` enum |
| `src/data/districtProfiles.ts` | Per-LGA procedural scene seeds |
| `src/data/cityScene.ts` | Scene generator (buildings, roads, trees) |
| `src/data/cityPalette.ts` | Colour constants |
| `src/state/mapSelectors.ts` | `MapState` + `MapLens` types, `selectMapState()` |

### GeoJSON
| File | Role |
|---|---|
| `public/data/lagos-lgas.geojson` | 20 LGA polygon boundaries |
| `public/data/lagos-lcdas.geojson` | 37 LCDA subdivision boundaries |
