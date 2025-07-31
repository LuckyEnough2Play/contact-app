# contact-app

Bubble Contact is a lightweight, fully offline mobile app for managing and visualizing personal contacts. It presents your relationships as interactive bubbles and allows importing selected contacts from your device with user consent.

## 🚀 Features

- 📱 Built natively for Android (React Native)
- 🫧 Visual contact bubbles with tags and relationship mapping
- ➕ Add/edit/delete contacts locally
- 🔍 Tag filter and name search
- 🔗 Manually import individual contacts from phone
- 🗃️ Offline data stored on-device (SQLite or AsyncStorage)
- 📤 CSV export/import support

## 🔒 Privacy First

- **No network usage**
- **No automatic contact access**
- **Only selected contacts are imported with explicit user consent**

## 🛠 Tech Stack

- [React Native](https://reactnative.dev/)
- [`react-native-svg`](https://github.com/software-mansion/react-native-svg) (for D3-style visualization)
- [`react-native-contacts`](https://github.com/morenoh149/react-native-contacts) (manual contact import)
- [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage) or SQLite (data persistence)

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- Expo CLI: `npm install -g expo-cli`
- Android Studio (or use real device with Expo Go)
