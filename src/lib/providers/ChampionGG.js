const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = M.Models;
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
    this.cachedPositions = {};
  }

  async request(gameMode, champion, position) {
    console.log(2, `${this.name} >> Requesting ${champion.name} - POS/${position} - GM/${gameMode}`);

    try {
      const res = await rp(`${this.base}champion/${champion.key}`);
      const d = this._scrape(res, champion, gameMode, position);

      if (d.availablePositions)
        this.cachedPositions[champion.id] = d.availablePositions;

      delete d.availablePositions;

      return { roles: { [position]: d } };
    }
    catch(err) {
      console.log(`[ProviderHandler] [Champion.GG] Something happened while gathering data (${position.name})`);

      if (err.toString().includes('Data is outdated')) {
        throw UI.error('providers-error-outdated', this.name);
      }
      else console.error(err);
    }
  }

  _scrape(html, champion, gameMode, position, statsHtml) {
    const $ = cheerio.load(html);

    if ($('.matchup-header').eq(0).text().trim() === "We are still gathering data for this stat, please check again later!") throw UI.error('providers-error-outdated', this.name);
    const availablePositions = [];

    const summonerspells = this.scrapeSummonerSpells($, gameMode);

    const skillorder = this.scrapeSkillOrder($);
    const itemsets = this.scrapeItemSets($, champion, position, skillorder);

    let perks = this.scrapePerks($, champion, position);

    let statistics = statsHtml ? this.scrapeStatistics($, statsHtml, champion, position) : {};

    return { perks, summonerspells, itemsets, availablePositions, gameMode, statistics };
  }

  /**
  * Scrapes item sets from a Champion.gg page
  * @param {cheerio} $ - The cheerio object
  */
  scrapePerks($) {
    let pages = [{ suffixName: `(HW%)`, selectedPerkIds: [] }, { suffixName: `(MF)`, selectedPerkIds: [] }];

    $("img[src*='perk-images'], img[src*='rune-shards']", $("div[class^=Slot__LeftSide]")).each(function(index) {
      let page = Math.trunc(index / 11), perk = $(this).attr('src').slice(38);

      if (index % 11 === 0) pages[page].primaryStyleId = Mana.gameClient.findPerkStyleByImage(perk).id;
      else if (index % 11 === 5) pages[page].subStyleId = Mana.gameClient.findPerkStyleByImage(perk).id;
      else if (index % 11 > 7) pages[page].selectedPerkIds.push($(this).attr('src').slice(-8, -4));
      else pages[page].selectedPerkIds.push(Mana.gameClient.findPerkByImage(perk).id);
    });

    console.dir(pages);
    return pages;
  }

  /**
  * Scrapes summoner spells from a Champion.gg page
  * @param {cheerio} $ - The cheerio object
  * @param {string} gameMode - A gamemode, from League Client, such as CLASSIC, ARAM, etc.
  */
  scrapeSummonerSpells($, gameMode) {
    let summonerSpells = [];

    $('.summoner-wrapper > a > img').each(function(index) {
      const summoner = Mana.gameClient.summonerSpells[$(this).attr('src').slice(51, -4)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerSpells.push(summoner.id);

      if (index >= 1 && summonerSpells.length === 2) return false;
    });

    console.dir(summonerSpells);
    return summonerSpells;
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
  * @param {object} champion - A champion object, from Mana.gameClient.champions
  * @param {string} position - Limited to: TOP, JUNGLE, MIDDLE, ADC, SUPPORT
  * @param {object} skillorder
  */
  scrapeItemSets($, champion, position, skillorder) {
    let itemset = new ItemSet(champion.key, position.toUpperCase(), this.id).setTitle(`CGG ${champion.name} - ${position}`);

    $('.build-wrapper').each(function(index) {
      const type = $(this).parent().find('h2').eq(index % 2).text();
      let block = new Block(), wr = $(this).find('div > strong').text().trim().slice(0, 6);

      $(this).children('a').each(function(index) {
        block.addItem($(this).children().first().data('id'), 1);
      });

      if (index === 0)
      itemset._data.blocks[3] = block.setType({ i18n: 'providers-cgg-blocks-completed-build-mf', arguments: [wr] });
      else if (index === 1)
      itemset._data.blocks[4] = block.setType({ i18n: 'providers-cgg-blocks-completed-build-hw%', arguments: [wr] });
      else if (index === 2)
      itemset._data.blocks[0] = block.setType({ i18n: 'providers-cgg-blocks-starters-mf', arguments: [wr] });
      else if (index === 3)
      itemset._data.blocks[1] = block.setType({ i18n: 'providers-cgg-blocks-starters-hw%', arguments: [wr] });
      else itemset.addBlock(block.setType(type + ` | ${$(this).find('div > strong').text().trim().slice(0, 6)} WR`));
    });

    itemset.addBlock(new Block().setType({ i18n: 'item-sets-block-consumables-skill-order', arguments: [skillorder.mf] }).addItem(2003).addItem(2138).addItem(2139).addItem(2140));
    itemset._data.blocks[2] = new Block().setType({ i18n: 'item-sets-block-trinkets' }).addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363);

    return [itemset];
  }

  getCondensedName() {
    return 'CGG';
  }
}

module.exports = ChampionGGProvider;
