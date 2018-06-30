class ProviderHandler {
  constructor() {
    this.providers = [new (require('./providers/ChampionGG.js'))()/*, new (require('./providers/Tidecall.js'))()*/];
  }

  async getChampionData(champion, position, gameMode) {
    const storeKey = champion.id + '.' + (position === null ? gameMode : position);

    if (Mana.store.has(`runes.${storeKey}`) && Mana.store.has(`summonerspells.${storeKey}`))
      return { runes: Mana.store.get(`runes.${storeKey}`), spells: Mana.store.get(`summonerspells.${storeKey}`) };

    for (let provider of this.providers) {
      try {
        const data = await provider.getData(champion, position, gameMode);

        Mana.store.set(`runes.${storeKey}`, Mana.store.get(`runes.${storeKey}`, []).concat(data.runes));
        Mana.store.set(`summonerspells.${storeKey}`, data.summonerspells);

        return data;
      }
      catch(err) {
        console.error(err);
      }
    }
  }
}

module.exports = ProviderHandler;
