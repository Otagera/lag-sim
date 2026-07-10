import { useGameStore } from '../state/gameStore'
import type { ConstituencyKey } from '../state/types'

const CONSTITUENCY_LABELS: Record<ConstituencyKey, string> = {
  lagosIsland: 'Lagos Isl.',
  etiOsa: 'Eti Osa',
  ibejuLekki: 'Ibeju-Lekki',
  surulere: 'Surulere',
  amuwoOdofin: 'Amuwo Odofin',
  apapa: 'Apapa',
  oshodiIsolo: 'Oshodi/Isolo',
  mushin: 'Mushin',
  shomolu: 'Shomolu',
  kosofe: 'Kosofe',
  lagosMainland: 'Lagos Mainland',
  ikeja: 'Ikeja',
  alimosho: 'Alimosho',
  agege: 'Agege',
  ifakoIjaye: 'Ifako/Ijaye',
  badagry: 'Badagry',
  epe: 'Epe',
  ikorodu: 'Ikorodu',
  ojo: 'Ojo',
  ajeromiIfelodun: 'Ajeromi/Ifel.',
}

function approvalColor(value: number): string {
  if (value >= 50) return 'var(--success-9)'
  if (value >= 35) return 'var(--warning-9)'
  return 'var(--error-9)'
}

function ApprovalBar({
  constituencyKey,
  value,
}: {
  constituencyKey: ConstituencyKey
  value: number
}) {
  return (
    <div>
      <div className="flex justify-between mb-px">
        <span className="label-caps truncate mr-1">{CONSTITUENCY_LABELS[constituencyKey]}</span>
        <span className="label-caps shrink-0" style={{ color: 'var(--text)' }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden" style={{ backgroundColor: 'var(--neutral-4)' }}>
        <div
          className="h-full transition-all"
          style={{ width: `${value}%`, backgroundColor: approvalColor(value) }}
        />
      </div>
    </div>
  )
}

const ALL_LGAS: ConstituencyKey[] = [
  'lagosIsland',
  'etiOsa',
  'ibejuLekki',
  'surulere',
  'amuwoOdofin',
  'apapa',
  'oshodiIsolo',
  'mushin',
  'shomolu',
  'kosofe',
  'lagosMainland',
  'ikeja',
  'alimosho',
  'agege',
  'ifakoIjaye',
  'badagry',
  'epe',
  'ikorodu',
  'ojo',
  'ajeromiIfelodun',
]

export function PollPanel() {
  const approval = useGameStore((s) => s.constituencyApproval)

  return (
    <div
      className="p-2 border"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <h2 className="label-caps mb-2">Polling — 20 LGAs</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {ALL_LGAS.map((key) => (
          <ApprovalBar key={key} constituencyKey={key} value={approval[key] ?? 50} />
        ))}
      </div>
    </div>
  )
}
