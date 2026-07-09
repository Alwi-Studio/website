# News System Docs

This project has a customizable news system with:

- Homepage news cards
- Full news listing page at `/news`
- Individual news detail pages at `/news/<slug>`
- A local data file that can later be replaced by database/API data
- Rich article body blocks for complex posts

## Main Files

| File | Purpose |
| --- | --- |
| `src/news/newsData.js` | Local news data source. Edit this to add or customize posts. |
| `src/news/News.jsx` | News card used on the homepage and related news section. |
| `src/news/NewsList.jsx` | Full page that lists every news post. |
| `src/news/NewsDetail.jsx` | Full article page renderer. |
| `src/common/ErrorPage.jsx` | Reusable 404/common error page. |
| `src/App.jsx` | Detects `/news`, `/news/<slug>`, and `/admin` URLs. |
| `server.mjs` | Secure server/API for admin login and database-backed news storage. |
| `database/supabase-news.sql` | Supabase SQL schema for the `news_posts` table. |

## Creating A News Post

Add a new object to `newsItems` inside `src/news/newsData.js`.

```js
{
  id: 'unique-post-id',
  slug: 'my-news-post',
  img: backgroundImg,
  title: 'My News Post',
  description: 'Short description shown on the news card and article hero.',
  category: 'Announcement',
  date: 'July 2026',
  author: 'AlwiNation Team',
  readingTime: '3 min read',
  featured: false,
  body: [
    'Simple paragraph content also works.',
  ],
  highlights: ['First highlight', 'Second highlight'],
}
```

The `slug` controls the URL. For example:

```txt
slug: 'my-news-post'
```

Creates:

```txt
/news/my-news-post
```

## News Post Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Stable unique ID for React keys and future database records. |
| `slug` | string | Yes | URL-friendly identifier used in `/news/<slug>`. |
| `img` | image import or URL | Yes | Hero/card image. Can become a database image URL later. |
| `title` | string | Yes | Article title. |
| `description` | string | Yes | Short summary shown on the card and article hero. |
| `category` | string | Yes | Post category, such as `Announcement`, `Preview`, or `Community`. |
| `date` | string | Yes | Display date. |
| `author` | string | Yes | Article author name. |
| `readingTime` | string | Yes | Display reading time. |
| `featured` | boolean | No | Available for future featured-post logic. |
| `body` | array | Yes | Article content blocks. |
| `highlights` | string array | Yes | Quick points shown in the article sidebar. |

## Simple Body Content

For a basic article, `body` can be an array of strings:

```js
body: [
  'First paragraph.',
  'Second paragraph.',
  'Third paragraph.',
]
```

Each string renders as a normal paragraph.

## Complex Body Content

For more advanced articles, `body` can use typed blocks. You can mix strings and typed blocks in the same article.

### Lead

Large opening paragraph.

```js
{
  type: 'lead',
  text: 'This is the main introduction for the article.',
}
```

### Paragraph

Normal paragraph.

```js
{
  type: 'paragraph',
  text: 'This is a normal article paragraph.',
}
```

### Heading

Section heading inside the article.

```js
{
  type: 'heading',
  text: 'What changed',
}
```

### List

Bullet list.

```js
{
  type: 'list',
  items: [
    'First list item.',
    'Second list item.',
    'Third list item.',
  ],
}
```

### Checklist

Task checklist.

```js
{
  type: 'checklist',
  items: [
    { checked: true, text: 'Spawn area prepared.' },
    { checked: false, text: 'Publish the announcement.' },
  ],
}
```

### Table

Column table.

```js
{
  type: 'table',
  headers: ['Rank', 'Price', 'Perks'],
  alignments: ['left', 'right', 'left'],
  rows: [
    ['VIP', '$5', 'Cosmetics'],
    ['MVP', '$10', 'Cosmetics and kits'],
  ],
}
```

### Columns / Grid

Short titled items in columns.

```js
{
  type: 'columns',
  columns: 2,
  items: [
    { title: 'Survival', text: 'Claim land, build bases, and trade.' },
    { title: 'Events', text: 'Join seasonal contests and tournaments.' },
  ],
}
```

### Cards

Repeated summary cards.

```js
{
  type: 'cards',
  items: [
    { title: 'VIP', text: 'Cosmetic perks and chat color.', meta: 'Store' },
    { title: 'MVP', text: 'Extra kits and profile flair.', meta: 'Popular' },
  ],
}
```

### Tabs

Short switchable content.

```js
{
  type: 'tabs',
  items: [
    { title: 'Java', text: 'Join with the Java address.' },
    { title: 'Bedrock', text: 'Join with the Bedrock address and port.' },
  ],
}
```

### Accordion / Collapse

FAQ-style collapsible content.

```js
{
  type: 'accordion',
  items: [
    { title: 'Can I transfer ranks?', text: 'Open a ticket with proof of purchase.' },
    { title: 'Where do I report bugs?', text: 'Use Discord support with screenshots.' },
  ],
}
```

### Section / Container / Sidebar

Grouped article areas.

```js
{
  type: 'section',
  title: 'Launch notes',
  text: 'This area introduces a new part of the article.',
}

{
  type: 'container',
  title: 'Important links',
  text: 'Use this for grouped links or short reminders.',
}

{
  type: 'sidebar',
  title: 'Quick reminder',
  text: 'Main explanation goes here.',
  sidebar: 'Side note, requirement, or warning goes here.',
}
```

### Quote

Quote block with an optional citation.

```js
{
  type: 'quote',
  text: 'Important quote text.',
  cite: 'AlwiNation Team',
}
```

### Stats

Small stat cards.

```js
{
  type: 'stats',
  items: [
    { label: 'News pages', value: '3' },
    { label: 'Post fields', value: '10+' },
    { label: 'Database-ready', value: 'Yes' },
  ],
}
```

