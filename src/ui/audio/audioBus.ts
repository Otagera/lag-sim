/**
 * audioBus — the single owner of game sound. Pure Web Audio (no libraries, no
 * asset files): one-shot cues for decisions/transitions plus a low, looping
 * ambient bed that cross-fades by situation.
 *
 * Quality chain (what makes synth sound produced rather than beep-y):
 *   voices → [dry + reverb send] → master gain (mute) → limiter → destination
 *   - a soft algorithmic reverb (convolver w/ generated impulse) gives space
 *   - a limiter (DynamicsCompressor) tames peaks so nothing is harsh/clippy
 *   - beds are WARM detuned sine "pads" (chords) + filtered noise — never raw
 *     saw/square drones — with slow filter movement so they breathe
 *   - every cue has attack/release envelopes (no clicks) and passes through reverb
 *
 * Design intent (OTA-47): weight, not whimsy. Ambient is OFF by default and
 * intentionally quiet; nothing loud or sudden. Browsers only allow audio after a
 * user gesture, so the context is created lazily and resumed on first unmute/cue.
 */

export type AudioSituation = 'calm' | 'election' | 'crisis' | 'storm'
export type Cue = 'commit' | 'crisis' | 'blackout'

let ctx: AudioContext | null = null
let master: GainNode | null = null       // mute / master volume
let reverbIn: GainNode | null = null      // send bus into the reverb
let muted = true
let desired: AudioSituation | null = null
let current: AmbientVoice | null = null
let noiseBuffer: AudioBuffer | null = null

interface AmbientVoice {
  situation: AudioSituation
  sources: AudioScheduledSourceNode[]
  fade: GainNode
}

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      ctx = new Ctor()

      // Limiter on the master bus — keeps everything smooth, never harsh.
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -10
      limiter.knee.value = 8
      limiter.ratio.value = 12
      limiter.attack.value = 0.003
      limiter.release.value = 0.25
      limiter.connect(ctx.destination)

      master = ctx.createGain()
      master.gain.value = muted ? 0 : 1
      master.connect(limiter)

      // Reverb send: convolver with a synthesized decaying-noise impulse.
      const convolver = ctx.createConvolver()
      convolver.buffer = makeImpulse(ctx, 2.4, 2.6)
      const wet = ctx.createGain()
      wet.gain.value = 0.22
      reverbIn = ctx.createGain()
      reverbIn.connect(convolver)
      convolver.connect(wet)
      wet.connect(master)

      preloadSamples(ctx) // start fetching any local audio files (synth until ready)
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

// A short plate-ish impulse response: exponentially decaying stereo noise.
function makeImpulse(c: AudioContext, seconds: number, decay: number): AudioBuffer {
  const rate = c.sampleRate
  const len = Math.floor(rate * seconds)
  const buf = c.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
    }
  }
  return buf
}

// A 2s looping white-noise buffer, reused for filtered-noise textures.
function getNoise(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer
  const len = c.sampleRate * 2
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  noiseBuffer = buf
  return buf
}

// ─── Sample layer (optional local files; synth is the automatic fallback) ────────
// Drop files in public/audio/ (see public/audio/README.md). If a file is present
// it's used; if not, the synth bed/cue plays instead. Recorded audio wins for the
// "real world" moods (election crowds, crisis unrest) that synthesis can't fake.
const SAMPLE_BASE = '/audio'
const AMBIENT_SRC: Record<AudioSituation, string[]> = {
  calm:     [`${SAMPLE_BASE}/ambient-calm.ogg`,     `${SAMPLE_BASE}/ambient-calm.mp3`],
  election: [`${SAMPLE_BASE}/ambient-election.ogg`, `${SAMPLE_BASE}/ambient-election.mp3`],
  crisis:   [`${SAMPLE_BASE}/ambient-crisis.ogg`,   `${SAMPLE_BASE}/ambient-crisis.mp3`],
  storm:    [`${SAMPLE_BASE}/ambient-storm.ogg`,    `${SAMPLE_BASE}/ambient-storm.mp3`],
}
const CUE_SRC: Record<Cue, string[]> = {
  commit:   [`${SAMPLE_BASE}/cue-commit.ogg`,   `${SAMPLE_BASE}/cue-commit.mp3`],
  crisis:   [`${SAMPLE_BASE}/cue-crisis.ogg`,   `${SAMPLE_BASE}/cue-crisis.mp3`],
  blackout: [`${SAMPLE_BASE}/cue-blackout.ogg`, `${SAMPLE_BASE}/cue-blackout.mp3`],
}
const sampleBuf = new Map<string, AudioBuffer>()
let preloaded = false

