Incoming Call "Likely" Popup (Android)

- Shows a small banner with "Likely:" and matching contact names when an incoming call is detected.
- Matches by phone number (normalized), supports multiple matches sorted by first name.
- Works for:
  - SIM/telephony calls (phone app, including forwarded calls)
  - Third‑party VoIP apps via Notification Listener (WhatsApp, Telegram, Messenger, Teams, etc.) when their notifications contain a phone number.

Permissions and setup
- Grant Notification access: Android Settings → Notifications → Device & app notifications → select this app and enable access.
- Allow runtime permissions when prompted: Notifications, Phone state, and Call log (improves number detection on Android 9+).

Notes and limitations
- If a VoIP app’s notification does not include a phone number, matching may not be possible.
- The banner appears in‑app; when the app is backgrounded, a heads‑up notification is posted with the same names.
- iOS: System restrictions prevent reading incoming call numbers or drawing over the Phone app; this feature is Android‑only.

Testing tips
- Telephony: Call the device from a number that exists in the app’s contacts (try with/without country code to validate matching).
- VoIP: Trigger an incoming call from WhatsApp/Telegram/etc. Ensure their notification contains the number; else matching will not occur.
- Background: Put the app in the background and repeat; you should see a heads‑up notification with the same names.