### Callout

Highlighted note box.

```js
{
  type: 'callout',
  title: 'Database note',
  text: 'This content can later come from an API or CMS.',
}
```

## Supabase Database Setup

The project now supports Supabase as the production database for admin-created and edited news posts. If Supabase env vars are not set, the server falls back to local JSON storage for development.

Create a Supabase project, open the SQL editor, and run:

```sql
-- Use the contents of database/supabase-news.sql
```

The SQL creates this table:

```txt
public.news_posts
```

Required server-only env vars:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Important: `SUPABASE_SERVICE_ROLE_KEY` must only exist on the server. Do not prefix it with `VITE_`, do not import it in React code, and do not expose it to the browser.

### Storage Limits

Supabase free projects include limited database storage, so the app stores news efficiently:

- Images are stored as URLs only, not binary data.
- Article body JSON is limited to 64 KB per post.
- Highlights JSON is limited to 4 KB per post.
- Highlights are capped at 12 items.
- Long text fields are trimmed server-side before saving.
- Complex article blocks are normalized so unknown or empty fields are not stored.

A normal 1,000-word article is usually around 8-20 KB, so even 1,000 posts would likely remain small. Images should be stored outside the database, such as Supabase Storage, Vercel Blob, or another image host.

For Vercel, add these in Project Settings -> Environment Variables:

```bash
ADMIN_USERNAME
ADMIN_PASSWORD or ADMIN_PASSWORD_HASH
SESSION_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`server.mjs` reads and writes Supabase through the REST API. The public site fetches news through `/api/news`, and admin writes go through protected `/api/admin/news` endpoints.

## Database Mapping

The current `newsData.js` file acts like local seed data. Later, you can replace it with data from a backend.

A database table or collection could use this shape:

```js
{
  id: 'launch-update-2026',
  slug: 'server-launch-update',
  imageUrl: 'https://example.com/news-image.png',
  title: 'Server Launch Update',
  description: 'Short card summary.',
  category: 'Announcement',
  publishedAt: '2026-07-05',
  author: 'AlwiNation Team',
  readingTime: '3 min read',
  featured: true,
  body: [
    { type: 'lead', text: 'Opening paragraph.' },
    { type: 'heading', text: 'What changed' },
    { type: 'paragraph', text: 'Article content.' },
  ],
  highlights: ['Dedicated article page', 'Ready for database content'],
}
```

Recommended database fields:

| Database Field | Frontend Field |
| --- | --- |
| `id` | `id` |
| `slug` | `slug` |
| `image_url` | `img` |
| `title` | `title` |
| `description` | `description` |
| `category` | `category` |
| `published_at` | `date` |
| `author` | `author` |
| `reading_time` | `readingTime` |
| `featured` | `featured` |
| `body_json` | `body` |
| `highlights_json` | `highlights` |

Store `body` and `highlights` as JSON if your database supports it.

## Admin Panel Prototype

The project includes a simple admin panel at:

```txt
/admin
```

The admin route is intentionally hidden from the public navigation. Open `/admin` directly when you need it.

Credentials are loaded by the Node server from `.env`:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=local-development-secret-change-this-value-please
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The `.env.example` file shows the expected variables:

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
SESSION_SECRET=replace-this-with-a-long-random-secret-at-least-32-characters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

The admin panel now uses server-side authentication. The password is not bundled into the Vite frontend. Login is handled by the local Node server, which sets an HttpOnly session cookie.

Run the secure server with:

```bash
pnpm run secure:start
```

Then open:

```txt
http://127.0.0.1:4175/admin
```

For production, prefer `ADMIN_PASSWORD_HASH` instead of a plain `ADMIN_PASSWORD`. The hash format is:

```txt
salt:scrypt_hash
```

Keep `SESSION_SECRET` long, random, and private.

The admin panel can:

- log in with the `.env` credentials
- create news posts
- generate a read-only slug from the title
- edit existing seed news posts as local overrides
- choose the publish date from a calendar input
- save article body paragraphs
- save highlights
- list both built-in news and browser-created posts
- delete browser-created posts
- hide built-in seed posts through a stored deleted override

If Supabase is configured, admin-created posts are saved in:

```txt
public.news_posts
```

If Supabase is not configured, development fallback posts are saved under:

```txt
data/admin-news.json
```

This file is ignored by git so local content is not committed by accident.

The login session is stored in an HttpOnly cookie named `alwination_admin`.

When a built-in post is edited, the saved version replaces that built-in post through the server-side override file. When a built-in post is deleted, the server stores a small `deleted: true` override for that slug so it disappears from the public site. The original source file is not changed. The slug stays locked to the existing URL while editing.

For a real database-backed admin panel, replace the JSON file storage in `server.mjs` with database calls. The API should:

- verify credentials on the server
- store sessions or tokens securely
- create, update, and delete news records in the database
- return published news posts to the public site
- keep passwords and database credentials outside frontend code

## Adding New Body Block Types

To add a new block type:

1. Add the new block data inside `src/news/newsData.js`.
2. Open `src/news/NewsDetail.jsx`.
3. Add a new condition inside `ArticleBlock`.

Example:

```jsx
if (block.type === 'image') {
  return <img className="rounded-lg" src={block.src} alt={block.alt} />
}
```

Then use it in a post:

```js
{
  type: 'image',
  src: 'https://example.com/image.png',
  alt: 'News image',
}
```

## Local Testing

Run the site:

```bash
pnpm run dev
```

Open:

```txt
http://localhost:5173
```

Example complex article:

```txt
http://localhost:5173/news/server-launch-update
```

Before publishing changes, check:

```bash
pnpm run build
pnpm run lint
```
