# Tahak brand sheet (for the edit)

From `docs/plan.md` (settled in Wave −1). Keep the video's graphics inside these rules and it will look like the app.

## Name and line

- **Tahak**, Filipino for treading a path. The wordmark is all caps (TAHAK, with a mountain for the second A); in text it's "Tahak".
- Tagline: **"When the signal drops, your guide doesn't."**
- One-liner: "An offline hiking companion for Filipino mountains."

## Logo files (`logo/`)

| File | Use |
|---|---|
| `tahak-wordmark-night.png` | Light olive wordmark on dark footage (transparent) |
| `tahak-wordmark-day.png` | Dark olive wordmark on light footage (transparent) |
| `tahak-mark-night_1024.png` / `-day_1024.png` | The mountain "A" alone, square. Use it wherever an app icon would go. The app's own icon is still Expo's placeholder. |

## Colour: one meaning per colour

| Colour | Hex (day / night) | Means | In the video |
|---|---|---|---|
| Olive | `#353F2A` / `#C9D4B0` | Brand, buttons | Logo, badges |
| Trail orange | `#D9661F` / `#FF8A3D` | The Trail and progress | Accent words in headlines |
| GPS blue | `#1A6FD6` / `#5AA9FF` | The hiker's position | — |
| Red | `#A8201A` | **Danger only** | Only the Deviation lower third and the Flare. Never as a general accent ([ADR 0004](../../docs/adr/0004-red-means-danger-only.md)). |
| Page / ink | `#F7F4EC` / `#1B1F1A`, night `#000000` / `#EDEBE3` | Neutrals | Backgrounds, text |

See `palette.png` for swatches.

## Type (`fonts/`, SIL Open Font License)

- **Barlow Condensed Bold / SemiBold** for headlines and big numbers.
- **Barlow Regular / Medium** for body and captions.
- Sentence case, not all caps ("Fire the Flare", not "FIRE THE FLARE").

## Texture

Faint topographic contour lines in olive tint (`#2A3122` on black), only on title and end cards and empty backgrounds. Never behind small text.

## Sound (`../05-audio-sfx/`)

- `deviation_alert.wav`: the app's real off-trail tone. Use it under shot 5.
- `flare_whistle.wav`: the Flare's whistle. Loud; duck the music under it.

## Music direction

Acoustic or ambient, 85–100 BPM, warm, with one lift at the Deviation and a hard stop for the Flare whistle. Royalty-free sources: YouTube Audio Library, Pixabay Music, or Uppbeat (credit as each requires). Search "acoustic adventure" or "cinematic ambient".
