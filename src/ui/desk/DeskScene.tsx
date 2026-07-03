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

export function DeskScene({
  children,
  situation = 'calm',
  deskStyle = 'modern',
  showWindow = true,
  showProps = true,
}: Props) {
  const wallColor = wallColors[situation]
  const windowBg = windowBgs[situation]
  const isDark = situation === 'crisis' || situation === 'storm'

  // First child is treated as "the document" resting on the desk (paper shadow + tilt);
  // any further children (e.g. a stat readout) render beneath it, unstyled.
  const [document, ...rest] = Children.toArray(children)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '860px',
        margin: '0 auto',
        background: wallColor,
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: isDark
          ? 'inset 0 0 60px rgba(0,0,0,.15), 0 4px 20px rgba(0,0,0,.2)'
          : 'inset 0 0 40px rgba(0,0,0,.03), 0 4px 20px rgba(0,0,0,.12)',
        transition: 'background .6s ease, box-shadow .6s ease',
      }}
    >
      <style>{DESK_KEYFRAMES}</style>
      {/* Wall texture overlay */}
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
        {/* Window area */}
        {showWindow && (
          <div
            style={{
              position: 'relative',
              marginBottom: '0',
            }}
          >
            {/* Window glow/atmosphere */}
            <div
              style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                right: '-10%',
                bottom: '-10%',
                background: windowBg,
                borderRadius: '4px',
                pointerEvents: 'none',
                transition: 'background .6s ease',
              }}
            />
            <WindowFrame width={420} height={240}>
              <LagosSkyline height="100%" />
            </WindowFrame>
          </div>
        )}

        {/* Spacer to create desk perspective */}
        <div style={{ height: '16px' }} />

        {/* Desk SVG container */}
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
                {/* Coffee cup — top-left corner, framing the document */}
                <CoffeeCup x={16} y={44} scale={1.3} steaming={situation !== 'crisis'} />

                {/* Phone — bottom-left corner */}
                <DeskPhone x={10} y={150} scale={1.1} ringing={situation === 'crisis'} />

                {/* Notebook — top-right corner */}
                <Notebook x={408} y={42} scale={1.2} />

                {/* Lamp — bottom-right corner */}
                <DeskLamp x={448} y={145} scale={1} lit={isDark} />
              </>
            )}
          </svg>
        </div>

        {/* Game elements — pulled up to sit at ~20% down the desk surface, then
            left in normal flow so real (variable-height) content isn't clipped */}
        <div
          style={{
            width: '56%',
            marginTop: '-41.6%',
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {document && (
            // Kraft mat underneath the document — gives it a paper backing/edge
            // instead of floating as a bare UI card; the card itself is untouched.
            <div
              className="atm-grain"
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '2px',
                background: isDark ? '#c9b183' : '#dcc79a',
                boxShadow: isDark
                  ? '0 2px 6px rgba(0,0,0,.35), 0 16px 32px rgba(0,0,0,.4)'
                  : '0 2px 5px rgba(60,40,20,.18), 0 16px 32px rgba(50,32,14,.22)',
                transition: 'background .6s ease, box-shadow .6s ease',
              }}
            >
              <div
                style={{
                  transform: 'rotate(-0.6deg)',
                  boxShadow: '0 2px 6px rgba(30,20,10,.2)',
                }}
              >
                {document}
              </div>
            </div>
          )}
          {rest}
        </div>

        {/* Floor area below desk */}
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
      </div>
    </div>
  )
}
