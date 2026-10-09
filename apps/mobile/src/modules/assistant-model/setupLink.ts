// Dev-only deep links for testing first launch and the download. Pure, so tests can load it.
//
//   tahak://setup/reset                    show the setup screen again (no uninstall)
//   tahak://setup/test-download[?fresh=1]  use the small test manifest (fresh: delete its folder first)
//   tahak://setup/real-download            back to the real Assistant model
import type { ModelSource } from './manifest.ts';

export type SetupLink = { kind: 'reset' } | { kind: 'source'; source: ModelSource; fresh: boolean };

export function parseSetupLink(url: string | null): SetupLink | null {
  const match = url?.match(/^tahak:\/\/setup\/([a-z-]+)(?:[?#](.*))?$/);
  if (!match) return null;
  const query = match[2] ?? '';
  switch (match[1]) {
    case 'reset':
      return { kind: 'reset' };
    case 'test-download':
      return { kind: 'source', source: 'test', fresh: /(^|&)fresh=1(&|$)/.test(query) };
    case 'real-download':
      return { kind: 'source', source: 'real', fresh: false };
    default:
      return null;
  }
}
