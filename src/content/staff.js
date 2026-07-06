// Seed (code-defined) staff list. Admin edits are stored as an override on top
// of this via content/staffStore.js. Edit these defaults to change what shows
// before any admin customization exists.
export const staffPage = {
  eyebrow: 'Meet the Team',
  title: 'AlwiNation Staff',
  updated: 'July 6, 2026',
  intro:
    'The people who keep AlwiNation running \u2014 building the world, hosting events, and keeping the community safe and welcoming.',
  groups: [
    {
      name: 'Ownership',
      members: [
        { name: 'Alwi', role: 'Founder & Owner', note: 'Runs the server, direction, and community.' },
      ],
    },
    {
      name: 'Administrators',
      members: [
        { name: 'Admin One', role: 'Server Admin', note: 'Infrastructure, plugins, and configuration.' },
        { name: 'Admin Two', role: 'Community Admin', note: 'Partnerships, content, and announcements.' },
      ],
    },
    {
      name: 'Moderators',
      members: [
        { name: 'Mod One', role: 'Moderator', note: 'Chat and in-game support.' },
        { name: 'Mod Two', role: 'Moderator', note: 'Reports and player help.' },
        { name: 'Mod Three', role: 'Trial Moderator' },
      ],
    },
    {
      name: 'Builders',
      members: [
        { name: 'Builder One', role: 'Lead Builder', note: 'Spawn and event maps.' },
        { name: 'Builder Two', role: 'Builder' },
      ],
    },
  ],
}
