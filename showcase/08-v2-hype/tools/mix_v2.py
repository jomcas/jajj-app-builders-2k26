"""Rough mix of the Tahak v2 promo audio: voice-over on top, the music ducked under it, SFX on the cuts.

Usage: python3 mix_v2.py <dir with 44.1 kHz 16-bit WAVs> <out.wav>
Inputs: vo.wav (mono), music.wav, glitch.wav, whoosh.wav, deviation.wav, whistle.wav (stereo).
Timings come from the word-level transcript (vo-words.json); see EDIT-v2.md.
"""
import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
SRC, OUT = Path(sys.argv[1]), sys.argv[2]

MUSIC_START = 3.91       # the music's beat drop (4.25 s into the track) lands on "This is Tahak" at 8.16 s
MUSIC_GAIN = 0.62        # under no speech
MUSIC_DUCK = 0.30        # under speech
TAIL = 1.0               # seconds after the last word (room for the closing boom)
RISER_END = 4.25         # where the music's own riser ends and the beat drops


def load(name):
    w = wave.open(str(SRC / name))
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if w.getnchannels() == 1:
        a = np.stack([a, a], axis=1)
    else:
        a = a.reshape(-1, 2)
    return a


vo = load('vo.wav')
music = load('music.wav')
length = len(vo) + int(TAIL * SR)
mix = np.zeros((length, 2), np.float32)


def place(clip, at, gain, fade_out=0.0):
    start = int(at * SR)
    clip = clip[: max(0, length - start)] * gain
    if fade_out:
        n = min(len(clip), int(fade_out * SR))
        clip[-n:] *= np.linspace(1, 0, n)[:, None]
    mix[start:start + len(clip)] += clip


# Sidechain-style ducking from the voice's envelope (attack 20 ms, release 250 ms).
env = np.abs(vo[:, 0])
win = int(0.02 * SR)
env = np.convolve(env, np.ones(win) / win, mode='same')
speaking = (env > 0.02).astype(np.float32)
rel = int(0.25 * SR)
speaking = np.convolve(speaking, np.ones(rel) / rel, mode='same')
speaking = np.clip(speaking * 3, 0, 1)
duck = np.full(length, MUSIC_GAIN, np.float32)
duck[: len(speaking)] = MUSIC_GAIN - (MUSIC_GAIN - MUSIC_DUCK) * speaking

m0 = int(MUSIC_START * SR)
seg = music[: length - m0].copy()
r = int(RISER_END * SR)
seg[:r] *= np.linspace(2.6, 1.0, r)[:, None]     # lift the soft riser so the cold open never dips
mix[m0:m0 + len(seg)] += seg * duck[m0:m0 + len(seg), None]

glitch, whoosh = load('glitch.wav'), load('whoosh.wav')
place(glitch, 0.00, 0.55)                      # cold open: signal lost
place(glitch, 3.00, 0.45)                      # "Gone."
for k, t in enumerate(np.arange(0.9, 7.4, 0.8)):  # low static bed under the rest of the cold open
    place(glitch[::-1] if k % 2 else glitch, float(t), 0.16, fade_out=0.3)
place(whoosh[::-1], 8.16 - len(whoosh) / SR, 0.55)  # reversed whoosh sucks into the drop on "This is Tahak"
place(whoosh, 63.55, 0.45)                     # into "your guide doesn't"
place(glitch, 65.05, 0.70)                     # closing boom, bookends the cold open
for t in [16.25, 25.55, 30.95, 35.80, 49.80, 54.70, 58.70]:  # scene cuts (see EDIT-v2.md)
    place(whoosh, t, 0.40)
place(load('deviation.wav')[: int(1.2 * SR)], 32.25, 0.35, fade_out=0.3)   # the app's real off-trail tone
place(load('whistle.wav')[: int(1.6 * SR)], 57.00, 0.22, fade_out=0.4)     # the app's real Flare whistle

mix[: len(vo)] += vo
peak = np.max(np.abs(mix))
mix *= 0.95 / peak
fade = int(0.4 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]

o = wave.open(OUT, 'wb')
o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR)
o.writeframes((mix * 32767).astype(np.int16).tobytes())
print(f'{OUT}: {length / SR:.2f} s, normalised from peak {peak:.2f}')
