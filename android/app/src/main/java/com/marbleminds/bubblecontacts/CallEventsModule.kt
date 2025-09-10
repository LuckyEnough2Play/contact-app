package com.marbleminds.bubblecontacts

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class CallEventsModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var registered = false
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent == null) return
      if (intent.action != ACTION_CALL_EVENT) return
      val map = Arguments.createMap().apply {
        putString("type", intent.getStringExtra("type"))
        putString("number", intent.getStringExtra("number"))
        putString("source", intent.getStringExtra("source"))
        putString("appPackage", intent.getStringExtra("appPackage"))
        putString("rawText", intent.getStringExtra("rawText"))
      }
      reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("callEvent", map)
    }
  }

  override fun getName(): String = "CallEvents"

  @ReactMethod
  fun startListeners() {
    if (registered) return
    val filter = IntentFilter().apply { addAction(ACTION_CALL_EVENT) }
    reactContext.registerReceiver(receiver, filter)
    registered = true
  }

  @ReactMethod
  fun stopListeners() {
    if (!registered) return
    try {
      reactContext.unregisterReceiver(receiver)
    } catch (_: Exception) {}
    registered = false
  }

  @ReactMethod
  fun openNotificationAccessSettings() {
    val intent = Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun postLikelyNotification(names: ReadableArray) {
    val list = mutableListOf<String>()
    for (i in 0 until names.size()) {
      list.add(names.getString(i) ?: "")
    }
    LikelyNotifier.postLikelyNotification(reactContext, list)
  }

  companion object {
    const val ACTION_CALL_EVENT = "com.marbleminds.bubblecontacts.CALL_EVENT"
  }
}

