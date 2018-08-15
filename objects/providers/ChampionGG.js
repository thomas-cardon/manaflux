const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');

let styles = {
  p: 8000,
  d: 8100,
  s: 8200,
  r: 8400,
  i: 8300
};

/*
* There's been a glitch on Champion.GG where it shows two times the same rune...
*/
let fixes = {
  8000: 9103,
  8100: 8135,
  8200: 8299,
  8400: 8451,
  8300: 8347
};

class ChampionGGProvider {
  constructor() {
    this.base = 'http://champion.gg/';
    this.name = 'ChampionGG';
  }

  async getData(champion, preferredPosition, gameMode) {
    const res = await rp(`${this.base}champion/${champion.key}${preferredPosition ? '/' + preferredPosition.toLowerCase() : ''}`);
    const data = this._scrape(res, champion.key, gameMode);

    let positions = {};
    positions[data.position] = data;

    console.dir(positions);

    for (const position of data.availablePositions) {
      console.dir(position);
      console.log(`[Champion.GG] Gathering data for ${position.name} position`);

      const d = await rp(position.link);
      positions[position.name] = this._scrape(d, champion.key, gameMode);
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

  convertSkillOrderToLanguage(letter) {
    if (i18n._locale === 'fr') {
      switch(letter) {
        case 'Q':
        return 'A';
        case 'W':
        return 'Z';
        default:
        return letter;
      }
    }

    return letter;
  }

  _scrape(html, champion, gameMode) {
    const convertSkillOrderToLanguage = this.convertSkillOrderToLanguage;
    let $ = cheerio.load(html);

    let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];
    let slots = $("div[class^=Slot__LeftSide]");

    /*
    * Ensuring it's the good name for jQuery, in case of exceptions like FiddleSticks being named Fiddlesticks on the website...
    */
    champion = $('.champion-profile > h1').text();

    const position = $(`li[class^='selected-role'] > a[href^='/champion/']`).first().text().trim();
    let availablePositions = [];

    $(`li[class!='selected-role'] > a[href^='/champion/']`).each(function(index) {
      availablePositions.push({ name: $(this).first().text().trim().toUpperCase(), link: 'https://champion.gg' + $(this).attr('href') });
    });

    /*
    * Runes
    */

    $("img[src^='https://s3.amazonaws.com/solomid-cdn/league/runes_reforged/']", slots).each(function(index) {
      let page = Math.trunc(index / 8), rune = $(this).attr("src").substring(59);
      if (index % 8 === 0) {
        pages[page].name = `CGG ${$('.champion-profile h1').text()} ${position} ${page === 0 ? 'HW%' : 'MF'}`;
        pages[page].primaryStyleId = styles[rune.substring(5, 6)];
      }
      else if (index % 8 === 5)
      pages[page].subStyleId = styles[rune.substring(5, 6)];
      else pages[page].selectedPerkIds.push(parseInt(rune.substring(0, 4)));
    });

    /*
    * Summoner Spells
    */

    let summonerspells = [];

    $('.summoner-wrapper > a > img').each(function(index) {
      const summoner = Mana.summonerspells[$(this).attr('src').slice(51, -4)];

      if (!summoner) return;
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    /*
    * Skills
    */

    let skills = $('.skill').slice(1, -1);
    skills.splice(3, 2);

    let sums = [{ key: convertSkillOrderToLanguage('Q'), sum: 0 }, { key: convertSkillOrderToLanguage('W'), sum: 0 }, { key: 'E', sum: 0 }];
    let skillorders = {};

    skills.each(function(index) {
      $(this).find('div').children().each(function(i) {
        if (!$(this).hasClass('selected')) return;
        sums[index % 3].sum += (18 - i);
      });

      console.log('Skill ' + sums[index % 3].key + ': ' + sums[index % 3].sum);

      if (index % 3 === 0) {
        sums = sums.sort((a, b) => b.sum - a.sum);
        skillorders[index === 0 ? 'mf' : 'hw%'] = `${sums[0].key} => ${sums[1].key} => ${sums[2].key}`;
        sums[0].sum = sums[1].sum = sums[2].sum = 0;
      }
    });

    console.dir(skillorders);

    /*
    * ItemSets
    */

    let itemset = new ItemSet(champion, position).setTitle(`CGG ${champion} - ${position}`);

    $('.build-wrapper').each(function(index) {
    	const type = $(this).parent().find('h2').eq(index % 2).text();
      let block = new Block().setName(type + ` (${$(this).find('div > strong').text().trim().slice(0, 6)} WR)`);

    	$(this).children('a').each(function(index) {
        block.addItem($(this).children().first().data('id'));
      });

      itemset.addBlock(block);
    });

    itemset.addBlock(new Block().setName(i18n.__('itemsets-block-consumables') + `: ${skillorders.mf}`).addItem(2003).addItem(2138).addItem(2139).addItem(2140));
    itemset.addBlock(new Block().setName('Trinkets').addItem(2055).addItem(3340).addItem(3341).addItem(3348).addItem(3363));

    /*
    * Workaround: fix duplicates
    */

    let i = pages.length;
    while (i--) {
      const page = pages[i];

      if (page.selectedPerkIds[0] === undefined && page.selectedPerkIds[1] === undefined) {
        pages.splice(i, 1);
        UI.error(`[Champion.GG] ${i18n.__('providers-error-data')}`);
      }
      else if (page.selectedPerkIds[0] === page.selectedPerkIds[1]) {
        page.selectedPerkIds.splice(1, 1);
        page.selectedPerkIds.splice(3, 0, fixes[page.primaryStyleId]);
        UI.error(`[Champion.GG] ${i18n.__('providers-cgg-runes-fix')}`);
      }
    }

    return { runes: pages, summonerspells, itemsets: [itemset], availablePositions, position: position.toUpperCase() };
  }
}

module.exports = ChampionGGProvider;