async function loadFirst(c: AudioContext, key: string, urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      sampleBuf.set(key, await c.decodeAudioData(await res.arrayBuffer()))
      return
    } catch { /* try next url, else stay on synth */ }
  }
}

function preloadSamples(c: AudioContext): void {
  if (preloaded) return
  preloaded = true
  const jobs: Promise<void>[] = []
  for (const [k, urls] of Object.entries(AMBIENT_SRC)) jobs.push(loadFirst(c, `ambient:${k}`, urls))
  for (const [k, urls] of Object.entries(CUE_SRC)) jobs.push(loadFirst(c, `cue:${k}`, urls))
  // Once loaded, swap any currently-playing synth bed to its sample.
  void Promise.allSettled(jobs).then(() => applyAmbient())
}

// Play a decoded sample as a one-shot through the dry+reverb bus.
function playSample(c: AudioContext, buf: AudioBuffer, gain: number, wet: number): void {
  const g = c.createGain()
  g.gain.value = gain
  const s = c.createBufferSource()
  s.buffer = buf
  s.connect(g)
  route(g, wet)
  s.start(c.currentTime)
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function isMuted(): boolean {
  return muted
}

/** Toggle sound. Unmuting lazily creates/resumes the context (call from a gesture). */
export function setMuted(m: boolean): void {
  muted = m
  const c = m ? ctx : ensureCtx()
  if (c && master) {
    const t = c.currentTime
    master.gain.cancelScheduledValues(t)
    master.gain.setValueAtTime(master.gain.value, t)
    master.gain.linearRampToValueAtTime(m ? 0 : 1, t + 0.3)
  }
  applyAmbient()
}

/** One-shot sting. No-op while muted. Enveloped + reverbed so it reads as a designed sound. */
export function playCue(type: Cue): void {
  if (muted) return
  const c = ensureCtx()
  if (!c || !master || !reverbIn) return
  const buf = sampleBuf.get(`cue:${type}`)
  if (buf) { playSample(c, buf, 0.9, 0.18); return } // local file wins
  const t = c.currentTime
  if (type === 'commit') cueCommit(c, t)
  else if (type === 'crisis') cueCrisis(c, t)
  else cueBlackout(c, t)
}

/** Cross-fade the ambient bed to the given situation. No audible effect while muted. */
export function setAmbient(situation: AudioSituation): void {
  desired = situation
  applyAmbient()
}

/** Stop everything (e.g. leaving the game screen). */
export function stopAll(): void {
  desired = null
  stopAmbient(0.3)
}

// ─── Routing helper ─────────────────────────────────────────────────────────────

// Send a node to both the dry master and the reverb bus.
function route(node: AudioNode, wet = 0.5): void {
  if (master) node.connect(master)
  if (reverbIn && wet > 0) {
    const send = ctx!.createGain()
    send.gain.value = wet
    node.connect(send)
    send.connect(reverbIn)
  }
}

// ─── Cues (designed one-shots, not test tones) ───────────────────────────────────

// Soft wooden "confirm": a gentle sine pluck + a short filtered tick. Reassuring.
function cueCommit(c: AudioContext, t: number): void {
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.012) // fast soft attack (no click)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
  route(g, 0.35)

  const o1 = c.createOscillator()
  o1.type = 'sine'
  o1.frequency.setValueAtTime(523.25, t) // C5
  o1.frequency.exponentialRampToValueAtTime(392, t + 0.13)
  const o2 = c.createOscillator()
  o2.type = 'sine'
  o2.frequency.setValueAtTime(784, t) // soft octave shimmer
  const o2g = c.createGain()
  o2g.gain.value = 0.3
  o2.connect(o2g); o2g.connect(g)
  o1.connect(g)
  o1.start(t); o2.start(t)
  o1.stop(t + 0.55); o2.stop(t + 0.55)

  // tiny percussive tick for tactility
  tick(c, t, 0.05, 2200)
}

