# Changelog System Docs

A per-realm changelog for AlwiNation. Each entry belongs to a **realm** (a backend
server / gamemode, e.g. `Skyblock`, `Survival`, `Lobby`), has a version, and a list of
changes grouped by type (Added / Changed / Improved / Fixed / Removed / Deprecated / Security).

The changelog is a **timeline** at `/changelog`, grouped by month, where each entry opens in
place to show its changes. Every entry also has its own **detail page** at `/changelog/<slug>`.
The realm is shown as the entry's badge (like a news category), and the page filters by realm
and by change type.

- Public timeline at `/changelog`, detail pages at `/changelog/<slug>`.
- Editable in the admin panel under the **Changelog** tab.
- A **Discord-bot API** so your bot can publish changelog entries automatically.

## Main Files

| File | Purpose |
| --- | --- |
| `src/changelog/changelogData.js` | Seed entries + change-type styling. |
| `src/changelog/Changelog.jsx` | One timeline entry, plus the meta, counts and change-group parts the detail page reuses. |
| `src/changelog/ChangelogList.jsx` | The `/changelog` timeline page with the realm and change-type filters. |
| `src/changelog/changeGroups.js` | Groups changes by type and entries by month. |
| `src/changelog/ChangelogDetail.jsx` | The `/changelog/<slug>` detail page (like `NewsDetail.jsx`). |
| `src/changelog/adminChangelogStore.js` | Frontend data loading, admin save/delete, lookup helpers. |
| `src/admin/AdminPanel.jsx` | The **Changelog** admin tab. |
| `api/changelog.js` | Public read + Discord-bot write (API key). |
| `api/admin/[...path].js` | Session-protected admin create/delete. |
| `api/_shared.js` | Shared normalize/validate/storage logic (Vercel). |
| `server.mjs` | Same logic for local `pnpm run secure:start`. |
| `database/supabase-changelog.sql` | Supabase schema for `changelog_entries`. |

## Entry Shape

```js
{
  id: 'admin-skyblock-v1-4-0',   // stable id (auto-generated)
  slug: 'skyblock-v1-4-0',       // unique, auto-built from realm + version
  realm: 'Skyblock',             // freeform gamemode / backend name
  img: 'https://.../banner.png', // optional picture in the opened entry and on the detail page
  version: 'v1.4.0',
  title: 'Season 3 balance pass',// optional headline
  summary: 'Short one-liner.',   // optional
  tag: 'Release',                // freeform label (Release / Hotfix / Beta...)
  date: 'July 20, 2026',         // display date (formatted from dateValue)
  dateValue: '2026-07-20',       // ISO date for sorting
  author: 'AlwiNation Team',
  changes: [
    { type: 'added',   items: ['New /is upgrade menu.'] },
    { type: 'changed', items: ['Rebalanced generator rates.'] },
    { type: 'fixed',   items: ['Fixed a duplication bug.'] },
  ],
  source: 'admin' | 'bot' | 'seed',
  deleted: false,
}
```

Valid change `type` values: `added`, `changed`, `improved`, `fixed`, `removed`, `deprecated`, `security`.
Any unknown type is stored as `changed`.

### Inline formatting

The `summary` and each change line support inline (Discord-style) markdown, rendered on the
timeline entries, detail page, and admin preview:

```txt
**bold**   *italic*   `code`   [link text](https://alwination.id)   ||spoiler||
```

This is inline only — headings, tables, lists, images, and other block components (from the
news `body` system) are not part of a changelog entry. The change groups are the structure.

## Realms

Realms are **managed categories**, not free text. In the admin **Changelog** tab you pick a
realm from a dropdown, or create a new one inline ("＋ Create new realm…"). A **Realms** panel
in the sidebar lists your saved realms and lets you remove ones you no longer use. Each realm
appears as the badge on its timeline entries and detail pages, and the `/changelog` page has
**realm filter buttons** built from the realms in use.

Realms are stored server-side:

- Admin reads/writes them via `GET`/`POST /api/admin/changelog-realms` (`{ "realms": ["Skyblock", ...] }`).
- The public `GET /api/changelog` response includes a `realms` array.
- Realm names are de-duplicated case-insensitively and trimmed on save.

