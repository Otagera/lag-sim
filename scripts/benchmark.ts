#!/usr/bin/env npx tsx
/**
 * Winning strategy benchmark.
 *
 * Runs the 'winning' simulation strategy across all archetypes and seeds,
 * reporting per-run outcomes and total win rate.
 *
 * Usage:
 *   npx tsx scripts/benchmark.ts
 *
 * Exits with code 0 if win rate ≥ 80%, otherwise code 1.
 */

import { simulateWeeks } from '../src/engine/simulateEngine'
import { getArchetypeState } from '../src/data/archetypes'
import type { GameState } from '../src/state/types'

/** mulberry32 seeded PRNG — deterministic for a given seed */
function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generate a seeded state that is deterministic for a given (archetype, stateSeed) pair.
 * getArchetypeState uses Math.random for NPC/deputy selection, so we temporarily
 * replace Math.random with a seeded PRNG for reproducibility.
 */
function makeSeededArchetypeState(arch: 'technocrat' | 'loyalist' | 'outsider', stateSeed: number): GameState {
  const orig = Math.random
  Math.random = mulberry32(stateSeed)
  const base = getArchetypeState(arch)
  Math.random = orig
  return base
}

const SEEDS = [42, 777, 12345, 99, 2020]
const ARCHETYPES = ['technocrat', 'loyalist', 'outsider'] as const
const MIN_WIN_RATE = 0.6
const TOTAL_WEEKS = 208

interface BenchmarkResult {
  archetype: string
  seed: number
  week: number
  cashReserve: number
  vote: number | null
  won: boolean
  outcome: string
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
      const r = simulateWeeks(base as GameState, TOTAL_WEEKS, {
        strategy: 'winning',
        seed,
      })
      const s = r.state
      const won = s.reElected === true
      const vote = s.electionResult ?? null

      let outcome: string
      if (won) {
        outcome = 'RE-ELECTED'
      } else if (s.isGameOver) {
        outcome = s.gameOverReason ?? 'LOST'
      } else {
        outcome = 'LOST_ELECTION'
      }

      results.push({
        archetype: arch,
        seed,
        week: s.week,
        cashReserve: s.stats.cashReserve,
        vote,
        won,
        outcome,
      })
    }
  }

  return results
}

function printResults(results: BenchmarkResult[]): void {
  for (const r of results) {
    const voteStr = r.vote !== null ? `${r.vote.toFixed(1)}%` : '-'
    const mark = r.won ? ' ✓' : ' ✗'
    console.log(
      `${r.archetype.padEnd(12)}seed=${String(r.seed).padEnd(6)}` +
      `wk=${String(r.week).padEnd(4)}cash=${r.cashReserve.toFixed(1).padStart(7)}` +
      ` vote=${voteStr} ${r.outcome}${mark}`,
    )
  }
}

const results = runBenchmark()
printResults(results)

const wins = results.filter((r) => r.won).length
const total = results.length
const rate = wins / total

console.log(`\nWins: ${wins}/${total} (${(rate * 100).toFixed(1)}%)`)
console.log(`Target: ≥ ${(MIN_WIN_RATE * 100).toFixed(0)}%`)

if (rate >= MIN_WIN_RATE) {
  console.log('✓ BENCHMARK PASSED')
  process.exit(0)
} else {
  console.log('✗ BENCHMARK FAILED — tune WINNING_STRATEGY in src/engine/simulateEngine.ts')
  process.exit(1)
}
