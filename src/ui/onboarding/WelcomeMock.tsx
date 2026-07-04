import { useReducedMotion } from '../design/useReducedMotion'
import { WindowFrame } from '../desk/WindowFrame'
import { LagosSkyline } from '../LagosSkyline'

const HOW_TO_PLAY = [
  'Every week brings a decision — read it, weigh the trade-off, choose.',
  'Choices move your stats immediately and some ripple into consequences weeks later.',
  'Factions remember. Godfathers, business, civil society — keep enough of them onside.',
  'Survive to election day, or lose the office first: bankruptcy, riot, or removal.',
]

// Reuses the desk scene's WindowFrame + skyline composition (not the whole
// DeskScene — there's no desk yet, the player hasn't taken office) as the
// entry illustration, addressing the "no illustration/imagery" weakness in
// the current WelcomeModal.
export function WelcomeMock() {
  const reduced = useReducedMotion()

  return (
    <div
      style={{
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        animation: reduced ? undefined : 'onboarding-illustration-enter 500ms ease-out',
      }}
    >
      <WindowFrame width={340} height={190}>
        <LagosSkyline height="100%" />
      </WindowFrame>

      <div style={{ textAlign: 'center' }}>
        <p className="label-caps" style={{ color: 'var(--accent-text)', marginBottom: '4px' }}>
          Lagos, Nigeria — 2027
        </p>
        <h1
          className="font-display font-semibold"
          style={{ fontSize: '30px', color: 'var(--text)', margin: 0, lineHeight: 1.2 }}
        >
          Welcome to Lagos
        </h1>
        <p
          className="prose"
          style={{ marginTop: '10px', color: 'var(--text-secondary)', fontSize: '14px' }}
        >
          You have just been sworn in as Governor of Lagos State. 22 million people. Your party
          called in every favour to get you here — now they want returns.
        </p>
      </div>

      <div
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {HOW_TO_PLAY.map((line, i) => (
          <div
            key={line}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              padding: '10px 14px',
              borderBottom: i < HOW_TO_PLAY.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--accent-bg-subtle)',
                color: 'var(--accent-text)',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Archivo Narrow', sans-serif",
              }}
            >
              {i + 1}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.5 }}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
