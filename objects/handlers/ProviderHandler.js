class ProviderHandler {
  constructor() {
    this.providers = {
      championgg: new (require('../providers/ChampionGG.js'))(),
      opgg: new (require('../providers/OPGG.js'))(),
      //ugg: new (require('../providers/UGG.js'))(),
      lolflavor: new (require('../providers/LoLFlavor.js'))()
    };
  }

  async getChampionData(champion, preferredPosition, gameMode) {
    /*
    * 1/3 Storage Checking
    */
    if (Mana.store.has(`data.${champion.key}`)) {
      let d = Mana.store.get(`data.${champion.key}`);

      for (let [position, data] of Object.entries(d))
        for (let i = 0; i < data.itemsets.length; i++)
          data.itemsets[i] = require('./ItemSetHandler').parse(champion.key, data.itemsets[i]._data, position);

      return d;
    }

    /*
     * 2/3 Downloading
    */

    let positions = {};

    let providerOrder = Mana.store.get('providers-order', ['championgg', 'opgg', /*'ugg',*/ 'lolflavor']);
    providerOrder.splice(providerOrder.indexOf('lolflavor'), 1);
    providerOrder.push('lolflavor');

    for (let i = 0; i < providerOrder.length; i++) {
      const provider = this.providers[providerOrder[i]];
      log.log(2, `[ProviderHandler] Using ${provider.name}`);

      try {
        let method = 'getData';

        if (positions[preferredPosition]) {
          if (positions[preferredPosition].itemsets.length === 0 && Mana.store.get('enableItemSets'))
            method = 'getItemSets';
          else if (positions[preferredPosition].summonerspells.length === 0 && Mana.store.get('enableSummonerSpells'))
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
        log.log(1, err);
      }
    }

    /*
    * 3/3 Saving
    */

    if (positions !== {}) Mana.store.set(`data.${champion.key}`, positions);
    return positions;
  }
}

module.exports = ProviderHandler;
