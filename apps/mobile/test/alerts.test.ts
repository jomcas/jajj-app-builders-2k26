// Group Hike Alerts (#24): the loopback transport, the member Alert state machine, the dot
// colour rule (ADR 0004), the simulated member's script through #8's detector, and this
// phone's outgoing Alerts.
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { alertsStore, SELF_ID, sendAlert, simulatedPeerTransport } from '../src/modules/alerts/alertsStore.ts';
import { applyAlert, initials, memberDot, memberStatus, type Member } from '../src/modules/alerts/memberState.ts';
import {
  MEMBER_SCRIPT,
  startIncident,
  startMemberScript,
  stepMemberScript,
} from '../src/modules/alerts/memberScript.ts';
import { createLoopbackPair } from '../src/modules/alerts/transport.ts';
import type { Alert, AlertType } from '../src/modules/alerts/types.ts';
import { startDeviationDetector, stepDeviation } from '../src/modules/hike/deviation/detector.ts';
import {
  buildSimulatedWalk,
  insertExcursion,
  sampleAt,
  walkDurationS,
} from '../src/modules/hike/simulate/walkScript.ts';
import { destinationPoint, locateOnTrail, prepareTrail } from '../src/modules/hike/trail/geometry.ts';

const T0 = 1_700_000_000_000;
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

function alert(type: AlertType, extra: Partial<Alert> = {}): Alert {
  return {
    id: `ana:${type}`,
    type,
    memberId: 'ana',
    memberName: 'Ana',
    position: { latitude: 14.05, longitude: 120.8 },
    time: T0,
    simulated: true,
    ...extra,
  };
}

describe('LoopbackTransport', () => {
  test('what one end sends, the other end receives, asynchronously, and never itself', async () => {
    const [phone, other] = createLoopbackPair();
    const atPhone: Alert[] = [];
    const atOther: Alert[] = [];
    phone.onReceive((a) => atPhone.push(a));
    other.onReceive((a) => atOther.push(a));
    other.send(alert('deviation'));
    assert.equal(atPhone.length, 0, 'not delivered synchronously');
    await tick();
    assert.deepEqual(atPhone.map((a) => a.type), ['deviation']);
    assert.equal(atOther.length, 0);
    assert.equal(other.sent.length, 1);
  });

  test('positions travel the same way, and unsubscribing stops delivery', async () => {
    const [phone, other] = createLoopbackPair();
    const got: string[] = [];
    const stop = phone.onPosition((p) => got.push(p.memberId));
    other.sendPosition({ memberId: 'ana', memberName: 'Ana', position: { latitude: 1, longitude: 2 }, time: T0 });
    await tick();
    stop();
    other.sendPosition({ memberId: 'ana', memberName: 'Ana', position: { latitude: 1, longitude: 2 }, time: T0 });
    await tick();
    assert.deepEqual(got, ['ana']);
  });
});

describe('the member Alert state machine', () => {
  const run = (...types: AlertType[]) =>
    types.reduce<Member | undefined>((member, type) => applyAlert(member, alert(type, { offTrailM: 60 })), undefined)!;

  test('deviation → cleared', () => {
    const off = run('deviation');
    assert.equal(memberStatus(off), 'deviation');
    assert.equal(off.offTrailM, 60);
    const back = run('deviation', 'deviation-cleared');
    assert.equal(memberStatus(back), 'ok');
    assert.equal(back.offTrailM, null);
  });

  test('flare → stopped', () => {
    assert.equal(memberStatus(run('flare')), 'flare');
    assert.equal(memberStatus(run('flare', 'flare-stopped')), 'ok');
  });

  test('a Flare outranks a Deviation, and each clears on its own', () => {
    assert.equal(memberStatus(run('deviation', 'flare')), 'flare');
    assert.equal(memberStatus(run('deviation', 'flare', 'flare-stopped')), 'deviation');
    assert.equal(memberStatus(run('deviation', 'flare', 'deviation-cleared')), 'flare');
  });

  test('a member is created by their first Alert, keeps their position and the simulated label', () => {
    const member = run('deviation');
    assert.equal(member.name, 'Ana');
    assert.equal(member.simulated, true);
    assert.deepEqual(member.position, { latitude: 14.05, longitude: 120.8 });
  });
});

