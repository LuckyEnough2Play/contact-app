## PRD.md — Bubble Contacts (Mobile)

# Product Requirements Document — Bubble Contacts (Mobile)

## Overview

Bubble Contacts is a private, offline contact manager for mobile. It provides fast search across all fields, simple tagging, and streamlined import/export with Outlook-compatible CSV. On Android, it can show a small in-app “Likely” banner and a heads-up notification with matching contact names when an incoming call is detected (telephony and supported VoIP apps via notification access). The app never uses the network; data lives entirely on-device.

---

## Goals

- Provide a fast, offline, mobile-native contact manager
- Make finding people quick via fuzzy search and tags
- Support easy import: single-contact pick and bulk import (device/CSV)
- Preserve privacy: no analytics, no cloud sync, no internet permission
- Surface useful context on incoming calls on Android (“Likely” names)

---

## Target Users

- Users who want private, lightweight contact management
- Event organizers, club leaders, community coordinators who organize by tags
- Privacy-conscious individuals who prefer apps without cloud sync

---

## Platforms

- Android (primary). Incoming-call features require Android.
- iOS (secondary). iOS does not support call number access or in-app overlays during calls; “Likely” is Android-only.

---

## Core Features

| Feature | Description |
|---|---|
| Home: search + tags | Top search bar with fuzzy matching across all fields; compact selected‑tag bar with Clear; "Browse Tags" opens a full‑screen Tag Browser. |
| Tag filtering | In the Tag Browser, tap chips to select/deselect; selection updates Home instantly. Selected tags color contacts: full/partial/none match. Long‑press a tag to delete it globally. |
| Contact list | Virtualized list of cards, sorted by name; each card has quick call action. |
| Add/Edit contact | Full-screen editor with first/last name, phone, email, birthday, company, title, and tags. Save/Delete actions. |
| Single-contact import | From New/Edit screen, pick one device contact to populate the form before saving. |
| Bulk import (device) | Import all visible device contacts with merge-by-email/phone rules; updates existing, adds new. |
| CSV transfer (Outlook) | Export to Outlook-compatible CSV; import from CSV with field mapping (emails 1–3, multiple phone variants) and tag mapping to Outlook Categories. |
| Incoming “Likely” (Android) | Detect incoming numbers via telephony and notification listener (for VoIP apps that include numbers). Show in-app banner; post heads-up notification when app is backgrounded. |
| Settings | Toggle Likely popup and heads-up notification, choose name order (First Last or Last, First), run transfer actions, and open Notification Access settings. |
| Offline storage | All data stored locally via AsyncStorage. No networking; INTERNET permission is blocked in config. |

Notes
- Fuzzy search implemented with Fuse.js (threshold 0.35, ignore location, min length 2) and indexes first/last/phone (digits), email, company, title, birthday, and tags.
- Phone number matching normalizes numbers and falls back to last 7/10 digits for “Likely”.
- On Android 9+, reading the telephony incoming number may require READ_CALL_LOG at runtime.

---

## Permissions Policy

| Permission | When | Purpose |
|---|---|---|
| Contacts | When importing (single or bulk) | Read device contacts to populate app entries. |
| Notifications (POST_NOTIFICATIONS) | First run on Android 13+ | Allow showing heads-up notifications for background “Likely”. |
| Notification Listener access | When enabling “Likely” for VoIP | Read incoming call notifications from other apps to extract numbers. User must enable in system settings. |
| Phone state (READ_PHONE_STATE) | On Android when starting listeners | Detect incoming telephony calls. |
| Call log (READ_CALL_LOG) | Android 9+ when available | Improves incoming number access for telephony. |
| File access | During CSV import/export | Read CSV from picker and write/export CSV via OS share sheet. |
| Internet | Never | Not requested; explicitly blocked in Android config. |

Privacy & Data Handling
- No analytics, tracking, or network calls. All data stays on device.
- Notification listener data is used ephemerally to match numbers to local contacts; nothing is stored beyond matching nor shared.

---

## Data Model

```ts
type Contact = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  birthday?: string; // ISO date string
  company?: string;
  title?: string;
  tags: string[];
}

type AppSettings = {
  likelyPopupEnabled: boolean;
  headsUpEnabled: boolean;
  nameOrder: 'firstLast' | 'lastFirst';
}
```

Storage
- Contacts: AsyncStorage key `contacts` (JSON array of Contact).
- Settings: AsyncStorage key `settings` (AppSettings, defaults applied on load).

---

## UX Flows

Home
- Search field; results update as you type (fuzzy).
- Selected‑tag bar shows count and Clear; "Browse Tags" opens Tag Browser.
- Tap a contact card to open Edit.
- Top-right: Settings; Plus button to add new contact.

Tag Browser (Full‑Screen)
- Sticky header with search, sort (Count / A–Z), and selected summary with Clear.
- Single virtualized list (sectioned): Selected, Relevant, All; sticky section headers.
- Tap a tag to toggle; long‑press to delete globally (confirm dialog).
- Persists last query and sort; closes back to Home with selection preserved.

New/Edit Contact
- Enter fields; tap “Set Birthday” to pick a date.
- Tap tags to select; add new tag via input + Add.
- “Import” picks a single device contact to populate fields before saving.
- Save creates/updates; Delete removes the contact.

Settings
- Toggles: “Show in-app Likely popup” and “Heads-up when backgrounded”.
- Name order: First Last or Last, First.
- Transfer actions: Export to Outlook CSV; Import from Outlook CSV; Import All from Device Contacts.
- Open system Notification Access settings (Android).

Incoming “Likely” (Android)
- App requests runtime permissions on first listener start.
- When an incoming number is detected, matches against local contacts and shows names.
- If app is backgrounded and “Heads-up” is enabled, also posts a notification.

---

## Import/Export Rules

CSV (Outlook-compatible)
- Export uses the full Outlook template header; unneeded columns are blank for better import mapping in Outlook.
- Import auto-detects delimiter (comma/semicolon/tab), maps phone variants (Mobile/Primary/Business/Home/Other) and email 1–3, parses birthdays, and splits Categories to tags.
- Merge strategy: match existing by email (case-insensitive) or by normalized phone digits; update fields when provided; tags are unioned.

Device Contacts (bulk)
- Merge by email or normalized phone; update when present, otherwise add new.
- Reads emails, phone numbers, birthday, and company where available.

---

## Non-Goals

- Cloud sync, account system, or multi-device sync.
- Visual “bubble diagram” UI (current design uses list + tag chips).
- Avatars/photo management.
- Sharing contact data with third parties.

---

## Risks & Limitations

- VoIP apps that do not include a phone number in their notifications cannot be matched.
- iOS platform limitations prevent “Likely” implementation.
- Reliance on runtime permissions: user may decline, disabling corresponding features.

---

## References (internal)

- Search behavior: `docs/search.md`
- Incoming calls: `docs/calls.md`
