const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LeagueofGraphsProvider extends Provider {
  constructor() {
    super('leagueofgraphs', 'League of Graphs');

    this.base = 'https://www.leagueofgraphs.com/champions';
  }

  async request(gameMode, champion, position) {
    return { roles: { [position] : await this._scrape(gameMode, champion, position) } };
  }

  async _scrape(gameMode, champion, position) {
    const data = await rp({ uri: `${this.base}/overview/${champion.key}${position ? '/' + position : ''}/${gameMode === 'ARAM' ? 'aram' : ''}`.toLowerCase(), transform: body => cheerio.load(body) });

    const perks = this.scrapePerks(data, position);

    const itemsets = Mana.getStore().get('item-sets-enable') ? this.scrapeItemSets(data, champion, position, this.scrapeSkillOrder(data)) : [];
    const summonerspells = Mana.getStore().get('summoner-spells') ? this.scrapeSummonerSpells(data, champion) : [];
    const statistics = Mana.getStore().get('statistics') ? {} : {};

    return { perks, itemsets, summonerspells, statistics, gameMode };
  }

  /**
   * Scrapes perks from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   */
  scrapePerks($, role) {
    let page = { selectedPerkIds: [] };

    $('.perksTableOverview').find('tr').each(function(i, elem) {
      let images = $(this).find('img[src^="//cdn.leagueofgraphs.com/img/perks/"]').toArray().filter(x => $(x.parentNode).css('opacity') != 0.2);

      if (i === 0 || i === 5)
        page[i === 0 ? 'primaryStyleId' : 'subStyleId'] = images[0].attribs.src.slice(-8, -4);
      else if (images.length > 0) page.selectedPerkIds.push(images[0].attribs.src.slice(-8, -4));
    });

    return [page];
  }

  /**
   * Scrapes summoner spells from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSummonerSpells($) {
    if (Mana.gameClient.locale !== 'en_GB' && Mana.gameClient.locale !== 'en_US') {
      console.log(2, `[ProviderHandler] [League of Graphs] Summoner spells are not supported because you're not using the english language in League`);
      return [];
    }

    return $('h3:contains(Summoner Spells)').parent().find('img').toArray().filter(x => Object.values(Mana.gameClient.summonerSpells).find(z => z.name === x.attribs.alt)).map(x => Object.values(Mana.gameClient.summonerSpells).find(z => z.name === x.attribs.alt).id);
  }

  /**
   * Scrapes skill order from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    return $('h3:contains(Skill Orders)').parent().find('.championSpellLetter').toArray().map(x => i18n.__('key-' + $(x).text().trim())).join(' => ');
  }

  /**
   * Scrapes item sets from a League of Graphs page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.gameClient.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`LOG ${champion.name} - ${position}`);
    let blocks = [
      new Block().setType({ i18n: 'item-sets-block-starter-skill-order', arguments: [skillorder] }),
      new Block().setType({
        i18n: 'item-sets-block-core-build-wr',
        arguments: [$('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div.row.margin-bottom > div.medium-13.columns').children('.figures').text().trim().split('%').map(x => x.replace(/[^0-9.]/g, ""))[1]]
      }),
      new Block().setType({ i18n: 'item-sets-block-endgame' }),
      new Block().setType({ i18n: 'item-sets-block-boots' })
    ];

    /* Starter items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div').children().find('img').toArray().map(x => $(x).attr('class').trim().slice(-7, -3)).forEach(x => blocks[0].addItem(x));
    /* Core items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div.row.margin-bottom > div.medium-13.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[1].addItem(x));
    /* Boots */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div:nth-child(2) > div.medium-11.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[2].addItem(x));
    /* End game items */
    $('#mainContent > div > div:nth-child(1) > a:nth-child(3) > div > div:nth-child(2) > div.medium-13.columns').children().find('img').toArray().map(x => parseInt($(x).attr('class').trim().slice(-7, -3))).forEach(x => blocks[3].addItem(x));

    itemset.addBlocks(...blocks);
    return [itemset];
  }

  getCondensedName() {
    return 'LOG';
  }
}

module.exports = LeagueofGraphsProvider;
