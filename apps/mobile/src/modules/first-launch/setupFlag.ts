import AsyncStorage from '@react-native-async-storage/async-storage';

// Whether first-launch setup has been completed on this phone.
const KEY = 'tahak.setupComplete';

export async function isSetupComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'yes';
  } catch {
    return false;
  }
}

export async function markSetupComplete(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'yes').catch(() => {});
}

/** Shows setup again on the next launch (dev deep link tahak://setup/reset). */
export async function resetSetup(): Promise<void> {
  await AsyncStorage.removeItem(KEY).catch(() => {});
}
