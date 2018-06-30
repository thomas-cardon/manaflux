const rp = require('request-promise-native'), cheerio = require('cheerio');
const { ItemSet, Block } = require('../ItemSet');

let styles = {
  p: 8000,
  d: 8100,
  s: 8200,
  r: 8400,
  i: 8300
};

class ChampionGGProvider {
  constructor() {
    this.base = 'http://champion.gg/';
    this.load();
  }

  async load() {
  }

  async getData(champion, position, gameMode) {
    const res = await rp(this.base + 'champion/' + champion.key);
    const data = await this._scrape(res, champion.key, position ? position.slice(0, 1) + position.slice(1).toLowerCase() : null, gameMode);

    if (data.runes.every(x => x.selectedPerkIds.length === 0)) throw new TypeError("Impossible de récupérer les runes de " + champion.name + " avec Champion.GG.");
    return data;
  }

  async getRunes(champion, position, gameMode) {
    const res = await rp(this.base + 'champion/' + champion.key);
    const { runes } = await this._scrape(res, champion.key, position ? position.slice(0, 1) + position.slice(1).toLowerCase() : null, gameMode);

    if (runes.every(x => x.selectedPerkIds.length === 0)) throw new TypeError("Impossible de récupérer les runes de " + champion.name + " avec Champion.GG.");
    return runes;
  }


  _scrape(html, champion, position, gameMode) {
    return new Promise(resolve => {
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
          pages[page].name = 'MF ' + $('.champion-profile h1').text() + " " + role + (page === 0 ? ' HW%' : ' MF');
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
        if (true/*summoner.gameModes.includes(gameMode)*/) summonerspells.push(summoner.id);

        if (index >= 1 && summonerspells.length === 2) return false;
      });

      /*
      * ItemSets
      */

      let itemset = new ItemSet(champion).setTitle($('.champion-profile h1').text() + " " + role);
      $('.buildwrapper').each(function(index) {
        const type = $(this).parent().find('h2').text();
        console.log(type);
        
        let block = new Block().setName(type);

        $(this).each(function(index) {
          if ($(this).hasClass('build-text')) return block.setName(block._set.type += `(${$(this).children().first().text().trim().slice(0, 6)} WinRate)`);
          console.log($(this).children().first().data('id'));
          block.addItem($(this).children().first().data('id'));
        });

        itemset.addBlock(block);
      });

      resolve({ runes: pages, summonerspells, itemsets: [itemset] });
    });
  }
}

module.exports = ChampionGGProvider;
