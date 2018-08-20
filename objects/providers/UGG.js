const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

class UGGProvider extends Provider {
  constructor() {
    super('ugg', 'U.GG');
    this.base = 'https://u.gg/';
  }

  async getData(champion, preferredPosition, gameMode) {
    if (!this._perks) {
      const d = JSON.parse(await rp(Mana.base + 'lol-perks/v1/perks'));
      this._perks = {};

      for (let rune of d) {
        let iconPath = rune.iconPath.slice(44, -4);

        /* Skip traits */
        if (iconPath === 'RunesIcon') return;
        this._perks[iconPath] = rune.id;
      }

      log.dir(3, this._perks);
    }

    let positions = ['jungle', 'middle', 'top', 'adc', 'support'];
    for (let i = 0; i < positions.length; i++) {
      try {
        log.log(`[U.GG] Gathering data for ${positions[i]} position`);

        const d = await rp(`${this.base}lol/champions/${champion.key.toLowerCase()}/build/?role=${positions[i]}`);
        positions[i] = this._scrape(d, champion, positions[i], gameMode);
      }
      catch(err) {
        log.error(1, err);
      }
    }

    return log.dir(3, positions);
  }

  async getSummonerSpells(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode);
  }

  async getItemSets(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode);
  }

  async getRunes(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode);
  }

  _scrape(html, champion, position, gameMode) {
    const $ = cheerio.load(html);
    log.dir(3, $);

    const summonerspells = this.scrapeSummonerSpells($);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, position.charAt(0).toUpperCase() + position.slice(1), skillorder);

    const runes = this.scrapeRunes($, champion, position.toUpperCase());

    log.log(3, summonerspells);
    log.log(3, skillorder);
    log.log(3, itemsets);
    log.log(3, runes);

    return { runes, summonerspells, itemsets, position };
  }

  /**
   * Scrapes item sets from a U.GG page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapeRunes($, champion, position) {
    let pages = [{ name: `UGG ${champion.name} ${position}`, selectedPerkIds: [] }];

    $('.perk-active > img').each(function(index) {
      const src = $(this).attr('src');
      let key = src.slice(70, -4);
  	  key = key.slice(key.indexOf('/') + 1, key.lastIndexOf('/'));

      if (this._perks[key]) pages[0].selectedPerkIds.push(this._perks[key]);
      else log.log(2, `[U.GG] Skipping key ${key} because it's missing`);
    });

    $('.path-main > img').each(function(index) {
      pages[0][index === 0 ? 'primaryStyleId' : 'subStyleId'] = parseInt($(this).attr('src').slice(-8, -4));
    });

    return pages;
  }

  /**
   * Scrapes summoner spells from a Champion.gg page
   * @param {cheerio} $ - The cheerio object
   * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
   */
  scrapeSummonerSpells($, gameMode) {
    let summonerspells = [];

    $("img[alt='SummonerSpell']").each(function(index) {
      const summoner = Mana.summonerspells[log.log(3, $(this).attr('src').slice($(this).attr('src').lastIndexOf('/'), -4))];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a Champion.gg page
   * @param {cheerio} $ - The cheerio object
   * @param {function} convertSkillOrderToLanguage - Default function
   */
  scrapeSkillOrder($, convertSkillOrderToLanguage = this.convertSkillOrderToLanguage) {
    let skillorder = '';
    const skills = $('.skill-path > .image-wrapper > .label').each(function(index) {
      skillorder += (skillorder !== '' ? ' => ' : '') + i18n.__('key-' + $(this).text());
    });

    return skillorder;
  }

  /**
   * Scrapes item sets from a Champion.gg page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   * @param {object} skillorder
   */
  scrapeItemSets($, champion, position, skillorder) {
    const items = $("img[src^='https://static.u.gg/lol/riot_static/lol/" + $('.champion-image').attr('src').slice(40, 46) + "/img/item/']");
    let itemset = new ItemSet(champion.key, position).setTitle(`UGG ${champion.name} - ${position}`);

    let starter = new Block().setName(i18n.__('itemsets-block-starter', skillorder));
    let coreBuild = new Block().setName(i18n.__('itemsets-block-core-build', $('.grid-block.final-items').find('.winrate').text().slice(0, 6), $('.grid-block.final-items').find('.matches').text().split(' ')[0]));
    let options = new Block().setName(i18n.__('itemsets-block-options'));

    /* Starter Block */
    items.slice(0, 2).each(function(index) {
      starter.addItem($(this).attr('src').slice(-8, -4));
    });


    /* Core Build Block */
    items.slice(2, 5).each(function(index) {
      coreBuild.addItem($(this).attr('src').slice(-8, -4));
    });

    /* Options Block */
    items.slice(5).each(function(index) {
      options.addItem($(this).attr('src').slice(-8, -4));
    });

    itemset.addBlock(starter, new Block().setName(`Trinkets`).addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363));
    itemset.addBlock(coreBuild).addBlock(options);
    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables')).addItem(2003).addItem(2138).addItem(2139).addItem(2140));

    return [itemset];
  }
}

module.exports = UGGProvider;
