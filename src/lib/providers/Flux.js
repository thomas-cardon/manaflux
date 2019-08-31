const rp = require('request-promise-native');
const Provider = require('./Provider');

class FluxProvider extends Provider {
  constructor(emitter, devMode = M.devMode) {
    super('flux', 'Flu.x', emitter);
    this.base = 'https://manaflux-server.herokuapp.com/';

    if (devMode) rp('http://localhost:8920/')
    .then(() => this.base = 'http://localhost:8920/')
    .catch(() => console.log('[Flu.x] Local server is unavailable.'));
  }

  async request(gameMode, champion, position) {
    console.log(2, '[Flu.x] Fetching data from the cache server');
    let data = JSON.parse(await rp(`${this.base}data/v1/${champion.id}?itemsets=${Mana.getStore().get('item-sets-enable', false)}&summonerspells=${Mana.getStore().get('summoner-spells', false)}&maxperkpages=${Mana.getStore().get('perks-max', 2)}`));
    data.flux = true;

    if (data.message) {
      if (data.statusCode === 404) throw Error(`Flu.x: Data not found`);
      else throw Error(`Flu.x error: ${data.statusCode} - ${data.message} (${data.error})`);
    }
    else if (data && data.roles) {
      Object.values(data.roles).forEach(x => {
        x.summonerspells = x.summonerspells.map(y => y.spells);
        x.summonerspells = [].concat(...x.summonerspells);
      });

      return data;
    }
    else throw Error('Unexpected error');
  }

  /*
   * Uploads data to Flu.x
   * @param {object} data - The data that contains perks, summonerspells etc
   */
  async upload(data) {
    if (Object.values(data.roles).some(x => Array.isArray(x) && x.length === 0)) return console.log(2, '[Flu.x] Upload cancelled: missing data');
    if (data.flux) return;

    return await rp({
      method: 'POST',
      uri: `${this.base}data/v3/upload`,
      body: data,
      json: true
    });
  }

  async bulkDownloadQuery() {
    const data = JSON.parse(await rp(`${this.base}data/v1/bulkdownload`));
    if (data.message) {
      if (data.statusCode === 404) throw Error(`Flu.x: Data not found`);
      else throw Error(`Flu.x error: ${data.statusCode} - ${data.message} (${data.error})`);
    }

    for (let championId in data)
      data[championId].flux = true;

    return data;
  }
}

module.exports = FluxProvider;
