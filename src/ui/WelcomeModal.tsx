const INTRO_KEY = 'lagos-intro-seen'

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-xl bg-gray-900 border border-gray-700 overflow-y-auto max-h-[90vh]">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-yellow-500 font-semibold">
              Lagos, Nigeria — 2024
            </p>
            <h1 className="text-2xl font-bold text-white">Lagos Governor Sim</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              You've just been sworn in as Governor of Lagos State. 22 million people. ₦45bn in the
              bank. Your party called in every favour to get you here.
            </p>
            <p className="text-gray-500 text-sm italic">Now they want returns.</p>
          </div>

          <div className="border-t border-gray-800" />

          {/* How to play */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              How to play
            </p>
            <ol className="space-y-2 text-sm">
              {[
                'Click "Next Week" in the top-right to advance time.',
                'Read the event card and choose how to respond. There are no obviously right answers.',
                'Some choices have delayed consequences — a decision today fires back in 4, 8, or 12 weeks.',
                'Survive 208 weeks (4 years) without going bankrupt, triggering an uprising, or getting removed by your party.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-yellow-700 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-gray-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-gray-800" />

          {/* Key stats */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Watch these stats
            </p>
            <div className="space-y-2">
              {[
                {
                  icon: '₦',
                  label: 'Cash Reserve',
                  desc: 'Your liquidity. If this goes negative for 3 weeks in a row, the state is insolvent.',
                  color: 'text-green-400',
                },
                {
                  icon: '%',
                  label: 'Public Trust',
                  desc: 'Combined approval across constituencies. Below 15 with high youth tension = uprising.',
                  color: 'text-blue-400',
                },
                {
                  icon: '⚡',
                  label: 'Political Capital',
                  desc: 'Spend it to take bold or expensive actions. Hard to earn back.',
                  color: 'text-yellow-400',
                },
                {
                  icon: '👔',
                  label: 'Factions',
                  desc: 'Six power blocs. The Party Godfathers don\'t drift — once they turn hostile, you\'re out.',
                  color: 'text-purple-400',
                },
              ].map(({ icon, label, desc, color }) => (
                <div key={label} className="flex gap-3">
                  <span className={`shrink-0 text-sm font-bold w-5 text-center ${color}`}>
                    {icon}
                  </span>
                  <div>
                    <p className="text-white text-xs font-semibold">{label}</p>
                    <p className="text-gray-400 text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800" />

          {/* CTA */}
          <div className="text-center space-y-2">
            <p className="text-gray-500 text-xs">
              Everyone thinks Lagos is easy to fix. Let's see what you do with it.
            </p>
            <button
              type="button"
              onClick={handleStart}
              className="w-full rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2.5 text-sm transition-colors"
            >
              Start Governing
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
