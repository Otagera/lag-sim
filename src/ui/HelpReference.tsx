import { X } from 'lucide-react'
import { STAT_ICONS } from '../data/icons'

const STAT_ROW_KEYS: Record<string, keyof typeof STAT_ICONS> = {
  'Cash Reserve': 'cashReserve',
  'Public Trust': 'publicTrust',
  'Political Capital': 'politicalCapital',
  'Infrastructure Score': 'infrastructureScore',
  'Corruption Pressure': 'corruptionPressure',
  'Youth Tension': 'youthTension',
}

const SECTIONS = [
  {
    label: 'Game Over Conditions',
    rows: [
      { condition: 'Bankruptcy', threshold: 'Cash < 0 for 3 consecutive weeks', recovery: 'Raise revenue, cut spending, or secure federal bailout' },
      { condition: 'Federal Takeover', threshold: 'Fed. Relationship < -40 AND Infrastructure < 25', recovery: 'Improve both before threshold is met' },
      { condition: 'Mass Uprising', threshold: 'Public Trust < 15 AND Youth Tension > 85', recovery: 'Raise trust or lower tension before both trigger' },
      { condition: 'Party Removal', threshold: 'Godfathers < 10 after week 52 (arc completes)', recovery: 'Keep godfather relations above 10' },
      { condition: 'Primary Defeat', threshold: 'Week 176 (Scenario B)', recovery: 'Maintain party support and public standing' },
      { condition: 'Term End', threshold: 'Week 208 / 416 — vote < 50%', recovery: 'Win the vote — no recovery after loss' },
    ],
  },
  {
    label: 'Key Stats',
    rows: [
      { condition: 'Cash Reserve', threshold: 'Starts ~₦22bn. Negative 3 weeks = bankruptcy.', recovery: 'IGR − expenditure. Raise taxes, cut waste, pursue grants.' },
      { condition: 'Public Trust', threshold: '0–100. Below 40 = warning. Below 15 + tension = uprising.', recovery: 'Deliver visible projects, avoid scandal, keep promises.' },
      { condition: 'Political Capital', threshold: '0–200. Below 25 = warning. Spent on bold actions.', recovery: 'Earned by delivering wins and keeping faction support.' },
      { condition: 'Infrastructure Score', threshold: '0–100. Decays 0.5/wk. Below 25 + fed crisis = takeover.', recovery: 'Fund projects, repair decay, target neglected zones.' },
      { condition: 'Corruption Pressure', threshold: '15–80 (clamped). Above 75 = grant freeze risk.', recovery: 'Anti-corruption initiatives, reform procurement, resist demands.' },
      { condition: 'Youth Tension', threshold: '0–100. Rises 0.4/wk. Above 85 + low trust = uprising.', recovery: 'Youth employment programs, engagement initiatives, visible outreach.' },
    ],
  },
  {
    label: 'Factions',
    rows: [
      { condition: 'Business Community', threshold: 'Below 20 = investment flight, revenue drops', recovery: 'Pro-business policies, tax incentives, infrastructure' },
      { condition: 'Informal Economy', threshold: 'Below 20 = street-level unrest, IGR erosion', recovery: 'Market improvements, inclusion programs, avoid crackdowns' },
      { condition: 'Party Godfathers', threshold: 'Below 10 = party removal arc triggers', recovery: 'Appointments, contracts, deference to their demands' },
      { condition: 'Federal Government', threshold: 'Below -40 = takeover risk (with low infra)', recovery: 'Federal alignment, avoid open confrontation' },
      { condition: 'Civil Society / Media', threshold: 'Below 20 = public trust erosion accelerates', recovery: 'Transparency, press engagement, anti-corruption signals' },
      { condition: 'LG Chairmen', threshold: 'Below 20 = local tax collection stalls', recovery: 'Devolve funds, consult on local decisions' },
    ],
  },
]

export function HelpReference({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        zIndex:     100,
        background: 'rgba(0,0,0,0.6)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth:   '640px',
          width:      '100%',
          maxHeight:  '80vh',
          overflowY:  'auto',
          background: 'var(--background)',
          border:     '1px solid var(--border)',
          borderRadius: '4px',
          padding:    '24px',
          position:   'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position:   'absolute',
            top:        '12px',
            right:      '12px',
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            color:      'var(--text-secondary)',
            padding:    '4px',
            lineHeight: 0,
          }}
          aria-label="Close reference"
        >
          <X size={18} />
        </button>

        <h2 className="font-display" style={{ fontSize: '22px', fontWeight: 600, margin: '0 0 20px', color: 'var(--text)' }}>
          Quick Reference
        </h2>

        {SECTIONS.map((section) => (
          <section key={section.label} style={{ marginBottom: '24px' }}>
            <h3 className="label-caps" style={{ color: 'var(--accent-text)', margin: '0 0 8px' }}>
              {section.label}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {section.rows.map((row) => {
                const isStats = section.label === 'Key Stats'
                const IconComp = isStats ? STAT_ICONS[STAT_ROW_KEYS[row.condition]]?.icon : undefined
                return (
                  <div
                    key={row.condition}
                    style={{
                      display:             'grid',
                      gridTemplateColumns: isStats ? '18px 130px 1fr' : '130px 1fr',
                      gap:                 '8px',
                      padding:             '6px 8px',
                      background:          'var(--surface)',
                      borderRadius:        '2px',
                      fontSize:            '12px',
                      lineHeight:          1.5,
                    }}
                  >
                    {isStats && (
                      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}>
                        {IconComp && <IconComp size={12} />}
                      </span>
                    )}
                    <span style={{
                      fontFamily: "'Archivo Narrow', sans-serif",
                      fontWeight: 600,
                      color:      'var(--text)',
                    }}>
                      {row.condition}
                    </span>
                    <span style={{
                      fontFamily: 'Georgia, serif',
                      color:      'var(--text-secondary)',
                    }}>
                      {row.recovery
                        ? `${row.threshold} — ${row.recovery}`
                        : row.threshold}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        ))}

        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize:   '11px',
          color:      'var(--text-tertiary)',
          textAlign:  'center',
          margin:     '16px 0 0',
        }}>
          Full documentation at docs/ in the project source
        </p>
      </div>
    </div>
  )
}
