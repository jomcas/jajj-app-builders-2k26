import { requireNativeModule } from 'expo';

// Local Expo module (Android only): see android/src/main/java/.../TahakDiagnosticsModule.kt.
type TahakDiagnosticsModule = {
  /** Absolute path of the app's external files directory, or null if it is unavailable. */
  externalFilesDir(): string | null;
  /** Writes one line to logcat under the given tag. Logcat truncates lines near 4 KB. */
  log(tag: string, message: string): void;
  /** True if the phone is in airplane mode. */
  airplaneMode(): boolean;
  /** Process memory in kB: pss, plus VmHWM, VmRSS, VmPeak, RssAnon, RssFile and friends. */
  memoryKb(): Record<string, number>;
};

export default requireNativeModule<TahakDiagnosticsModule>('TahakDiagnostics');
