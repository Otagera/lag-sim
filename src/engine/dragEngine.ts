import type { GameState, HiddenDrag } from '../state/types'

export function calculateHiddenDrag(state: GameState, capitalSpend: number): HiddenDrag {
  const worksCommissioner = state.commissioners?.['works']
  const godfatherLeakageBonus = worksCommissioner?.isGodfatherChoice ? 0.05 : 0
  const leakageRate = 0.15 + (state.stats.corruptionPressure / 100) * 0.25 + godfatherLeakageBonus
  const procurementLeakage = capitalSpend * leakageRate

  const ghostRegenRate = 0.001 * (1 - state.stats.civilServiceReformScore / 100)

  const overheadCreep = 0.05

  const faacVariance = (Math.random() - 0.5) * 0.3 * 8.7

  return { procurementLeakage, ghostRegenRate, overheadCreep, faacVariance }
}
