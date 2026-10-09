// Parses the dev-only preview links. Pure, tested under plain Node.
//
//   tahak://emergency/preview/<guideId>      shows the Emergency Guide card for that Guide
//   tahak://emergency/ask?q=<question>       routes the question and shows the result and card
//
// Either takes &lang=en|fil and &theme=day|night. Dev builds only (see PreviewGate.tsx).
import type { Language } from '../../i18n/types';
import type { ThemeMode } from '../../theme/tokens';

export type PreviewRequest =
  | { kind: 'guide'; guideId: string; language?: Language; theme?: ThemeMode }
  | { kind: 'ask'; question: string; language?: Language; theme?: ThemeMode };

function decode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function params(query: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const pair of (query ?? '').split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key) out[decode(key)] = decode(value);
  }
  return out;
}

export function parsePreviewLink(url: string | null): PreviewRequest | null {
  if (!url) return null;
  const match = url.match(/^tahak:\/\/emergency\/(preview|ask)(?:\/([^/?#]*))?\/?(?:\?([^#]*))?(?:#.*)?$/);
  if (!match) return null;
  const query = params(match[3]);
  const language = query.lang === 'en' || query.lang === 'fil' ? query.lang : undefined;
  const theme = query.theme === 'day' || query.theme === 'night' ? query.theme : undefined;
  if (match[1] === 'preview') {
    const guideId = match[2] ? decode(match[2]).toLowerCase() : '';
    return guideId ? { kind: 'guide', guideId, language, theme } : null;
  }
  const question = (query.q ?? '').trim();
  return question ? { kind: 'ask', question, language, theme } : null;
}
