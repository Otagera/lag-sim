import { useMemo } from 'react'
import { useGameStore } from '../../state/gameStore'
import { useSituation } from '../design/ThemeProvider'
import { Banner } from '../components'

function deriveDiagnosis(s: ReturnType<typeof useGameStore.getState>): string | null {
  if (s.riotModeActive)                              return 'Riots in the streets — security situation critical. Your administration is losing control.'
  if (s.consecutiveBankruptWeeks >= 2)               return 'Two consecutive bankruptcy weeks. The treasury is empty and salary payments are at risk.'
  if (s.stats.cashReserve < 8)                       return `Treasury critically low: ₦${s.stats.cashReserve.toFixed(1)}bn remaining. Payroll risk this week.`
  if (s.stats.publicTrust < 30)                      return `Public trust has collapsed to ${Math.round(s.stats.publicTrust)}%. Citizens have lost faith in this government.`
  if (s.stats.politicalCapital < 15)                 return `Political capital near zero (${Math.round(s.stats.politicalCapital)}). You cannot move any legislation.`
  if (s.stats.corruptionPressure > 75)               return 'Corruption is rampant across MDAs. Media exposure and EFCC scrutiny are imminent.'
  if (s.stats.cashReserve < 15)                      return `Treasury under pressure: ₦${s.stats.cashReserve.toFixed(1)}bn — overheads are bleeding you dry.`
  if (s.stats.publicTrust < 40)                      return `Trust eroding: ${Math.round(s.stats.publicTrust)}%. Streets are growing restless.`
  if (s.stats.politicalCapital < 25)                 return `Low political capital (${Math.round(s.stats.politicalCapital)}). Every initiative costs more to pass.`
  if (Object.values(s.factions).some((v) => v <= 15)) return 'A key faction has turned hostile. Coalition stability is at risk.'
  return null
}

export function DiagnosisBanner() {
  const gameState = useGameStore((s) => s)
  const situation = useSituation()

  const message = useMemo(() => deriveDiagnosis(gameState), [
    gameState.riotModeActive,
    gameState.consecutiveBankruptWeeks,
    gameState.stats.cashReserve,
    gameState.stats.publicTrust,
    gameState.stats.politicalCapital,
    gameState.stats.corruptionPressure,
    gameState.factions,
  ])

  if (!message || situation === 'calm') return null

  const tone = situation === 'storm' ? 'danger' : 'warning'

  return <Banner tone={tone} enter>{message}</Banner>
}