The **Discord bot does not need to pre-create realms** — any realm it sends on a new entry is
**auto-registered** into the managed list, so it shows up in the admin dropdown afterward.

## API

### Public read

```txt
GET /api/changelog  ->  { "items": [ ...entries ] }
```

### Discord-bot write (API key)

```txt
POST /api/changelog
```

Authenticate with the `CHANGELOG_API_KEY` secret, sent as **either**:

- `Authorization: Bearer <CHANGELOG_API_KEY>`, or
- `x-api-key: <CHANGELOG_API_KEY>`

Request body (the `changes` field accepts **two** forms):

```jsonc
// Grouped-object form (simplest for a bot):
{
  "realm": "Skyblock",
  "version": "v1.4.0",
  "title": "Season 3 balance pass",   // optional
  "summary": "Economy + progression.", // optional
  "img": "https://.../banner.png",     // optional entry + detail picture
  "tag": "Release",                    // optional, default "Update"
  "date": "2026-07-20",                // optional ISO date, default today
  "author": "AlwiNation Team",         // optional
  "changes": {
    "added":   ["New /is upgrade menu."],
    "changed": ["Rebalanced generator rates."],
    "fixed":   ["Fixed a duplication bug."]
  }
}
```

```jsonc
// Array form (also accepted):
"changes": [
  { "type": "added", "items": ["New /is upgrade menu."] },
  { "type": "fixed", "items": ["Fixed a duplication bug."] }
]
```

Responses: `201 { ok, entry }` on success, `400` on validation error, `401` on a bad/missing key.

Posting the same `realm` + `version` (or same `slug`) again **updates** that entry instead of
creating a duplicate. Set a custom `slug` in the body if you want to control that key.

#### Discord bot example (Node.js)

```js
async function publishChangelog() {
  const response = await fetch('https://alwination.id/api/changelog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CHANGELOG_API_KEY}`,
    },
    body: JSON.stringify({
      realm: 'Skyblock',
      version: 'v1.4.0',
      title: 'Season 3 balance pass',
      tag: 'Release',
      changes: {
        added: ['New /is upgrade menu.'],
        fixed: ['Fixed a duplication bug on hopper minecarts.'],
      },
    }),
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.error)
  return data.entry
}
```

#### curl example

```bash
curl -X POST https://alwination.id/api/changelog \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CHANGELOG_API_KEY" \
  -d '{"realm":"Skyblock","version":"v1.4.0","changes":{"added":["New menu"],"fixed":["Dupe bug"]}}'
```

### Admin write (session cookie)

Used by the admin panel; requires an admin login session.

```txt
POST   /api/admin/changelog          create / update an entry
DELETE /api/admin/changelog?slug=... delete (add &hide=true to hide a seed entry)
```

## Environment Variables

Add to `.env` (local) and to Vercel Project Settings -> Environment Variables (production):

```bash
CHANGELOG_API_KEY=a-long-random-secret-the-discord-bot-uses
```

Keep this key private and server-only. Do **not** prefix it with `VITE_` and never import it
in React code. If `CHANGELOG_API_KEY` is unset, the bot write endpoint always returns `401`.

Storage uses the same Supabase config as news (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
Without Supabase, the local server stores entries in `data/admin-changelog.json` (git-ignored).

## Supabase Setup

Open the Supabase SQL editor and run the contents of:

```txt
database/supabase-changelog.sql
```

This creates `public.changelog_entries` with public read access (row-level security) and a
`slug` uniqueness/format constraint. Writes go through the service-role key on the server only.

## Local Testing

```bash
pnpm run build
pnpm run secure:start          # serves the built site + API on http://127.0.0.1:4175
```

- Public page: `http://127.0.0.1:4175/changelog`
- Admin panel: `http://127.0.0.1:4175/admin` -> **Changelog** tab
- Bot API: `POST http://127.0.0.1:4175/api/changelog` with the `CHANGELOG_API_KEY` header

`pnpm run dev` (Vite) only serves the frontend with seed data; use `secure:start` to exercise
the API, admin panel, and bot endpoint locally.
