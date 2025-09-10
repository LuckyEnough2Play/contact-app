package com.marbleminds.bubblecontacts

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.app.Notification
import android.content.Intent
import java.util.regex.Pattern

class IncomingNotificationListenerService : NotificationListenerService() {
  private val interestingPackages = setOf(
    "com.whatsapp",
    "com.facebook.orca", // Messenger
    "org.telegram.messenger",
    "org.thunderdog.challegram", // Telegram X
    "com.google.android.apps.googlevoice",
    "com.microsoft.teams",
    "com.skype.raider",
    "com.truecaller",
    "com.google.android.dialer",
    "com.android.dialer"
  )

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    val n = sbn.notification ?: return
    val pkg = sbn.packageName ?: ""

    val isCallCategory = n.category == Notification.CATEGORY_CALL
    val isInteresting = isCallCategory || interestingPackages.contains(pkg)
    if (!isInteresting) return

    val extras = n.extras
    val title = extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
    val text = extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
    val sub = extras?.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""
    val bigText = extras?.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
    val content = listOf(title, text, sub, bigText).joinToString(" \u2022 ")

    val number = extractPhone(content)
    val out = Intent(CallEventsModule.ACTION_CALL_EVENT)
    if (!number.isNullOrBlank()) {
      out.putExtra("type", "incoming")
      out.putExtra("number", number)
      out.putExtra("source", "notification")
      out.putExtra("appPackage", pkg)
      out.putExtra("rawText", content)
      sendBroadcast(out)
    }
  }

  override fun onNotificationRemoved(sbn: StatusBarNotification?) {
    val out = Intent(CallEventsModule.ACTION_CALL_EVENT)
    out.putExtra("type", "ended")
    out.putExtra("source", "notification")
    sendBroadcast(out)
  }

  private fun extractPhone(text: String): String? {
    // Extract something that looks like a phone number, keep last 15 chars max
    val pattern = Pattern.compile("(\\+?\\d[\\d\\s().-]{5,})")
    val m = pattern.matcher(text)
    while (m.find()) {
      val raw = m.group(1)
      if (!raw.isNullOrBlank()) {
        // Strip to digits, keep leading +
        val hasPlus = raw.startsWith("+")
        val digits = raw.replace(Regex("[^0-9]"), "")
        if (digits.length >= 7) {
          return if (hasPlus) "+$digits" else digits
        }
      }
    }
    return null
  }
}

