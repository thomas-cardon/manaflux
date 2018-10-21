const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class LoLAlyticsProvider extends Provider {
  constructor() {
    super('lolalytics', 'LoLAlytics');
    this.base = 'https://lolalytics.com';
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp({
      method: 'GET',
      uri: `${this.base}/${gameMode === 'ARAM' ? 'aram' : 'ranked'}/worldwide/platinum/plus/champion/${champion.key}/`,
      json: true
    }), d = this._scrape(res, champion, gameMode), data = { roles: {} };

    for (const position of d.availablePositions) {
      console.log(2, `[Champion.GG] Gathering data (${position.name})`);

      data.roles[position.name] = this._scrape(await rp(position.link), champion, gameMode);
      delete data.roles[position.name].position;
    }

    return data;
  }

  _scrape(html, champion, gameMode) {
    const $ = cheerio.load(html);

    const position = $('.lanebox.selected').find('.lanename').text();
    const availablePositions = [];

    if ($('body > header > div.topbar > div > div > div:nth-child(3) > div > a > div').text().slice(-9, -5) !== Mana.gameClient.branch) UI.error('providers-error-outdated');

    if (position === 'Overall' && gameMode !== 'ARAM') {
      $('.lanebox[class!="lanebox selected"] > .lanetitle[class!="lanetitle leaderboard"] > .lanename').each(function(index) {
        availablePositions.push({ name: $(this).text().toUpperCase(), link: 'https://lolalytics.com' + $(this).parent().parent().attr('href') });
      });

      return { availablePositions, position: position.toUpperCase() };
    }

    const summonerspells = this.scrapeSummonerSpells($);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, position, skillorder);

    const perks = this.scrapePerks($, champion, position);

    return { perks, summonerspells, itemsets, availablePositions, position: position === 'Overall' ? null : position.toUpperCase() };
  }

  /**
   * Scrapes item sets from a LoLAlytics page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSummonerSpells($) {
    const spells = [];
    $('[data-type="spell"]').each(function(index) {
      spells.push($(this).data('id'));
    })
    return spells;
  }

  /**
   * Scrapes item sets from a LoLAlytics page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    const page = { selectedPerkIds: [], provider: 'lolalytics' };

    $('.pick.highlight').siblings('[data-id]').each(function(index) {
      page.selectedPerkIds.push($(this).data('id'));
    });

    console.dir(page);
    page.primaryStyleId = Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[0]).id;
    page.subStyleId = Mana.gameClient.findPerkStyleByPerkId(page.selectedPerkIds[4]).id;

    return [page];
  }

  /**
   * Scrapes skill order from a LoLAlytics page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    return $('.summaryskills').eq(0).children('div.summaryspellkey').text().split('').map(x => i18n.__('key-' + x)).join(' => ');
  }

  /**
   * Scrapes item sets from a LoLAlytics page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`OPG ${champion.name} - ${position}`);

    let boots = new Block().setType({ i18n: 'item-sets-block-boots' });
    let starter = new Block().setType({ i18n: 'item-sets-block-boots' });
    let mostpopular = new Block().setType({ i18n: 'item-sets-block-most-popular' });

    let x = [[], [], [], [], []];

    $('strong[style="font-size:22px;"]').each(function(i) {
      $(this).parent().parent().parent().parent().find('[data-type="item"]').each(function(ii) {
        x[i].push($(this).data('id'));
      });
    });

    $('.pure-u-1-12.headings:contains("Starting")').parent().find('[data-type="item"]').slice(0, 3).each(function(index) {
      starter.addItem($(this).data('id'), false);
    });

    $('.pure-u-1-12.headings:contains("Boots")').parent().find('[data-type="item"]').each(function(index) {
      boots.addItem($(this).data('id'), false);
    });

    $('.pure-u-1-12.headings:contains("Popular")').parent().find('[data-type="item"]').each(function(index) {
      mostpopular.addItem($(this).data('id'), false);
    });

    let itemBlocks = [1, 2, 3, 4, 5].map(x => new Block().setType({ i18n: 'item-sets-block-completed-build-numbered', arguments: [x] }));
    x.forEach(list => list.forEach((id, i) => itemBlocks[i].addItem(id, false)));

    itemset.addBlocks(starter, mostpopular, ...itemBlocks, boots);
    itemset.addBlock(new Block().setType({ i18n: 'item-sets-block-consumables-skill-order', arguments: [skillorder] }).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return [itemset];
  }

  getCondensedName() {
    return 'ALY';
  }
}

module.exports = LoLAlyticsProvider;
