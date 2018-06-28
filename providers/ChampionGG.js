const rp = require('request-promise-native'), cheerio = require('cheerio');
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

  async getRunes(champion, position) {
    const res = await rp(this.base + 'champion/' + champion.key);
    return await this._scrape(res, champion.key, position ? position.slice(0, 1) + position.slice(1).toLowerCase() : null);
  }

  _scrape(html, champion, position) {
    return new Promise(resolve => {
      let $ = cheerio.load(html);
      let pages = [{ selectedPerkIds: [] }, { selectedPerkIds: [] }];

      let slots = $("div[class^=Slot__LeftSide]");
      let role = $(`li[class^='selected-role'] a[href^='/champion/${champion}']`).first().text().trim();

      $("img[src^='https://s3.amazonaws.com/solomid-cdn/league/runes_reforged/']", slots).each(function(index) {
        let page = Math.trunc(index / 8), rune = $(this).attr("src").substring(59);
        if (index % 8 === 0) {
          pages[page].name = 'MF ' + $('.champion-profile h1').text() + " " + role + (page === 0 ? 'HW%' : 'MF');
          pages[page].primaryStyleId = styles[rune.substring(5, 6)];
        }
        else if(index % 8 === 5)
          pages[page].subStyleId = styles[rune.substring(5, 6)];
        else pages[page].selectedPerkIds.push(parseInt(rune.substring(0, 4)));
      });

      resolve(pages);
    });
  }
}

module.exports = ChampionGGProvider;
