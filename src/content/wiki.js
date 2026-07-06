// Seed (code-defined) wiki content. Admin edits are stored as an override on top
// of this via content/wikiStore.js. Each category is a "realm" or topic area that
// holds a list of articles. Edit these defaults to change what shows before any
// admin customization exists.
export const wikiPage = {
  eyebrow: 'Server Wiki',
  title: 'AlwiNation Wiki',
  updated: 'July 6, 2026',
  intro:
    'Your complete guide to AlwiNation \u2014 every realm, command, and feature explained. Search or browse by category to find exactly what you need.',
  categories: [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: '\uD83D\uDE80',
      description: 'New to the server? Start here to get online and find your feet.',
      articles: [
        {
          slug: 'how-to-join',
          title: 'How to Join AlwiNation',
          excerpt: 'Connect from Java or Bedrock in under a minute.',
          updated: 'July 6, 2026',
          body:
            'AlwiNation supports both **Java** and **Bedrock** editions, so you can play from almost any device.\n\n# Java Edition\n- Open Minecraft Java Edition (version 1.21+)\n- Click **Multiplayer**, then **Add Server**\n- Enter the address `play.alwination.id`\n- Save and join!\n\n# Bedrock Edition\n- Open Minecraft Bedrock Edition\n- Go to **Servers**, then **Add Server**\n- Address: `play.alwination.id`\n- Port: `19132`\n\n> Cross-play is fully supported \u2014 Java and Bedrock players share the same worlds.',
        },
        {
          slug: 'first-steps',
          title: 'Your First Steps',
          excerpt: 'What to do in your first hour on the server.',
          updated: 'July 6, 2026',
          body:
            'Welcome! Here is a quick checklist to get you started on the right foot.\n\n# First things to do\n- Read the [server rules](/rules) so you stay safe and fair\n- Pick a realm from the **/warp** menu\n- Claim a plot of land to protect your builds\n- Set your home with `/sethome`\n\n# Helpful tips\n- Use `/spawn` to return to the hub any time\n- Type `/help` in-game for a full command list\n- Join our Discord to chat with the community\n\nHave fun and build something amazing!',
        },
      ],
    },
    {
      id: 'realms',
      name: 'Realms',
      icon: '\uD83C\uDF0D',
      description: 'Explore the different worlds and game modes AlwiNation offers.',
      articles: [
        {
          slug: 'survival-realm',
          title: 'Survival Realm',
          excerpt: 'Classic survival with land claiming and a player economy.',
          updated: 'July 6, 2026',
          body:
            'The **Survival Realm** is our flagship world \u2014 gather, build, and thrive with the community.\n\n# Features\n- Land claiming to protect your builds from griefers\n- A player-driven economy with shops\n- Regular events and boss fights\n- Friendly, active moderation\n\n# Getting started\n- Use `/warp survival` to travel there\n- Claim land with a golden shovel\n- Trade with other players at spawn\n\n> Tip: Team up with friends to build a town together.',
        },
        {
          slug: 'skyblock-realm',
          title: 'Skyblock Realm',
          excerpt: 'Start on a floating island and expand your empire.',
          updated: 'July 6, 2026',
          body:
            'In the **Skyblock Realm**, you begin on a tiny floating island with limited resources. Expand carefully and build an economy from nothing.\n\n# Basics\n- Use `/is create` to start your island\n- Complete challenges for rewards\n- Invite friends with `/is invite`\n\n# Progression\n- Expand your island border as you level up\n- Build cobblestone generators for infinite resources\n- Compete on the island top leaderboard',
        },
      ],
    },
    {
      id: 'economy',
      name: 'Economy & Shops',
      icon: '\uD83D\uDCB0',
      description: 'Earn, spend, and trade across the server economy.',
      articles: [
        {
          slug: 'economy-basics',
          title: 'Economy Basics',
          excerpt: 'How money works and how to earn your first coins.',
          updated: 'July 6, 2026',
          body:
            'AlwiNation runs a player-driven economy. Here is how to get started.\n\n# Earning money\n- Sell items at the server shop with `/shop`\n- Set up your own player shop\n- Complete jobs with `/jobs`\n- Win events and competitions\n\n# Checking your balance\n- Use `/balance` to see your coins\n- Use `/pay <player> <amount>` to send money\n- View the richest players with `/baltop`',
        },
        {
          slug: 'player-shops',
          title: 'Setting Up a Player Shop',
          excerpt: 'Sell your goods to other players automatically.',
          updated: 'July 6, 2026',
          body:
            'Player shops let you sell items even while you are offline.\n\n# Creating a shop\n- Place a chest in your claimed land\n- Look at the chest and hold the item you want to sell\n- Type the price when prompted\n\n# Best practices\n- Price competitively \u2014 check `/shop` prices first\n- Keep your shop stocked\n- Build near spawn for more traffic',
        },
      ],
    },
    {
      id: 'ranks-perks',
      name: 'Ranks & Perks',
      icon: '\u2B50',
      description: 'Unlock cosmetics, commands, and perks as you rank up.',
      articles: [
        {
          slug: 'ranks-overview',
          title: 'Ranks Overview',
          excerpt: 'How ranks work and what each tier unlocks.',
          updated: 'July 6, 2026',
          body:
            'Ranks reward active players and supporters with extra perks.\n\n# Playtime ranks\n- Earn ranks automatically by playing\n- Each tier unlocks new commands and cosmetics\n\n# Store ranks\n- Support the server at the [store](https://store.alwination.id)\n- Unlock exclusive kits, homes, and particles\n\n> All ranks are cosmetic-first \u2014 AlwiNation is never pay-to-win.',
        },
      ],
    },
    {
      id: 'commands',
      name: 'Commands',
      icon: '\u2328\uFE0F',
      description: 'A reference of the most useful in-game commands.',
      articles: [
        {
          slug: 'essential-commands',
          title: 'Essential Commands',
          excerpt: 'The commands every player should know.',
          updated: 'July 6, 2026',
          body:
            'Here are the commands you will use most often.\n\n# Movement\n- `/spawn` \u2014 return to the hub\n- `/sethome` \u2014 set a home point\n- `/home` \u2014 teleport to your home\n- `/tpa <player>` \u2014 request to teleport to a player\n\n# Economy\n- `/balance` \u2014 check your coins\n- `/pay <player> <amount>` \u2014 send money\n- `/shop` \u2014 open the server shop\n\n# Social\n- `/msg <player> <text>` \u2014 private message\n- `/help` \u2014 full command list',
        },
      ],
    },
  ],
}
