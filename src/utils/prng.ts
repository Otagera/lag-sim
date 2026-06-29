/**
 * TRUST BOUNDARY (authoritative vs presentational randomness)
 *
 * These functions are the NARROW SEAM for all secret/uncertain resolution:
 *   resolveOutcome(node, seed)  — research payoff
 *   drawNextEvent(state)        — event deck draw
 *   pickOutcome(node, seed)     — weighted choice from outcome table
 *   weightedSelect(pool, seed)  — weighted choice from event pool
 *
 * They are the ONLY places where seeded determinism governs game-mechanical
 * outcomes. The seed (runSeed) is authoritative — if it moves server-side,
 * only these functions change (they become async API calls).
 *
 * Everything else that uses Math.random() is presentational or tactical:
 * - FAAC variance (dragEngine)       — week-level simulation noise
 * - Godfather ask selection          — run-setup randomness
 * - News generation                  — cosmetic
 * - Visual effects (groundLayer)     — UI-only
 * - NPC/deputy selection at game start — one-time setup
 * These stay client-side. They don't affect verifiable game outcomes.
 */

/** mulberry32 seeded PRNG — deterministic for a given seed */
export function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Derive a deterministic sub-seed from the run seed + a stable label string.
 *  Same inputs → same number. Labels should be unique per resolution site. */
export function hashSeed(base: number, label: string): number {
  let h = base | 0
  for (let i = 0; i < label.length; i++) {
    h = ((h << 5) - h + label.charCodeAt(i)) | 0
  }
  return h >>> 0
}
