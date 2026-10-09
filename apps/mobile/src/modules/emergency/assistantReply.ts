// How an emergency route becomes the Assistant's reply (issue #14's pipeline seam). Pure,
// tested under plain Node. Structural: it does not import the Assistant's types, so this
// module never depends on the Assistant (the Assistant depends on it).
import type { EmergencyResult } from './router';

/** The pipeline's emergency reply: a Guide to open, or bare distress (the distress card). */
export type AssistantEmergencyReply =
  | { kind: 'emergency'; guideId: string; distress?: undefined }
  | { kind: 'emergency'; distress: true; guideId?: undefined };

export function toAssistantReply(result: EmergencyResult | null): AssistantEmergencyReply | null {
  if (!result) return null;
  return result.kind === 'guide' ? { kind: 'emergency', guideId: result.guideId } : { kind: 'emergency', distress: true };
}
