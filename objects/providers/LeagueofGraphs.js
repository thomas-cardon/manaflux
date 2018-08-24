const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');
    this.base = 'https://www.leagueofgraphs.com/champions/';
  }

  async getData(champion, gameMode, preferredPosition) {
    return await this._scrape(res, champion, gameMode, preferredPosition);
  }

  async getItemSets(champion, gameMode, position) {
    return await this.getData(champion, position, gameMode).itemsets;
  }

  async _scrape(html, champion, gameMode, position) {
    const data = await Promise.all([
      await rp(`${this.base}/runes/${champion.key.toLowerCase()}`),
      await rp(`${this.base}/items/${champion.key.toLowerCase()}`),
      await rp(`${this.base}/spells/${champion.key.toLowerCase()}`),
      await rp(`${this.base}/stats/${champion.key.toLowerCase()}`)
    ]);

    const $perks = cheerio.load(data[0]);
    const $items = cheerio.load(data[1]);
    const $spells = cheerio.load(data[2]);
    const $stats = cheerio.load(data[3]);

    const perks = scrapePerks($perks, champion);
    const itemsets = scrapePerks($items, champion, position);
    const summonerspells = scrapePerks($spells, champion);
    const statistics = scrapePerks($stats);

    return { perks, itemsets, summonerspells, statistics };
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    let pages = [{ selectedPerkIds: [], name: `LOG1 ${champion.name} ${position}` }, { selectedPerkIds: [], name: `LOG1 ${champion.name} ${position}` }];
    const page1 = $('table').eq(0).find("img[src^='//cdn.leagueofgraphs.com/img/perks/']:not([style*='opacity: 0.3'])");
    const page2 = $('table').eq(1).find("img[src^='//cdn.leagueofgraphs.com/img/perks/']:not([style*='opacity: 0.3'])");

    function treatPage(page, data) {
      /* Perks styles */
      data.splice(0, 2).each(function(index) {
        page[index === 0 ? 'primaryStyleId' : 'subStyleId'] = $(this).attr('src').slice(-8, -4);
      });

      return page;
    }

    pages[0] = treatPage(pages[0], page1);
    pages[1] = treatPage(pages[1], page1);

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
