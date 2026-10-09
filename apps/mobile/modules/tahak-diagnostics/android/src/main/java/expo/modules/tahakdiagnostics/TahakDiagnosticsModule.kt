package expo.modules.tahakdiagnostics

import android.os.Debug
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

/**
 * Small Android helpers the JS side cannot reach on its own: the app's external files
 * directory, logcat lines under a chosen tag, airplane mode, and this process's memory.
 */
class TahakDiagnosticsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TahakDiagnostics")

    /** Absolute path of Context.getExternalFilesDir(null), or null if storage is unavailable. */
    Function("externalFilesDir") {
      appContext.reactContext?.getExternalFilesDir(null)?.absolutePath
    }

    /** Writes one line to logcat at INFO level under the given tag. */
    Function("log") { tag: String, message: String ->
      Log.i(tag, message)
      Unit
    }

    /** True if the phone is in airplane mode. */
    Function("airplaneMode") {
      val resolver = appContext.reactContext?.contentResolver
      resolver != null && Settings.Global.getInt(resolver, Settings.Global.AIRPLANE_MODE_ON, 0) == 1
    }

    /**
     * Memory of this process in kB: PSS from Debug.getPss(), plus the Vm and Rss lines of
     * /proc/self/status (VmHWM is the peak resident set size since the process started).
     */
    Function("memoryKb") {
      val result = mutableMapOf<String, Long>("pss" to Debug.getPss())
      File("/proc/self/status").forEachLine { line ->
        val key = line.substringBefore(':')
        if (key.startsWith("Vm") || key.startsWith("Rss")) {
          line.substringAfter(':').trim().removeSuffix("kB").trim().toLongOrNull()?.let {
            result[key] = it
          }
        }
      }
      result
    }
  }
}
