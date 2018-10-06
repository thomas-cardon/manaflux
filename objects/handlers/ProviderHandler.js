const rp = require('request-promise-native');
class ProviderHandler {
  constructor() {
    this.providers = {
      championgg: new (require('../providers/ChampionGG'))(),
      opgg: new (require('../providers/OPGG'))(),
      /*ugg: new (require('../providers/UGG'))(),*/
      leagueofgraphs: new (require('../providers/LeagueofGraphs'))(),
      lolflavor: new (require('../providers/LoLFlavor'))(),
      manaflux: new (require('../providers/Manaflux'))()
    };
  }

  async getChampionData(champion, preferredPosition, gameMode = 'CLASSIC', cache) {
    /* 1/4 - Storage Checking */
    if (Mana.getStore().has(`data.${champion.key}`) && cache) {
      let d = Mana.getStore().get(`data.${champion.key}`);

      for (let [position, data] of Object.entries(d))
        for (let set in data.itemsets)
          data.itemsets[set] = require('./ItemSetHandler').parse(champion.key, data.itemsets[set]._data, position);

      return d;
    }

    /* 2/4 - Downloading */

    let data;

    const providers = Mana.getStore().get('providers-order', Object.keys(this.providers));
    //providers.unshift(...providers.splice(providers.indexOf('manaflux'), 1), ...providers.splice(providers.indexOf('lolflavor'), 1));

    for (let provider of providers) {
      provider = this.providers[provider];
      if (provider.name === 'Manaflux') continue;

      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      if (!data) {
        try {
          const x = await provider.getData(champion, preferredPosition, gameMode);
          data = { roles: {}, role: preferredPosition, championId: champion.id, gameMode, providerId: provider.id, version: Mana.version, gameVersion: Mana.gameClient.branch, region: Mana.gameClient.region, ...x };
        }
          catch(err) {
          console.error(err);
          console.log('Couldn\'t aggregate data. Using next provider!');
          continue;
        }
      }
      else {
        try {
          this._merge(data, await provider.getData(champion, preferredPosition, gameMode));
        }
        catch(err) {
          console.error(err);
          console.log('Couldn\'t aggregate data. Using next provider!');
          continue;
        }
      }

      console.log('Provider data changed.');
      console.dir(data);

      /* If a provider can't get any data on that role/position, let's use another provider */
      if (!data || !data.roles[preferredPosition]) {
        console.log(`Missing data for the asked role. (${preferredPosition})`);
        continue;
      }

      /* Else we need to check the provider provided the required data */
      if (data.roles[preferredPosition].perks.length === 0)
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getPerks(champion, preferredPosition, gameMode) || {} };
      else if (data.roles[preferredPosition].itemsets.length === 0 && Mana.getStore().get('enableItemSets'))
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getItemSets(champion, preferredPosition, gameMode) || {} };
      else if (data.roles[preferredPosition].summonerspells.length === 0 && Mana.getStore().get('enableSummonerSpells'))
          data.roles[preferredPosition] = { ...data.roles[preferredPosition], ...await provider.getSummonerSpells(champion, preferredPosition, gameMode) || {} };

      break;
    }

    /* 3/4 - Saving to offline cache
       4/4 - Uploading to online cache */
    if (!cache) return data;
    this.saveToCache(champion, data);

    /* Prevents the client from sending data the server already has */
    //if (!data._id) this.providers.manaflux.upload(data);

    return data;
  }

  _merge(x, y) {
    for (const [name, role] in Object.entries(y.roles))
      if (!x.roles[name]) x.roles[name] = role;
      else {
        for (const [k, v] in Object.entries(role)) {
          if (!x.roles[name][k]) x.roles[name][k] = v;
          else if (Array.isArray(x.roles[name][k])) x.roles[name][k] = x.roles[name][k].concat(v);
        }
      }
  }
  saveToCache(champion, d) {
    Mana.getStore().set(`data.${champion.key}`, d);
  }
}

module.exports = ProviderHandler;
