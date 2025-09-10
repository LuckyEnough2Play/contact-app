**Startup Crash (Android) – Quick Fixes**

- Babel config: Ensure `babel.config.js` includes:
  - `react-native-reanimated/plugin` (must be last)
  - `expo-router/babel`
  - `module-resolver` alias `{ '@': './' }`
- Clear caches:
  - Metro: `npx expo start --clear`
  - Android: `cd android && ./gradlew clean` (or `gradlew.bat clean` on Windows)
- Native CallEvents in dev/iOS: Warnings about an unlinked module are safe; the app guards against missing native code outside Android.

These are already applied in this repo. If issues persist, remove the app from device, reinstall, and re-run with a clean Metro cache.

