import { Children, type ReactNode } from 'react'
import { LagosSkyline } from '../LagosSkyline'
import { CoffeeCup } from './CoffeeCup'
import { DeskLamp } from './DeskLamp'
import { DeskPhone } from './DeskPhone'
import { DeskSurface } from './DeskSurface'
import { DESK_KEYFRAMES } from './keyframes'
import { Notebook } from './Notebook'
import { WindowFrame } from './WindowFrame'

type DeskStyle = 'modern' | 'traditional' | 'simple'
type Situation = 'calm' | 'election' | 'crisis' | 'storm'

interface Props {
  children?: ReactNode
  situation?: Situation
  deskStyle?: DeskStyle
  showWindow?: boolean
  showProps?: boolean
}

const wallColors: Record<Situation, string> = {
  calm: '#e8e0d4',
  election: '#e5ddd0',
  crisis: '#d4c8b8',
  storm: '#b8a898',
}

const windowBgs: Record<Situation, string> = {
  calm: 'rgba(255,255,255,.05)',
  election: 'rgba(255,255,255,.05)',
  crisis: 'rgba(0,0,0,.08)',
  storm: 'rgba(0,0,0,.15)',
}

function DeskShell({
  wallColor,
  isDark,
  children,
}: {
  wallColor: string
  isDark: boolean
  children: ReactNode
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
        background: wallColor,
        borderRadius: '8px',
        // Not clipped: the document can be taller than the desk artwork
        // (a multi-choice event card vs. a one-line empty state) and needs
        // to extend past it rather than being cut off.
        overflow: 'visible',
        boxShadow: isDark
          ? 'inset 0 0 60px rgba(0,0,0,.15), 0 4px 20px rgba(0,0,0,.2)'
          : 'inset 0 0 40px rgba(0,0,0,.03), 0 4px 20px rgba(0,0,0,.12)',
        transition: 'background .6s ease, box-shadow .6s ease',
      }}
    >
      <style>{DESK_KEYFRAMES}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 120px,
          rgba(0,0,0,.02) 120px,
          rgba(0,0,0,.02) 121px
        )`,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0',
          padding: '24px 20px 0',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// The desk's own drawn legs/feet already read as "the desk," but this floor
// strip is the room's front edge below it — purely decorative, no relation
// to document content. It's bundled with the SVG (not appended after
// whatever the document renders) specifically so its position is pinned to
// the artwork's own fixed height and can never be displaced by document
// height, regardless of how the document is laid out above it.
function FloorStrip({ isDark }: { isDark: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '20px',
        background: isDark
          ? 'linear-gradient(180deg, #8a7a6a, #7a6a5a)'
          : 'linear-gradient(180deg, #c8b8a8, #b8a898)',
        transition: 'background .6s ease',
      }}
    />
  )
}

function WindowArea({ situation, showWindow }: { situation: Situation; showWindow: boolean }) {
  if (!showWindow) {
    return null
  }

  return (
    <div
      className="hidden sm:block"
      style={{
        position: 'relative',
        marginBottom: '0',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          right: '-10%',
          bottom: '-10%',
          background: windowBgs[situation],
          borderRadius: '4px',
          pointerEvents: 'none',
          transition: 'background .6s ease',
        }}
      />
      <WindowFrame width={420} height={240}>
        <LagosSkyline height="100%" />
      </WindowFrame>
    </div>
  )
}

function DeskSvg({
  deskStyle,
  situation,
  showProps,
}: {
  deskStyle: DeskStyle
  situation: Situation
  showProps: boolean
}) {
  const isDark = situation === 'crisis' || situation === 'storm'

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <svg
        viewBox="0 0 500 260"
        role="img"
        aria-label="Governor's desk"
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      >
        <DeskSurface x={0} y={40} width={500} height={160} deskStyle={deskStyle} />

        {showProps && (
          <>
            <CoffeeCup x={16} y={44} scale={1.3} steaming={situation !== 'crisis'} />
            <DeskPhone x={10} y={150} scale={1.1} ringing={situation === 'crisis'} />
            <Notebook x={408} y={42} scale={1.2} />
            <DeskLamp x={448} y={145} scale={1} lit={isDark} />
          </>
        )}
      </svg>
    </div>
  )
}

function DocumentMat({ document }: { document: ReactNode }) {
  if (!document) {
    return null
  }

  return (
    <div
      className="atm-grain"
      style={{
        width: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        background: 'var(--paper)',
        boxShadow: 'var(--shadow-atm)',
        transform: 'rotate(-0.6deg)',
        transition: 'background .6s ease, box-shadow .6s ease',
      }}
    >
      {document}
    </div>
  )
}

export function DeskScene({
  children,
  situation = 'calm',
  deskStyle = 'modern',
  showWindow = true,
  showProps = true,
}: Props) {
  const wallColor = wallColors[situation]
  const windowBg = windowBgs[situation]
  const isDark = situation === 'crisis' || (situation === 'storm' && windowBg === windowBgs.storm)

  // First child is treated as "the document" resting on the desk (paper shadow + tilt);
  // any further children (e.g. a stat readout) render beneath it, unstyled.
  const [document, ...rest] = Children.toArray(children)

  return (
    <DeskShell wallColor={wallColor} isDark={isDark}>
      {/* Desk art and the document share one grid cell, so the taller of the
          two drives the height: an empty state lets the desk art size the box
          (desk fully visible); a tall multi-choice card sizes it instead, and
          DeskShell grows with it so the last choice can't hide under the dock. */}
      <div style={{ display: 'grid', width: '100%' }}>
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // Decoration only — must never intercept clicks on the choices it
            // overlaps.
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <WindowArea situation={situation} showWindow={showWindow} />
          <div style={{ height: '16px' }} />
          <DeskSvg deskStyle={deskStyle} situation={situation} showProps={showProps} />
          <FloorStrip isDark={isDark} />
        </div>
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            justifySelf: 'center',
            // 56% of an 860px desktop shell is a sensible ~480px card, but
            // the same 56% of a ~360px phone shell crushes it to ~200px —
            // capping the width and letting it grow to 90% below that cap
            // keeps the card readable at any size instead of just scaling
            // the desktop proportion down.
            width: 'min(480px, 90%)',
            paddingTop: '4%',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <DocumentMat document={document} />
          {rest}
        </div>
      </div>
    </DeskShell>
  )
}
