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

  async getChampionData(champion, preferredPosition, gameMode, cache = true) {
    /* 1/4 - Storage Checking */
    if (Mana.getStore().has(`data.${champion.key}`) && cache) {
      let d = Mana.getStore().get(`data.${champion.key}`);

      for (let [position, data] of Object.entries(d))
        for (let i = 0; i < data.itemsets.length; i++)
          data.itemsets[i] = require('./ItemSetHandler').parse(champion.key, data.itemsets[i]._data, position);

      return d;
    }

    /* 2/4 - Downloading */

    let positions = {};

    const providers = Mana.getStore().get('providers-order', Object.keys(this.providers));
    providers.unshift(...providers.splice(providers.indexOf('manaflux'), 1), ...providers.splice(providers.indexOf('lolflavor'), 1));

    for (let provider of providers) {
      provider = this.providers[providers[i]];
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

        for (let [position, data] of Object.entries(positions))
          positions[position] = Object.assign(positions[position], data);

        break;
      }
      catch(err) {
        console.error(err);
        return;
      }
    }

    console.dir(3, positions);

    /* 3/4 - Saving to offline cache */
    /* 4/4 - Uploading to online cache */
    if (cache) {
      Mana.getStore().set(`data.${champion.key}`, positions);
      this.providers.manaflux.upload(positions);
    }

    return positions;
  }
}

module.exports = ProviderHandler;
