// Parses the Guide deep link. Pure, tested under plain Node.
//
//   tahak://guides/<id>     opens that Guide in the Guides tab
//   tahak://guides          opens the Guide Library list

export type GuideLink = { id: string | null };

export function parseGuideLink(url: string | null): GuideLink | null {
  if (!url) return null;
  const match = url.match(/^tahak:\/\/guides(?:\/([^/?#]*))?\/?(?:[?#]|$)/);
  if (!match) return null;
  const id = match[1] ? decodeURIComponent(match[1]).toLowerCase() : '';
  return { id: id || null };
}
