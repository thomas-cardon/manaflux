const EventEmitter = require('events');

class ProviderHandler {
  constructor() {
    this.providers = {
      championgg: new (require('../providers/ChampionGG.js'))(),
      opgg: new (require('../providers/OPGG.js'))(),
      //ugg: new (require('../providers/UGG.js'))(),
      //lolflavor: new (require('../providers/LoLFlavor.js'))()
    };
  }

  /*
  * Supposed to support parallelism as much as it can
  */
  createDownloadEventEmitter(champion, gameMode, preferredPosition) {
    const dl = new EventEmitter();
    this.getChampionData(dl, champion, gameMode, preferredPosition);
    return dl;
  }

  getChampionData(dl, champion, gameMode, preferredPosition) {
    /* Fetches from cache if available */
    if (Mana.store.has(`data.${champion.key}`)) {
      let d = Mana.store.get(`data.${champion.key}`);

      for (let [position, data] of Object.entries(d)) {
        /* SummonerSpells */
        if (data.summonerspells)
          dl.emit('summonerspells', 'cache', position, data.summonerspells);

        /* Perks */
        if (data.perks)
          for (let i = 0; i < data.perks.length; i++)
            dl.emit('perksPage', 'cache', position, data.perks[i]);

        /* ItemSets */
        if (data.itemsets)
          for (let i = 0; i < data.itemsets.length; i++)
            dl.emit('itemset', 'cache', position, require('./ItemSetHandler').parse(champion.key, data.itemsets[i]._data, position));
      }

      return;
    }

    /* Prepare caching */
    dl.on('summonerspells', (provider, pos, data) => Mana.store.set(`data.${champion.key}.${pos.toUpperCase()}.summonerspells`, data));
    dl.on('perksPage', (provider, pos, data) => Mana.store.set(`data.${champion.key}.${pos.toUpperCase()}.perks`, data));
    dl.on('itemset', (provider, pos, data) => Mana.store.set(`data.${champion.key}.${pos.toUpperCase()}.itemsets`, data));

    /* Aggregating from the providers
    let providerOrder = Mana.store.get('providers-order', ['championgg', 'opgg', /*'ugg',*-/ 'lolflavor']);
    providerOrder.splice(providerOrder.indexOf('lolflavor'), 1);
    providerOrder.push('lolflavor');*/
    let providerOrder = ['championgg', /*'opgg'*/];

    for (let i = 0; i < providerOrder.length; i++)
      this.providers[providerOrder[i]].getData(dl, champion, gameMode, preferredPosition);
  }
}

module.exports = ProviderHandler;
