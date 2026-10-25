// Seed (code-defined) staff list. Admin edits are stored as an override on top
// of this via content/staffStore.js. Edit these defaults to change what shows
// before any admin customization exists.
// Groups whose name matches no rank (see content/staffLook.js) set their own look, so they do
// not all fall back to the same grey; "COMMUNITY MANAGER" would also be cut to 16 characters.
export const staffPage = {
  eyebrow: 'Meet the Team',
  title: 'AlwiNation Staff',
  updated: 'October 25, 2026',
  intro:
    'The people who keep AlwiNation running — building the world, hosting events, and keeping the community safe and welcoming.',
  groups: [
    {
      name: 'Owner',
      members: [
        { name: 'alwisusilo', role: 'Founder & Owner', note: 'Oversees the entire server, sets the overall direction, and leads the community vision.' },
      ],
    },
    {
      name: 'Supervisor',
      members: [
        { name: 'Senn0_', role: 'Project Lead & Head Developer', note: 'Leads the server project, manages development direction, and drives new innovations.' },
        { name: 'Graymontt', role: 'Co-Head Developer', note: 'Assists the project leads, supports development planning, and helps turn new ideas into reality.' },
        { name: 'WaltzDeReich', role: 'Operational Lead & Public Relation', note: 'Leads the staff team, oversees daily operations, engages in community operations, and helps maintain a positive environment.' },
        { name: 'UtoYuto', role: 'Staff Lead', note: 'Supervises the staff team, supports staff coordination, and ensures staff responsibilities are handled properly.' },
      ],
      color: '#ffaa00',
      stage: 'hub-center',
    },
    {
      name: 'Developer',
      members: [
        { name: 'Sy4dd', role: 'Developer', note: 'Develops active Realms, implements new features, and contributes to server innovations.' },
        { name: 'access505', role: 'Developer', note: 'Works on active Realms, improves gameplay systems, and helps bring new ideas to the server.' },
        { name: 'Ray28_', role: 'Developer', note: 'Develops ongoing Realms, assists with new features, and supports server improvements.' },
      ],
      color: '#55ff55',
      stage: 'hub-lanterns',
    },
    {
      name: 'Administrators',
      members: [
        { name: 'DominicTurbo', role: 'Operational Admin', note: 'Manages in-game and Discord administration while supporting overall operations.' },
        { name: 'Dityaa', role: 'Operational Admin', note: 'Manages in-game and Discord administration while supporting overall operations.' },
        { name: 'KaptenZett', role: 'Operational Admin', note: 'Handles Projects administration across the server and Discord community.' },
        { name: 'PeterTzy_', role: 'Operational Admin', note: 'Handles Projects administration across the server and Discord community.' },
        { name: 'Ryocnz', role: 'Project Admin', note: 'Handles the Discord administration to keep project operations running smoothly.' },
        { name: 'dezelyon', role: 'Product Admin', note: 'Quality Provider and Assists with Operational administration, moderation support, and community management tasks.' },
      ],
    },
    {
      name: 'Community Manager',
      members: [
        { name: 'DevKry', role: 'Community Manager & Wiki Maintainer', note: 'Helps manage the community, supports player communication, and keeps the wiki organized and up to date.' },
      ],
      color: '#00aaaa',
      tag: 'COMMUNITY',
      stage: 'street-path',
    },
    {
      name: 'Moderators',
      members: [
        { name: 'Zennzyx', role: 'Senior Moderator' },
        { name: 'Vennelica', role: 'Senior Moderator' },
        { name: 'HMSI', role: 'Moderator' },
        { name: 'PyVoz', role: 'Moderator' },
        { name: 'Kyuu4Y', role: 'Moderator' },
        { name: 'DFerZ', role: 'Moderator' },
      ],
    },
  ],
}
