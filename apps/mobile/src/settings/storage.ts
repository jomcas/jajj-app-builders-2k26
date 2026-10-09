import AsyncStorage from '@react-native-async-storage/async-storage';

// Small on-device preferences (theme, language). Stored locally only.
export async function loadSetting<T extends string>(
  key: string,
  allowed: readonly T[],
): Promise<T | undefined> {
  try {
    const value = await AsyncStorage.getItem(`tahak.${key}`);
    return allowed.find((option) => option === value);
  } catch {
    return undefined;
  }
}

export function saveSetting(key: string, value: string): void {
  AsyncStorage.setItem(`tahak.${key}`, value).catch(() => {
    // A failed write only means the choice is not remembered after a restart.
  });
}
