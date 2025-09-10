Search Behavior

- The Home screen search now uses fuzzy matching via Fuse.js.
- It searches across all contact fields: first name, last name, phone (digits included), email, company, title, birthday, and tags.
- Misspellings and partial terms still return relevant contacts.

Configuration

- Implementation: `src/screens/HomeScreen.tsx`.
- Options: threshold set to `0.35`, with `ignoreLocation: true` and `minMatchCharLength: 2`.
- To tweak behavior, edit the Fuse options or the indexed fields in the `searchIndex` builder.

