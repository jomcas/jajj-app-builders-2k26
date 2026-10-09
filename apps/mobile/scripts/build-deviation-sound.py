#!/usr/bin/env python3
"""Builds the Deviation alert tone, assets/sounds/deviation_alert.wav (issue #8).

Generated here from sine waves, so there is no third-party audio and no licence to track.
The expo-notifications config plugin copies it into the Android res/raw folder at prebuild,
and the "Deviation alerts" notification channel plays it.

The tone: three high-low pairs (C6 then G5, 160 ms each), about 1.6 s in all. Each beep has a
little of its third harmonic so it cuts through on a small phone speaker, and 8 ms fades so it
does not click. 22.05 kHz, 16-bit mono PCM, about 70 KB.

Run from apps/mobile (standard library only):
  python3 -I scripts/build-deviation-sound.py
"""

import math
import struct
import wave
from pathlib import Path

RATE = 22050
AMPLITUDE = 0.8
FADE_S = 0.008
HIGH_HZ = 1046.5  # C6
LOW_HZ = 784.0  # G5
BEEP_S = 0.16
GAP_S = 0.06
PAIR_GAP_S = 0.22
PAIRS = 3

OUT = Path(__file__).resolve().parent.parent / 'assets' / 'sounds' / 'deviation_alert.wav'


def beep(frequency: float, seconds: float) -> list[float]:
    count = int(RATE * seconds)
    fade = int(RATE * FADE_S)
    samples = []
    for i in range(count):
        t = i / RATE
        value = 0.85 * math.sin(2 * math.pi * frequency * t) + 0.15 * math.sin(2 * math.pi * 3 * frequency * t)
        envelope = min(1.0, i / fade, (count - 1 - i) / fade)
        samples.append(value * envelope)
    return samples


def silence(seconds: float) -> list[float]:
    return [0.0] * int(RATE * seconds)


def main() -> None:
    samples: list[float] = []
    for pair in range(PAIRS):
        samples += beep(HIGH_HZ, BEEP_S) + silence(GAP_S) + beep(LOW_HZ, BEEP_S)
        if pair < PAIRS - 1:
            samples += silence(PAIR_GAP_S)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        out.writeframes(b''.join(struct.pack('<h', round(s * AMPLITUDE * 32767)) for s in samples))
    print(f'{OUT} · {len(samples) / RATE:.2f} s')


if __name__ == '__main__':
    main()
