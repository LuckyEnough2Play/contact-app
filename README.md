# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

   The project uses [patch-package](https://github.com/ds300/patch-package) to
   apply fixes to some dependencies. The patches should be applied automatically
   after installation, but if you ever run into build errors related to missing
   native methods, run `npx patch-package` to ensure the patches are applied.

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Outlook Transfer (CSV)

- Export: Home → tap the ⇄ button → "Export to Outlook CSV". Share or save the generated `contacts-outlook.csv`, then import it in Outlook (File → Open & Export → Import/Export → Import from another program or file → CSV).
- Import: In Outlook, export contacts to CSV (File → Open & Export → Export to a file → CSV). In the app, Home → ⇄ → "Import from Outlook CSV" and pick the exported file. Existing contacts are matched by email or phone; matches are updated and tags (Outlook categories) are merged.

Notes
- CSV fields used: First Name, Last Name, E-mail Address, Mobile Phone, Company, Birthday, Categories.
- Tags map to Outlook Categories (semicolon-separated in CSV).
- Requires the following Expo packages: `expo-document-picker`, `expo-file-system`, `expo-sharing`.

## Import from Outlook on Phone (No CSV)

- Enable Outlook → device Contacts sync:
  - Android: Outlook → profile icon → Settings → tap your account → enable "Sync contacts" (or "Save Contacts").
  - iOS: Outlook → Settings → tap your account → enable "Save Contacts". Also ensure iOS Settings → Contacts → Accounts → your Outlook account is enabled.
- In the app: Home → ⇄ → "Import All from Device Contacts" to bulk‑import everything the phone sees. You can still import one contact at a time on the New Contact screen via the "Import" button.
