const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');
    this.base = 'https://www.leagueofgraphs.com/en/champions';
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

    const itemsets = Mana.getStore().get('item-sets') ? this.scrapeItemSets(cheerio.load(data[1]), champion, position, '') : {};
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
    return $('td.medium-text-left.small-text-center > span:eq(0) > img').map(function(x) { return Mana.gameclient.findSummonerSpellByName($(this).attr('alt')); });;
  }

  /**
   * Scrapes skill order from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    let x = [[0, 0, 0, 'Q'], [0, 0, 0, 'W'], [0, 0, 0, 'E']], keys = ['Q', 'W', 'E', 'R'];
    $('.skillCell').each(function(index) {
      if ($(this).hasClass('active')) x[Math.floor(index / 18)][Math.floor(index % 18 / 6)]++;

      /* 18 * 3 = Total number of skills */
      if (index === 54) return false;
    });

    return x.map((x, index) => i18n.__('key-' + keys[index])).sort((a, b) => a[0] - b[0] || a[1] - b[1]).join(' => ');
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    let itemset = new ItemSet(champion.key, position).setTitle(`LOG ${champion.name} - ${position}`);
    $('#mainContent > div > div > div > table').each(function(index) {
      let block;

      switch(index) {
        case 0:
          block = new Block().setName(i18n.__('item-sets-block-starter', skillorder));
          break;
        case 1:
          block = new Block().setName(i18n.__('item-sets-block-core-build'));
          break;
        case 2:
          block = new Block().setName(i18n.__('item-sets-block-endgame'));
          break;
        case 3:
          block = new Block().setName(i18n.__('item-sets-block-boots'));
          break;
      }

      $(this).find('tr:not(".see_more_hidden")').children('td.text-center').children('img').each(function() {
        block.addItem($(this).attr('class').slice(20, -4));
      });

      itemset.addBlock(block);
    });

    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables')).addItem(2003).addItem(2138).addItem(2139).addItem(2140));
  }
}

module.exports = LeagueofGraphsProvider;
