import { useMemo } from 'react'
import { useGameStore } from '../../state/gameStore'
import { Banner } from '../components'
import { useSituation } from '../design/ThemeProvider'

function deriveDiagnosis(s: ReturnType<typeof useGameStore.getState>): string | null {
  if (s.riotModeActive)
    return 'Riots in the streets — security situation critical. Your administration is losing control.'
  if (s.consecutiveBankruptWeeks >= 2)
    return 'Two consecutive bankruptcy weeks. Cash reserves are exhausted and salary payments are at risk.'
  if (s.stats.cashReserve < 8)
    return `Cash critically low: ₦${s.stats.cashReserve.toFixed(1)}bn remaining. Payroll risk this week.`
  if (s.stats.publicTrust < 30)
    return `Public trust has collapsed to ${Math.round(s.stats.publicTrust)}%. Citizens have lost faith in this government.`
  if (s.stats.politicalCapital < 15)
    return `Political capital critically low (${Math.round(s.stats.politicalCapital)}). Mend fences with the godfathers, deliver a popular win, or side with a faction to rebuild it.`
  if (s.stats.corruptionPressure > 75)
    return 'Corruption is rampant across MDAs. Media exposure and EFCC scrutiny are imminent.'
  if (s.stats.cashReserve < 15)
    return `Cash under pressure: ₦${s.stats.cashReserve.toFixed(1)}bn — overheads are bleeding you dry.`
  if (s.stats.publicTrust < 40)
    return `Trust eroding: ${Math.round(s.stats.publicTrust)}%. Streets are growing restless.`
  if (s.stats.politicalCapital < 25)
    return `Low political capital (${Math.round(s.stats.politicalCapital)}). Court the godfathers or deliver a visible win to rebuild it.`
  if (Object.values(s.factions).some((v) => v <= 15))
    return 'A key faction has turned hostile. Coalition stability is at risk.'
  return null
}

export function DiagnosisBanner() {
  const gameState = useGameStore((s) => s)
  const situation = useSituation()

  const message = useMemo(
    () => deriveDiagnosis(gameState),
    [
      gameState.riotModeActive,
      gameState.consecutiveBankruptWeeks,
      gameState.stats.cashReserve,
      gameState.stats.publicTrust,
      gameState.stats.politicalCapital,
      gameState.stats.corruptionPressure,
      gameState.factions,
      gameState,
    ],
  )

  if (!message || situation === 'calm') return null

  const tone = situation === 'storm' ? 'danger' : 'warning'

  return (
    <Banner tone={tone} enter>
      {message}
    </Banner>
  )
}
