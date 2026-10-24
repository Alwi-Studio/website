# Site Settings Docs

One JSON document, the **site document**, holds everything on the home page and the
site-wide settings, so the owner can change them from the admin without a deploy.

- **Settings:** server address, Bedrock port, Java version, Discord link and invite code,
  store, status page, YouTube and TikTok links, tagline, footer text.
- **Home page:** the hero (picture, subtitle, button labels) and every section below it (Pick your Gameplay, the Season band, Top Players,
  How to join, Latest News, Join the community). Each section can be renamed, reordered, or turned
  off without losing its content.
- **Realms:** every realm card in Pick your Gameplay: name, label, colour, picture, badge, link,
  description, on/off and order.

The seed lives in `src/content/site.js` (`defaultSite`). Until something is saved, every page uses it.

## Editing

Admin panel at `/admin`:

- **Home page**: sections and realm cards.
- **Site settings**: the settings above, with a live Discord count preview.

**Reset to defaults** in either editor resets the whole site document (home page and settings together).

## Main Files

- `api/_site.js`: schema, `normalizeSite`, `validateSite`, size limits. It runs on the server
  and in the browser, so it must stay free of Node-only globals.
- `api/site.js`: public read, `GET /api/site`.
- `api/admin/[...path].js`: admin write, `POST /api/admin/site` with `{ site }` and reset with `DELETE`, behind the admin session.
- `src/content/siteStore.js` and `src/common/SiteProvider.jsx`: load the document once and share it.
- `src/admin/HomeEditor.jsx`, `src/admin/SettingsEditor.jsx`: the two editors.

Limits: the document must be under 64 KB (checked the same way the SQL constraint counts it),
and a request body under 128 KB. A document that fails validation is rejected whole, not patched.

## Supabase Setup

Open the Supabase SQL editor and run the contents of:

```txt
database/supabase-site.sql
```

This creates `public.site_pages` (one row, key `main`) with public read access and a 64 KB size
check. Writes go through the service-role key on the server only (`SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, the same as news). Without Supabase, the local server stores the
document in `data/site.json`.

## Local Testing

```bash
pnpm test                      # includes the site schema and API tests
pnpm run secure:start          # builds, then serves the site + API on http://127.0.0.1:4175
```

Then open `http://127.0.0.1:4175/admin`, go to **Home page** or **Site settings**, save, and reload `/`.
