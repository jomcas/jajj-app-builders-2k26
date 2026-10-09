import { useStrings } from '../../settings/preferences';
import { EmptyState } from '../../shell/EmptyState';
import strings from './strings';

export function PlaceholderScreen() {
  const s = useStrings(strings);
  return <EmptyState icon="message-outline" title={s.title} body={s.body} />;
}
