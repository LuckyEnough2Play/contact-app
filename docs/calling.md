Calling Method (Phone/Third-Party)

- Choose a default calling method in Settings > Calling: "Ask every time", "Phone (system)", and any installed supported apps (FaceTime on iOS, Skype, WhatsApp, Telegram, Viber).
- When set to "Ask every time", tapping a call icon shows an in-app chooser listing detected apps.
- Fallbacks: If a chosen app can’t open the number, the app falls back to the system phone using `tel:`.

Supported Apps and Schemes
- Phone (system): `tel:<number>` (opens default dialer)
- FaceTime (iOS): `facetime://<number>`
- Skype: `skype:<number>?call`
- WhatsApp: `whatsapp://send?phone=<number>` (opens chat; user can start call)
- Telegram: `tg://msg?to=<number>` (opens chat when possible)
- Viber: `viber://contact?number=<number>` (opens contact; user can start call)

Platform Notes
- iOS: `Linking.canOpenURL` requires whitelisting schemes in Info.plist. The app config includes `LSApplicationQueriesSchemes` for FaceTime, Skype, WhatsApp, Telegram, and Viber. Expo Go cannot be modified; use a dev build or standalone build to detect third‑party apps.
- Android: On Android 11+, package visibility requires `<queries>` for non-HTTP schemes to reliably detect availability. The app manifest includes queries for skype, whatsapp, tg, and viber. `tel:` always opens the default dialer.

