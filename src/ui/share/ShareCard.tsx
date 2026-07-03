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

type FlavorPalette = (typeof FLAVOR_COLORS)[keyof typeof FLAVOR_COLORS]
type KeyMoment = ShareCardData['keyMoments'][number]
type ScoreGrade = ShareCardData['grades'][number]

interface ShareCardLayout {
  headlineLines: string[]
  headlineSize: number
  headlineLineH: number
  headlineY: number
  afterHeadline: number
  verdictLines: string[]
  verdictY: number
  ghostNumeral: string
  ghostSize: number
  momentsTitleY: number
  momentStep: number
  moments: KeyMoment[]
  timelineTop: number
  timelineBottom: number
  scoreTitleY: number
  boxY: number
  boxW: number
  boxH: number
  boxGap: number
}

const wrapLine = (label: string, maxChars: number): string[] => {
  if (label.length <= maxChars) return [label]
  const dashIdx = label.indexOf('—')
  if (dashIdx > 0) {
    return [label.slice(0, dashIdx).trim(), `— ${label.slice(dashIdx + 1).trim()}`]
  }
  const words = label.split(' ')
  const lines: string[] = ['']
  for (const word of words) {
    const cur = lines[lines.length - 1]
    if (cur && `${cur} ${word}`.length > maxChars) lines.push(word)
    else lines[lines.length - 1] = cur ? `${cur} ${word}` : word
  }
  return lines.slice(0, 3)
}

const buildShareCardLayout = (data: ShareCardData): ShareCardLayout => {
  const headlineLines = wrapLine(data.exitLabel, 24)
  const headlineSize = headlineLines.length > 1 ? 78 : 88
  const headlineLineH = headlineSize * 1.08
  const headlineY = 320
  const afterHeadline = headlineY + (headlineLines.length - 1) * headlineLineH
  const momentsTitleY = 640
  const momentStep = 104
  const moments = data.keyMoments.slice(0, 3)
  const timelineTop = momentsTitleY + 34

  return {
    headlineLines,
    headlineSize,
    headlineLineH,
    headlineY,
    afterHeadline,
    verdictLines: wrapLine(data.verdictHeadline, 46),
    verdictY: afterHeadline + 74,
    ghostNumeral: String(data.weekCount),
    ghostSize: String(data.weekCount).length >= 3 ? 330 : 430,
    momentsTitleY,
    momentStep,
    moments,
    timelineTop,
    timelineBottom: timelineTop + (moments.length - 1) * momentStep + 18,
    scoreTitleY: 1024,
    boxY: 1050,
    boxW: 201,
    boxH: 148,
    boxGap: 32,
  }
}

const ShareCardDefs = ({ flavor }: { flavor: FlavorPalette }) => (
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
)

const BackgroundLayer = () => (
  <>
    <rect width="1080" height="1350" fill="url(#card-bg)" />
    <rect width="1080" height="1350" fill="url(#share-grain)" />
  </>
)

const GhostWeek = ({
  data,
  flavor,
  layout,
}: {
  data: ShareCardData
  flavor: FlavorPalette
  layout: ShareCardLayout
}) => (
  <>
    <text
      x="1042"
      y="620"
      textAnchor="end"
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize={layout.ghostSize}
      fontWeight="700"
      fill="none"
      stroke={flavor.accent}
      strokeWidth="2"
      opacity="0.13"
    >
      {layout.ghostNumeral}
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
  </>
)

const Masthead = ({ flavor }: { flavor: FlavorPalette }) => (
  <>
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
  </>
)

const TenureKicker = ({ data, flavor }: { data: ShareCardData; flavor: FlavorPalette }) => (
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
)

const HeadlineBlock = ({ flavor, layout }: { flavor: FlavorPalette; layout: ShareCardLayout }) => (
  <>
    <rect
      x="90"
      y={layout.headlineY - 66}
      width="5"
      height={layout.afterHeadline - layout.headlineY + 92}
      fill={flavor.accent}
      opacity="0.85"
    />
    {layout.headlineLines.map((line, i) => (
      <text
        key={line}
        x="122"
        y={layout.headlineY + i * layout.headlineLineH}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize={layout.headlineSize}
        fontWeight="700"
        fill={flavor.text}
      >
        {line}
      </text>
    ))}
  </>
)

const VerdictDeck = ({ flavor, layout }: { flavor: FlavorPalette; layout: ShareCardLayout }) => (
  <>
    {layout.verdictLines.map((line, i) => (
      <text
        key={line}
        x="122"
        y={layout.verdictY + i * 48}
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="36"
        fontStyle="italic"
        fill={flavor.accent}
      >
        {line}
      </text>
    ))}
  </>
)

const VerdictStamp = ({ flavor, stamp }: { flavor: FlavorPalette; stamp: string }) => (
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
    <rect x="52" y="-58" width="26" height="5" fill={flavor.bg} opacity="0.9" />
    <rect x="-104" y="49" width="34" height="5" fill={flavor.bg} opacity="0.9" />
  </g>
)

