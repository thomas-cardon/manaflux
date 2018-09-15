const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');
    this.base = 'https://www.leagueofgraphs.com/champions';
  }

  async getData(champion, gameMode, preferredPosition) {
    let positions = {};

    let x = ['JUNGLE', 'MIDDLE', 'TOP', 'ADC', 'SUPPORT'];
    for (let i = 0; i < x.length; i++) {
      log.log(2, `[ProviderHandler] [LOG] Gathering data for ${x[i]}`);

      try {
        positions[x[i]] = await this._scrape(champion, gameMode, x[i]);
      }
      catch(err) {
        console.error(err);
      }
    }

    return log.dir(3, positions);
  }

  async getItemSets(champion, gameMode, position) {
    return await this.getData(champion, position, gameMode).itemsets;
  }

  async _scrape(champion, gameMode, position) {
    let promises = [rp(`${this.base}/runes/${champion.key.toLowerCase()}${position ? '/' + position : ''}`)];

    promises.push(Mana.getStore().get('item-sets') ? rp(`${this.base}/items/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : Promise.resolve());
    promises.push(Mana.getStore().get('summoner-spells') ? rp(`${this.base}/spells/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : Promise.resolve());
    promises.push(Mana.getStore().get('statistics') ? rp(`${this.base}/stats/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : null);

    const data = await Promise.all(promises);
    console.dir(data);

    const $perks = cheerio.load(data[0]);
    const perks = this.scrapePerks($perks, champion, position);

    const itemsets = Mana.getStore().get('item-sets') ? this.scrapeItemSets(cheerio.load(data[1]), champion, position) : {};
    const summonerspells = Mana.getStore().get('summoner-spells') ? this.scrapeSummonerSpells(cheerio.load(data[2]), champion) : {};
    const statistics = Mana.getStore().get('statistics') ? {} : {};

    return { perks, itemsets, summonerspells, availablePositions: {}, statistics };
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    let pages = [{ selectedPerkIds: [], name: `LOG1 ${champion.name} ${position}` }, { selectedPerkIds: [], name: `LOG1 ${champion.name} ${position}` }];

    for (let page in pages) {
      const d = $('table').eq(page).find("img[src^='//cdn.leagueofgraphs.com/img/perks/']:not([style*='opacity: 0.3'])");
      /* Perks styles */
      d.slice(0, 2).each(function(index) {
        pages[page][index === 0 ? 'primaryStyleId' : 'subStyleId'] = $(this).attr('src').slice(-8, -4);
      });

      pages[page].selectedPerkIds = [
        d.eq(4).attr('src').slice(-8, -4),
        d.eq(5).attr('src').slice(-8, -4),
        d.eq(6).attr('src').slice(-8, -4),
        d.eq(8).attr('src').slice(-8, -4),
        d.eq(9).attr('src').slice(-8, -4),
        d.eq(10).attr('src').slice(-8, -4)
      ];
    }

    return pages;
  }

  /**
   * Scrapes summoner spells from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells($, gameMode) {
    let summonerspells = [];
    return summonerspells;
  }

  /**
   * Scrapes skill order from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    return skillorder;
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {

  }
}

module.exports = LeagueofGraphsProvider;
