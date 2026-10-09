import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useStrings, useTheme } from '../../settings/preferences';
import strings from './strings';

/** The small grey cloud-off icon next to a title: this Destination works offline (plan.md). */
export function WorksOfflineIcon({ size = 20 }: { size?: number }) {
  const { colors } = useTheme();
  const s = useStrings(strings);
  return (
    <MaterialCommunityIcons
      name="cloud-off-outline"
      size={size}
      color={colors.muted}
      accessible
      accessibilityRole="image"
      accessibilityLabel={s.worksOffline}
    />
  );
}
