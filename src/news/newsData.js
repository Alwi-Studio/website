import backgroundAvif from '../assets/background.avif'
import backgroundImg from '../assets/background.webp'

export const newsItems = [
  {
    id: 'launch-update-2026',
    slug: 'server-launch-update',
    imgAvif: backgroundAvif,
    img: backgroundImg,
    title: 'Server Launch Update',
    description:
      'AlwiNation is preparing a cleaner home base with server updates, community highlights, and project announcements.',
    category: 'Announcement',
    date: 'July 2026',
    author: 'AlwiNation Team',
    readingTime: '3 min read',
    featured: true,
    body: [
      {
        type: 'lead',
        text: 'AlwiNation is preparing a refreshed web hub for server updates, community highlights, event notes, and important announcements. This page is designed to become the main place for players to understand what changed and what is coming next.',
      },
      {
        type: 'heading',
        text: 'What changed',
      },
      {
        type: 'paragraph',
        text: 'The launch update focuses on making information easier to find. News posts now support their own detail pages, so each announcement can include a longer article, custom image, category, date, author, and related metadata.',
      },
      {
        type: 'stats',
        items: [
          { label: 'News pages', value: '3' },
          { label: 'Post fields', value: '10+' },
          { label: 'Database-ready', value: 'Yes' },
        ],
      },
      {
        type: 'heading',
        text: 'Publishing workflow',
      },
      {
        type: 'list',
        items: [
          'Create a post with a unique slug, title, category, and publish date.',
          'Add a short card description for the homepage news grid.',
          'Write rich article blocks for the full news page.',
          'Attach highlights so readers can scan the main points quickly.',
        ],
      },
      {
        type: 'quote',
        text: 'The goal is to make every important update easy to publish, easy to share, and easy for players to understand.',
        cite: 'AlwiNation Team',
      },
      {
        type: 'callout',
        title: 'Database note',
        text: 'This structure is ready to connect to a database later. The local data file can be replaced with an API call from Supabase, Firebase, MongoDB, MySQL, or another backend without redesigning the news cards or article pages.',
      },
    ],
    highlights: ['Dedicated article page', 'Custom image and metadata', 'Ready for database content'],
  },
  {
    id: 'community-hub-preview-2026',
    slug: 'community-hub-preview',
    imgAvif: backgroundAvif,
    img: backgroundImg,
    title: 'Community Hub Preview',
    description:
      'The new news section will collect important updates in one place so visitors can quickly see what changed.',
    category: 'Preview',
    date: 'Coming soon',
    author: 'AlwiNation Team',
    readingTime: '2 min read',
    featured: false,
    body: [
      'The community hub is planned as a central place for server information. Instead of spreading updates across different channels, the website can collect major changes into clear posts that are easy to share.',
      'Each post can be customized with its own title, short description, article content, date, category, image, and slug. That makes it simple to publish patch notes, event announcements, staff updates, or recaps.',
      'When a backend is added, the same fields can come directly from a database table or CMS collection.',
    ],
    highlights: ['Central update feed', 'Shareable post links', 'CMS-friendly fields'],
  },
  {
    id: 'community-event-notes-2026',
    slug: 'community-event-notes',
    imgAvif: backgroundAvif,
    img: backgroundImg,
    title: 'Community Event Notes',
    description:
      'A quick recap of planned events, server improvements, and upcoming community activities.',
    category: 'Community',
    date: 'Coming soon',
    author: 'AlwiNation Team',
    readingTime: '2 min read',
    featured: false,
    body: [
      'Community events can now be represented as full news articles instead of short cards only. This gives event posts enough room for schedules, rules, rewards, summaries, and follow-up notes.',
      'The layout supports a readable article area, a hero image, highlight points, and quick navigation back to the main news list.',
      'Future database content can use the same post shape, keeping the frontend stable while the admin or CMS workflow changes behind it.',
    ],
    highlights: ['Event recaps', 'Rules and reward space', 'Reusable article layout'],
  },
]

export function getNewsItem(slug) {
  return newsItems.find((item) => item.slug === slug)
}

export function getRelatedNews(currentSlug, limit = 2) {
  return newsItems.filter((item) => item.slug !== currentSlug).slice(0, limit)
}
