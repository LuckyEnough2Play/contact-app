
---

## 📘 `PRD.md` (Product Requirements Document)

```md
# Product Requirements Document – Bubble Contact (Mobile)

## ✨ Overview

Bubble Contact is a visual contact management app designed for mobile devices. It allows users to manage their personal network as an interactive, taggable bubble diagram. The app works entirely offline, with manual contact importing and local data persistence.

---

## 🎯 Goals

- Provide a fast, offline, mobile-native contact management tool
- Allow users to see and group contacts visually via tags
- Enable selective import of existing contacts with permission
- Maintain full data privacy with no background syncing

---

## 🧑‍💻 Target Users

- Users who want private, lightweight contact management
- Users with niche social groups, event organizers, hobby clubs
- Privacy-conscious individuals who prefer apps without cloud sync

---

## 📱 Platforms

- Android (primary)
- iOS (secondary, optional in future)

---

## 🧩 Core Features

| Feature                        | Description |
|-------------------------------|-------------|
| 🫧 Visual Bubble Interface     | Contacts displayed as draggable bubbles based on tags |
| 🔍 Search & Tag Filter         | Filter bubbles by tag or name |
| ➕ Add/Edit Contact            | Full-screen modal for editing contact info |
| 🔗 Manual Contact Import       | User-initiated contact selection from device |
| 📤 CSV Export/Import           | Save and load contacts from files |
| 💾 Offline Storage             | All data stays on-device using SQLite or AsyncStorage |

---

## 🔐 Permissions Policy

| Permission       | Trigger                        | Behavior         |
|------------------|--------------------------------|------------------|
| Contacts         | When user taps "Import"        | Shows OS contact picker |
| File Access      | On export/import               | Uses file dialog or native sharing |
| Internet         | **Not used at all**            | App is fully offline |

---

## 📊 Data Model

```ts
Contact {
  id: string
  name: string
  phone?: string
  email?: string
  company?: string
  title?: string
  notes?: string
  tags: string[]
}