// Tense low swell — a minor-second dyad rising and settling. Dread, not an alarm beep.
function cueCrisis(c: AudioContext, t: number): void {
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(300, t)
  lp.frequency.linearRampToValueAtTime(1400, t + 0.4)
  lp.frequency.linearRampToValueAtTime(500, t + 1.3)

  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.12, t + 0.18)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4)
  lp.connect(g)
  route(g, 0.55)

  for (const [f, det] of [[146.8, 0], [155.6, 4]] as const) { // D3 + Eb3 (minor 2nd)
    const o = c.createOscillator()
    o.type = 'triangle'
    o.frequency.value = f
    o.detune.value = det
    o.connect(lp)
    o.start(t); o.stop(t + 1.45)
  }
}

// Power-down: a low tone sagging in pitch under a burst of filtered noise fading out.
function cueBlackout(c: AudioContext, t: number): void {
  const o = c.createOscillator()
  o.type = 'sine'
  o.frequency.setValueAtTime(140, t)
  o.frequency.exponentialRampToValueAtTime(36, t + 0.55)
  const og = c.createGain()
  og.gain.setValueAtTime(0.0001, t)
  og.gain.exponentialRampToValueAtTime(0.24, t + 0.02)
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.7)
  o.connect(og)
  route(og, 0.4)
  o.start(t); o.stop(t + 0.75)

  // noise whoosh dying with the power
  const n = c.createBufferSource()
  n.buffer = getNoise(c)
  const nf = c.createBiquadFilter()
  nf.type = 'lowpass'
  nf.frequency.setValueAtTime(1200, t)
  nf.frequency.exponentialRampToValueAtTime(120, t + 0.6)
  const ng = c.createGain()
  ng.gain.setValueAtTime(0.12, t)
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.65)
  n.connect(nf); nf.connect(ng)
  route(ng, 0.5)
  n.start(t); n.stop(t + 0.7)
}

function tick(c: AudioContext, t: number, gain: number, cutoff: number): void {
  const n = c.createBufferSource()
  n.buffer = getNoise(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = cutoff
  bp.Q.value = 0.8
  const g = c.createGain()
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)
  n.connect(bp); bp.connect(g)
  route(g, 0.2)
  n.start(t); n.stop(t + 0.08)
}

// ─── Ambient beds (warm pads + texture, never raw drones) ────────────────────────

// Each bed is a chord of detuned sine partials through a slowly-moving lowpass,
// plus an optional filtered-noise layer. Kept quiet — a bed you feel, not hear.
const BEDS: Record<AudioSituation, {
  chord: number[]     // partial frequencies (Hz)
  detune: number      // ± cents spread for warmth/chorus
  gain: number        // pad loudness (low)
  cutoff: number      // lowpass centre
  sweep: number       // ± Hz the cutoff drifts
  sweepHz: number     // cutoff drift rate (breathing)
  noise?: { type: BiquadFilterType; freq: number; q: number; gain: number }
}> = {
  // Warm, consonant, restful — a major-ish spread
  calm:     { chord: [98, 147, 196, 294], detune: 6, gain: 0.05, cutoff: 700, sweep: 260, sweepHz: 0.05 },
  // Brighter with a hint of tension (added 2nd), gentle motion
  election: { chord: [110, 165, 220, 247], detune: 7, gain: 0.05, cutoff: 900, sweep: 320, sweepHz: 0.09 },
  // Minor, close intervals that beat slightly — unease without harshness
  crisis:   { chord: [110, 131, 165, 196], detune: 10, gain: 0.055, cutoff: 520, sweep: 200, sweepHz: 0.14,
              noise: { type: 'bandpass', freq: 320, q: 0.7, gain: 0.02 } },
  // Low rumble + wind/rain hiss; the pad sits deep and dark
  storm:    { chord: [55, 82, 110], detune: 9, gain: 0.06, cutoff: 300, sweep: 140, sweepHz: 0.2,
              noise: { type: 'lowpass', freq: 700, q: 0.9, gain: 0.05 } },
}

