package com.marbleminds.bubblecontacts

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat

object LikelyNotifier {
  private const val CHANNEL_ID = "likely_calls"
  private const val CHANNEL_NAME = "Likely Calls"
  private const val NOTIF_ID = 424242

  private fun ensureChannel(ctx: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (nm.getNotificationChannel(CHANNEL_ID) == null) {
        val c = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH)
        c.enableVibration(true)
        c.description = "Shows likely matching contacts for incoming calls"
        nm.createNotificationChannel(c)
      }
    }
  }

  fun postLikelyNotification(ctx: Context, names: List<String>) {
    ensureChannel(ctx)
    val contentTitle = "Likely:"
    val builder = NotificationCompat.Builder(ctx, CHANNEL_ID)
      .setSmallIcon(ctx.applicationInfo.icon)
      .setContentTitle(contentTitle)
      .setCategory(Notification.CATEGORY_MESSAGE)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setAutoCancel(true)

    val style = NotificationCompat.InboxStyle().setBigContentTitle(contentTitle)
    names.forEach { style.addLine(it) }
    builder.setStyle(style)

    val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.notify(NOTIF_ID, builder.build())
  }
}

