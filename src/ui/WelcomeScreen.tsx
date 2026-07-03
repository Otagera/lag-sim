import type { LucideIcon } from 'lucide-react'
import { BarChart3, Landmark, Network, Zap } from 'lucide-react'
import { Button, Surface } from './components'
import { LagosSkyline } from './LagosSkyline'

const STATS: { Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  {
    Icon: Landmark,
    label: 'Cash Reserve',
    desc: 'Your liquidity. Negative for 3 weeks = insolvency.',
    color: 'var(--success-11)',
  },
  {
    Icon: BarChart3,
    label: 'Public Trust',
    desc: 'Below 15 with high youth tension = uprising.',
    color: 'var(--info-11)',
  },
  {
    Icon: Zap,
    label: 'Political Capital',
    desc: 'Spend it on bold actions. Hard to earn back.',
    color: 'var(--warning-11)',
  },
  {
    Icon: Network,
    label: 'Factions',
    desc: 'Six power blocs. Godfathers do not drift — once hostile, you are out.',
    color: 'var(--accent-text)',
  },
]

type Props = {
  onNewGame: () => void
  onContinue: () => void
  canContinue: boolean
}

export function WelcomeScreen({ onNewGame, onContinue, canContinue }: Props) {
  return (
    <div
      className="h-screen flex flex-col"
      style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
    >
      {/* Lagos skyline hero banner */}
      <div style={{ flexShrink: 0 }}>
        <LagosSkyline height={200} />
      </div>

      {/* Centered card content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg text-center">
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>
            Lagos, Nigeria — 2024
          </p>
          <h1
            className="font-display font-semibold mt-2"
            style={{ fontSize: '30px', color: 'var(--text)' }}
          >
            Lagos Governor Sim
          </h1>
          <p
            className="mt-3 max-w-md mx-auto leading-relaxed"
            style={{ fontSize: '13px', color: 'var(--text-secondary)' }}
          >
            You have just been sworn in as Governor of Lagos State. 22 million people. Your party
            called in every favour to get you here.
          </p>
          <p className="italic mt-1" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Now they want returns.
          </p>

          <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
            <Button variant="primary" fullWidth onClick={onNewGame}>
              New Game
            </Button>
            <Button variant="ghost" fullWidth onClick={onContinue} disabled={!canContinue}>
              Continue Saved Game
            </Button>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto">
              {STATS.map(({ Icon, label, desc, color }) => (
                <Surface
                  key={label}
                  elevation="raised"
                  padding="12px"
                  style={{ display: 'flex', gap: '10px' }}
                >
                  <span className="shrink-0 w-5 flex items-start justify-center mt-0.5">
                    <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color }} />
                  </span>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>
                      {label}
                    </p>
                    <p
                      style={{
                        fontSize: '10px',
                        marginTop: '2px',
                        lineHeight: 1.3,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {desc}
                    </p>
                  </div>
                </Surface>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
