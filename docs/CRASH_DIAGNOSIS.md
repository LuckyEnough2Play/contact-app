Crash Diagnosis – Android

1) Environment
- Expo: see `package.json`
- React Native / React / Hermes: see `android/gradle.properties` and `app.json`
- Device: model, Android version, Play build or locally signed APK/AAB

2) Capture a full fatal stack
- Enable USB debugging on the device
- Terminal A: `npm run android:logs`
- Terminal B: `npm run android:clear && npm run android:start`
- Reproduce the crash and save the entire fatal block to `docs/crashlogs/YYYYMMDD-HHMM.txt`

3) Toggle matrix
- Hermes: `app.json -> expo.jsEngine = jsc` (done)
- New Architecture: `android/gradle.properties -> newArchEnabled=false` (done)
- Minify/R8: release currently not minified; if enabling, use the ProGuard keeps in `android/app/proguard-rules.pro` (done)

4) Result log
- Hermes on/off: [result]
- New Arch on/off: [result]
- Minify on/off: [result]

5) Root cause and fix
- Summary: [fill]
- Follow-ups: re-enable Hermes/minify once stable, keeping the minimal rules required by the dependency graph.

