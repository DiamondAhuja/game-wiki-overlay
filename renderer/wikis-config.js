/**
 * Wiki Configuration
 * 
 * This module defines all available wikis in a single, centralized location.
 * To add a new wiki, simply add a new object to the WIKIS array below.
 * No need to modify HTML or other code files.
 * 
 * Format:
 * {
 *   name: "Display name",
 *   url: "Base wiki URL",
 *   search: "Search URL with {query} placeholder or with ?search= parameter",
 *   icon: "Emoji icon"
 * }
 */

const WIKIS = [
  {
    name: "Minecraft",
    url: "https://minecraft.wiki",
    search: "https://minecraft.wiki/w/Special:Search?search=",
    icon: "⛏️"
  },
  {
    name: "Terraria",
    url: "https://terraria.wiki.gg",
    search: "https://terraria.wiki.gg/index.php?search=",
    icon: "🗡️"
  },
  {
    name: "Stardew Valley",
    url: "https://stardewvalleywiki.com",
    search: "https://stardewvalleywiki.com/mediawiki/index.php?search=",
    icon: "🌾"
  },
  {
    name: "The Legend of Zelda",
    url: "https://zelda.fandom.com",
    search: "https://zelda.fandom.com/wiki/Special:Search?query=",
    icon: "⚔️"
  },
  {
    name: "Dark Souls",
    url: "https://darksouls.wiki.fextralife.com",
    search: "https://darksouls.wiki.fextralife.com/search?q=",
    icon: "💀"
  },
  {
    name: "Elden Ring",
    url: "https://eldenring.wiki.fextralife.com",
    search: "https://eldenring.wiki.fextralife.com/search?q=",
    icon: "👑"
  },
  {
    name: "Hollow Knight",
    url: "https://hollowknight.wiki.gg",
    search: "https://hollowknight.wiki.gg/index.php?search=",
    icon: "🦗"
  },
  {
    name: "Baldur's Gate 3",
    url: "https://baldursgate3.wiki.fextralife.com",
    search: "https://baldursgate3.wiki.fextralife.com/search?q=",
    icon: "🐉"
  },
  {
    name: "Palworld",
    url: "https://palworld.wiki.gg",
    search: "https://palworld.wiki.gg/index.php?search=",
    icon: "🎮"
  },
  {
    name: "Path of Exile",
    url: "https://www.poewiki.net",
    search: "https://www.poewiki.net/index.php?search=",
    icon: "⚡"
  },
  {
    name: "League of Legends",
    url: "https://leagueoflegends.fandom.com",
    search: "https://leagueoflegends.fandom.com/wiki/Special:Search?query=",
    icon: "🎪"
  },
  {
    name: "Genshin Impact",
    url: "https://genshin-impact.fandom.com",
    search: "https://genshin-impact.fandom.com/wiki/Special:Search?query=",
    icon: "⭐"
  },
  {
    name: "Valorant",
    url: "https://valorant.fandom.com",
    search: "https://valorant.fandom.com/wiki/Special:Search?query=",
    icon: "🎯"
  }
];

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WIKIS };
}
