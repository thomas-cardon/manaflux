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

    let positions = {};

    const providers = Mana.getStore().get('providers-order', Object.keys(this.providers));
    //providers.unshift(...providers.splice(providers.indexOf('manaflux'), 1), ...providers.splice(providers.indexOf('lolflavor'), 1));

    for (let provider of providers) {
      provider = this.providers[provider];

      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      try {
        positions = Object.assign({ gameMode, role: preferredPosition, championId: champion.id, providerId: provider.id }, await provider.getData(champion, preferredPosition, gameMode) || {});

        if (!positions[preferredPosition]) positions[preferredPosition] = { perks: [], itemsets: [], summonerspells: [] };

        if (positions[preferredPosition].perks.length === 0)
            positions[preferredPosition] = Object.assign(positions[preferredPosition], await provider.getPerks(champion, preferredPosition, gameMode) || {});
        else if (positions[preferredPosition].itemsets.length === 0 && Mana.getStore().get('enableItemSets'))
            positions[preferredPosition] = Object.assign(positions[preferredPosition], await provider.getItemSets(champion, preferredPosition, gameMode) || {});
        else if (positions[preferredPosition].summonerspells.length === 0 && Mana.getStore().get('enableSummonerSpells'))
            positions[preferredPosition] = Object.assign(positions[preferredPosition], await provider.getSummonerSpells(champion, preferredPosition, gameMode) || {});

        debug.dir(positions);
        break;
      }
      catch(err) {
        console.error(err);
        return;
      }
    }

    /* 3/4 - Saving to offline cache
       4/4 - Uploading to online cache */
    if (cache) {
      Mana.getStore().set(`data.${champion.key}`, positions);

      /* Prevents the client from sending data the server already has */
      if (positions._id) return;
      console.log(2, '[ProviderHandler] Uploading to Manaflux cache server');
      this.providers.manaflux.upload(positions);
    }

    return positions;
  }
}

module.exports = ProviderHandler;
