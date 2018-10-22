const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class METAsrcProvider extends Provider {
  constructor() {
    super('metasrc', 'METAsrc');
    this.base = 'https://www.metasrc.com/';
  }

  getGameMode(mode) {
    switch(mode.toLowerCase()) {
      case 'aram':
      return 'aram';
      case 'classic':
      return '5v5';
      default:
      return '5v5';
    }
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp({
      method: 'GET',
      uri: `${this.base}${this.getGameMode(gameMode)}/champion/${champion.key.toLowerCase()}`,
      json: true
    });

    return this._scrape(res, champion, preferredPosition, gameMode);
  }

  _scrape(html, champion, position, gameMode) {
    let $ = cheerio.load(html);

    let itemsets = this.scrapeItemSets($, champion, position, this.scrapeSkillOrder($));
    return { perks: this.scrapePerks($), summonerspells: this.scrapeSummonerSpells($), itemsets };
  }

  /**
   * Scrapes item sets from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapePerks($) {
    let page = { selectedPerkIds: [] };

    $('svg > image').each(function(index) {
      try {
        console.dir($(this).attr('href'));
        console.dir(this);
      }
      catch(err) {}
      
      if (index === 0) page.primaryStyleId = $(this).attr('href').slice(-8, -4);
      else if (index === 5) page.primaryStyleId = $(this).attr('href').slice(-8, -4);
      else page.selectedPerkIds.push(Mana.gameClient.findPerkByImage($(this).attr('href')).id);
    });

    return [page];
  }

  /**
   * Scrapes summoner spells from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSummonerSpells($) {
    let summonerspells = [];

    $('img[src^="https://ddragon.leagueoflegends.com/cdn/8.20.1/img/spell/"]').slice(0, 2).each(function(index) {
      summonerspells.push(Mana.gameClient.findSummonerSpellByName($(this).attr('src').slice($(this).attr('src').lastIndexOf('/') + 1, -4)));
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    return null; //skillorder;
  }

  /**
   * Scrapes item sets from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    return [];
    /*const itemrows = $('.champion-overview__table').eq(1).find('.champion-overview__row');

    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`OPG ${champion.name} - ${position}`);

    return [itemset];*/
  }

  getCondensedName() {
    return 'MSR';
  }
}

module.exports = METAsrcProvider;
