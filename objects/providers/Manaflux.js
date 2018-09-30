const rp = require('request-promise-native');
const Provider = require('./Provider');

class ManafluxProvider extends Provider {
  constructor() {
    super('manaflux', 'Manaflux');
    this.base = 'https://manaflux-server.herokuapp.com/';
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(2, '[Manaflux] Fetching data from the cache server');
    return log.dir(3, await rp(`${this.base}v1/data/${champion.id}`));
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
}

module.exports = ManafluxProvider;
