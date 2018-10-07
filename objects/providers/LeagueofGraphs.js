const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');
    this.base = 'https://www.leagueofgraphs.com/champions';
  }

  async getData(champion, gameMode, preferredPosition) {
    let data = { roles: {} };

    for (let x of ['JUNGLE', 'MIDDLE', 'TOP', 'ADC', 'SUPPORT']) {
      console.log(2, `[ProviderHandler] [LOG] Gathering data (${x})`);

      try {
        data.roles[x] = await this._scrape(champion, gameMode, x);
      }
      catch(err) {
        console.error(err);
      }
    }

    return data;
  }

  async getItemSets(champion, gameMode, position) {
    return await this.getData(champion, position, gameMode)[position].itemsets;
  }

  async _scrape(champion, gameMode, position) {
    let promises = [rp(`${this.base}/runes/${champion.key.toLowerCase()}${position ? '/' + position : ''}`)];

    promises.push(Mana.getStore().get('item-sets') ? rp(`${this.base}/items/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : Promise.resolve());
    promises.push(Mana.getStore().get('summoner-spells') ? rp(`${this.base}/spells/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : Promise.resolve());
    promises.push(Mana.getStore().get('statistics') ? rp(`${this.base}/stats/${champion.key.toLowerCase()}${position ? '/' + position : ''}`) : null);

    const data = await Promise.all(promises);

    const $perks = cheerio.load(data[0]);
    const perks = this.scrapePerks($perks, champion, position);

    const itemsets = Mana.getStore().get('item-sets') ? this.scrapeItemSets(cheerio.load(data[1]), champion, position, '') : [];
    const summonerspells = Mana.getStore().get('summoner-spells') ? this.scrapeSummonerSpells(cheerio.load(data[2]), champion) : [];
    const statistics = Mana.getStore().get('statistics') ? {} : {};

    return console.dir({ perks, itemsets, summonerspells, statistics });
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    let pages = [{ selectedPerkIds: [], name: `LOG1 ${champion.name} ${position}` }, { selectedPerkIds: [], name: `LOG2 ${champion.name} ${position}` }];

    for (let page in pages) {
      $('table').eq(page).find('tr').each(function(index) {
        /* Perks styles */
        if (index === 0) {
          $(this).find("img[src^='//cdn.leagueofgraphs.com/img/perks/']").each(function(index) {
            pages[page][index === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt($(this).attr('src').slice(-8, -4));
          });
          return;
        }

        const perks = $(this).find("img[src^='//cdn.leagueofgraphs.com/img/perks/']").toArray().sort((a, b) => parseFloat($(a).css('opacity')) - parseFloat($(b).css('opacity')));
        pages[page].selectedPerkIds.push(parseInt(perks[perks.length - 1].attribs.src.slice(-8, -4)));
      });

      pages[page].selectedPerkIds.pop();
    }

    return pages;
  }

  /**
   * Scrapes summoner spells from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells($, gameMode) {
    return $('td.medium-text-left.small-text-center > span > img').slice(0, 2).toArray().map(x => Mana.gameClient.findSummonerSpellByName(x.attribs.alt).id);
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
    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`LOG ${champion.name} - ${position}`);
    let blocks = [
        new Block().setName(i18n.__('item-sets-block-starter', skillorder)),
        new Block().setName(i18n.__('item-sets-block-core-build')),
        new Block().setName(i18n.__('item-sets-block-endgame')),
        new Block().setName(i18n.__('item-sets-block-boots'))
    ];

    $('#mainContent > div > div > div > table').each(function(index) {
      if (!blocks[index]) return;

      $(this).find('img').each(function() {
        blocks[index].addItem($(this).attr('class').slice(20, -4), false);
      });
    });

    itemset.setBlocks(blocks);
    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables')).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return [itemset];
  }
}

module.exports = LeagueofGraphsProvider;