const AMBIENT_FADE = 1.6 // seconds

function applyAmbient(): void {
  if (muted || !desired) {
    stopAmbient(AMBIENT_FADE)
    return
  }
  const c = ensureCtx()
  if (!c || !master) return
  if (current && current.situation === desired) return
  stopAmbient(AMBIENT_FADE)
  current = buildBed(c, desired)
}

// Prefer a local sample loop; fall back to the synth pad if no file is present.
function buildBed(c: AudioContext, situation: AudioSituation): AmbientVoice {
  const buf = sampleBuf.get(`ambient:${situation}`)
  if (buf) {
    const t = c.currentTime
    const fade = c.createGain()
    fade.gain.setValueAtTime(0.0001, t)
    fade.gain.linearRampToValueAtTime(1, t + AMBIENT_FADE)
    route(fade, 0.12)
    const src = c.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(fade)
    src.start(t)
    return { situation, sources: [src], fade }
  }
  return buildSynthBed(c, situation)
}

function buildSynthBed(c: AudioContext, situation: AudioSituation): AmbientVoice {
  const cfg = BEDS[situation]
  const t = c.currentTime
  const sources: AudioScheduledSourceNode[] = []

  // fade envelope for the whole bed
  const fade = c.createGain()
  fade.gain.setValueAtTime(0.0001, t)
  fade.gain.linearRampToValueAtTime(1, t + AMBIENT_FADE)
  route(fade, 0.4)

  // slowly-moving lowpass gives the pad life without any tremolo harshness
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = cfg.cutoff
  lp.Q.value = 0.6
  lp.connect(fade)

  const lfo = c.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = cfg.sweepHz
  const lfoGain = c.createGain()
  lfoGain.gain.value = cfg.sweep
  lfo.connect(lfoGain); lfoGain.connect(lp.frequency)
  lfo.start(t); sources.push(lfo)

  const padGain = c.createGain()
  padGain.gain.value = cfg.gain / cfg.chord.length
  padGain.connect(lp)

  // detuned sine pair per chord note = gentle chorus/warmth
  cfg.chord.forEach((f, i) => {
    for (const sign of [-1, 1]) {
      const o = c.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      o.detune.value = sign * cfg.detune + (i - 1) * 1.5
      o.connect(padGain)
      o.start(t); sources.push(o)
    }
  })

  // optional filtered-noise texture (wind/rain/unease)
  if (cfg.noise) {
    const n = c.createBufferSource()
    n.buffer = getNoise(c)
    n.loop = true
    const nf = c.createBiquadFilter()
    nf.type = cfg.noise.type
    nf.frequency.value = cfg.noise.freq
    nf.Q.value = cfg.noise.q
    const ng = c.createGain()
    ng.gain.value = cfg.noise.gain
    n.connect(nf); nf.connect(ng); ng.connect(lp)
    n.start(t); sources.push(n)
  }

  return { situation, sources, fade }
}

function stopAmbient(fade: number): void {
  const voice = current
  current = null
  if (!voice || !ctx) return
  const t = ctx.currentTime
  voice.fade.gain.cancelScheduledValues(t)
  voice.fade.gain.setValueAtTime(voice.fade.gain.value, t)
  voice.fade.gain.linearRampToValueAtTime(0.0001, t + fade)
  for (const s of voice.sources) {
    try { s.stop(t + fade + 0.05) } catch { /* already stopped */ }
  }
}
