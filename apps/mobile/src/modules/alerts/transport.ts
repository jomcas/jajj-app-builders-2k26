// How Alerts travel between the phones of a Group Hike. Pure, tested under plain Node.
//
// The alerts module only ever talks to an AlertTransport, so the link can change without
// touching the Alert UI:
//
//   - today: LoopbackTransport. Two ends linked in memory on this phone. This phone holds one
//     end; the simulated group member holds the other, as if it were a second phone. What one
//     end sends, the other receives, a tick later (never synchronously, like a real link).
//   - #23 (deferred): a NearbyTransport over Google Nearby Connections, one end per phone.
//     It implements this same interface: send() writes the Alert (JSON) to every connected
//     endpoint, onReceive() fires for each payload that parses as an Alert, and the same for
//     positions. Swap it in with setTransport() in alertsStore.ts. Nothing else changes.
//
// A transport never delivers a phone's own messages back to it.

import type { Alert, MemberPosition } from './types.ts';

type Unsubscribe = () => void;

export interface AlertTransport {
  /** Sends an Alert to every other member of the Group Hike. */
  send(alert: Alert): void;
  /** Calls cb for each Alert another member sends. */
  onReceive(cb: (alert: Alert) => void): Unsubscribe;
  /** Sends this member's position (between Alerts, so their dot moves). */
  sendPosition(update: MemberPosition): void;
  onPosition(cb: (update: MemberPosition) => void): Unsubscribe;
}

/** One end of an in-memory link. Create them in pairs with createLoopbackPair(). */
export class LoopbackTransport implements AlertTransport {
  private peer: LoopbackTransport | null = null;
  private readonly alertListeners = new Set<(alert: Alert) => void>();
  private readonly positionListeners = new Set<(update: MemberPosition) => void>();
  /** Every Alert this end sent, newest last (for logs and tests). */
  readonly sent: Alert[] = [];

  connect(peer: LoopbackTransport): void {
    this.peer = peer;
  }

  send(alert: Alert): void {
    this.sent.push(alert);
    const peer = this.peer;
    if (!peer) return;
    setTimeout(() => peer.alertListeners.forEach((cb) => cb(alert)), 0);
  }

  onReceive(cb: (alert: Alert) => void): Unsubscribe {
    this.alertListeners.add(cb);
    return () => {
      this.alertListeners.delete(cb);
    };
  }

  sendPosition(update: MemberPosition): void {
    const peer = this.peer;
    if (!peer) return;
    setTimeout(() => peer.positionListeners.forEach((cb) => cb(update)), 0);
  }

  onPosition(cb: (update: MemberPosition) => void): Unsubscribe {
    this.positionListeners.add(cb);
    return () => {
      this.positionListeners.delete(cb);
    };
  }
}

/** Two linked ends: [this phone's, the other member's]. */
export function createLoopbackPair(): [LoopbackTransport, LoopbackTransport] {
  const a = new LoopbackTransport();
  const b = new LoopbackTransport();
  a.connect(b);
  b.connect(a);
  return [a, b];
}
