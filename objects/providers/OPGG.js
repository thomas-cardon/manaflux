const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class OPGGProvider extends Provider {
  constructor() {
    super('opgg', 'OP.GG');
    this.base = 'https://www.op.gg';
  }

  getOPGGPosition(pos) {
    switch(pos.toLowerCase()) {
      case 'middle':
        return 'mid';
      case 'adc':
        return 'bot';
      default:
        return pos.toLowerCase();
    }
  }

  convertOPGGPosition(pos) {
    switch(pos.toLowerCase()) {
      case 'mid':
        return 'middle';
      case 'bot':
        return 'adc';
      default:
        return pos.toLowerCase();
    }
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}/champion/${champion.key}/statistics${preferredPosition ? '/' + this.convertOPGGPosition(preferredPosition) : ''}`);
    const d = this._scrape(res, champion, gameMode, true);

    let data = { roles: { [d.position]: d } };

    for (const position of d.availablePositions) {
      console.log(2, `[ProviderHandler] [OP.GG] Gathering data (${position.name})`);

      data.roles[position.name] = this._scrape(await rp(position.link), champion, gameMode);
      delete data.roles[position.name].position;
    }

    delete data.roles[d.position].availablePositions;
    delete data.roles[d.position].position;

    return data;
  }

  _scrape(html, champion, gameMode, firstScrape) {
    let $ = cheerio.load(html);

    const convertOPGGPosition = this.convertOPGGPosition;

    if ($('.champion-stats-header-version').text().trim().slice(-4) != Mana.gameClient.branch) UI.error('providers-error-outdated');

    let position = this.convertOPGGPosition($('li.champion-stats-header__position.champion-stats-header__position--active').data('position')).toUpperCase();
    const availablePositions = [];

    if (firstScrape) {
      $('[data-position] > a').each(function(index) {
        availablePositions.push({ name: convertOPGGPosition($(this).parent().data('position')).toUpperCase(), link: 'https://op.gg' + $(this).attr('href') });
      });
    }

    const summonerspells = this.scrapeSummonerSpells($);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, position.charAt(0) + position.slice(1).toLowerCase(), skillorder);

    const perks = this.scrapePerks($, champion, position);

    return { perks, summonerspells, itemsets, availablePositions, position: position.toUpperCase() };
  }

  /**
   * Scrapes item sets from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    let pages = [{ name: `OPG1 ${champion.name} ${position}`, selectedPerkIds: [] }, { name: `OPG2 ${champion.name} ${position}`, selectedPerkIds: [] }];

    $('.perk-page').find('img.perk-page__image.tip').slice(0, 4).each(function(index) {
      const page = Math.trunc(index / 2);
      pages[page][index % 2 === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt($(this).attr('src').slice(-8, -4));
    });

    $('.perk-page__item--active').find('img').slice(0, 12).each(function(index) {
      pages[Math.trunc(index / 6)].selectedPerkIds.push(parseInt($(this).attr('src').slice(-8, -4)));
    });

    return pages;
  }

  /**
   * Scrapes summoner spells from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells($, gameMode) {
    let summonerspells = [];

    $("img[src^='//opgg-static.akamaized.net/images/lol/spell/Summoner']").slice(0, 2).each(function(index) {
      const summoner = Mana.summonerspells[$(this).attr('src').slice(45, -19)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    let skillorder = '';
    const skills = $('.champion-stats__list').eq(2).find('li:not(.champion-stats__list__arrow) > img').each(function(index) {
      skillorder += (skillorder !== '' ? ' => ' : '') + i18n.__('key-' + ($(this).siblings().text()));
    });

    return skillorder;
  }

  /**
   * Scrapes item sets from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    const itemrows = $('.champion-overview__table').eq(1).find('.champion-overview__row');

    let itemset = new ItemSet(champion.key, position, this.id).setTitle(`OPG ${champion.name} - ${position}`);
    let boots = new Block().setType({ i18n: 'item-sets-block-boots' });

    /* Block Starter */
    itemrows.slice(0, 2).each(function(index) {
      let starter = new Block().setType({ i18n: 'item-sets-block-starter-numbered', arguments: [index + 1, skillorder] });
      let pots = 0;

      let items = {};
      $(this).find('img').each(function(index) {
        const id = $(this).attr('src').slice(44, 48);
        items[id] = items[id] + 1 || 1;
      });

      for (var [id, count] of Object.entries(items))
        starter.addItem(id, count);

      itemset.addBlock(starter);
    });

    itemset.addBlock(new Block().setType({ i18n: 'item-sets-block-trinkets' }).addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363));

    /* Block Recommanded */
    let recommanded = new Block().setType({ i18n: 'item-sets-block-recommanded' });
    itemrows.slice(2, -3).find('li:not(.champion-stats__list__arrow) > img').each(function(index) {
      recommanded.addItem($(this).attr('src').slice(44, 48), false);
    });

    itemset.addBlock(recommanded);

    /* Block Boots */
    itemrows.slice(-3).find('img').each(function(index) {
      boots.addItem($(this).attr('src').slice(44, 48));
    });

    itemset.addBlock(boots);
    itemset.addBlock(new Block().setType({ i18n: 'item-sets-block-consumables' }).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return [itemset];
  }
}

module.exports = OPGGProvider;
