const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class METAsrcProvider extends Provider {
  constructor() {
    super('metasrc', 'METAsrc');
    this.base = 'https://www.metasrc.com/';
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}${this.getGameMode(gameMode)}/champion/${champion.key.toLowerCase()}`);
    const d = this._scrape(res, champion, preferredPosition, gameMode);

    let data = { roles: { [d.position]: d } };

    if (['ARAM', 'TWISTED_TREELINE', 'URF'].includes(gameMode)) {
      delete data.roles[gameMode].position;
      return data;
    }

    for (const position of d.availablePositions) {
      console.log(2, `[ProviderHandler] [METAsrc] Gathering data (${position.name})`);
      try {
        data.roles[position.position] = this._scrape(await rp(`${this.base}${this.getGameMode(gameMode)}/champion/${champion.key.toLowerCase()}/${position.metasrcPosition}`), champion, position.position, gameMode);
      }
      catch(err) {
        console.log(`[ProviderHandler] [METAsrc] Something happened while gathering data (${position.name})`);
        console.error(err);
      }
    }

    Object.values(data.roles).forEach(role => {
      delete role.availablePositions;
      delete role.position;
    });

    return data;
  }

  _scrape(html, champion, position, gameMode) {
    let $ = cheerio.load(html), availablePositions = [];

    if (gameMode === 'CLASSIC') {
      $('a[href^="/5v5/champion/"] > table').each(function(index) {
        if ($(this).css('box-shadow') === 'none') availablePositions.push({ metasrcPosition: $(this).find('h1').text().toLowerCase(), position: $(this).find('h1').text() === 'MID' ? 'MIDDLE' : $(this).find('h1').text() });
        else position = $(this).find('h1').text() === 'MID' ? 'MIDDLE' : $(this).find('h1').text();
      });
    }
    else position = gameMode;

    let itemsets = this.scrapeItemSets($, champion, position, this.scrapeSkillOrder($));
    return { position, perks: this.scrapePerks($), summonerspells: this.scrapeSummonerSpells($), itemsets, availablePositions, gameMode };
  }

  /**
   * Scrapes item sets from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapePerks($) {
    let page = { selectedPerkIds: [] };

    $('svg > image').each(function(index) {
      if (index === 0) page.primaryStyleId = $(this).attr('href').slice(-8, -4);
      else if (index === 5) page.subStyleId = $(this).attr('href').slice(-8, -4);
      else page.selectedPerkIds.push(Mana.gameClient.findPerkByImage($(this).attr('href').slice(84)).id);
    });

    return [page];
  }

  /**
   * Scrapes summoner spells from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSummonerSpells($) {
    let summonerspells = [];

    $('img[src*="/img/spell"]').slice(0, 2).each(function(index) {
      const key = $(this).attr('src').slice($(this).attr('src').lastIndexOf('/') + 1, -4);

      if (Mana.summonerspells[key])
        summonerspells.push(Mana.summonerspells[key]);
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    return null;
  }

  /**
   * Scrapes item sets from a METAsrc page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    const itemset = new ItemSet(champion.key, position, this.id);

    let starter = new Block().setType({ i18n: 'item-sets-block-starter' });
    let core = new Block().setType({
      i18n: 'item-sets-block-core-build-wr',
      arguments: [$('a[href*="/champion/"] > table > tbody > tr').eq(2).find('td').text() + '%'] /* Winrate */
    });

    $('img[src*="/img/item/"]').each(function(index) {
      let id = $(this).attr('src').slice(-8, -4);

      if (index <= 2) starter.addItem(id);
      else core.addItem(id);
    });

    itemset.addBlocks(starter, core);
    return [itemset];
  }

  getGameMode(mode) {
      switch(mode.toLowerCase()) {
        case 'aram':
        return 'aram';
        case 'classic':
        return '5v5';
        case 'twisted_treeline':
        return '3v3';
        case 'urf':
        return 'arurf';
        default:
        return '5v5';
      }
    }

  getCondensedName() {
    return 'MSR';
  }
}

module.exports = METAsrcProvider;
