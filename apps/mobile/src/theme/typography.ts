import type { TextStyle } from 'react-native';

// Font files are embedded in the APK by the expo-font config plugin (app.config.js), so nothing
// is loaded at runtime (ADR 0002). On Android the family name is the file name.
export const fonts = {
  heading: 'BarlowCondensed_600SemiBold',
  headingBold: 'BarlowCondensed_700Bold',
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemiBold: 'Barlow_600SemiBold',
} as const;

// Barlow Condensed for headings and big numbers, Barlow for body. Sentence case, never all caps.
export const textStyles = {
  title: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32 },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 26 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 22 },
  /** Small labels: tab names, section labels. */
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 17 },
  labelStrong: { fontFamily: fonts.bodySemiBold, fontSize: 13, lineHeight: 17 },
  /** The SOS control's text. */
  signal: { fontFamily: fonts.headingBold, fontSize: 18, letterSpacing: 0.6 },
  /** Live numbers (distance, ETA, elevation): condensed with tabular figures. */
  number: { fontFamily: fonts.headingBold, fontSize: 32, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;
