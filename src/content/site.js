export const defaultSite = {
  version: 1,
  settings: {
    serverAddress: 'play.alwination.id',
    bedrockPort: 19132,
    javaVersion: '1.21.11',
    discordUrl: 'https://discord.alwination.id',
    discordInviteCode: 'alwination',
    storeUrl: 'https://store.alwination.id',
    statusUrl: 'https://status.alwination.id/status/dashboard',
    youtubeUrl: 'https://www.youtube.com/@alwisusilo',
    tiktokUrl: 'https://www.tiktok.com/@alwinationmc',
    tagline: "Indonesia's Minecraft network, for Java and Bedrock.",
    footerBlurb: 'A community server hub for updates, events and announcements. Play together across PC, phone and console.',
  },
  home: {
    hero: {
      image: '/img/hero-hub.webp',
      subtitle: 'The official Minecraft server of Alwisusilo. Ten realms on one IP, from Arena PvP to Tycoon, on PC, phone or console.',
      primaryLabel: 'Play now',
      secondaryLabel: 'Join Discord',
    },
    sections: [
      // Rendered in this order. `enabled` hides a section without deleting its content.
      { id: 'gameplay', enabled: true, kicker: 'Realms', title: 'Pick your Gameplay',
        lead: 'Ten realms, one IP. Walk into any of them from the hub and switch whenever you like.',
        autoplaySeconds: 6 },
      { id: 'feature', enabled: true, kicker: 'Tycoon · New season', title: 'Season 5 is', titleAccent: 'live',
        lead: 'The cold has reached your island. Season 5 reworks the core of Tycoon: a new generator line, pets with evolution lines, a Knowledge system and an event calendar you can plan around.',
        image: '/img/street-wide.webp', effect: 'snow', // 'snow' | 'embers' | 'none'
        buttonLabel: 'Read the patch notes', buttonHref: '/news/season-5',
        tooltip: { title: 'Tycoon · Season Five', subtitle: '12 changes · highlights', footer: '+6 more in the patch notes',
          lines: [
            { name: 'Frost Bound Curse', text: 'Seek warmth before the cold bites.' },
            { name: 'Generator Update', text: 'A whole new generator line.' },
            { name: 'Pet Rework', text: 'Full overhaul, with evolution lines.' },
            { name: 'Knowledge System', text: 'Learn entries to open features.' },
            { name: 'Night Market', text: 'Your own loot, your own rewards.' },
            { name: 'Calendar', text: 'Events on a schedule: /calendar' },
          ] } },
      { id: 'players', enabled: true, kicker: 'Hall of fame', title: 'Top Players',
        lead: 'The best PvP players on AlwiNation, straight from the server.',
        boards: [ // which leaderboard boards to show as podiums; first entry is shown raised in the middle
          { mode: 'overall', label: 'Overall · Points', unit: 'pts' },
          { mode: 'ffa', label: 'FFA · Kills', unit: 'kills' },
          { mode: 'crystal', label: 'Crystal · Wins', unit: 'wins' },
        ] },
      { id: 'join', enabled: true, kicker: 'How to join', title: 'Start playing in a minute',
        lead: 'Same address on every platform. Java players connect straight away; Bedrock players add port {bedrockPort}.',
        steps: [
          { title: 'Copy the IP', text: '{serverAddress} — Bedrock also needs port {bedrockPort}.' },
          { title: 'Add the server', text: 'Multiplayer, then Add Server on Java. Servers, then Add Server on Bedrock.' },
          { title: 'Pick a realm in the hub', text: 'Walk into any of the ten realms and start playing. Java {javaVersion} recommended.' },
        ] },
      { id: 'news', enabled: true, kicker: 'From the team', title: 'Latest News', lead: 'Patch notes, events and announcements.', count: 3 },
      { id: 'community', enabled: true, kicker: 'Community', title: 'Join the community',
        lead: 'Event announcements, patch notes and staff support all happen on the AlwiNation Discord.',
        image: '/img/hub-podium-wide.webp', buttonLabel: 'Join our Discord' },
    ],
    realms: [
      // Order = carousel order. Owner-provided list (2026-10-24). Only Arena PvP and Tycoon copy is from real data; the rest is SAMPLE copy the owner must rewrite.
      { id: 'arena-pvp', enabled: true, name: 'Arena PvP', label: 'Practice · Ranked', color: '#ff5f57', image: '/img/card-pvp.webp', badge: 'Ranked',
        description: 'Twelve kits from Sword and Crystal to Mace and UHC, plus FFA. Climb the ranked ELO ladder.', linkLabel: 'See top players', href: '/leaderboard' },
      { id: 'tycoon', enabled: true, name: 'Tycoon', label: 'Island Tycoon', color: '#ffaa00', image: '/img/hub-lanterns.webp', badge: 'Season 5 live',
        description: 'Grow your island, upgrade generators and push the milestones. Now with the Frost Bound Curse and the Pet Rework.', linkLabel: 'See Season 5', href: '/news/season-5' },
      { id: 'earth', enabled: true, name: 'Earth', label: 'Towns & Nations', color: '#55c8ff', image: '/img/street-path.webp', badge: '',
        description: 'The whole world map at Minecraft scale. Settle anywhere, found a town and grow it into a nation.', linkLabel: 'Earth guide', href: '/wiki' },
      { id: 'vanilla', enabled: true, name: 'Vanilla', label: 'Pure Survival', color: '#6ee06e', image: '/img/street-lamps.webp', badge: '',
        description: 'Minecraft the way it ships. No custom items, no shortcuts, just a shared world to build in.', linkLabel: 'Vanilla guide', href: '/wiki' },
      { id: 'survival-war', enabled: true, name: 'Survival War', label: 'Survival · PvP', color: '#ff4d6d', image: '/img/card-war.webp', badge: '',
        description: 'Survival where teams fight over land. Build a base, fortify it and go to war.', linkLabel: 'War guide', href: '/wiki' },
      { id: 'survival-slimefun', enabled: true, name: 'Survival Slimefun', label: 'Survival · Machines & magic', color: '#a3e635', image: '/img/card-creative.webp', badge: '',
        description: 'Survival with Slimefun: hundreds of new machines, tools and magic items to research and build.', linkLabel: 'Slimefun guide', href: '/wiki' },
      { id: 'survival-rpg', enabled: true, name: 'Survival RPG', label: 'Survival · Adventure', color: '#c792ff', image: '/img/card-rpg.webp', badge: '',
        description: 'Survival with levels, custom gear and dungeons to clear with your friends.', linkLabel: 'RPG guide', href: '/wiki' },
      { id: 'oneblock-slimefun', enabled: true, name: 'Oneblock Slimefun', label: 'Oneblock · Machines', color: '#4fe0c4', image: '/img/card-oneblock-sf.webp', badge: '',
        description: 'Start on a single block, then build Slimefun machines out of everything it gives you.', linkLabel: 'Guide', href: '/wiki' },
      { id: 'oneblock', enabled: true, name: 'Oneblock', label: 'One block start', color: '#ff8ad8', image: '/img/card-oneblock.webp', badge: '',
        description: 'Start on a single block that never runs out and grow it into a whole island.', linkLabel: 'Oneblock guide', href: '/wiki' },
      { id: 'prison', enabled: true, name: 'Prison', label: 'Mine & rank up', color: '#c9ccd6', image: '/img/card-prison.webp', badge: '',
        description: 'Mine your way up through the ranks, prestige, and start again stronger.', linkLabel: 'Prison guide', href: '/wiki' },
    ],
  },
}

// One pass, plain text: unknown placeholders stay literal and replacements
// cannot introduce another round of substitution.
export function fillSitePlaceholders(text, settings = defaultSite.settings) {
  return String(text ?? '').replace(/\{(serverAddress|bedrockPort|javaVersion)\}/g, (_, key) => String(settings[key]))
}
