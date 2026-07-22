// Local seed data for the changelog. Once Supabase (or the local server store) has
// entries, admin/bot entries take priority and these seeds fill in during development.

const showSeedChangelogInDevelopment = true
const showSeedChangelogInProduction = false

export const showSeedChangelog = import.meta.env.PROD
  ? showSeedChangelogInProduction
  : showSeedChangelogInDevelopment

// The canonical change groups. Order here controls the display order inside an entry.
export const changeTypeOrder = ['added', 'changed', 'improved', 'fixed', 'removed', 'deprecated', 'security']

export const changeTypeMeta = {
  added: {
    label: 'Added',
    symbol: '+',
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  changed: {
    label: 'Changed',
    symbol: '~',
    badge: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    dot: 'bg-sky-400',
  },
  improved: {
    label: 'Improved',
    symbol: '↑',
    badge: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    dot: 'bg-violet-400',
  },
  fixed: {
    label: 'Fixed',
    symbol: '✓',
    badge: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    dot: 'bg-amber-400',
  },
  removed: {
    label: 'Removed',
    symbol: '−',
    badge: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    dot: 'bg-rose-400',
  },
  deprecated: {
    label: 'Deprecated',
    symbol: '!',
    badge: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
    dot: 'bg-orange-400',
  },
  security: {
    label: 'Security',
    symbol: '⚠',
    badge: 'border-red-400/30 bg-red-400/10 text-red-300',
    dot: 'bg-red-400',
  },
}

export function getChangeTypeMeta(type) {
  return changeTypeMeta[type] ?? changeTypeMeta.changed
}

export const changelogEntries = [
  {
    id: 'skyblock-season-3',
    slug: 'skyblock-season-3',
    realm: 'Skyblock',
    version: 'v1.4.0',
    title: 'Season 3 balance pass',
    summary: 'A big economy and island-progression update to open Season 3.',
    tag: 'Release',
    date: 'July 20, 2026',
    dateValue: '2026-07-20',
    author: 'AlwiNation Team',
    changes: [
      {
        type: 'added',
        items: ['New /is upgrade menu with island-wide boosters.', 'Seasonal leaderboard rewards.'],
      },
      {
        type: 'changed',
        items: ['Rebalanced cobblestone generator rates.', 'Adjusted mob spawner drop tables.'],
      },
      {
        type: 'fixed',
        items: ['Duplication bug on hopper minecarts.', 'Island border rendering glitch at spawn.'],
      },
    ],
    source: 'seed',
    deleted: false,
  },
  {
    id: 'survival-hotfix-201',
    slug: 'survival-hotfix-2-0-1',
    realm: 'Survival',
    version: 'v2.0.1',
    title: 'Post-launch hotfix',
    summary: 'Stability fixes following the Survival 2.0 launch.',
    tag: 'Hotfix',
    date: 'July 18, 2026',
    dateValue: '2026-07-18',
    author: 'AlwiNation Team',
    changes: [
      {
        type: 'fixed',
        items: ['Claim protection not applying to boats.', 'Rare crash when opening the market menu.'],
      },
      {
        type: 'improved',
        items: ['Faster chunk loading around the world spawn.'],
      },
    ],
    source: 'seed',
    deleted: false,
  },
  {
    id: 'lobby-cosmetics',
    slug: 'lobby-cosmetics-update',
    realm: 'Lobby',
    version: 'v1.1.0',
    title: 'Cosmetics refresh',
    summary: 'New cosmetics and navigation improvements in the main lobby.',
    tag: 'Update',
    date: 'July 15, 2026',
    dateValue: '2026-07-15',
    author: 'AlwiNation Team',
    changes: [
      {
        type: 'added',
        items: ['Summer particle trails and hats in the cosmetics menu.'],
      },
      {
        type: 'changed',
        items: ['Reorganized the server selector for quicker realm access.'],
      },
      {
        type: 'removed',
        items: ['Retired the old winter cosmetics set.'],
      },
    ],
    source: 'seed',
    deleted: false,
  },
]
