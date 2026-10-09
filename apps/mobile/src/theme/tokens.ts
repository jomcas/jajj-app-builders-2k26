// Color tokens from docs/plan.md, "Settled: color system".
// One meaning per color: olive = brand and actions, trail orange = the Trail and progress
// (including the active tab), blue = the hiker's GPS position, amber = caution,
// red = danger only (ADR 0004). Everything else is warm neutrals.

export type ThemeMode = 'day' | 'night';

export type Palette = {
  page: string;
  surface: string;
  line: string;
  ink: string;
  muted: string;
  primary: string;
  onPrimary: string;
  tint: string;
  onTint: string;
  peach: string;
  onPeach: string;
  sky: string;
  onSky: string;
  butter: string;
  onButter: string;
  blush: string;
  trail: string;
  trailOutline: string;
  gps: string;
  /** Red for the SOS icon and text and Emergency Guide icons. */
  dangerIcon: string;
  /** Red fill for the Deviation banner and the active Flare. */
  danger: string;
  onDanger: string;
  /** Dims the screen behind a sheet or dialog. */
  scrim: string;
};

const day: Palette = {
  page: '#F7F4EC',
  surface: '#FFFDF8',
  line: '#DDD7C8',
  ink: '#1B1F1A',
  muted: '#434A41',
  primary: '#353F2A',
  onPrimary: '#F7F4EC',
  tint: '#DCE4C8',
  onTint: '#353F2A',
  peach: '#F9D3B4',
  onPeach: '#6A2C0C',
  sky: '#CFE3F7',
  onSky: '#0E3F7A',
  butter: '#FBE7A1',
  onButter: '#5C4300',
  blush: '#F6D0CC',
  trail: '#D9661F',
  trailOutline: '#3B1F0E',
  gps: '#1A6FD6',
  dangerIcon: '#A8201A',
  danger: '#A8201A',
  onDanger: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.4)',
};

// The plan gives night text colors for peach, sky and butter; the fills come from the
// Wave −1 prototype (.lavish/tahak-prototype.html).
const night: Palette = {
  page: '#000000',
  surface: '#141414',
  line: '#2A2A2A',
  ink: '#EDEBE3',
  muted: '#A9AFA5',
  primary: '#C9D4B0',
  onPrimary: '#000000',
  tint: '#2A3122',
  onTint: '#C9D4B0',
  peach: '#3A2A1F',
  onPeach: '#FFC9A3',
  sky: '#1E2B3B',
  onSky: '#A9CDF5',
  butter: '#3A331C',
  onButter: '#F5DC8A',
  blush: '#3B2220',
  trail: '#FF8A3D',
  trailOutline: '#2A1406',
  gps: '#5AA9FF',
  dangerIcon: '#FF8A80',
  danger: '#A8201A',
  onDanger: '#FFFFFF',
  // Stronger than by day: the night page is already black, so the sheet needs more separation.
  scrim: 'rgba(0, 0, 0, 0.6)',
};

export const palettes: Record<ThemeMode, Palette> = { day, night };
