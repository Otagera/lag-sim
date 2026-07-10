# Game audio (local files)

Drop audio files here and `audioBus.ts` uses them automatically. If a file is
missing, the synthesized fallback plays instead — so you can add them one at a
time. Recorded audio is strongly preferred for **election** and **crisis**
(crowds / unrest can't be faked with synthesis); **storm** and **calm** already
sound fine synthesized, so those files are optional.

## Filenames (exact)

`.ogg` is tried first, then `.mp3`. Provide either one.

| Purpose | File | Type | Notes |
|---|---|---|---|
| Calm bed | `ambient-calm.ogg` / `.mp3` | loop | optional (synth is fine) |
| Election bed | `ambient-election.ogg` / `.mp3` | loop | **wanted** — rally/crowd/PA/drums |
| Crisis bed | `ambient-crisis.ogg` / `.mp3` | loop | **wanted** — tension/unrest/siren |
| Storm bed | `ambient-storm.ogg` / `.mp3` | loop | optional (synth is fine) |
| Commit cue | `cue-commit.ogg` / `.mp3` | one-shot | soft confirm / stamp |
| Crisis cue | `cue-crisis.ogg` / `.mp3` | one-shot | tension hit / sting |
| Blackout cue | `cue-blackout.ogg` / `.mp3` | one-shot | power-down |

**Ambient beds must loop seamlessly.** Aim for 15–40s, keep them quiet/low-mid,
avoid a recognizable melody (it's a bed, not a track). Ogg Vorbis ~96–128 kbps,
mono is fine — keeps files small.

## Where to get stock audio (license-safe)

Prefer **CC0 / royalty-free, no attribution** to keep licensing simple. If a
clip requires credit, add it to a `CREDITS.md` in this folder.

- **Pixabay** — https://pixabay.com/sound-effects/ — royalty-free, no attribution. Easiest.
- **Freesound** — https://freesound.org — huge library; filter license to **CC0**. Great for real-world beds.
- **Mixkit** — https://mixkit.co/free-sound-effects/ — free with a permissive license.
- **Kenney** — https://kenney.nl/assets?q=audio — CC0 game UI sounds (good for cues).
- **OpenGameArt** — https://opengameart.org — filter to CC0.
- **YouTube Audio Library** — https://youtube.com/audiolibrary — free SFX/ambience.
- **Zapsplat / Uppbeat** — free tiers, usually require attribution.

## Search terms per slot

- **election bed:** "crowd rally ambience", "political rally", "protest chant distant", "marching drums", "megaphone crowd", "stadium crowd murmur"
- **crisis bed:** "tension drone", "suspense underscore", "distant siren city", "unrest crowd", "anxiety pulse", "dark ambient bed"
- **storm bed (optional):** "heavy rain thunder loop", "rain ambience", "wind storm"
- **calm bed (optional):** "calm ambient pad", "soft room tone", "peaceful drone"
- **commit cue:** "ui confirm soft", "paper stamp", "wooden click", "page turn"
- **crisis cue:** "tension hit", "dramatic impact soft", "warning sting"
- **blackout cue:** "power down", "electricity shutdown", "generator die", "power failure"

## After adding files

Reload the app, open `/style-lab`, toggle 🔊 Sound, and cycle the states — the
file plays instead of the synth. Tune per-slot reverb/level in `audioBus.ts`
(`playSample` / `buildBed` `route(...)` wet amounts) if needed.
