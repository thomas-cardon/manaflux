const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');
const Provider = require('./Provider');

/*
* There's been a glitch on Champion.GG where it shows two times the same perk...
*/
let fixes = {
  8000: 9103,
  8100: 8135,
  8200: 8299,
  8400: 8451,
  8300: 8347
};

class ChampionGGProvider extends Provider {
  constructor() {
    super('championgg', 'ChampionGG');
    this.base = 'https://champion.gg/';
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}champion/${champion.key}`);
    const d = this._scrape(res, champion, gameMode, true);

    let data = { roles: { [d.position]: d } };

    for (const position of d.availablePositions) {
      console.log(2, `[Champion.GG] Gathering data (${position.name})`);

      data.roles[position.name] = this._scrape(await rp(position.link), champion, gameMode);
      delete data.roles[position.name].position;
    }

    delete data.roles[d.position].availablePositions;
    delete data.roles[d.position].position;

    return data;
  }

  _scrape(html, champion, gameMode, firstScrape = false) {
    const $ = cheerio.load(html);

    const position = $(`li[class^='selected-role'] > a[href^='/champion/']`).first().text().trim();
    const availablePositions = [];

    if (firstScrape) {
      $(`li[class!='selected-role'] > a[href^='/champion/']`).each(function(index) {
        availablePositions.push({ name: $(this).first().text().trim().toUpperCase(), link: 'https://champion.gg' + $(this).attr('href') });
      });
    }

    const summonerspells = this.scrapeSummonerSpells($, gameMode);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, position, skillorder);

    let perks = this.scrapePerks($, champion, position);

    /* Validation - TODO: replace by a global validator in Manaflux client/server */
    let i = perks.length;
    while (i--) {
      const page = perks[i];

      if (page.selectedPerkIds[0] === undefined && page.selectedPerkIds[1] === undefined) {
        perks.splice(i, 1);
        UI.error(`[Champion.GG] ${i18n.__('providers-error-data')}`);
      }
      else if (page.selectedPerkIds[0] === page.selectedPerkIds[1]) {
        page.selectedPerkIds.splice(1, 1);
        page.selectedPerkIds.splice(3, 0, fixes[page.primaryStyleId]);
        UI.error(`[Champion.GG] ${i18n.__('providers-cgg-perks-fix')}`);
      }
    }

    return { perks, summonerspells, itemsets, availablePositions, position: position.toUpperCase() };
  }

  /**
   * Scrapes item sets from a Champion.gg page
   * @param {cheerio} $ - The cheerio object
   * @param {object} champion - A champion object, from Mana.champions
   * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
   */
  scrapePerks($, champion, position) {
    let pages = [{ name: `CGG1 ${champion.name} ${position} (HW%)`, selectedPerkIds: [] }, { name: `CGG2 ${champion.name} ${position} (MF)`, selectedPerkIds: [] }];

    $("img[src*='perk-images']", $("div[class^=Slot__LeftSide]")).each(function(index) {
      let page = Math.trunc(index / 8), perk = $(this).attr("src").slice(38);
      if (index % 8 === 0) pages[page].primaryStyleId = Mana.gameClient.perks.find(x => x.icon === perk).id;
      else if (index % 8 === 5) pages[page].subStyleId = Mana.gameClient.perks.find(x => x.icon === perk).id;
      else pages[page].selectedPerkIds.push(Mana.gameClient.findPerkByImage(perk).id);
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

    $('.summoner-wrapper > a > img').each(function(index) {
      const summoner = Mana.summonerspells[$(this).attr('src').slice(51, -4)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    return summonerspells;
  }

  /**
   * Scrapes skill order from a Champion.gg page
   * @param {cheerio} $ - The cheerio object
   */
  scrapeSkillOrder($) {
    let skills = $('.skill').slice(1, -1);
    skills.splice(3, 2);

    let sums = [{ key: i18n.__('key-Q'), sum: 0 }, { key: i18n.__('key-W'), sum: 0 }, { key: i18n.__('key-E'), sum: 0 }];
    let skillorder = {};

    skills.each(function(index) {
      $(this).find('div').children().each(function(i) {
        if (!$(this).hasClass('selected')) return;
        sums[index % 3].sum += (18 - i);
      });

      if (index % 3 === 0) {
        sums = sums.sort((a, b) => b.sum - a.sum);
        skillorder[index === 0 ? 'mf' : 'hw%'] = `${sums[0].key} => ${sums[1].key} => ${sums[2].key}`;
        sums[0].sum = sums[1].sum = sums[2].sum = 0;
      }
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
    let itemset = new ItemSet(champion.key, position.toUpperCase(), this.id).setTitle(`CGG ${champion.name} - ${position}`);

    $('.build-wrapper').each(function(index) {
      const type = $(this).parent().find('h2').eq(index % 2).text();
      let block = new Block();

      $(this).children('a').each(function(index) {
        block.addItem($(this).children().first().data('id'), 1);
      });

      if (index === 0)
          itemset._data.blocks[3] = block.setName(i18n.__('providers-cgg-blocks-completed-build-mf') + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`);
      else if (index === 1)
          itemset._data.blocks[4] = block.setName(i18n.__('providers-cgg-blocks-completed-build-hw%') + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`);
      else if (index === 2)
        itemset._data.blocks[0] = block.setName(i18n.__('providers-cgg-blocks-starters-mf') + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`);
      else if (index === 3)
        itemset._data.blocks[1] = block.setName(i18n.__('providers-cgg-blocks-starters-hw%') + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`);
      else itemset.addBlock(block.setName(type + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`));
    });

    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables') + `: ${skillorder.mf}`).addItem(2003).addItem(2138).addItem(2139).addItem(2140));
    itemset._data.blocks[2] = new Block().setName('Trinkets').addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363);

    return [itemset];
  }
}

module.exports = ChampionGGProvider;
