class ProviderHandler {
  constructor() {
    this.providers = [new (require('../providers/ChampionGG.js'))(), new (require('../providers/LoLFlavor.js'))()];
  }

  async getChampionData(champion, position, gameMode) {
    const storeKey = champion.id + '.' + (position === null ? gameMode : position);

    if (Mana.store.has(`runes.${storeKey}`) && Mana.store.has(`summonerspells.${storeKey}`))
      return { runes: Mana.store.get(`runes.${storeKey}`), spells: Mana.store.get(`summonerspells.${storeKey}`) };

    let data = {
      runes: [],
      itemsets: [],
      summonerspells: []
    };

    for (let provider of this.providers) {
      console.log('Using provider: ' + provider.name);
      try {
        let method;

        if (data.runes.length === 0 && data.itemsets.length === 0 && data.summonerspells.length === 0)
          method = 'getData';
        else if (data.itemsets.length === 0 && Mana.store.get('enableItemSets'))
          method = 'getItemSets';
        else if (data.summonerspells.length === 0 && Mana.store.get('enableSummonerSpells'))
          method = 'getSummonerSpells';
        else if (data.runes.length === 0)
          method = 'getRunes';

        if (!provider[method]) continue;

        const d = await provider[method](champion, position, gameMode);

        if (method === 'getData' || method === 'getRunes')
          Mana.store.set(`runes.${storeKey}`, data.runes = data.runes.concat(d.runes));
        if (method === 'getData' || method === 'getItemSets')
          data.itemsets = data.itemsets.concat(d.itemsets);
        if (method === 'getData' || method === 'getSummonerSpells') {
          data.summonerspells = d.summonerspells;

          if (d.summonerspells.length > 0)
            Mana.store.set(`summonerspells.${storeKey}`, d.summonerspells);
        }

        if (data.runes.length === 0 || (data.itemsets.length === 0 && Mana.store.get('enableItemSets')) || (data.summonerspells.length === 0 && Mana.store.get('enableSummonerSpells'))) {
          console.log('Missing data. Using another provider.');
          continue;
        }

        console.dir(data);
        return data;
      }
      catch(err) {
        console.error(err);
      }
    }

    return data;
  }
}

module.exports = ProviderHandler;
