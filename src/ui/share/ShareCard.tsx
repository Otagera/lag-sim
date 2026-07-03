import { BustPortrait } from '../portraits'
import { LagosSealMark } from '../seals/LagosSealMark'
import type { ShareCardData } from './buildShareCardData'

const DANFO = '#F5C518'

const FLAVOR_COLORS: Record<string, { bg: string; text: string; accent: string; subdue: string }> =
  {
    crisis: { bg: '#1A0808', text: '#EDD6D4', accent: '#D7322A', subdue: '#7A4A40' },
    storm: { bg: '#0C1720', text: '#C4D6E4', accent: '#5899D2', subdue: '#4A5A68' },
    teal: { bg: '#0A1A18', text: '#CDE4E0', accent: '#1A9B8E', subdue: '#3A6A64' },
    triumph: { bg: '#0A1810', text: '#CDE4D4', accent: '#3AA048', subdue: '#3A5A44' },
  }

const STAMP_FALLBACK: Record<string, string> = {
  crisis: 'FALLEN',
  storm: 'SEIZED',
  teal: 'ENDED',
  triumph: 'RETURNED',
}

/**
 * SVG <text> has no wrapping — split on a display dash first (the exit labels
 * are written as "Fact — Consequence"), else break near the middle at a space.
 */
function wrapLine(label: string, maxChars: number): string[] {
  if (label.length <= maxChars) return [label]
  const dashIdx = label.indexOf('—')
  if (dashIdx > 0) {
    return [label.slice(0, dashIdx).trim(), `— ${label.slice(dashIdx + 1).trim()}`]
  }
  const words = label.split(' ')
  const lines: string[] = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if (cur && `${cur} ${w}`.length > maxChars) lines.push(w)
    else lines[lines.length - 1] = cur ? `${cur} ${w}` : w
  }
  return lines.slice(0, 3)
}

/**
 * The shareable legacy card — designed as a front page about your downfall
 * (or, rarely, your triumph), not a scoreboard. The big moves:
 * Danfo-yellow nameplate bar · ghost week-numeral · rotated rubber-stamp
 * verdict · key moments as a timeline · stamped grade blocks · footer band
 * with the seal. Fashemu looms over godfather endings.
 */
