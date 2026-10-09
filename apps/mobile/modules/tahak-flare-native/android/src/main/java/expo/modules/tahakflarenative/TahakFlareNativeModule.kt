package expo.modules.tahakflarenative

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.os.Handler
import android.os.HandlerThread
import android.util.Log
import android.view.WindowManager
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val TAG = "TahakFlare"

/**
 * The phone hardware the Flare (issue #12) needs and JS cannot reach on its own:
 *
 * - the flashlight, through CameraManager.setTorchMode. That needs no camera permission and
 *   does not open the camera. The on/off pattern (the Morse SOS, built in JS by
 *   src/modules/flare/morse.ts) runs here on its own thread, so a busy JS thread cannot
 *   stretch a dot into a dash;
 * - the screen at full brightness, for the strobe, through the activity window only (no
 *   WRITE_SETTINGS, and the phone's own brightness setting is untouched);
 * - the media volume at maximum for the whistle tone, restored when the Flare stops.
 *
 * Each torch change is logged under the "TahakFlare" tag, so a test can read the blinking
 * from logcat.
 */
class TahakFlareNativeModule : Module() {
  private var thread: HandlerThread? = null
  private var handler: Handler? = null
  private var torchOn = false
  private var savedVolume: Int? = null

  private val context: Context?
    get() = appContext.reactContext

  private val cameraManager: CameraManager?
    get() = context?.getSystemService(Context.CAMERA_SERVICE) as? CameraManager

  private fun torchCameraId(): String? {
    val manager = cameraManager ?: return null
    return try {
      manager.cameraIdList.firstOrNull { id ->
        val c = manager.getCameraCharacteristics(id)
        c.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true &&
          c.get(CameraCharacteristics.LENS_FACING) == CameraCharacteristics.LENS_FACING_BACK
      } ?: manager.cameraIdList.firstOrNull { id ->
        manager.getCameraCharacteristics(id).get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
      }
    } catch (e: Exception) {
      Log.w(TAG, "no torch: ${e.message}")
      null
    }
  }

  private fun setTorch(id: String, on: Boolean) {
    try {
      cameraManager?.setTorchMode(id, on)
      torchOn = on
      Log.i(TAG, if (on) "torch on" else "torch off")
    } catch (e: Exception) {
      // The camera may be in use by another app; the screen and the tone still run.
      Log.w(TAG, "torch ${if (on) "on" else "off"} failed: ${e.message}")
    }
  }

  private fun stopTorchPattern() {
    handler?.removeCallbacksAndMessages(null)
    thread?.quitSafely()
    thread = null
    handler = null
    torchCameraId()?.let { if (torchOn) setTorch(it, false) }
    torchOn = false
  }

  private fun setWindowBrightness(level: Float) {
    val activity = appContext.currentActivity ?: return
    activity.runOnUiThread {
      val window = activity.window
      val attributes = window.attributes
      attributes.screenBrightness = level
      window.attributes = attributes
    }
  }

  private fun restoreVolume() {
    val saved = savedVolume ?: return
    savedVolume = null
    val audio = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    try {
      audio.setStreamVolume(AudioManager.STREAM_MUSIC, saved, 0)
      Log.i(TAG, "media volume restored to $saved")
    } catch (e: Exception) {
      Log.w(TAG, "media volume restore failed: ${e.message}")
    }
  }

  override fun definition() = ModuleDefinition {
    Name("TahakFlareNative")

    /** True if the phone has a flashlight the app can switch. */
    Function("hasTorch") {
      torchCameraId() != null
    }

    /**
     * Blinks the flashlight in a loop until stopTorch: durations in ms, alternately on and off,
     * starting with on. Replaces any pattern already running. False if there is no flashlight.
     */
    Function("startTorch") { durationsMs: List<Int> ->
      stopTorchPattern()
      val id = torchCameraId() ?: return@Function false
      // Even length, so every loop starts with "on".
      if (durationsMs.isEmpty() || durationsMs.size % 2 != 0) return@Function false
      val newThread = HandlerThread("TahakFlareTorch").also { it.start() }
      val newHandler = Handler(newThread.looper)
      thread = newThread
      handler = newHandler
      Log.i(TAG, "torch pattern start: ${durationsMs.joinToString(",")}")
      var index = 0
      val step = object : Runnable {
        override fun run() {
          setTorch(id, index % 2 == 0)
          val wait = durationsMs[index].toLong().coerceAtLeast(1)
          index = (index + 1) % durationsMs.size
          newHandler.postDelayed(this, wait)
        }
      }
      newHandler.post(step)
      true
    }

    /** Stops the blinking and turns the flashlight off. */
    Function("stopTorch") {
      stopTorchPattern()
      Log.i(TAG, "torch pattern stop")
      Unit
    }

    /** True while the flashlight is on (between blinks it reads false). */
    Function("isTorchOn") {
      torchOn
    }

    /** Full screen brightness for this app's window while true; the phone's setting otherwise. */
    Function("setMaxBrightness") { on: Boolean ->
      setWindowBrightness(
        if (on) WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_FULL
        else WindowManager.LayoutParams.BRIGHTNESS_OVERRIDE_NONE,
      )
      Unit
    }

    /** Sets the media volume to its maximum, remembering the old level for restoreMediaVolume. */
    Function("raiseMediaVolume") {
      val audio = context?.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        ?: return@Function Unit
      try {
        if (savedVolume == null) savedVolume = audio.getStreamVolume(AudioManager.STREAM_MUSIC)
        val max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        audio.setStreamVolume(AudioManager.STREAM_MUSIC, max, 0)
        Log.i(TAG, "media volume raised from $savedVolume to $max")
      } catch (e: Exception) {
        Log.w(TAG, "media volume raise failed: ${e.message}")
      }
      Unit
    }

    /** Puts the media volume back to where raiseMediaVolume found it. */
    Function("restoreMediaVolume") {
      restoreVolume()
      Unit
    }

    OnActivityDestroys {
      stopTorchPattern()
      restoreVolume()
    }

    OnDestroy {
      stopTorchPattern()
      restoreVolume()
    }
  }
}
