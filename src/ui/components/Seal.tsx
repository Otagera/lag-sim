import { LagosSealMark } from '../seals/LagosSealMark'

interface SealProps {
  size?: number
}

// Thin wrapper around the richer seal mark built in Style Lab
// (src/ui/seals/LagosSealMark.tsx) — that component already renders a
// legible compact reduction below 64px, which is the only size this real
// call site (StatusBar header, size=28) ever uses.
export function Seal({ size = 40 }: SealProps) {
  return <LagosSealMark size={size} />
}
