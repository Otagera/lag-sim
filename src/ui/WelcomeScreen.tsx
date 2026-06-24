import { BarChart3, Landmark, Network, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const STATS: { Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  { Icon: Landmark, label: 'Cash Reserve', desc: 'Your liquidity. Negative for 3 weeks = insolvency.', color: 'var(--success-11)' },
  { Icon: BarChart3, label: 'Public Trust', desc: 'Below 15 with high youth tension = uprising.', color: 'var(--info-11)' },
  { Icon: Zap, label: 'Political Capital', desc: 'Spend it on bold actions. Hard to earn back.', color: 'var(--warning-11)' },
  { Icon: Network, label: 'Factions', desc: 'Six power blocs. Godfathers do not drift — once hostile, you are out.', color: 'var(--accent-text)' },
]

type Props = {
  onNewGame: () => void
  onContinue: () => void
  canContinue: boolean
}

export function WelcomeScreen({ onNewGame, onContinue, canContinue }: Props) {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}>
      <div className="w-full max-w-lg text-center">
        <p className="label-caps" style={{ color: 'var(--accent-text)' }}>Lagos, Nigeria — 2024</p>
        <h1 className="font-display text-3xl font-semibold mt-2" style={{ color: 'var(--text)' }}>
          Lagos Governor Sim
        </h1>
        <p className="text-sm mt-3 max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          You have just been sworn in as Governor of Lagos State. 22 million people. 
          Your party called in every favour to get you here.
        </p>
        <p className="text-sm italic mt-1" style={{ color: 'var(--text-secondary)' }}>
          Now they want returns.
        </p>

        <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
          <button
            type="button"
            onClick={onNewGame}
            className="w-full py-3 text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
          >
            New Game
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="w-full py-3 text-sm font-semibold transition-colors border"
            style={{
              borderColor: canContinue ? 'var(--border)' : 'var(--neutral-4)',
              color: canContinue ? 'var(--text)' : 'var(--border-strong)',
              backgroundColor: 'var(--surface)',
              opacity: canContinue ? 1 : 0.5,
              cursor: canContinue ? 'pointer' : 'not-allowed',
            }}
          >
            Continue Saved Game
          </button>
        </div>

        <div className="mt-10">
          <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
            {STATS.map(({ Icon, label, desc, color }) => (
              <div key={label} className="flex gap-2.5 p-3 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                <span className="shrink-0 w-5 flex items-start justify-center mt-0.5">
                  <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color }} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
                  <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