const TimelineMoment = ({
  flavor,
  moment,
  y,
}: {
  flavor: FlavorPalette
  moment: KeyMoment
  y: number
}) => (
  <g>
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
      WEEK {moment.week}
    </text>
    <text
      x={134 + 96 + String(moment.week).length * 10}
      y={y}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="13"
      fill={flavor.subdue}
      letterSpacing="0.12em"
      fontWeight="700"
    >
      {moment.type.toUpperCase().replace(/-/g, ' ')}
    </text>
    <text
      x="134"
      y={y + 36}
      fontFamily="Georgia, 'Times New Roman', serif"
      fontSize="29"
      fontWeight="600"
      fill={flavor.text}
    >
      {moment.title.length > 44 ? `${moment.title.slice(0, 41)}…` : moment.title}
    </text>
  </g>
)

const KeyMomentsTimeline = ({
  flavor,
  layout,
}: {
  flavor: FlavorPalette
  layout: ShareCardLayout
}) => {
  if (layout.moments.length === 0) return null

  return (
    <g>
      <text
        x="90"
        y={layout.momentsTitleY}
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
        y1={layout.timelineTop}
        x2="104"
        y2={layout.timelineBottom}
        stroke={flavor.subdue}
        strokeWidth="2"
        opacity="0.6"
      />
      {layout.moments.map((moment, i) => (
        <TimelineMoment
          key={`km-${moment.week}-${moment.type}`}
          flavor={flavor}
          moment={moment}
          y={layout.timelineTop + 14 + i * layout.momentStep}
        />
      ))}
    </g>
  )
}

const FashemuShadow = ({
  flavor,
  show,
  titleY,
}: {
  flavor: FlavorPalette
  show: boolean
  titleY: number
}) => {
  if (!show) return null

  return (
    <g>
      <g transform={`translate(806 ${titleY + 4})`}>
        <BustPortrait charId="fashemu" size={170} shape="square" />
      </g>
      <text
        x="891"
        y={titleY + 240}
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
  )
}

const GradeBlock = ({
  flavor,
  grade,
  index,
  layout,
}: {
  flavor: FlavorPalette
  grade: ScoreGrade
  index: number
  layout: ShareCardLayout
}) => {
  const x = 90 + index * (layout.boxW + layout.boxGap)
  const valueWidth = Math.max(
    6,
    ((layout.boxW - 48) * Math.min(100, Math.max(0, grade.value))) / 100,
  )

  return (
    <g>
      <rect
        x={x}
        y={layout.boxY}
        width={layout.boxW}
        height={layout.boxH}
        fill={grade.color}
        opacity="0.08"
        rx="4"
      />
      <rect
        x={x}
        y={layout.boxY}
        width={layout.boxW}
        height={layout.boxH}
        fill="none"
        stroke={grade.color}
        strokeWidth="2.5"
        rx="4"
      />
      <text
        x={x + layout.boxW / 2}
        y={layout.boxY + 88}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="86"
        fontWeight="700"
        fill={grade.color}
      >
        {grade.grade}
      </text>
      <text
        x={x + layout.boxW / 2}
        y={layout.boxY + 116}
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="15"
        fill={flavor.subdue}
        letterSpacing="0.16em"
        fontWeight="700"
      >
        {grade.label.toUpperCase()}
      </text>
      <rect
        x={x + 24}
        y={layout.boxY + 128}
        width={layout.boxW - 48}
        height="5"
        fill={grade.color}
        opacity="0.18"
        rx="2.5"
      />
      <rect
        x={x + 24}
        y={layout.boxY + 128}
        width={valueWidth}
        height="5"
        fill={grade.color}
        opacity="0.75"
        rx="2.5"
      />
    </g>
  )
}

const Scorecard = ({
  data,
  flavor,
  layout,
}: {
  data: ShareCardData
  flavor: FlavorPalette
  layout: ShareCardLayout
}) => (
  <>
    <text
      x="90"
      y={layout.scoreTitleY}
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="15"
      fill={flavor.subdue}
      letterSpacing="0.2em"
      fontWeight="700"
    >
      FINAL SCORECARD
    </text>
    {data.grades.map((grade, index) => (
      <GradeBlock key={grade.key} flavor={flavor} grade={grade} index={index} layout={layout} />
    ))}
  </>
)

const FooterBand = ({ data, flavor }: { data: ShareCardData; flavor: FlavorPalette }) => (
  <>
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
  </>
)

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
  const layout = buildShareCardLayout(data)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1080 1350"
      width="100%"
      height="100%"
      style={{ display: 'block' }}
      aria-label="Lagos Governor Sim Legacy Card"
    >
      <ShareCardDefs flavor={flavor} />
      <BackgroundLayer />
      <GhostWeek data={data} flavor={flavor} layout={layout} />
      <Masthead flavor={flavor} />
      <TenureKicker data={data} flavor={flavor} />
      <HeadlineBlock flavor={flavor} layout={layout} />
      <VerdictDeck flavor={flavor} layout={layout} />
      <VerdictStamp flavor={flavor} stamp={stamp} />
      <KeyMomentsTimeline flavor={flavor} layout={layout} />
      <FashemuShadow flavor={flavor} show={data.hasFashemuEnding} titleY={layout.momentsTitleY} />
      <Scorecard data={data} flavor={flavor} layout={layout} />
      <FooterBand data={data} flavor={flavor} />
    </svg>
  )
}
