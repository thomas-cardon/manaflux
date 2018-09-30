const rp = require('request-promise-native');
const Provider = require('./Provider');

class ManafluxProvider extends Provider {
  constructor() {
    super('manaflux', 'Manaflux');
    this.base = 'https://manaflux-server.herokuapp.com/';
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(2, '[Manaflux] Fetching data from the cache server');
    return console.dir(3, JSON.parse(await rp(`${this.base}v1/data/${champion.id}`)));
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

  async upload(data) {
    for (const pos in data) {
      /* Let's not upload incomplete data */
      if (data[pos].summonerspells.length === 0 || data[pos].itemsets.length === 0 || data[pos].perks.length === 0) return;
      data[pos].itemsets = data[pos].itemsets.map(x => x._data);
    }

    await rp({
      method: 'POST',
      uri: `${this.base}v1/data`,
      body: data,
      json: true
    });
  }
}

module.exports = ManafluxProvider;
