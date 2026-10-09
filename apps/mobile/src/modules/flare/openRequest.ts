// Opening the Flare screen without a tap on SOS, e.g. from the Assistant's Flare tool. The
// shell's SOS control on the focused tab subscribes (SosAction.onOpenRequest) and shows the
// screen. Opening never fires the Flare: that still takes the 1.5 s hold (ADR 0004).
// Pure, tested under plain Node.

const openers = new Set<() => void>();

/** Shows the Flare screen, ready to fire. Returns false if no SOS control is listening. */
export function openFlareScreen(): boolean {
  openers.forEach((open) => open());
  return openers.size > 0;
}

/** For the shell's SOS control: call `open` when the Flare screen is asked for. */
export function onFlareOpenRequest(open: () => void): () => void {
  openers.add(open);
  return () => {
    openers.delete(open);
  };
}
