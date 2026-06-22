// Usage: node scripts/fetchLagosData.mjs
// Downloads real Lagos LGA boundaries (geoBoundaries CC-BY 4.0) and
// LCDA subdivision lines (OpenStreetMap via Overpass API).
// Writes to public/data/ — run once, then commit the output files.

import fs from 'fs/promises'
import osmtogeojson from 'osmtogeojson'

// Exact shapeName values as they appear in geoBoundaries NGA ADM2
// (hyphens → spaces or slashes in several cases)
const LAGOS_LGA_NAMES = new Set([
  'Agege', 'Ajeromi/Ifelodun', 'Alimosho', 'Amuwo Odofin', 'Apapa',
  'Badagry', 'Epe', 'Eti Osa', 'Ibeju Lekki', 'Ifako/Ijaye',
  'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
  'Mushin', 'Ojo', 'Oshodi/Isolo', 'Shomolu', 'Surulere',
])

// Lagos State bounding box — filters out same-named LGAs in other states
const LAGOS_BBOX = { minLon: 2.7, maxLon: 4.1, minLat: 6.3, maxLat: 6.8 }
function centroidInLagos(feature) {
  const coords = feature.geometry?.coordinates
  if (!coords) return false
  // Flatten nested coordinate arrays to get all [lon, lat] pairs
  const flat = []
  const flatten = (arr) => {
    if (typeof arr[0] === 'number') { flat.push(arr); return }
    arr.forEach(flatten)
  }
  flatten(coords)
  if (!flat.length) return false
  const lon = flat.reduce((s, p) => s + p[0], 0) / flat.length
  const lat = flat.reduce((s, p) => s + p[1], 0) / flat.length
  return lon >= LAGOS_BBOX.minLon && lon <= LAGOS_BBOX.maxLon &&
         lat >= LAGOS_BBOX.minLat && lat <= LAGOS_BBOX.maxLat
}

// ── Step 1: LGA boundaries from geoBoundaries ─────────────────────────────
console.log('Fetching geoBoundaries NGA ADM2 metadata...')
const meta = await fetch('https://www.geoboundaries.org/api/current/gbOpen/NGA/ADM2/')
  .then(r => r.json())

console.log(`Downloading LGA GeoJSON from: ${meta.gjDownloadURL}`)
const allLGAs = await fetch(meta.gjDownloadURL).then(r => r.json())

const lagosLGAs = {
  ...allLGAs,
  features: allLGAs.features.filter(f =>
    LAGOS_LGA_NAMES.has(f.properties.shapeName) && centroidInLagos(f)
  ),
}

await fs.mkdir('public/data', { recursive: true })
await fs.writeFile('public/data/lagos-lgas.geojson', JSON.stringify(lagosLGAs))
console.log(`✓ LGAs: ${lagosLGAs.features.length} features written to public/data/lagos-lgas.geojson`)

if (lagosLGAs.features.length !== 20) {
  const found = lagosLGAs.features.map(f => f.properties.shapeName).sort()
  const missing = [...LAGOS_LGA_NAMES].filter(n => !found.includes(n))
  if (missing.length) console.warn(`  Missing from dataset: ${missing.join(', ')}`)
}

// ── Step 2: LCDA boundaries from OSM Overpass ────────────────────────────
console.log('\nFetching LCDA boundaries from OSM Overpass (may take ~30s)...')
const overpassQuery = `[out:json][timeout:90];
area["name"="Lagos State"]["admin_level"="4"]->.lagos;
(
  relation["boundary"="administrative"]["admin_level"="7"](area.lagos);
);
out geom;`

let lcdaGeoJSON = { type: 'FeatureCollection', features: [] }
try {
  const osmData = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(overpassQuery)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).then(r => r.json())

  lcdaGeoJSON = osmtogeojson(osmData)
  console.log(`✓ LCDAs: ${lcdaGeoJSON.features.length} features written to public/data/lagos-lcdas.geojson`)
} catch (err) {
  console.warn(`  LCDA fetch failed (${err.message}) — writing empty file, map will still work without LCDA lines`)
}

await fs.writeFile('public/data/lagos-lcdas.geojson', JSON.stringify(lcdaGeoJSON))
console.log('\nDone. Commit public/data/*.geojson to avoid re-fetching.')
