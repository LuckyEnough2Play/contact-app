package com.marbleminds.bubblecontacts

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager

class TelephonyReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (action != TelephonyManager.ACTION_PHONE_STATE_CHANGED && action != "android.intent.action.PHONE_STATE") return
    val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE) ?: return
    val out = Intent(CallEventsModule.ACTION_CALL_EVENT).apply {
      // Restrict broadcast to our own app only
      setPackage(context.packageName)
    }
    when (state) {
      TelephonyManager.EXTRA_STATE_RINGING -> {
        val incoming = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER)
        if (!incoming.isNullOrBlank()) {
          out.putExtra("type", "incoming")
          out.putExtra("number", incoming)
          out.putExtra("source", "telephony")
          context.sendBroadcast(out)
        }
      }
      TelephonyManager.EXTRA_STATE_IDLE -> {
        out.putExtra("type", "ended")
        out.putExtra("source", "telephony")
        context.sendBroadcast(out)
      }
      else -> {}
    }
  }
}
