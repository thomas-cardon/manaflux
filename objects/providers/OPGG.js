const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');

class ChampionGGProvider {
  constructor() {
    this.base = 'https://www.op.gg';
    this.name = 'OP.GG';
  }

  convertPosition(pos) {
    switch(pos.toLowerCase()) {
      case 'middle':
        return 'mid';
      case 'adc':
        return 'bot';
      default:
        return pos.toLowerCase();
    }
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}/champion/${champion.key}/statistics/${this.convertPosition(preferredPosition)}`);
    const data = this._scrape(res, champion, gameMode, this.convertPosition(preferredPosition));

    let positions = {};
    positions[data.position] = data;

    console.dir(positions);

    for (const position of data.availablePositions) {
      console.dir(position);
      console.log(`[OP.GG] Gathering data for ${position.name} position`);

      const d = await rp(position.link);
      positions[position.name] = this._scrape(d, champion, position.name, gameMode);
    }

    return positions;
  }

  async getSummonerSpells(champion, position, gameMode) {
    const { summonerspells } = await this.getData(champion, position, gameMode);
    return summonerspells;
  }

  async getItemSets(champion, position, gameMode) {
    const { itemsets } = await this.getData(champion, position, gameMode);
    return itemsets;
  }

  async getRunes(champion, position, gameMode) {
    const { runes } = await this.getData(champion, position, gameMode);
    return runes;
  }

  _scrape(html, champion, position, gameMode) {
    let $ = cheerio.load(html);
    const version = $('.champion-index__version').text().trim().slice(-4);

    if (version != Mana.gameVersion) UI.error(Error('OP.GG: ' + i18n.__('providers-error-outdated')))

    let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];

    let availablePositions = [];

    $('[data-position] > a').each(function(index) {
      availablePositions.push({ name: $(this).attr('href'), link: 'https://op.gg' + $(this).attr('href') });
    });

    /*
    * Runes
    */

    $('.perk-page').find('img.perk-page__image.tip').slice(0, 4).each(function(index) {
      pages[Math.trunc(index / 2)][index % 2 === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt($(this).attr('src').slice(-8, -4));
    });

    $('.perk-page__item--active').find('img').slice(0, 12).each(function(index) {
      pages[Math.trunc(index / 6)].selectedPerkIds.push(parseInt($(this).attr('src').slice(-8, -4));
    });

    /*
    * Summoner Spells
    */

    let summonerspells = [];

    $("img[src^='//opgg-static.akamaized.net/images/lol/spell/Summoner']").slice(0, 2).each(function(index) {
      const summoner = Mana.summonerspells[$(this).attr('src').slice(45, -19)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    /*
    * Skills
    */

    let skillorder = '';
    const skills = $('.champion-stats__list:eq(2) > li:not(.champion-stats__list__arrow) > img').each(function(index) {
      skillorder += (skillorder !== '' ? ' => ') + $(this).siblings().text();
    });

    /*
    * ItemSets
    */
    const itemrows = $('.champion-overview__table:eq(1)').find('.champion-overview__row');

    let itemset = new ItemSet(champion.key, position).setTitle(`OPG ${champion.name} - ${position}`);
    let boots = new Block().setName(`${i18n.__('itemsets-block-boots')}`);

    // Starter
    itemrows.slice(0, 2).each(function(index) {
      let starter = new Block().setName(`${i18n.__('itemsets-block-starter-numbered').replace("{n}", index + 1)}${skillorder}`);
      let pots = 0;

      $(this).find('img').each(function(index) {
        if (id === '2003') return pots++; // Avoid having the same potion multiple times
        starter.addItem($(this).attr('src').slice(44, 48));
      });

      if (pots > 0) starter.addItem(2003, pots);

      itemset.addBlock(starter);
    });
    itemset.addBlock(new Block().setName(`Trinkets`).addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363));

    // Recommanded Items
    let recommanded = [];
    itemrows.slice(2, -3).find('li:not(.champion-stats__list__arrow) > img').each(function(index) {
      const id = $(this).attr('src').slice(44, 48);
      if (!recommanded.includes(id) recommanded.push(id);
    });

    // Boots
    itemrows.slice(-3).find('img').each(function(index) {
      boots.addItem($(this).attr('src').slice(44, 48));
    });

    itemset.addBlock(boots);
    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-recommanded')).setItems(recommanded));
    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables')).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return { runes: pages, summonerspells, itemsets: [itemset], availablePositions, position: position.toUpperCase() };
  }
}

module.exports = ChampionGGProvider;
