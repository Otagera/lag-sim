import { PROJECTS } from '../data/projects'
import type { GameState, PendingMoment } from '../state/types'

/**
 * Detects a brag-worthy mid-game moment from a prev→next state transition,
 * or null. Pure and deterministic — called from tickCleanup like the hint loop.
 * Re-election is NOT here: winning re-election is itself a game-over
 * (`termEndWin`), so that moment is offered from the `beginSecondTerm` action
 * when the player carries on into a second term.
 */
export function detectMoment(prev: GameState, next: GameState): PendingMoment | null {
  // Only offer while the game is live and not paused on a decision.
  if (next.isGameOver) return null

  return (
    detectCrisisSurvived(prev, next) ??
    detectLandmark(prev, next) ??
    detectTermMilestone(prev, next)
  )
}

function detectCrisisSurvived(prev: GameState, next: GameState): PendingMoment | null {
  if (prev.riotModeActive && !next.riotModeActive) {
    return { type: 'crisis-survived', key: `crisis:riot:${next.week}`, label: 'Riot Contained' }
  }
  if (prev.consecutiveBankruptWeeks >= 2 && next.consecutiveBankruptWeeks === 0) {
    return {
      type: 'crisis-survived',
      key: `crisis:solvency:${next.week}`,
      label: 'Solvency Restored',
    }
  }
  if (prev.impeachmentStage >= 1 && next.impeachmentStage === 0) {
    return {
      type: 'crisis-survived',
      key: `crisis:impeachment:${next.week}`,
      label: 'Impeachment Defeated',
    }
  }
  if (prev.emergencySuspensionWeeks > 0 && next.emergencySuspensionWeeks === 0) {
    return {
      type: 'crisis-survived',
      key: `crisis:reinstated:${next.week}`,
      label: 'Reinstated to Office',
    }
  }
  return null
}

function detectLandmark(prev: GameState, next: GameState): PendingMoment | null {
  // Capital projects (projectEngine).
  const prevCapDone = new Set(
    prev.capitalProjects.filter((p) => p.status === 'completed').map((p) => p.id),
  )
  const newCap = next.capitalProjects.find(
    (p) => p.status === 'completed' && !prevCapDone.has(p.id),
  )
  if (newCap) {
    return { type: 'landmark-delivered', key: `landmark:${newCap.id}`, label: newCap.name }
  }

  // Commissioned projects (projectsEngine) — a separate system; diff both.
  for (const [id, status] of Object.entries(next.projectStatuses)) {
    if (status === 'completed' && prev.projectStatuses[id] !== 'completed') {
      const def = PROJECTS.find((p) => p.id === id)
      return {
        type: 'landmark-delivered',
        key: `landmark:${id}`,
        label: def?.title ?? 'A Landmark Project',
      }
    }
  }
  return null
}

function detectTermMilestone(prev: GameState, next: GameState): PendingMoment | null {
  if (next.week > 0 && next.week % 52 === 0 && prev.week % 52 !== 0) {
    const year = next.week / 52
    return { type: 'term-milestone', key: `term-milestone:${next.week}`, label: `Year ${year}` }
  }
  return null
}
