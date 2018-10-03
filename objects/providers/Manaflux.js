const rp = require('request-promise-native');
const Provider = require('./Provider');

class ManafluxProvider extends Provider {
  constructor() {
    super('manaflux', 'Manaflux');
    this.base = 'https://manaflux-server.herokuapp.com/';
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(2, '[Manaflux] Fetching data from the cache server');

    let data = JSON.parse(await rp(`${this.base}v1/data/${champion.id}`));

    if (data[0]) return data[0];
    else if (data.message) throw Error(`Manaflux cache server error: ${data.statusCode} - ${data.message} (${data.error})`);
    else throw Error('Unexpected error');
  }

  async getSummonerSpells(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode).summonerspells;
  }

  async getItemSets(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode).itemsets;
  }

  async getPerks(champion, position, gameMode) {
    return await this.getData(champion, position, gameMode).perks;
  }

  async upload(d) {
    for (const pos in d) {
      if (typeof d[pos] !== 'object') return;

      /* Let's not upload incomplete data */
      if (d[pos].summonerspells.length === 0 || d[pos].itemsets.length === 0 || d[pos].perks.length === 0) return;
      d[pos].itemsets = d[pos].itemsets.map(x => x.build());
    }

    await rp({
      method: 'POST',
      uri: `${this.base}v1/data`,
      body: console.dir(3, JSON.stringify(data)),
      json: true
    });
  }
}

module.exports = ManafluxProvider;
