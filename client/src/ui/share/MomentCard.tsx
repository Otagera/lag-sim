import type { MomentCardData } from './buildMomentCardData'
import {
  CardBackground,
  CardDefs,
  CardFooter,
  CardMasthead,
  DANFO,
  FLAVOR_COLORS,
} from './cardChrome'

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif"
const SANS = "'Archivo Narrow', system-ui, -apple-system, sans-serif"

function GhostWeek({ week, accent }: { week: number; accent: string }) {
  return (
    <text
      x="1042"
      y="700"
      textAnchor="end"
      fontFamily={SERIF}
      fontSize={String(week).length >= 3 ? 360 : 470}
      fontWeight="700"
      fill="none"
      stroke={accent}
      strokeWidth="2"
      opacity="0.12"
    >
      {week}
    </text>
  )
}

function Kicker({ tenure, kicker, accent }: { tenure: string; kicker: string; accent: string }) {
  return (
    <text
      x="90"
      y="230"
      fontFamily={SANS}
      fontSize="21"
      fill={accent}
      letterSpacing="0.24em"
      fontWeight="700"
    >
      {tenure.toUpperCase()} · {kicker.toUpperCase()}
    </text>
  )
}

function wrapHeadline(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]
  const words = text.split(' ')
  const lines: string[] = ['']
  for (const word of words) {
    const cur = lines[lines.length - 1]
    if (cur && `${cur} ${word}`.length > maxChars) lines.push(word)
    else lines[lines.length - 1] = cur ? `${cur} ${word}` : word
  }
  return lines.slice(0, 3)
}

/**
 * The lighter mid-game "moment" card — one headline, a one-line deck, and a
 * two-up stat strip, on the same chrome/palette as the legacy ShareCard.
 * No timeline or scorecard: those belong to the end-game card.
 */
export function MomentCard({ data }: { data: MomentCardData }) {
  const flavor = FLAVOR_COLORS[data.flavor]
  const lines = wrapHeadline(data.headline, 18)
  const headlineSize = lines.length > 2 ? 96 : 116
  const lineH = headlineSize * 1.04
  const headlineY = 470

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1350"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      aria-label="Lagos Governor Sim Moment Card"
    >
      <CardDefs flavor={flavor} />
      <CardBackground />

      <GhostWeek week={data.week} accent={flavor.accent} />

      <CardMasthead administrationLabel={data.administrationLabel} flavor={flavor} />

      <Kicker tenure={data.tenure} kicker={data.kicker} accent={flavor.accent} />

      {/* Headline */}
      <rect
        x="90"
        y={headlineY - 84}
        width="6"
        height={(lines.length - 1) * lineH + 108}
        fill={flavor.accent}
        opacity="0.85"
      />
      {lines.map((line, i) => (
        <text
          key={line}
          x="124"
          y={headlineY + i * lineH}
          fontFamily={SERIF}
          fontSize={headlineSize}
          fontWeight="700"
          fill={flavor.text}
        >
          {line}
        </text>
      ))}

      {/* Subhead */}
      <text
        x="124"
        y={headlineY + (lines.length - 1) * lineH + 78}
        fontFamily={SERIF}
        fontSize="38"
        fontStyle="italic"
        fill={flavor.accent}
      >
        {data.subhead.length > 52 ? `${data.subhead.slice(0, 51)}…` : data.subhead}
      </text>

      {data.stats.slice(0, 2).map((stat, i) => (
        <g key={stat.label} transform={`translate(${90 + i * 452} 1024)`}>
          <rect x="0" y="0" width="420" height="150" fill={flavor.accent} opacity="0.08" rx="4" />
          <rect
            x="0"
            y="0"
            width="420"
            height="150"
            fill="none"
            stroke={flavor.accent}
            strokeWidth="2.5"
            rx="4"
          />
          <text
            x="28"
            y="66"
            fontFamily={SANS}
            fontSize="16"
            fill={flavor.subdue}
            letterSpacing="0.16em"
            fontWeight="700"
          >
            {stat.label.toUpperCase()}
          </text>
          <text x="28" y="128" fontFamily={SERIF} fontSize="64" fontWeight="700" fill={flavor.text}>
            {stat.value}
          </text>
        </g>
      ))}

      {data.governorName ? (
        <text
          x="90"
          y="1234"
          fontFamily={SERIF}
          fontSize="25"
          fontStyle="italic"
          fill={flavor.text}
          opacity="0.9"
        >
          — Gov. {data.governorName}
        </text>
      ) : null}

      {/* Danfo tick under the stat strip for a bit of brand rhythm */}
      <rect x="90" y="1196" width="60" height="5" fill={DANFO} opacity="0.9" />

      <CardFooter versionStamp={data.gameVersion} flavor={flavor} />
    </svg>
  )
}