export function ShareCard({ data }: { data: ShareCardData }) {
  const flavor = FLAVOR_COLORS[data.endingFlavor] ?? FLAVOR_COLORS.teal
  const stamp = data.stampWord ?? STAMP_FALLBACK[data.endingFlavor] ?? 'ENDED'

  const headlineLines = wrapLine(data.exitLabel, 24)
  const headlineSize = headlineLines.length > 1 ? 78 : 88
  const headlineLineH = headlineSize * 1.08
  const headlineY = 320
  const afterHeadline = headlineY + (headlineLines.length - 1) * headlineLineH

  const verdictLines = wrapLine(data.verdictHeadline, 46)
  const verdictY = afterHeadline + 74

  const ghostNumeral = String(data.weekCount)
  const ghostSize = ghostNumeral.length >= 3 ? 330 : 430

  const momentsTitleY = 640
  const momentStep = 104
  const moments = data.keyMoments.slice(0, 3)
  const timelineTop = momentsTitleY + 34
  const timelineBottom = timelineTop + (moments.length - 1) * momentStep + 18

  const scoreTitleY = 1024
  const boxY = scoreTitleY + 26
  const boxW = 201
  const boxH = 148
  const boxGap = 32

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1350"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      aria-label="Lagos Governor Sim Legacy Card"
    >
      <defs>
        <filter id="share-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feComponentTransfer in="grayNoise">
            <feFuncA type="linear" slope="0.035" />
          </feComponentTransfer>
        </filter>
        <linearGradient id="card-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={flavor.bg} />
          <stop offset="72%" stopColor="#070707" />
          <stop offset="100%" stopColor="#050505" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="1080" height="1350" fill="url(#card-bg)" />
      <rect width="1080" height="1350" fill="url(#share-grain)" />

      {/* Ghost week-numeral — the watermark of how long you lasted */}
      <text
        x="1042"
        y="620"
        textAnchor="end"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={ghostSize}
        fontWeight="700"
        fill="none"
        stroke={flavor.accent}
        strokeWidth="2"
        opacity="0.13"
      >
        {ghostNumeral}
      </text>
      {!data.hasFashemuEnding && (
        <text
          x="1042"
          y="668"
          textAnchor="end"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="17"
          letterSpacing="0.3em"
          fill={flavor.accent}
          opacity="0.35"
          fontWeight="700"
        >
          WEEKS IN OFFICE
        </text>
      )}

      {/* Nameplate bar + masthead */}
      <rect x="0" y="0" width="1080" height="10" fill={DANFO} />
      <text
        x="90"
        y="94"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="29"
        fontWeight="700"
        fill={flavor.text}
        letterSpacing="0.07em"
      >
        LAGOS GOVERNOR SIM
      </text>
      <text
        x="990"
        y="92"
        textAnchor="end"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="13"
        fill={flavor.subdue}
        letterSpacing="0.16em"
        fontWeight="700"
      >
        OFFICIAL RECORD OF AN ADMINISTRATION
      </text>
      <line
        x1="90"
        y1="122"
        x2="990"
        y2="122"
        stroke={flavor.subdue}
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="90"
        y1="127"
        x2="990"
        y2="127"
        stroke={flavor.subdue}
        strokeWidth="0.6"
        opacity="0.4"
      />

      {/* Kicker — tenure line */}
      <text
        x="90"
        y="196"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="19"
        fill={flavor.accent}
        letterSpacing="0.22em"
        fontWeight="700"
      >
        {data.tenure.toUpperCase()} · {data.decisionCount} MAJOR DECISIONS
      </text>

      {/* Headline */}
      <rect
        x="90"
        y={headlineY - 66}
        width="5"
        height={afterHeadline - headlineY + 92}
        fill={flavor.accent}
        opacity="0.85"
      />
      {headlineLines.map((line, i) => (
        <text
          key={line}
          x="122"
          y={headlineY + i * headlineLineH}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize={headlineSize}
          fontWeight="700"
          fill={flavor.text}
        >
          {line}
        </text>
      ))}

      {/* Verdict deck */}
      {verdictLines.map((line, i) => (
        <text
          key={line}
          x="122"
          y={verdictY + i * 48}
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="36"
          fontStyle="italic"
          fill={flavor.accent}
        >
          {line}
        </text>
      ))}

      {/* Rubber-stamp verdict — inked, crooked, filed top-right */}
      <g transform="translate(912 194) rotate(-7)" opacity="0.92">
        <rect x="-150" y="-58" width="300" height="112" fill={flavor.bg} opacity="0.55" />
        <rect
          x="-150"
          y="-58"
          width="300"
          height="112"
          fill="none"
          stroke={flavor.accent}
          strokeWidth="5"
        />
        <rect
          x="-138"
          y="-46"
          width="276"
          height="88"
          fill="none"
          stroke={flavor.accent}
          strokeWidth="1.5"
          opacity="0.8"
        />
        <text
          x="0"
          y="14"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize={stamp.length > 8 ? 42 : 48}
          fontWeight="800"
          letterSpacing="0.18em"
          fill={flavor.accent}
        >
          {stamp}
        </text>
        {/* ink imperfections */}
        <rect x="52" y="-58" width="26" height="5" fill={flavor.bg} opacity="0.9" />
        <rect x="-104" y="49" width="34" height="5" fill={flavor.bg} opacity="0.9" />
      </g>

      {/* Key moments — a timeline, not a list */}
      {moments.length > 0 && (
        <g>
          <text
            x="90"
            y={momentsTitleY}
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="15"
            fill={flavor.subdue}
            letterSpacing="0.2em"
            fontWeight="700"
          >
            THE ROAD HERE
          </text>
          <line
            x1="104"
            y1={timelineTop}
            x2="104"
            y2={timelineBottom}
            stroke={flavor.subdue}
            strokeWidth="2"
            opacity="0.6"
          />
          {moments.map((m, i) => {
            const y = timelineTop + 14 + i * momentStep
            return (
              <g key={`km-${m.week}-${m.type}`}>
                <circle cx="104" cy={y - 6} r="6" fill={flavor.accent} />
                <circle
                  cx="104"
                  cy={y - 6}
                  r="10"
                  fill="none"
                  stroke={flavor.accent}
                  strokeWidth="1"
                  opacity="0.4"
                />
                <text
                  x="134"
                  y={y}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="15"
                  fill={DANFO}
                  letterSpacing="0.14em"
                  fontWeight="700"
                >
                  WEEK {m.week}
                </text>
                <text
                  x={134 + 96 + String(m.week).length * 10}
                  y={y}
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontSize="13"
                  fill={flavor.subdue}
                  letterSpacing="0.12em"
                  fontWeight="700"
                >
                  {m.type.toUpperCase().replace(/-/g, ' ')}
                </text>
                <text
                  x="134"
                  y={y + 36}
                  fontFamily="Georgia, 'Times New Roman', serif"
                  fontSize="29"
                  fontWeight="600"
                  fill={flavor.text}
                >
                  {m.title.length > 44 ? `${m.title.slice(0, 41)}…` : m.title}
                </text>
              </g>
            )
          })}
        </g>
      )}

      {/* The Godfather's shadow — only on Fashemu endings */}
      {data.hasFashemuEnding && (
        <g>
          <g transform={`translate(806 ${momentsTitleY + 4})`}>
            <BustPortrait charId="fashemu" size={170} shape="square" />
          </g>
          <text
            x="891"
            y={momentsTitleY + 240}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="13"
            fill={flavor.subdue}
            letterSpacing="0.18em"
            fontWeight="700"
          >
            THE GODFATHER&apos;S SHADOW
          </text>
        </g>
      )}

      {/* Final scorecard — stamped grade blocks */}
      <text
        x="90"
        y={scoreTitleY}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15"
        fill={flavor.subdue}
        letterSpacing="0.2em"
        fontWeight="700"
      >
        FINAL SCORECARD
      </text>
      {data.grades.map((g, i) => {
        const x = 90 + i * (boxW + boxGap)
        return (
          <g key={g.key}>
            <rect x={x} y={boxY} width={boxW} height={boxH} fill={g.color} opacity="0.08" rx="4" />
            <rect
              x={x}
              y={boxY}
              width={boxW}
              height={boxH}
              fill="none"
              stroke={g.color}
              strokeWidth="2.5"
              rx="4"
            />
            <text
              x={x + boxW / 2}
              y={boxY + 88}
              textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize="86"
              fontWeight="700"
              fill={g.color}
            >
              {g.grade}
            </text>
            <text
              x={x + boxW / 2}
              y={boxY + 116}
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="15"
              fill={flavor.subdue}
              letterSpacing="0.16em"
              fontWeight="700"
            >
              {g.label.toUpperCase()}
            </text>
            {/* value bar */}
            <rect
              x={x + 24}
              y={boxY + 128}
              width={boxW - 48}
              height="5"
              fill={g.color}
              opacity="0.18"
              rx="2.5"
            />
            <rect
              x={x + 24}
              y={boxY + 128}
              width={Math.max(6, ((boxW - 48) * Math.min(100, Math.max(0, g.value))) / 100)}
              height="5"
              fill={g.color}
              opacity="0.75"
              rx="2.5"
            />
          </g>
        )
      })}

      {/* Footer band */}
      <rect x="0" y="1252" width="1080" height="98" fill={flavor.accent} opacity="0.1" />
      <rect x="0" y="1252" width="1080" height="3" fill={DANFO} opacity="0.9" />
      <text
        x="90"
        y="1310"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15"
        fill={flavor.subdue}
        letterSpacing="0.06em"
      >
        {data.gameVersion}
        {/* OTA-26 seam: append seed · hash here for verifiable runs */}
      </text>
      <g transform="translate(518 1274)">
        <LagosSealMark size={54} tone="accent" />
      </g>
      <text
        x="990"
        y="1310"
        textAnchor="end"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="22"
        fill={flavor.text}
        opacity="0.9"
        letterSpacing="0.14em"
        fontWeight="700"
      >
        LAGOS GOVERNOR SIM
      </text>
    </svg>
  )
}
