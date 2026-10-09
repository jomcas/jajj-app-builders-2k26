/// <reference types="expo/types" />
// The Guide content files, bundled into the app at build time (ADR 0002): nothing downloads.
//
// require.context makes Metro bundle every content/<id>.json statically, so adding a Guide
// means adding its file, with no code edit. Expo's Metro config enables require.context.
// In development builds the sample in ../fixtures is added too, so an ordinary Guide can be
// seen before the real ordinary Guides exist. It never appears in a release build.
import type { ContentFile } from '../loader';

function filesIn(context: ReturnType<typeof require.context>, folder: string): ContentFile[] {
  return context
    .keys()
    .filter((key) => key.endsWith('.json'))
    .sort()
    .map((key) => ({ source: `${folder}/${key.replace(/^\.\//, '')}`, raw: context(key) }));
}

export function contentFiles(): ContentFile[] {
  const files = filesIn(require.context('./', false, /\.json$/), 'content');
  if (__DEV__) files.push(...filesIn(require.context('../fixtures', false, /\.json$/), 'fixtures'));
  return files;
}
