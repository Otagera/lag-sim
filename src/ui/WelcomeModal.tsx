import { BarChart3, Landmark, Network, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from './components'

const INTRO_KEY = 'lagos-intro-seen'

const STATS: { Icon: LucideIcon; label: string; desc: string; color: string }[] = [
  { Icon: Landmark, label: 'Cash Reserve', desc: 'Your liquidity. If this goes negative for 3 weeks in a row, the state is insolvent.', color: 'var(--success-11)' },
  { Icon: BarChart3, label: 'Public Trust', desc: 'Combined approval across constituencies. Below 15 with high youth tension = uprising.', color: 'var(--info-11)' },
  { Icon: Zap, label: 'Political Capital', desc: 'Spend it to take bold or expensive actions. Hard to earn back.', color: 'var(--warning-11)' },
  { Icon: Network, label: 'Factions', desc: "Six power blocs. The Party Godfathers don't drift — once they turn hostile, you're out.", color: 'var(--accent-text)' },
]

export function hasSeenIntro(): boolean {
  return localStorage.getItem(INTRO_KEY) !== null
}

export function markIntroSeen(): void {
  localStorage.setItem(INTRO_KEY, '1')
}

export function WelcomeModal({ onStart }: { onStart: () => void }) {
  function handleStart() {
    markIntroSeen()
    onStart()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(43,47,44,0.85)' }}>
      <div className="w-full max-w-lg border overflow-y-auto max-h-[90vh]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
        <div
          className="p-4"
          style={{ borderBottom: '2px solid var(--accent-solid)' }}
        >
          <p className="label-caps" style={{ color: 'var(--accent-text)' }}>Lagos, Nigeria — 2024</p>
          <h1 className="font-display font-semibold mt-1" style={{ fontSize: '26px', color: 'var(--text)' }}>Lagos Governor Sim</h1>
        </div>
        <div className="p-6 space-y-5">
          <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text)' }}>
            You've just been sworn in as Governor of Lagos State. 22 million people. ₦45bn in the
            bank. Your party called in every favour to get you here.
          </p>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Now they want returns.</p>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          <div className="space-y-2">
            <p className="label-caps">How to play</p>
            <ol className="space-y-2" style={{ fontSize: '13px' }}>
              {[
                'Click "Next Week" in the top-right to advance time.',
                'Read the event card and choose how to respond. There are no obviously right answers.',
                'Some choices have delayed consequences — a decision today fires back in 4, 8, or 12 weeks.',
                'Survive 208 weeks (4 years) without going bankrupt, triggering an uprising, or getting removed by your party.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="shrink-0 w-5 h-5 text-[10px] font-bold flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: 'var(--accent-solid)', color: 'var(--accent-on-solid)' }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          <div className="space-y-2">
            <p className="label-caps">Watch these stats</p>
            <div className="space-y-2">
              {STATS.map(({ Icon, label, desc, color }) => (
                <div key={label} className="flex gap-3">
                  <span className="shrink-0 w-5 flex items-center justify-center mt-0.5">
                    <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color }} />
                  </span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }} />

          <div className="text-center space-y-3">
            <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              Everyone thinks Lagos is easy to fix. Let's see what you do with it.
            </p>
            <Button variant="primary" fullWidth onClick={handleStart}>
              Start Governing
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
