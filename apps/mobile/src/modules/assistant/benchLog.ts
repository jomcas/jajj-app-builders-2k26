// Logcat helpers shared by the benches.
import diagnostics from '../../../modules/tahak-diagnostics';

/** Logcat cuts lines near 4 KB; long text goes out in pieces well under that. */
const CHUNK = 1500;

export function logChunks(log: (record: Record<string, unknown>) => void, base: Record<string, unknown>, text: string) {
  const parts = Math.max(1, Math.ceil(text.length / CHUNK));
  for (let part = 0; part < parts; part++) {
    log({ ...base, part: part + 1, parts, text: text.slice(part * CHUNK, (part + 1) * CHUNK) });
  }
}

export function round(value: number, places = 2) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

/** Samples this process's PSS once a second and keeps the peak of the current phase. */
export function memorySampler() {
  let phasePeak = 0;
  let overallPeak = 0;
  const sample = () => {
    const pss = diagnostics.memoryKb().pss ?? 0;
    phasePeak = Math.max(phasePeak, pss);
    overallPeak = Math.max(overallPeak, pss);
  };
  sample();
  const timer = setInterval(sample, 1000);
  return {
    /** Peak PSS since the last call, in kB; starts a new phase. */
    endPhase() {
      sample();
      const peak = phasePeak;
      phasePeak = 0;
      return peak;
    },
    stop() {
      clearInterval(timer);
      sample();
      return overallPeak;
    },
  };
}
