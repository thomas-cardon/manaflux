const fs = require('fs'), path = require('path');
const rp = require('request-promise-native');

class FeatureEnabler {
  constructor() {}

  async load() {
    console.log('[FeatureEnabler] Loading..');

    let data = Mana.getStore().get('features') || await this._readFeaturesFile();

    try {
      const rules = JSON.parse(await rp(`http://manaflux-server.herokuapp.com/v1/features?v=${Mana.version}${data.summonerIds ? '&summoners=' + data.summonerIds.join(',') : ''}`));
      console.dir(rules);
      
      data.enabled = data.enabled.concat(rules.enabled).filter(x => !rules.disabled.includes(x));
      Mana.getStore().set('features', data);
    }
    catch(err) {
      console.log('[FeatureEnabler] Couldn\'t find features list');
      console.error(err);
    }

    setInterval(this.load, 1000*60*10);
  }

  onLoggedIn(summoner) {
    Mana.getStore().get('features.summonerIds').push(summoner.getSummonerId());
  }

  isEnabled(q) {
    return Mana.getStore().get('features.enabled').includes(q);
  }

  _readFeaturesFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(__dirname, '../features.json'), 'utf8', function(err, d) {
          if (err) return reject(err);
          else resolve(JSON.parse(d));
      });
    })
  }
}

module.exports = FeatureEnabler;
