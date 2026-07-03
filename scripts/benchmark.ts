#!/usr/bin/env npx tsx

/**
 * Winning strategy benchmark — full two-term run.
 *
 * Simulates 416 weeks (term1 + term2) per (archetype × seed) pair,
 * reporting both term1 re-election and term2 completion outcomes.
 *
 * Usage:
 *   npx tsx scripts/benchmark.ts
 *
 * Exits with code 0 if full-term win rate ≥ 60%, otherwise code 1.
 */

import { getArchetypeState } from '../src/data/archetypes'
import { simulateWeeks } from '../src/engine/simulateEngine'
import type { GameState } from '../src/state/types'

function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeSeededArchetypeState(
  arch: 'technocrat' | 'loyalist' | 'outsider',
  stateSeed: number,
): GameState {
  const orig = Math.random
  Math.random = mulberry32(stateSeed)
  const base = getArchetypeState(arch)
  Math.random = orig
  return base
}

const SEEDS = [42, 777, 12345, 99, 2020]
const ARCHETYPES = ['technocrat', 'loyalist', 'outsider'] as const
const MIN_WIN_RATE = 0.6
const TOTAL_WEEKS = 416

interface BenchmarkResult {
  archetype: string
  seed: number
  finalWeek: number
  cashT1: number | null // cash at week 209 transition (if re-elected)
  cashFinal: number
  reElected: boolean
  term2Won: boolean
  outcome: string
}

function classifyOutcome(s: GameState): string {
  if (!s.reElected && s.currentTerm === 1) {
    if (s.isGameOver) return s.gameOverReason ?? 'T1_LOST'
    return 'T1_LOST_ELECTION'
  }
  if (s.reElected && s.currentTerm === 2) {
    if (!s.isGameOver) return 'T2_IN_PROGRESS'
    const r = s.gameOverReason ?? ''
    if (r.includes('second term has ended') || r.includes('term has ended')) return 'T2_COMPLETE'
    return r
  }
  if (s.isGameOver) return s.gameOverReason ?? 'GAME_OVER'
  return 'UNKNOWN'
}

function runBenchmark(): BenchmarkResult[] {
  const results: BenchmarkResult[] = []

  for (const arch of ARCHETYPES) {
    for (const seed of SEEDS) {
      const stateSeed = seed + ARCHETYPES.indexOf(arch) * 10000
      const base = makeSeededArchetypeState(arch, stateSeed)
      base.runMeta = {
        archetype: arch,
        simStrategy: 'winning',
        simSeed: seed,
        simWeeksSkipped: 0,
      }

      const r = simulateWeeks(base as GameState, TOTAL_WEEKS, { strategy: 'winning', seed })
      const s = r.state

      const reElected = s.reElected === true
      const term2Won =
        reElected &&
        s.isGameOver &&
        !!(
          s.gameOverReason?.includes('second term has ended') ||
          s.gameOverReason?.includes('term has ended')
        )

      // Approximate cash at term1 end: only meaningful if they made it to term2
      const cashT1 = reElected
        ? (s.timeline
            .slice()
            .reverse()
            .find((e) => e.week <= 209)?.statDelta?.cashReserve ?? null)
        : null

      results.push({
        archetype: arch,
        seed,
        finalWeek: s.week,
        cashT1,
        cashFinal: s.stats.cashReserve,
        reElected,
        term2Won,
        outcome: classifyOutcome(s),
      })
    }
  }

  return results
}

function printResults(results: BenchmarkResult[]): void {
  const t1wins = results.filter((r) => r.reElected)
  const t2wins = results.filter((r) => r.term2Won)

  console.log('\n── Term 1 ────────────────────────────────────────────────────────')
  for (const r of results) {
    const mark = r.reElected ? ' ✓' : ' ✗'
    const cashStr = `cash=${r.cashFinal.toFixed(1).padStart(7)}`
    const detail = r.reElected ? `→ term2` : r.outcome.slice(0, 50)
    console.log(
      `${r.archetype.padEnd(12)}seed=${String(r.seed).padEnd(6)}wk=${String(r.finalWeek).padEnd(4)}` +
        `${cashStr} ${detail}${mark}`,
    )
  }

  console.log('\n── Term 2 (re-elected runs only) ─────────────────────────────────')
  for (const r of t1wins) {
    const mark = r.term2Won ? ' ✓' : ' ✗'
    const cashStr = `cash=${r.cashFinal.toFixed(1).padStart(7)}`
    console.log(
      `${r.archetype.padEnd(12)}seed=${String(r.seed).padEnd(6)}wk=${String(r.finalWeek).padEnd(4)}` +
        `${cashStr} ${r.outcome.slice(0, 55)}${mark}`,
    )
  }

  console.log(`\nT1 re-elected: ${t1wins.length}/${results.length}`)
  console.log(`T2 completed:  ${t2wins.length}/${results.length}  (full two-term wins)`)
}

const results = runBenchmark()
printResults(results)

const wins = results.filter((r) => r.term2Won).length
const total = results.length
const rate = wins / total

console.log(`\nFull win rate: ${wins}/${total} (${(rate * 100).toFixed(1)}%)`)
console.log(`Target: ≥ ${(MIN_WIN_RATE * 100).toFixed(0)}%`)

if (rate >= MIN_WIN_RATE) {
  console.log('✓ BENCHMARK PASSED')
  process.exit(0)
} else {
  console.log('✗ BENCHMARK FAILED — tune WINNING_STRATEGY in src/engine/simulateEngine.ts')
  process.exit(1)
}
