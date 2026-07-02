import type { ReactNode } from 'react'
import { LagosSkyline } from '../LagosSkyline'
import { WindowFrame } from './WindowFrame'
import { DeskSurface } from './DeskSurface'
import { CoffeeCup } from './CoffeeCup'
import { DeskPhone } from './DeskPhone'
import { Notebook } from './Notebook'
import { DeskLamp } from './DeskLamp'
import { DESK_KEYFRAMES } from './keyframes'

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

  return (
    <div style={{
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
    }}>
      <style>{DESK_KEYFRAMES}</style>
      {/* Wall texture overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(
          90deg,
          transparent,
          transparent 120px,
          rgba(0,0,0,.02) 120px,
          rgba(0,0,0,.02) 121px
        )`,
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
        padding: '24px 20px 0',
      }}>
        {/* Window area */}
        {showWindow && (
          <div style={{
            position: 'relative',
            marginBottom: '0',
          }}>
            {/* Window glow/atmosphere */}
            <div style={{
              position: 'absolute',
              top: '-10%', left: '-10%', right: '-10%', bottom: '-10%',
              background: windowBg,
              borderRadius: '4px',
              pointerEvents: 'none',
              transition: 'background .6s ease',
            }} />
            <WindowFrame width={420} height={240}>
              <LagosSkyline height="100%" />
            </WindowFrame>
          </div>
        )}

        {/* Spacer to create desk perspective */}
        <div style={{ height: '16px' }} />

        {/* Desk SVG container */}
        <div style={{
          position: 'relative',
          width: '100%',
        }}>
          <svg
            viewBox="0 0 500 260"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          >
            <DeskSurface
              x={0}
              y={40}
              width={500}
              height={160}
              deskStyle={deskStyle}
            />

            {showProps && (
              <>
                {/* Coffee cup — left side */}
                <CoffeeCup x={20} y={50} scale={1.3} steaming={situation !== 'crisis'} />

                {/* Phone — far left */}
                <DeskPhone x={12} y={100} scale={1.1} ringing={situation === 'crisis'} />

                {/* Notebook — right side */}
                <Notebook x={410} y={55} scale={1.2} />

                {/* Lamp — far right */}
                <DeskLamp x={450} y={110} scale={1} lit={isDark} />
              </>
            )}
          </svg>

          {/* Game elements on the desk surface */}
          <div style={{
            position: 'absolute',
            left: '22%',
            right: '22%',
            top: '20%',
            bottom: '15%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}>
            {children}
          </div>
        </div>

        {/* Floor area below desk */}
        <div style={{
          width: '100%',
          height: '20px',
          background: isDark
            ? 'linear-gradient(180deg, #8a7a6a, #7a6a5a)'
            : 'linear-gradient(180deg, #c8b8a8, #b8a898)',
          transition: 'background .6s ease',
        }} />
      </div>
    </div>
  )
}
