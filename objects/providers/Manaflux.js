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
    if (Array.isArray(data)) data = data[0];

    if (data) {
      Object.keys(data.roles).forEach(r => data.roles[r].itemsets.map(x => require('./ItemSetHandler').parse(champion.key, x, r, 'manaflux')));
      return data;
    }
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

  /**
   * Uploads data to Manaflux server
   * @param {object} data - The data that contains perks, summonerspells etc
   */
  async upload(data) {
    console.log(2, '[ProviderHandler] Uploading to Manaflux cache server');
    if (Object.values(data.roles).some(x => x.summonerspells.length === 0 || x.itemsets.length === 0 || x.perks.length === 0)) return console.log(2, 'Upload cancelled: missing data');
    Object.values(data.roles).forEach(r => r.itemsets.map(x => x.build());

    await rp({
      method: 'POST',
      uri: `${this.base}v1/data`,
      body: console.dir(3, data),
      json: true
    });
  }
}

module.exports = ManafluxProvider;
