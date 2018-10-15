const rp = require('request-promise-native');
const Provider = require('./Provider');

class FluxProvider extends Provider {
  constructor() {
    super('flux', 'Flu.x');
    this.base = 'https://manaflux-server.herokuapp.com/';

    if (Mana.devMode) rp('http://localhost:8920/').then(() => this.base = 'http://localhost:8920/').catch(() => console.log('[Flu.x] Local server is unavailable.'));
  }

  async getData(champion, preferredPosition, gameMode) {
    console.log(2, '[Manaflux] Fetching data from the cache server');

    let data = JSON.parse(await rp(`${this.base}v1/data/${champion.id}`));

    console.dir(data);

    if (data.message) {
      if (data.statusCode === 404) throw Error(`Flu.x: Data not found`);
      else throw Error(`Flu.x error: ${data.statusCode} - ${data.message} (${data.error})`);
    }
    else if (data && data.roles) {
      Object.keys(data.roles).filter(x => !x.startsWith('_')).forEach(r => {
        data.roles[r].itemsets = data.roles[r].itemsets.map(x => require('../handlers/ItemSetHandler').parse(champion.key, x, r, this._id));
      });
      return data;
    }
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
   * Uploads data to Flu.x
   * @param {object} data - The data that contains perks, summonerspells etc
   */
  async upload(data) {
    console.log(2, '[ProviderHandler] Uploading to Flu.x');
    if (Object.values(data.roles).some(x => Array.isArray(x) && x.length === 0)) return console.log(2, 'Upload cancelled: missing data');

    Object.values(data.roles).forEach(r => {
      r.itemsets = r.itemsets.map(x => x.build(false));
    });

    console.dir(data);

    await rp({
      method: 'POST',
      uri: `${this.base}v1/data`,
      body: data,
      json: true
    });
  }
}

module.exports = FluxProvider;
