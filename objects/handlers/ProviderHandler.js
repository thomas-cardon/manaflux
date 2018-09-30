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
    /*
    * 1/3 Storage Checking
    */
    if (Mana.getStore().has(`data.${champion.key}`) && cache) {
      let d = Mana.getStore().get(`data.${champion.key}`);

      for (let [position, data] of Object.entries(d))
        for (let i = 0; i < data.itemsets.length; i++)
          data.itemsets[i] = require('./ItemSetHandler').parse(champion.key, data.itemsets[i]._data, position);

      return d;
    }

    /*
     * 2/3 Downloading
    */

    let positions = {};

    let providerOrder = Mana.getStore().get('providers-order', Object.keys(this.providers)).sort((a, b) => b.canAggregateEverything - a.canAggregateEverything);
    console.dir(providerOrder);

    for (let i = 0; i < providerOrder.length; i++) {
      const provider = this.providers[providerOrder[i]];
      console.log(2, `[ProviderHandler] Using ${provider.name}`);

      try {
        let method = 'getData';

        if (positions[preferredPosition]) {
          if (positions[preferredPosition].itemsets.length === 0 && Mana.getStore().get('enableItemSets'))
            method = 'getItemSets';
          else if (positions[preferredPosition].summonerspells.length === 0 && Mana.getStore().get('enableSummonerSpells'))
            method = 'getSummonerSpells';
          else if (positions[preferredPosition].perks.length === 0)
            method = 'getPerks';
        }

        const d = await provider[method](champion, preferredPosition, gameMode) || {};

        for (let [position, data] of Object.entries(d))
          positions[position] = Object.assign(positions[position] || { perks: {}, itemsets: {}, summonerspells: {} }, data);

        break;
      }
      catch(err) {
        console.log(1, err);
      }
    }

    /*
    * 3/3 Saving
    */

    if (positions !== {} && cache) Mana.getStore().set(`data.${champion.key}`, positions);
    return positions;
  }
}

module.exports = ProviderHandler;