describe('the dot colour rule (ADR 0004)', () => {
  test('olive with no icon unless in a Deviation or a Flare', () => {
    assert.deepEqual(memberDot('ok'), { fill: 'olive', icon: null, pulse: false });
  });
  test('red only in a Deviation or a Flare, and never without an icon', () => {
    for (const status of ['deviation', 'flare'] as const) {
      const dot = memberDot(status);
      assert.equal(dot.fill, 'danger');
      assert.ok(dot.icon, `${status} has an icon`);
    }
    assert.equal(memberDot('flare').pulse, true);
    assert.equal(memberDot('deviation').pulse, false);
  });
  test('initials: AN for Ana', () => {
    assert.equal(initials('Ana'), 'AN');
    assert.equal(initials('Juan dela Cruz'), 'JD');
  });
});

describe('the simulated member script through #8’s detector', () => {
  const start = { latitude: 14.05, longitude: 120.8 };
  const end = destinationPoint(start, 1500, 60);
  const trail = prepareTrail([
    [start.longitude, start.latitude],
    [end.longitude, end.latitude],
  ])!;

  for (const speed of [2, 15]) {
    test(`at ${speed}×: exactly one Deviation Alert and one Flare Alert, each cleared once`, () => {
      let samples = buildSimulatedWalk(trail, { excursions: false });
      const incidentAtS = 200;
      const stepS = 0.25 * speed;
      let detector = startDeviationDetector();
      let script = startMemberScript();
      const alerts: { type: AlertType; tS: number }[] = [];
      let inserted = false;
      for (let t = 0; t <= walkDurationS(samples); t += stepS) {
        if (!inserted && t >= incidentAtS) {
          samples = insertExcursion(trail, samples, t, 'long').samples;
          script = startIncident(script);
          inserted = true;
        }
        const sample = sampleAt(samples, t);
        const step = stepDeviation(detector, {
          offTrailM: locateOnTrail(sample, trail)!.offTrailM,
          timestamp: T0 + Math.round(t * 1000),
        });
        detector = step.state;
        const result = stepMemberScript(script, { tS: t, deviationEvent: step.event });
        script = result.state;
        alerts.push(...result.alerts.map((type) => ({ type, tS: t })));
      }
      assert.deepEqual(
        alerts.map((a) => a.type),
        ['deviation', 'deviation-cleared', 'flare', 'flare-stopped'],
      );
      const [, cleared, flare, stopped] = alerts;
      assert.ok(flare.tS - cleared.tS >= MEMBER_SCRIPT.flareAfterS);
      assert.ok(stopped.tS - flare.tS >= MEMBER_SCRIPT.flareForS);
      assert.equal(script.phase, 'done');
    });
  }

  test('without the incident, the member walks the whole Trail with no Alerts', () => {
    const samples = buildSimulatedWalk(trail, { excursions: false });
    let detector = startDeviationDetector();
    let script = startMemberScript();
    const types: AlertType[] = [];
    for (const sample of samples) {
      const step = stepDeviation(detector, {
        offTrailM: locateOnTrail(sample, trail)!.offTrailM,
        timestamp: T0 + sample.tS * 1000,
      });
      detector = step.state;
      const result = stepMemberScript(script, { tS: sample.tS, deviationEvent: step.event });
      script = result.state;
      types.push(...result.alerts);
    }
    assert.deepEqual(types, []);
  });
});

describe('this phone’s outgoing Alerts', () => {
  test('its own Deviation and Flare go out through the transport, and are not shown as a member', async () => {
    const peer = simulatedPeerTransport();
    const received: Alert[] = [];
    const stop = peer.onReceive((a) => received.push(a));
    const where = { latitude: 14.05, longitude: 120.8 };
    sendAlert('deviation', where, { offTrailM: 55 });
    sendAlert('deviation-cleared', where);
    sendAlert('flare', where);
    sendAlert('flare-stopped', where);
    await tick();
    stop();
    assert.deepEqual(
      received.map((a) => a.type),
      ['deviation', 'deviation-cleared', 'flare', 'flare-stopped'],
    );
    assert.ok(received.every((a) => a.memberId === SELF_ID));
    assert.equal(received[0].offTrailM, 55);
    assert.equal(alertsStore.getMembers()[SELF_ID], undefined);
  });

  test('an Alert from the other end reaches this phone’s store through the transport', async () => {
    simulatedPeerTransport().send(alert('flare'));
    await tick();
    const ana = alertsStore.getMembers().ana;
    assert.equal(memberStatus(ana), 'flare');
    assert.equal(alertsStore.getAlerts().at(-1)?.type, 'flare');
  });
});
