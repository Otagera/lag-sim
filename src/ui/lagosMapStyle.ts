import type { StyleSpecification } from 'maplibre-gl'

// Custom illustrated style for Lagos Governor Sim.
// Uses OpenFreeMap vector tiles (free, no API key).
// Color palette mirrors the warm illustrated Lagos reference images:
//   land = ochre sand, water = vivid teal, roads = bright yellow, buildings = terracotta.
// Cast to unknown first to avoid fighting Maplibre's deeply recursive expression types.
export const LAGOS_ILLUSTRATED_STYLE = {
  version: 8,
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    planet: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  layers: [
    // ── Background ──────────────────────────────────────────────────────────
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#F2D49B' },
    },

    // ── Water ───────────────────────────────────────────────────────────────
    {
      id: 'water-body',
      type: 'fill',
      source: 'planet',
      'source-layer': 'water',
      paint: { 'fill-color': '#4EC8D4' },
    },
    {
      id: 'waterway-line',
      type: 'line',
      source: 'planet',
      'source-layer': 'waterway',
      paint: {
        'line-color': '#4EC8D4',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 12, 3],
      },
    },

    // ── Land cover ──────────────────────────────────────────────────────────
    {
      id: 'landcover-green',
      type: 'fill',
      source: 'planet',
      'source-layer': 'landcover',
      filter: ['match', ['get', 'class'], ['grass', 'wood', 'scrub', 'wetland'], true, false],
      paint: { 'fill-color': '#8DC870', 'fill-opacity': 0.7 },
    },
    {
      id: 'landuse-green',
      type: 'fill',
      source: 'planet',
      'source-layer': 'landuse',
      filter: ['match', ['get', 'class'],
        ['park', 'grass', 'forest', 'meadow', 'pitch', 'stadium', 'recreation_ground'],
        true, false],
      paint: { 'fill-color': '#8DC870', 'fill-opacity': 0.8 },
    },
    {
      id: 'landuse-urban',
      type: 'fill',
      source: 'planet',
      'source-layer': 'landuse',
      filter: ['match', ['get', 'class'],
        ['residential', 'commercial', 'retail', 'industrial'],
        true, false],
      paint: { 'fill-color': '#E8C89E', 'fill-opacity': 0.5 },
    },

    // ── Roads ───────────────────────────────────────────────────────────────
    // Minor streets
    {
      id: 'road-minor',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['minor', 'service', 'track', 'path'], true, false],
      minzoom: 12,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#E8D8C0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 16, 3],
      },
    },
    // Secondary / tertiary — casing
    {
      id: 'road-secondary-casing',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#C4A870',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 8],
      },
    },
    // Secondary / tertiary — fill
    {
      id: 'road-secondary',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#F0E4C0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.8, 14, 5],
      },
    },
    // Primary / motorway — casing
    {
      id: 'road-primary-casing',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#D4922C',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2.5, 14, 13],
      },
    },
    // Primary / motorway — fill (bright yellow matching illustrated maps)
    {
      id: 'road-primary',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#F0C840',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1.5, 14, 9],
      },
    },
    // Railway — dashed blue-gray
    {
      id: 'railway',
      type: 'line',
      source: 'planet',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'rail'],
      paint: {
        'line-color': '#88A8C0',
        'line-width': 1.5,
        'line-dasharray': [6, 4],
      },
    },

    // ── Buildings ───────────────────────────────────────────────────────────
    {
      id: 'building',
      type: 'fill',
      source: 'planet',
      'source-layer': 'building',
      minzoom: 12,
      paint: {
        'fill-color': '#C89470',
        'fill-outline-color': '#A8784C',
      },
    },

    // ── Place labels ────────────────────────────────────────────────────────
    {
      id: 'place-label',
      type: 'symbol',
      source: 'planet',
      'source-layer': 'place',
      filter: ['match', ['get', 'class'],
        ['city', 'town', 'village', 'suburb', 'quarter'],
        true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 14],
        'text-anchor': 'center',
        'text-max-width': 8,
      },
      paint: {
        'text-color': '#5C4830',
        'text-halo-color': '#F2D49B',
        'text-halo-width': 1.5,
      },
    },
  ],
} as unknown as StyleSpecification
