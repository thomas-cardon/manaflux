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
  }

  async getData(champion, position, gameMode) {
    const res = await rp(`${this.base}champion/${champion.key}${position ? '/' + position.toLowerCase() : ''}`);
    return this._scrape(res, champion.key, gameMode);
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

  _scrape(html, champion, gameMode) {
    let $ = cheerio.load(html);
    let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];

    let slots = $("div[class^=Slot__LeftSide]");
    let role = $(`li[class^='selected-role'] a[href^='/champion/${champion}']`).first().text().trim();

    /*
    * Runes
    */

    $("img[src^='https://s3.amazonaws.com/solomid-cdn/league/runes_reforged/']", slots).each(function(index) {
      let page = Math.trunc(index / 8), rune = $(this).attr("src").substring(59);
      if (index % 8 === 0) {
        pages[page].name = $('.champion-profile h1').text() + " " + role + (page === 0 ? ' HW%' : ' MF');
        pages[page].primaryStyleId = styles[rune.substring(5, 6)];
      }
      else if(index % 8 === 5)
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
      console.dir(summoner);
      if (summoner.gameModes.includes(gameMode)) summonerspells.push(summoner.id);

      if (index >= 1 && summonerspells.length === 2) return false;
    });

    /*
    * ItemSets
    */

    let itemset = new ItemSet(champion).setTitle($('.champion-profile h1').text() + " " + role);
    $('.build-wrapper').each(function(index) {
      const type = $(this).parent().find('h2').eq(index).text();
      let block = new Block().setName(type);

      $(this).each(function(index) {
        console.log($(this));

        if ($(this).hasClass('build-text')) return block.setName(block._set.type += ` (${$(this).children().first().text().trim().slice(0, 6)} WR)`);
        if (!$(this).is('a')) return;

        console.log($(this).children().first());
        block.addItem($(this).children().first().data('id'));
      });

      itemset.addBlock(block);
    });

    /*
    * Workaround: fix duplicates
    */
    for (let page of pages) {
      console.dir(page);
      if (page.selectedPerkIds[0] === page.selectedPerkIds[1]) {
          page.selectedPerkIds.splice(1, 1);
          page.selectedPerkIds.splice(3, 0, fixes[page.primaryStyleId]);
          console.dir(page);
          UI.error(new Error("Tentative de réparation des runes: Duplication des keystones avec Champion.GG"));
      }
    }

    return { runes: pages, summonerspells, itemsets: [itemset] };
  }
}

module.exports = ChampionGGProvider;
