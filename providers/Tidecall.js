const rp = require('request-promise-native'), cheerio = require('cheerio');
let styles = {
  p: 8000,
  d: 8100,
  s: 8200,
  r: 8400,
  i: 8300
};

/*
* WIP Website. Not working for the moment.
*/
class TidecallProvider {
  constructor() {
    this.base = 'http://localhost:3000/api/v1/champions/';
  }

  async getRunes(champion, position) {
    const res = await rp(this.base + champion.id);
    const { name, statistics } = JSON.parse(res), perks = statistics[0].perks;

    return {
      name: 'MF ' + name,
      primaryStyleId: perks.primary,
      subStyleId: perks.sub,
      selectedPerkIds: [perks.perk0.id, perks.perk1.id, perks.perk2.id, perks.perk3.id, perks.perk4.id, perks.perk5.id] };
  }
}

module.exports = TidecallProvider;
