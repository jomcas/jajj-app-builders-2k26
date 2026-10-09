// The hike module's Assistant tools (issue #19, ADR 0001), listed in the module's `tools`.

import type { AssistantTool } from '../../types';
import { hikeStore } from '../hikeStore';
import strings from '../strings';
import { DISTANCE_TOOL_ID, distanceAnswer, matchDistance, type DistanceArgs } from './distance';
import { liveHikeFor } from './liveHike';

/** "How far to the next campsite?": the live distance and ETA to the next Waypoint. */
export const distanceTool: AssistantTool = {
  id: DISTANCE_TOOL_ID,
  description: { en: strings.en.toolDescription, fil: strings.fil.toolDescription },
  parameters: [
    {
      name: 'type',
      type: 'string',
      description: 'The kind of Waypoint asked for; omit for the next Waypoint of any kind.',
      enum: ['campsite', 'water', 'summit', 'jump_off'],
    },
  ],
  match: matchDistance,
  async run(args, { language }) {
    const hike = hikeStore.getSnapshot().hike;
    return distanceAnswer(hike !== null, hike ? liveHikeFor(hike.id) : null, args as DistanceArgs, language);
  },
};
