Crash Capture (Android – physical device)

Prereqs
- Enable Developer Options and USB debugging on the device.
- Connect via USB and authorize the host.

Commands
- Terminal A: `npm run android:logs`
- Terminal B:
  1) `npm run android:clear`
  2) `npm run android:start`

What to save
- Copy the entire fatal stack from Terminal A and save as `docs/crashlogs/YYYYMMDD-HHMM.txt`.

Notes
- These logs include `ReactNative:V` and `ReactNativeJS:V` plus `AndroidRuntime:E` to catch native fatals.
- If the app doesn’t appear in launcher, ensure the package name matches: `com.marbleminds.bubblecontacts`.

