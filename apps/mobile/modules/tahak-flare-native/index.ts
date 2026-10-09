import { requireOptionalNativeModule } from 'expo';

// Local Expo module (Android only) for the Flare, issue #12: see
// android/src/main/java/expo/modules/tahakflarenative/TahakFlareNativeModule.kt.
type TahakFlareNativeModule = {
  /** True if the phone has a flashlight the app can switch. */
  hasTorch(): boolean;
  /**
   * Blinks the flashlight in a loop until stopTorch, on its own native thread. durationsMs
   * alternate on and off, starting with on, and must have an even length. False if there is
   * no flashlight or the pattern is invalid.
   */
  startTorch(durationsMs: number[]): boolean;
  /** Stops the blinking and turns the flashlight off. */
  stopTorch(): void;
  /** True while the flashlight is lit (false between blinks). */
  isTorchOn(): boolean;
  /** Full brightness for the app's window while true; the phone's own setting otherwise. */
  setMaxBrightness(on: boolean): void;
  /** Media volume to maximum, remembering the old level. */
  raiseMediaVolume(): void;
  /** Media volume back to where raiseMediaVolume found it. */
  restoreMediaVolume(): void;
};

// Null on a build without this module (an older APK), so the Flare's screen and tone still work.
export default requireOptionalNativeModule<TahakFlareNativeModule>('TahakFlareNative');
