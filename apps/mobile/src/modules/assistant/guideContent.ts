// The Guide Library's content, read straight from the Guide JSON files that ship with the app
// (src/modules/guides/content/<id>.json, from the Guides tickets #10/#11). Reading the files
// rather than the guides module keeps the Assistant independent of that module's code; a
// Guide is opened with its deep link, tahak://guides/<id>.

type RequireContext = { keys(): string[]; (id: string): unknown };

// Metro's require.context bundles every .json file in the folder, including ones added later.
const guideFiles: RequireContext = (
  require as unknown as { context(dir: string, recursive: boolean, filter: RegExp): RequireContext }
).context('../guides/content', false, /\.json$/);

export function loadGuideJson(): unknown[] {
  return guideFiles
    .keys()
    .sort()
    .map((key) => guideFiles(key));
}

export function guideLink(guideId: string): string {
  return `tahak://guides/${encodeURIComponent(guideId)}`;
}
