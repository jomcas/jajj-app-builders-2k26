#!/usr/bin/env python3
"""Builds the Flare's whistle tone, assets/sounds/flare_whistle.wav (issue #12).

Generated here from sine waves, so there is no third-party audio and no licence to track.
The Flare loops it with expo-audio on the media stream until the hiker stops the Flare.

The tone copies the distress whistle: three long blasts, then a pause, about 3.1 s per loop.
Each blast is near 3 kHz, where a small phone speaker is loud and the ear is most sensitive,
and warbles a little (2.9 to 3.3 kHz, 6 times a second) so it stands out from birdsong and
insects. 10 ms fades so it does not click, and the loop ends in silence so the join is clean.
22.05 kHz, 16-bit mono PCM, about 135 KB.

Run from apps/mobile (standard library only):
  python3 -I scripts/build-flare-whistle.py
"""

import math
import struct
import wave
from pathlib import Path

RATE = 22050
AMPLITUDE = 0.95
FADE_S = 0.01
CENTER_HZ = 3100.0
WARBLE_HZ = 200.0  # ± around the centre
WARBLE_RATE = 6.0  # warbles per second
BLAST_S = 0.6
GAP_S = 0.25
PAUSE_S = 0.8
BLASTS = 3

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'sounds' / 'flare_whistle.wav'


def blast(seconds: float) -> list[float]:
    count = int(RATE * seconds)
    fade = int(RATE * FADE_S)
    samples = []
    phase = 0.0
    for i in range(count):
        t = i / RATE
        frequency = CENTER_HZ + WARBLE_HZ * math.sin(2 * math.pi * WARBLE_RATE * t)
        phase += 2 * math.pi * frequency / RATE
        envelope = min(1.0, i / fade, (count - 1 - i) / fade)
        samples.append(math.sin(phase) * envelope)
    return samples


def silence(seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds)


def main() -> None:
    samples: list[float] = []
    for n in range(BLASTS):
        samples += blast(BLAST_S)
        samples += silence(GAP_S if n < BLASTS - 1 else PAUSE_S)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(s * AMPLITUDE * 32767)) for s in samples))
    print(f'{OUT} · {len(samples) / RATE:.2f} s')


if __name__ == '__main__':
    main()
