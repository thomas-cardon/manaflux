const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = M.Models;
const Provider = require('./Provider');

class OPGG_URFProvider extends Provider {
  constructor() {
    super('opgg_urf', 'OP.GG (URF!)');
    this.base = 'https://www.op.gg/urf';
  }

  async request(gameMode, champion, position) {
    if (gameMode !== 'URF') throw Error('[Providers] OP.GG URF >> Can\'t be called on a different gamemode than URF!');

    const res = await rp({ uri: `${this.base}/${champion.key}/statistics`, transform: body => cheerio.load(body) });
    const d = this._scrape(res, champion, gameMode);

    return { roles: { [gameMode]: d } };
  }

  _scrape($, champion, gameMode) {
    if ($('.champion-stats-header-version').text().trim().slice(-4) != Mana.gameClient.version) UI.error('providers-error-outdated', this.name);
    if ($('.WorkingTitle').text().trim().startsWith('Maintenance')) UI.error('providers-error-offline', this.name);

    const summonerspells = this.scrapeSummonerSpells($, gameMode);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, gameMode, skillorder);

    const perks = this.scrapePerks($, champion);

    return { perks, summonerspells, itemsets };
  }

  /**
   * Scrapes item sets from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.gameClient.champions
   */
  scrapePerks($, champion) {
    let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];

    $('.perk-page').find('img.perk-page__image.tip').slice(0, 4).each(function(index) {
      const page = Math.trunc(index / 2);
      pages[page][index % 2 === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt($(this).attr('src').slice(-8, -4));
    });

    $('.perk-page__item--active').find('img').slice(0, 12).each(function(index) {
      pages[Math.trunc(index / 6)].selectedPerkIds.push(parseInt($(this).attr('src').slice(-8, -4)));
    });

    $('.fragment__summary').find('img').slice(0, 6).each(function(index) {
      pages[index > 2 ? 1 : 0].selectedPerkIds.push(parseInt($(this).attr('src').slice(-8, -4)));
    })

    return pages;
  }

  /**
   * Scrapes summoner spells from a OP.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells($, gameMode) {
    let summonerSpells = [];

    $("img[src^='//opgg-static.akamaized.net/images/lol/spell/Summoner']").slice(0, 2).each(function(index) {
      const summoner = Mana.gameClient.summonerSpells[$(this).attr('src').slice(45, -29)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerSpells.push(summoner.id);
    });

    return summonerSpells;
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
   * @param {object} champion - A champion object, from Mana.gameClient.champions
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, gameMode, skillorder) {
    const itemrows = $('.champion-overview__table').eq(1).find('.champion-overview__row');

    let itemset = new ItemSet(champion.key, gameMode, this.id);
    let boots = new Block().setType({ i18n: 'item-sets-block-boots' });

    /* Block Starter */
    itemrows.slice(0, 2).each(function(index) {
      let starter = new Block().setType({ i18n: 'item-sets-block-starter-skill-order-numbered', arguments: [index + 1, skillorder] });
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

module.exports = OPGG_URFProvider;
